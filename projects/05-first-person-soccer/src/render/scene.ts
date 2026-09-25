/**
 * 场景 / 相机 / 光照 / 天空 / 雾 / 屏幕震动。
 *
 * three 0.186 注意点（与 r128 旧作差异极大，不要照抄旧代码）：
 *   - 用 `outputColorSpace`，不是 r128 的 `outputEncoding`
 *   - 光照物理正确，强度数量级远大于旧版
 */
import * as THREE from 'three';
import { CONFIG } from '../core/config';

export interface CameraPose {
  pos: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
}

export class SceneRig {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  private shakeAmount = 0;
  private shakeTime = 0;

  constructor(container: HTMLElement) {
    const c = CONFIG.camera;
    this.camera = new THREE.PerspectiveCamera(
      c.fov,
      window.innerWidth / window.innerHeight,
      c.near,
      c.far,
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);

    this.buildSky();
    this.buildLights();

    this.scene.fog = new THREE.Fog(0xcfe4f5, 55, 200);
    this.scene.add(this.camera);
  }

  /** 日间天空：canvas 渐变贴到内翻大球（零外部资产） */
  private buildSky(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#3d7fc4');
      g.addColorStop(0.5, '#7fb4e0');
      g.addColorStop(0.82, '#cfe4f5');
      g.addColorStop(1, '#e8f2e2');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 8, 256);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(260, 24, 16),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false }),
    );
    sky.name = 'sky';
    this.scene.add(sky);
  }

  private buildLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xbcd8f2, 0x3a5a2a, 1.5));

    const sun = new THREE.DirectionalLight(0xfff3dc, 2.6);
    sun.position.set(30, 46, 22);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x8fb0d8, 0.6);
    fill.position.set(-26, 18, -22);
    this.scene.add(fill);

    this.scene.add(new THREE.AmbientLight(0x5a6a78, 0.5));
  }

  shake(amount: number): void {
    this.shakeAmount = Math.min(1.2, this.shakeAmount + amount);
  }

  update(dt: number, pose: CameraPose): void {
    const cam = this.camera;
    this.shakeTime += dt * 47;
    this.shakeAmount = Math.max(
      0,
      this.shakeAmount - CONFIG.camera.shakeDecay * dt * this.shakeAmount * 0.9 - dt * 0.05,
    );

    const sx = Math.sin(this.shakeTime * 1.7) * this.shakeAmount * 0.09;
    const sy = Math.cos(this.shakeTime * 2.3) * this.shakeAmount * 0.09;

    cam.position.set(pose.pos.x + sx, pose.pos.y + sy, pose.pos.z);
    cam.rotation.set(0, 0, 0);
    cam.rotation.order = 'YXZ';
    cam.rotation.y = pose.yaw;
    cam.rotation.x = pose.pitch;
    cam.rotation.z = this.shakeAmount * Math.sin(this.shakeTime * 1.1) * 0.02;
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  info(): { drawCalls: number; triangles: number; programs: number } {
    this.renderer.info.reset();
    this.renderer.render(this.scene, this.camera);
    const r = this.renderer.info.render;
    return {
      drawCalls: r.calls,
      triangles: r.triangles,
      programs: this.renderer.info.programs?.length ?? 0,
    };
  }
}
