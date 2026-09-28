import * as THREE from 'three';
import { InputController } from '../core/InputController';
import { Loop } from '../core/Loop';
import { createRenderer, resizeRenderer } from '../core/Renderer';
import {
  Car,
  DEFAULT_CAR_TUNING,
  PLAYER_PAINT,
  type CarPaint,
} from '../entities/Car';
import { Track } from '../entities/Track';
import { AudioSystem } from '../systems/AudioSystem';
import { ChaseCamera } from '../systems/ChaseCamera';
import { DebugTools, type DebugTuning } from '../systems/DebugTools';
import { Hud } from '../systems/Hud';
import { RaceSystem, type RaceState } from '../systems/RaceSystem';
import { animateVaporWorld, buildVaporWorld } from '../world/World';

const AI_PAINTS: CarPaint[] = [
  { body: '#2dfff3', accent: '#ff2d95', emissive: '#2dfff3', name: 'NOVA' },
  { body: '#ffe600', accent: '#b84dff', emissive: '#ffe600', name: 'PIXEL' },
  { body: '#b84dff', accent: '#2dfff3', emissive: '#b84dff', name: 'YUZU' },
];

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(58, 1, 0.1, 500);
  private readonly input: InputController;
  private readonly track = new Track();
  private readonly cars: Car[] = [];
  private readonly player: Car;
  private readonly race: RaceSystem;
  private readonly audio = new AudioSystem();
  private readonly hud = new Hud();
  private readonly chase: ChaseCamera;
  private readonly world: THREE.Group;
  private readonly loop = new Loop(
    (delta, elapsed) => this.update(delta, elapsed),
    () => this.render(),
  );

  private readonly tuning: DebugTuning = {
    ...DEFAULT_CAR_TUNING,
    cameraLag: 4.5,
    exposure: 1.1,
    maxDpr: 2,
  };

  private readonly debugTools: DebugTools;
  private frame = 0;
  private elapsed = 0;
  private pausedForScreenshot = false;
  private reducedMotion = false;
  private paused = false;
  private lastPlayerLap = 0;
  private accumulator = 0;
  private readonly fixedDt = 1 / 60;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = createRenderer(canvas);
    this.renderer.toneMappingExposure = this.tuning.exposure;

    const stick = document.querySelector<HTMLElement>('#touch-stick');
    const knob = document.querySelector<HTMLElement>('#touch-knob');
    const boostBtn = document.querySelector<HTMLElement>('#boost-button');
    const driftBtn = document.querySelector<HTMLElement>('#drift-button');
    this.input = new InputController(stick, knob, boostBtn, driftBtn);

    this.debugTools = new DebugTools(this.tuning, () => {
      this.renderer.toneMappingExposure = this.tuning.exposure;
      resizeRenderer(this.renderer, this.camera, this.tuning.maxDpr);
    });

    this.player = new Car(this.track, 0, PLAYER_PAINT, true, this.tuning);
    this.cars.push(this.player);
    const aiTuning = {
      ...this.tuning,
      maxSpeed: 46,
      boostSpeed: 62,
      accel: 34,
    };
    AI_PAINTS.forEach((paint, i) => {
      this.cars.push(new Car(this.track, i + 1, paint, false, aiTuning));
    });

    this.race = new RaceSystem(this.track, this.cars, 3);
    this.chase = new ChaseCamera(this.camera, this.tuning.cameraLag);

    this.createScene();
    this.world = buildVaporWorld({ curve: this.track.curve, halfWidth: this.track.roadHalfWidth });
    this.scene.add(this.world);
    (window as unknown as { __GAME_SCENE__?: THREE.Scene }).__GAME_SCENE__ = this.scene;

    const spawn = this.player;
    this.chase.snapTo(spawn.position, spawn.heading);
    resizeRenderer(this.renderer, this.camera, this.tuning.maxDpr);
    this.installTestHooks();
    this.publishDiagnostics();
    this.hud.update(this.snapshotHud(this.race.getState()));
  }

  start(): void {
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    this.input.dispose();
    this.audio.dispose();
    this.debugTools.dispose();
    this.track.dispose();
    this.renderer.dispose();
    window.__THREE_GAME_DIAGNOSTICS__ = undefined;
    window.__THREE_GAME_TEST_HOOKS__ = undefined;
  }

  private update(delta: number, elapsed: number): void {
    this.frame += 1;
    if (this.pausedForScreenshot) {
      this.publishDiagnostics();
      return;
    }

    const intent = this.input.readIntent();
    if (intent.restart) {
      this.race.reset();
      this.lastPlayerLap = 0;
      this.paused = false;
      this.chase.snapTo(this.player.position, this.player.heading);
      this.hud.flashCountdown?.();
    }
    if (intent.pause && this.race.phase === 'racing') {
      this.paused = !this.paused;
    }

    resizeRenderer(this.renderer, this.camera, this.tuning.maxDpr);
    this.elapsed += this.paused ? 0 : delta;

    // fixed timestep for car sim
    const simDelta = this.paused ? 0 : delta;
    this.accumulator = Math.min(this.accumulator + simDelta, 0.1);
    while (this.accumulator >= this.fixedDt) {
      this.applyIntentToPlayer(intent);
      const raceActive = this.race.phase === 'racing' && !this.paused;
      for (const car of this.cars) car.update(this.fixedDt, raceActive);
      this.race.update(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    // lap feedback
    if (this.player.lap > this.lastPlayerLap && this.race.phase === 'racing') {
      this.lastPlayerLap = this.player.lap;
      const improved = this.player.bestLap === this.player.lastLap;
      this.race.flashMessage(improved ? `BEST ${formatLap(this.player.lastLap)}` : `LAP ${formatLap(this.player.lastLap)}`);
      this.audio.lap();
      this.chase.addTrauma(0.25);
    }

    const animDelta = this.reducedMotion ? 0 : delta;
    const animElapsed = this.reducedMotion ? 0 : elapsed;
    animateVaporWorld(this.world, animElapsed);

    // camera
    const boostActive =
      this.player.controls.boost && this.player.boost > 0 && this.player.controls.throttle > 0.1;
    this.chase.update(
      this.paused ? 0 : delta,
      this.player.position,
      this.player.heading,
      this.player.speed,
      this.player.drifting,
      boostActive,
    );
    if (this.player.collisionFlash > 0.9) {
      this.chase.addTrauma(0.15);
    }

    // follow shadow camera to player for key light
    this.world.traverse((obj) => {
      if (obj instanceof THREE.DirectionalLight && obj.castShadow) {
        obj.target.position.copy(this.player.position);
        obj.target.updateMatrixWorld();
        obj.position.copy(this.player.position).add(new THREE.Vector3(40, 60, 20));
      }
    });

    const state = this.race.getState();
    this.audio.updateEngine(
      THREE.MathUtils.clamp(this.player.speed / 50, 0, 1),
      this.player.drifting,
      boostActive && this.player.boost > 0,
      this.race.phase !== 'finished' && !this.paused,
    );
    this.hud.update(this.snapshotHud(state));
    void animDelta;
    this.publishDiagnostics();
  }

  private applyIntentToPlayer(intent: ReturnType<InputController['readIntent']>): void {
    this.player.controls.throttle = intent.throttle;
    this.player.controls.steer = intent.steer;
    this.player.controls.brake = intent.brake;
    this.player.controls.drift = intent.drift;
    this.player.controls.boost = intent.boost;
  }

  private snapshotHud(s: RaceState) {
    return {
      speedKph: this.player.speed * 3.6,
      boost: this.player.boost,
      drifting: this.player.drifting,
      lap: s.playerLap,
      totalLaps: s.totalLaps,
      position: s.playerPosition,
      fieldSize: this.cars.length,
      raceTime: s.raceTime,
      currentLapTime: this.player.lapTime,
      bestLap: s.playerBestLap,
      lastLap: s.playerLastLap,
      countdown: s.phase === 'countdown' ? Math.max(1, Math.ceil(s.countdown - 0.5)) : 0,
      message: s.message,
      phase: s.phase,
      standings: s.standings.map((row) => ({
        name: row.name,
        isPlayer: row.isPlayer,
        lap: row.lap,
        paint: row.paint,
      })),
    };
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private createScene(): void {
    this.scene.fog = new THREE.FogExp2('#2a0f4a', 0.0045);
    this.scene.add(this.track.group);
    for (const car of this.cars) this.scene.add(car.group);
  }

  private installTestHooks(): void {
    window.__THREE_GAME_TEST_HOOKS__ = {
      seed: (value: number) => {
        void value;
      },
      setState: (name: string) => {
        if (name !== 'active-play' && name !== 'complete' && name !== 'title') {
          throw new Error(`Unknown test state: ${name}`);
        }
        this.resetForTest();
        if (name === 'active-play') {
          // skip countdown, put player mid-race
          this.race.phase = 'racing';
          this.race.countdown = 0;
          this.race.raceTime = 12.4;
          this.player.controls.throttle = 1;
          this.player.controls.steer = 0.25;
          this.player.controls.drift = true;
          this.player.boost = 0.8;
          this.player.position.copy(this.track.pointAt(0.15, -1.5));
          const s = this.track.getSample(Math.floor(0.15 * 400));
          this.player.heading = Math.atan2(s.tangent.x, s.tangent.z);
          this.player.velocity.copy(this.player.getForward().multiplyScalar(32));
          this.player.speed = 32;
          this.player.drifting = true;
          this.chase.snapTo(this.player.position, this.player.heading);
          for (const car of this.cars) car.update(this.fixedDt, true);
        }
        if (name === 'complete') {
          this.race.phase = 'racing';
          this.race.countdown = 0;
          for (const car of this.cars) car.lap = 3;
          for (const car of this.cars) car.unwrappedProgress = 3.05;
          this.race.update(this.fixedDt);
        }
        this.hud.update(this.snapshotHud(this.race.getState()));
        this.render();
        this.publishDiagnostics();
        return { state: name };
      },
      setPausedForScreenshot: (paused: boolean) => {
        this.pausedForScreenshot = paused;
      },
      setReducedMotion: (enabled: boolean) => {
        this.reducedMotion = enabled;
        this.render();
        this.publishDiagnostics();
      },
      hideDebugUi: (hidden: boolean) => {
        this.debugTools.setHidden(hidden);
      },
    };
  }

  private resetForTest(): void {
    this.race.reset();
    this.lastPlayerLap = 0;
    this.elapsed = 0;
    this.chase.snapTo(this.player.position, this.player.heading);
  }

  private publishDiagnostics(): void {
    const info = this.renderer.info;
    window.__THREE_GAME_DIAGNOSTICS__ = {
      frame: this.frame,
      elapsed: this.elapsed,
      score: this.player.lap,
      targetScore: this.race.totalLaps,
      complete: this.race.phase === 'finished',
      player: {
        position: {
          x: this.player.position.x,
          y: this.player.position.y,
          z: this.player.position.z,
        },
        speed: this.player.speed,
        drifting: this.player.drifting,
        boost: this.player.boost,
      },
      renderer: {
        calls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      },
      canvas: {
        clientWidth: this.canvas.clientWidth,
        clientHeight: this.canvas.clientHeight,
        width: this.canvas.width,
        height: this.canvas.height,
        dpr: Math.min(window.devicePixelRatio || 1, this.tuning.maxDpr),
      },
    };
  }
}

function formatLap(seconds: number): string {
  return `${seconds.toFixed(2)}s`;
}
