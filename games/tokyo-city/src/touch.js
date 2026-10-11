// touch.js — 手机 / 平板的虚拟操控。
//
// 布局：左下虚拟摇杆（驾驶 = 转向，上推也能给油；散步 = 移动），
//       右下按键（驾驶：油门 / 刹车 / 漂移 / 视角 / 复位；散步：跳跃 / 疾跑），
//       散步时在空白处拖动 = 转视角。观景模式不显示，交给 OrbitControls 的原生触控。
// 只输出一份「输入状态」，由 play.js 与键盘输入合并，不直接改游戏状态。

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function isTouchDevice() {
  return (window.matchMedia && matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
}

export class TouchControls {
  constructor() {
    this.enabled = false;
    this.mode = 'orbit';
    this.state = { steer: 0, throttle: 0, brake: 0, handbrake: false, moveX: 0, moveY: 0, run: false, jump: false };
    this.lookDX = 0;
    this.lookDY = 0;
    this.onAction = () => {};   // 'camera' | 'reset' | 'pause'

    const root = document.createElement('div');
    root.id = 'touch-ui';
    root.hidden = true;
    root.innerHTML = `
      <div class="tc-joy" id="tc-joy"><div class="tc-knob" id="tc-knob"></div></div>
      <div class="tc-cluster tc-drive">
        <button class="tc-btn tc-small" data-act="camera" aria-label="切换视角">视角</button>
        <button class="tc-btn tc-small" data-act="reset" aria-label="复位">复位</button>
        <button class="tc-btn tc-hb" data-hold="handbrake" aria-label="漂移手刹">漂移</button>
        <button class="tc-btn tc-brake" data-hold="brake" aria-label="刹车倒车">刹车</button>
        <button class="tc-btn tc-gas" data-hold="throttle" aria-label="油门">油门</button>
      </div>
      <div class="tc-cluster tc-walk">
        <button class="tc-btn tc-brake" data-hold="run" aria-label="疾跑">疾跑</button>
        <button class="tc-btn tc-gas" data-hold="jump" aria-label="跳跃">跳跃</button>
      </div>`;
    document.body.appendChild(root);
    this.root = root;

    this._bindJoystick(root.querySelector('#tc-joy'), root.querySelector('#tc-knob'));
    for (const b of root.querySelectorAll('[data-hold]')) this._bindHold(b, b.dataset.hold);
    for (const b of root.querySelectorAll('[data-act]')) {
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this._buzz(8); this.onAction(b.dataset.act); });
    }
    this._bindLook();
  }

  _buzz(ms) { try { navigator.vibrate?.(ms); } catch { /* 不支持就算了 */ } }

  _bindHold(el, key) {
    const on = (e) => {
      e.preventDefault();
      try { el.setPointerCapture?.(e.pointerId); } catch { /* 合成事件 / 已失效的指针 */ }
      el.classList.add('on');
      this.state[key] = key === 'handbrake' || key === 'run' || key === 'jump' ? true : 1;
      if (key === 'handbrake') this._buzz(12);
    };
    const off = () => {
      el.classList.remove('on');
      this.state[key] = key === 'handbrake' || key === 'run' || key === 'jump' ? false : 0;
    };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('lostpointercapture', off);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _bindJoystick(base, knob) {
    let id = null, cx = 0, cy = 0;
    const R = 52;
    const move = (e) => {
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy);
      const k = len > R ? R / len : 1;
      const x = dx * k, y = dy * k;
      knob.style.transform = `translate(${x}px, ${y}px)`;
      const nx = x / R, ny = y / R;
      // 小死区，避免手指轻放就跑偏
      const dz = (v) => (Math.abs(v) < 0.12 ? 0 : (v - Math.sign(v) * 0.12) / 0.88);
      this.state.steer = -dz(nx);       // 车：左正右负（与键盘 A/D 一致）
      this.state.moveX = dz(nx);
      this.state.moveY = -dz(ny);       // 上推 = 前进
      this._joyThrottle = ny < -0.45 ? 1 : 0;
      this._joyBrake = ny > 0.6 ? 1 : 0;
    };
    const end = () => {
      id = null;
      knob.style.transform = '';
      base.classList.remove('on');
      this.state.steer = this.state.moveX = this.state.moveY = 0;
      this._joyThrottle = this._joyBrake = 0;
    };
    base.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      id = e.pointerId;
      try { base.setPointerCapture?.(id); } catch { /* 同上 */ }
      const r = base.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      base.classList.add('on');
      move(e);
    });
    base.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
    base.addEventListener('pointerup', (e) => { if (e.pointerId === id) end(); });
    base.addEventListener('pointercancel', end);
  }

  // 散步：在空白处拖动转视角
  _bindLook() {
    let id = null, lx = 0, ly = 0;
    window.addEventListener('pointerdown', (e) => {
      if (!this.enabled || this.mode !== 'walk' || e.pointerType === 'mouse') return;
      if (e.target.closest && e.target.closest('#touch-ui .tc-joy, #touch-ui .tc-btn, button, #panel')) return;
      id = e.pointerId; lx = e.clientX; ly = e.clientY;
    });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      this.lookDX += e.clientX - lx; this.lookDY += e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
    });
    const up = (e) => { if (e.pointerId === id) id = null; };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  consumeLook() {
    const r = { dx: this.lookDX, dy: this.lookDY };
    this.lookDX = this.lookDY = 0;
    return r;
  }

  /** 合并后的驾驶输入（摇杆上推也算油门，下拉也算刹车） */
  get drive() {
    const s = this.state;
    return {
      throttle: s.throttle || this._joyThrottle ? 1 : 0,
      brake: s.brake || this._joyBrake ? 1 : 0,
      steer: clamp(s.steer, -1, 1),
      handbrake: s.handbrake,
    };
  }

  setEnabled(on) {
    this.enabled = on;
    document.body.classList.toggle('touch', on);
    this._sync();
  }

  setMode(mode) { this.mode = mode; this._sync(); }

  /** 有面板打开时把触控层藏起来，避免误触 */
  setSuppressed(on) { this.suppressed = on; this._sync(); }

  _sync() {
    const show = this.enabled && !this.suppressed && (this.mode === 'drive' || this.mode === 'walk');
    this.root.hidden = !show;
    this.root.classList.toggle('drive', this.mode === 'drive');
    this.root.classList.toggle('walk', this.mode === 'walk');
    if (!show) {
      for (const k of Object.keys(this.state)) this.state[k] = typeof this.state[k] === 'boolean' ? false : 0;
      this._joyThrottle = this._joyBrake = 0;
      for (const b of this.root.querySelectorAll('.on')) b.classList.remove('on');
    }
  }
}
