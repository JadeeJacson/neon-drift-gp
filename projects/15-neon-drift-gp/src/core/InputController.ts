export type DriveIntent = {
  throttle: number;
  steer: number;
  brake: boolean;
  drift: boolean;
  boost: boolean;
  restart: boolean;
  pause: boolean;
};

export class InputController {
  private readonly keys = new Set<string>();
  private restartPressed = false;
  private pausePressed = false;
  private stickThrottle = 0;
  private stickSteer = 0;

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Space') event.preventDefault();
    this.keys.add(event.code);
    if (event.code === 'KeyR') this.restartPressed = true;
    if (event.code === 'Escape') this.pausePressed = true;
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private readonly onBlur = () => {
    this.keys.clear();
  };

  constructor(
    stick?: HTMLElement | null,
    knob?: HTMLElement | null,
    boostButton?: HTMLElement | null,
    driftButton?: HTMLElement | null,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);

    if (stick && knob) this.bindStick(stick, knob);
    if (boostButton) this.bindHold(boostButton, (on) => {
      this.touchBoost = on;
    });
    if (driftButton) this.bindHold(driftButton, (on) => {
      this.touchDrift = on;
    });
  }

  private touchBoost = false;
  private touchDrift = false;
  private pointerId: number | null = null;
  private stickCenterX = 0;
  private stickCenterY = 0;
  private stickRadius = 1;

  private bindStick(stick: HTMLElement, knob: HTMLElement): void {
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      this.pointerId = e.pointerId;
      const rect = stick.getBoundingClientRect();
      this.stickCenterX = rect.left + rect.width / 2;
      this.stickCenterY = rect.top + rect.height / 2;
      this.stickRadius = rect.width * 0.4;
      try {
        stick.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic */
      }
      this.applyStick(e.clientX, e.clientY, knob);
    };
    const onMove = (e: PointerEvent) => {
      if (this.pointerId !== e.pointerId) return;
      e.preventDefault();
      this.applyStick(e.clientX, e.clientY, knob);
    };
    const onUp = (e: PointerEvent) => {
      if (this.pointerId !== e.pointerId) return;
      this.pointerId = null;
      this.stickThrottle = 0;
      this.stickSteer = 0;
      knob.style.transform = 'translate(-50%, -50%)';
    };
    stick.addEventListener('pointerdown', onDown);
    stick.addEventListener('pointermove', onMove);
    stick.addEventListener('pointerup', onUp);
    stick.addEventListener('pointercancel', onUp);
  }

  private applyStick(x: number, y: number, knob: HTMLElement): void {
    let dx = (x - this.stickCenterX) / this.stickRadius;
    let dy = (y - this.stickCenterY) / this.stickRadius;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    this.stickSteer = dx;
    this.stickThrottle = -dy;
    knob.style.transform = `translate(calc(-50% + ${dx * 36}px), calc(-50% + ${dy * 36}px))`;
  }

  private bindHold(el: HTMLElement, set: (on: boolean) => void): void {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      set(true);
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic */
      }
    });
    const off = (e: Event) => {
      e.preventDefault();
      set(false);
    };
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
  }

  readIntent(): DriveIntent {
    let throttle = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) throttle += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) throttle -= 1;
    throttle += this.stickThrottle;
    throttle = Math.max(-1, Math.min(1, throttle));

    let steer = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) steer -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) steer += 1;
    steer += this.stickSteer;
    steer = Math.max(-1, Math.min(1, steer));

    const intent: DriveIntent = {
      throttle,
      steer,
      brake: this.keys.has('KeyS') || this.keys.has('ArrowDown'),
      drift: this.keys.has('Space') || this.touchDrift,
      boost: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchBoost,
      restart: this.restartPressed,
      pause: this.pausePressed,
    };
    this.restartPressed = false;
    this.pausePressed = false;
    return intent;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
