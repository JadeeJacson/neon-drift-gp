/**
 * 唯一胶水层：输入 → sim.step → 事件消费（渲染 / 音频 / HUD）→ 渲染。
 *
 * 约束：
 *   1. sim 是唯一真相源。渲染层只读 ActorView / BallView / GameSnapshot。
 *   2. 事件驱动反馈。sim 产出 SimEvent，这里翻译成音效 / HUD —— sim 因此保持零 DOM。
 */
import { CONFIG } from './core/config';
import { GameSim } from './sim/game';
import { emptyInput } from './sim/types';
import type { GameInput, SimEvent } from './sim/types';
import { normalize, v3 } from './sim/vecmath';
import { SceneRig } from './render/scene';
import { buildPitch } from './render/pitch';
import { BallRenderer } from './render/ball';
import { ActorRenderer, ViewHands } from './render/actors';
import { AudioEngine } from './audio/synth';
import { Hud } from './ui/hud';

function need(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`index.html 缺少必要容器 #${id}`);
  return el;
}
const container = need('app');
const hudRoot = need('hud');
const overlay = need('overlay');
const panel = need('panel');

const rig = new SceneRig(container);
buildPitch(rig.scene);
const ballRenderer = new BallRenderer(rig.scene);
const actorRenderer = new ActorRenderer(rig.scene);
const viewHands = new ViewHands(rig.camera);
const hud = new Hud(hudRoot);
const audio = new AudioEngine();

let sim = await GameSim.create(1);
let seedCounter = 1;
let running = false;

// ---------------- 输入 ----------------
const keys = new Set<string>();
const look = { yaw: -Math.PI / 2, pitch: 0 };
const injected: Partial<GameInput> = {};
let kicking = false;
let dragging = false;
let playerKickAnim = 0;
let footTimer = 0;
let prevFootPos = sim.player.pos();

const PITCH_LIMIT = Math.PI / 2 - 0.02;

function applyLook(dx: number, dy: number): void {
  look.yaw -= dx * CONFIG.camera.sensitivity;
  look.pitch -= dy * CONFIG.camera.sensitivity;
  look.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, look.pitch));
}

function currentInput(): GameInput {
  const input = emptyInput();
  input.forward =
    (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
    (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  input.right =
    (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
    (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  input.jump = keys.has('Space');
  input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  input.kick = kicking;
  input.yaw = look.yaw;
  input.pitch = look.pitch;
  return Object.assign(input, injected);
}

// ---------------- 事件消费 ----------------
function consume(events: SimEvent[]): void {
  for (const e of events) {
    switch (e.type) {
      case 'kick':
        audio.kick(e.power);
        if (e.power > 14) rig.shake(0.12);
        playerKickAnim = 0.3;
        break;
      case 'bounce':
        audio.bounce(e.speed);
        break;
      case 'goal':
        audio.goal();
        hud.goal(e.team);
        rig.shake(CONFIG.camera.goalShake);
        break;
      case 'whistle':
        audio.whistle();
        break;
      case 'save':
        audio.save();
        break;
      case 'footstep':
        audio.footstep();
        break;
      case 'win':
        audio.win();
        finish(true);
        break;
      case 'lose':
        audio.lose();
        finish(false);
        break;
      default:
        break;
    }
  }
}

// ---------------- 主循环（固定步长） ----------------
let last = performance.now();
let acc = 0;
let lastInput = emptyInput();

function frame(now: number): void {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (running && sim.phase !== 'won' && sim.phase !== 'lost') {
    acc += dt;
    let steps = 0;
    while (acc >= CONFIG.physics.fixedDt && steps < 6) {
      const input = currentInput();
      lastInput = input;
      consume(sim.step(input));
      acc -= CONFIG.physics.fixedDt;
      steps += 1;
    }
    if (steps >= 6) acc = 0;
  }

  const snap = sim.snapshot();
  const eye = sim.player.eye(CONFIG.player.eyeOffset);
  rig.update(dt, { pos: eye, yaw: look.yaw, pitch: look.pitch });
  ballRenderer.sync(sim.ballView());
  actorRenderer.sync(sim.actorViews(), dt);
  if (playerKickAnim > 0) playerKickAnim -= dt;

  const moving = Math.abs(lastInput.forward) + Math.abs(lastInput.right) > 0.1;
  viewHands.update(dt, moving, lastInput.sprint, snap.charge, playerKickAnim);

  // 脚步（渲染侧，不污染 sim 事件流）
  const p = sim.player.pos();
  const movedXZ = Math.hypot(p.x - prevFootPos.x, p.z - prevFootPos.z);
  prevFootPos = p;
  if (sim.player.grounded && movedXZ > 0.01) {
    footTimer -= dt * (lastInput.sprint ? 1.4 : 1);
    if (footTimer <= 0) {
      footTimer = 0.34;
      audio.footstep();
    }
  }

  hud.update(snap);
  rig.render();
}
requestAnimationFrame(frame);

// ---------------- 开始 / 结算 / 重开 ----------------
function beginRun(): void {
  audio.init();
  look.yaw = -Math.PI / 2; // 面向 +X（进攻方向）
  look.pitch = 0;
  overlay.classList.add('hidden');
  running = true;
  acc = 0;
  last = performance.now();
}

function finish(won: boolean): void {
  running = false;
  const snap = sim.snapshot();
  const mins = Math.floor(snap.time / 60);
  const secs = Math.floor(snap.time % 60).toString().padStart(2, '0');
  panel.innerHTML = `
    <h1 style="${won ? '' : 'color:#ff5a4d'}">${won ? '胜利' : '落败'}</h1>
    <h2>${won ? '你先打进 ' + snap.goalsToWin + ' 球' : '对手先打进 ' + snap.goalsToWin + ' 球'}</h2>
    <div class="stats">比分 <b>${snap.scoreBlue} : ${snap.scoreRed}</b><br />用时 <b>${mins}:${secs}</b></div>
    <button class="btn" id="again-btn">再来一局（Enter）</button>
    <div class="hint">点击后重新锁定鼠标</div>
  `;
  overlay.classList.remove('hidden');
  document.getElementById('again-btn')?.addEventListener('click', () => void restart());
}

async function restart(): Promise<void> {
  seedCounter += 1;
  const next = await GameSim.create(seedCounter);
  const old = sim;
  sim = next;
  old.dispose();
  keys.clear();
  kicking = false;
  beginRun();
}

// ---------------- 事件绑定 ----------------
overlay.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement | null;
  if (t?.id === 'start-btn' || t?.id === 'again-btn') return;
  if (overlay.classList.contains('hidden')) return;
  if (sim.phase === 'won' || sim.phase === 'lost') void restart();
  else beginRun();
});

document.getElementById('start-btn')?.addEventListener('click', (ev) => {
  ev.stopPropagation();
  beginRun();
  rig.renderer.domElement.requestPointerLock?.();
});

window.addEventListener('keydown', (ev) => {
  if (ev.code === 'Enter' && (sim.phase === 'won' || sim.phase === 'lost')) {
    void restart();
    return;
  }
  keys.add(ev.code);
  if (ev.code === 'Space') ev.preventDefault();
});
window.addEventListener('keyup', (ev) => keys.delete(ev.code));
window.addEventListener('blur', () => keys.clear());

const canvas = rig.renderer.domElement;
canvas.addEventListener('mousedown', (ev) => {
  if (ev.button === 0) {
    kicking = true;
    dragging = document.pointerLockElement !== canvas;
  }
});
window.addEventListener('mouseup', () => {
  kicking = false;
  dragging = false;
});
window.addEventListener('mousemove', (ev) => {
  if (document.pointerLockElement === canvas || dragging) applyLook(ev.movementX, ev.movementY);
});
window.addEventListener('resize', () => rig.resize());

// ---------------- 验证接口（CDP / 调试用） ----------------
export interface BallApi {
  version: string;
  start(): void;
  restart(): Promise<void>;
  setInput(p: Partial<GameInput>): void;
  setLook(yaw: number, pitch: number): void;
  clearInput(): void;
  state(): Record<string, unknown>;
  actors(): unknown[];
  ball(): Record<string, unknown>;
  info(): { drawCalls: number; triangles: number; programs: number };
  audioInfo(): { state: string; playCount: number; last: string };
  /** 调试：把球瞬移到 (x,z)（CDP 验证进球链路用） */
  debugPlaceBall(x: number, z: number): void;
  /** 调试：直接踢球（方向 + 力量） */
  debugKickBall(dx: number, dy: number, dz: number, power: number): void;
}

const api: BallApi = {
  version: '05-blockball',
  start: () => beginRun(),
  restart: () => restart(),
  setInput: (p) => Object.assign(injected, p),
  setLook: (yaw, pitch) => {
    injected.yaw = yaw;
    injected.pitch = pitch;
    look.yaw = yaw;
    look.pitch = pitch;
  },
  clearInput: () => {
    for (const k of Object.keys(injected)) delete (injected as Record<string, unknown>)[k];
  },
  state: () => ({ ...sim.snapshot(), running }),
  actors: () => sim.actorViews(),
  ball: () => ({ ...sim.ballView(), radius: CONFIG.ball.radius }),
  info: () => rig.info(),
  audioInfo: () => ({ state: audio.state(), playCount: audio.playCount, last: audio.lastKind }),
  debugPlaceBall: (x, z) => {
    sim.ball.body.setTranslation({ x, y: CONFIG.ball.radius, z }, true);
    sim.ball.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  },
  debugKickBall: (dx, dy, dz, power) => {
    sim.ball.kick(normalize(v3(dx, dy, dz)), power);
  },
};
(window as unknown as { __ball: BallApi }).__ball = api;
