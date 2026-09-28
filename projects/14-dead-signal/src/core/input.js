/* 输入层：键盘 + 鼠标（指针锁定）+ 滚轮 + 触屏虚拟摇杆（移植自本人前一工程并 ESM 化） */
import { bus } from './util.js';

export const Input = {
  enabled: false,
  locked: false,
  touch: false,
  keys: Object.create(null),
  look: { dx: 0, dy: 0 },
  wheel: 0,
  pressed: Object.create(null),   // 本帧刚按下（边沿）
  mouse: { left: false, right: false },
  sensitivity: 1,
  invertY: false
};

const KEYMAP = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'jump',
  KeyC: 'crouch', ControlLeft: 'crouch', ControlRight: 'crouch',
  ShiftLeft: 'shift', ShiftRight: 'shift',
  KeyR: 'reload', KeyV: 'melee', KeyF: 'use', KeyQ: 'quick', KeyE: 'use2',
  KeyM: 'sensUp', KeyN: 'sensDown', Escape: 'esc', Enter: 'enter',
  Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4',
  KeyP: 'pause'
};

function keyName(e) { return KEYMAP[e.code] || e.code; }

// 初始化；dom 为指针锁定目标（渲染画布）
Input.init = function (dom) {
  this.dom = dom || document.body;

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (!this.keys[k]) this.pressed[k] = true;
    this.keys[k] = true;
    if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) >= 0) {
      if (this.locked || e.code === 'Space') e.preventDefault();
    }
    if (e.code === 'Escape') bus.emit('escape');
  }, { passive: false });

  window.addEventListener('keyup', (e) => {
    this.keys[keyName(e)] = false;
  });

  window.addEventListener('blur', () => { this.keys = Object.create(null); this.mouse.left = false; this.mouse.right = false; });

  // ---- 鼠标 ----
  this.dom.addEventListener('mousedown', (e) => {
    if (!this.locked) return;
    if (e.button === 0) { this.mouse.left = true; this.pressed.fire = true; }
    if (e.button === 2) { this.mouse.right = true; }
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) this.mouse.left = false;
    if (e.button === 2) this.mouse.right = false;
  });
  window.addEventListener('contextmenu', (e) => { if (this.locked) e.preventDefault(); });
  window.addEventListener('mousemove', (e) => {
    if (!this.locked) return;
    this.look.dx += e.movementX || 0;
    this.look.dy += e.movementY || 0;
  });
  window.addEventListener('wheel', (e) => { if (this.locked) { this.wheel += Math.sign(e.deltaY); e.preventDefault(); } }, { passive: false });

  document.addEventListener('pointerlockchange', () => {
    this.locked = document.pointerLockElement === this.dom;
    bus.emit('lockchange', this.locked);
    if (!this.locked) { this.mouse.left = false; this.mouse.right = false; this.keys = Object.create(null); }
  });

  this.touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
};

Input.lock = function () {
  try {
    const p = this.dom.requestPointerLock && this.dom.requestPointerLock();
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* 个别浏览器不支持 */ }
};
Input.unlock = function () { try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {} };

// 每帧开始：消费累积的视角增量
Input.beginFrame = function () {
  const l = { dx: this.look.dx, dy: this.look.dy, wheel: this.wheel };
  this.look.dx = 0; this.look.dy = 0; this.wheel = 0;
  return l;
};
Input.endFrame = function () { this.pressed = Object.create(null); };

Input.mouseDown = function (btn) { return btn === 'right' ? this.mouse.right : this.mouse.left; };
Input.wasPressed = function (k) { return !!this.pressed[k]; };
Input.down = function (k) { return !!this.keys[k]; };

/* ---------- 触屏：虚拟摇杆 + 视角滑动 + 按钮（返回每帧可读的状态对象） ---------- */
Input.Touch = function (root) {
  const t = {
    move: { x: 0, y: 0 }, look: { dx: 0, dy: 0 },
    btn: { fire: false, reload: false, jump: false, sprint: false }
  };
  let moveId = null, lookId = null, moveStart = null, lookStart = null;
  const MOVE_R = 58;
  const pad = document.getElementById('tPad'), stick = document.getElementById('tStick');
  const lookZone = root ? root : null;
  const pt = (e) => ({ x: e.clientX, y: e.clientY });

  if (pad) {
    pad.addEventListener('touchstart', (e) => {
      const t0 = e.changedTouches[0]; moveId = t0.identifier;
      const r = pad.getBoundingClientRect();
      moveStart = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      e.preventDefault();
    }, { passive: false });
  }
  if (lookZone) {
    lookZone.addEventListener('touchstart', (e) => {
      const t0 = e.changedTouches[0]; lookId = t0.identifier; lookStart = pt(t0);
    }, { passive: true });
  }
  window.addEventListener('touchmove', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const tt = e.changedTouches[i];
      if (tt.identifier === moveId && moveStart) {
        const dx = tt.clientX - moveStart.x, dy = tt.clientY - moveStart.y;
        t.move.x = (dx / MOVE_R) * Math.min(1, Math.hypot(dx, dy) / MOVE_R);
        t.move.y = (dy / MOVE_R) * Math.min(1, Math.hypot(dx, dy) / MOVE_R);
        if (stick) stick.style.transform = 'translate(' + (dx / MOVE_R) * 40 + 'px,' + (dy / MOVE_R) * 40 + 'px)';
      } else if (tt.identifier === lookId && lookStart) {
        t.look.dx += (tt.clientX - lookStart.x) * 1.6;
        t.look.dy += (tt.clientY - lookStart.y) * 1.6;
        lookStart = pt(tt);
      }
    }
  }, { passive: false });
  window.addEventListener('touchend', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const tt = e.changedTouches[i];
      if (tt.identifier === moveId) { moveId = null; moveStart = null; t.move.x = 0; t.move.y = 0; if (stick) stick.style.transform = 'translate(0,0)'; }
      if (tt.identifier === lookId) { lookId = null; lookStart = null; }
    }
  });

  const btns = document.querySelectorAll('[data-tbtn]');
  for (let i = 0; i < btns.length; i++) {
    (function (b) {
      const name = b.getAttribute('data-tbtn');
      b.addEventListener('touchstart', (e) => { t.btn[name] = true; b.classList.add('on'); e.preventDefault(); }, { passive: false });
      const off = () => { t.btn[name] = false; b.classList.remove('on'); };
      b.addEventListener('touchend', off);
      b.addEventListener('touchcancel', off);
    })(btns[i]);
  }
  return t;
};
