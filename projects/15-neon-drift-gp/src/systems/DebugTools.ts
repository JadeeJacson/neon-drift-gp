export type DebugTuning = {
  accel: number;
  maxSpeed: number;
  boostSpeed: number;
  reverseSpeed: number;
  steerRate: number;
  grip: number;
  driftGrip: number;
  brakeForce: number;
  drag: number;
  boostDrain: number;
  cameraLag: number;
  exposure: number;
  maxDpr: number;
};

import GUI from 'lil-gui';

export class DebugTools {
  private gui: GUI | null = null;

  constructor(tuning: DebugTuning, onChange: () => void) {
    const enabled = new URLSearchParams(window.location.search).has('debug');
    if (!enabled) return;

    this.gui = new GUI({ title: 'Neon Drift tuning' });
    const drive = this.gui.addFolder('Drive');
    drive.add(tuning, 'accel', 10, 50, 0.5);
    drive.add(tuning, 'maxSpeed', 20, 70, 0.5);
    drive.add(tuning, 'boostSpeed', 30, 80, 0.5);
    drive.add(tuning, 'steerRate', 1, 5, 0.05);
    drive.add(tuning, 'grip', 3, 16, 0.1);
    drive.add(tuning, 'driftGrip', 0.5, 6, 0.1);
    drive.add(tuning, 'drag', 0, 2, 0.05);
    const cam = this.gui.addFolder('Camera');
    cam.add(tuning, 'cameraLag', 1, 12, 0.1).onChange(() => onChange());
    cam.add(tuning, 'maxDpr', 1, 2, 0.25).onChange(onChange);
    cam.add(tuning, 'exposure', 0.6, 1.8, 0.01).onChange(onChange);
  }

  setHidden(hidden: boolean): void {
    if (!this.gui) return;
    if (hidden) this.gui.hide();
    else this.gui.show();
  }

  dispose(): void {
    this.gui?.destroy();
    this.gui = null;
  }
}
