/**
 * 场景 / 相机 / 光照 / 天空 / 雾 / 屏幕震动。
 *
 * three 0.186 的注意点（与 r128 旧作差异极大，不要照抄旧代码）：
 *   - 用 `outputColorSpace`，不是 r128 的 `outputEncoding`
 *   - 光照是物理正确的，强度数量级远大于旧版
 *   - ColorManagement 默认开启
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CONFIG } from '../core/config';

export interface CameraPose {
  pos: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  recoilPitch: number;
  recoilYaw: number;
}

export class SceneRig {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  /** 后处理链：RenderPass → Bloom（曳光/枪口火光/面罩发光泛光）→ OutputPass（tone mapping + sRGB） */
  private readonly composer: EffectComposer;

  /** 屏幕震动强度（衰减到 0） */
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

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // ACES 电影级色调映射（借鉴 04_1 的 Renderer.ts）：高光滚降，曳光/火光不再死白
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    // 阴影开启（04_1 已验证同栈可负担；drawCalls 41→~100 仍在预算内）
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 后处理：MSAA 目标（WebGL2）+ bloom。阈值 0.72 只让高亮发光体泛光，
    // 普通漫反射面不受影响；strength 0.35 克制到「曳光有辉光」而不是「整屏发光」。
    const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
    const rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      samples: 4,
      type: THREE.HalfFloatType,
    });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(size, 0.35, 0.5, 0.72));
    this.composer.addPass(new OutputPass());

    this.buildSky();
    this.buildLights();

    // 雾：海面湿雾（运输船纵深 100m，雾距相应拉远；远端舱壁半没入雾中是氛围交付项）
    this.scene.fog = new THREE.Fog(0x1c2a3a, 26, 130);

    // 必须把 camera 挂进 scene，否则 camera.add(viewmodel) 的子节点不会进入遍历
    this.scene.add(this.camera);

    // 手中武器必须自带光：场景光源从世界空间方向来，跟相机走的武器永远背光
    const vmLight = new THREE.PointLight(0xfff0d8, 1.6, 1.4, 1.4);
    vmLight.position.set(0.28, 0.22, 0.32); // 相机右前上方
    this.camera.add(vmLight);
  }

  /** 程序化天空：canvas 渐变贴到内翻的大球上，零外部资产（海战氛围：海蓝 + 晚霞地平线） */
  private buildSky(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#0d1c30');
      g.addColorStop(0.45, '#24425e');
      g.addColorStop(0.72, '#54718a');
      g.addColorStop(1, '#8a7a62');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 8, 256);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(220, 24, 16),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false }),
    );
    sky.name = 'sky';
    this.scene.add(sky);
  }

  private buildLights(): void {
    // 半球光：天空色 → 地面色，给整体基调
    const hemi = new THREE.HemisphereLight(0x9fb6d9, 0x2b2419, 1.1);
    this.scene.add(hemi);

    // 主光（斜射，制造箱体明暗面）+ 阴影：覆盖整艘船（约 100m）的单一 shadow camera。
    // 04 是 ±26 的方形竞技场，±32 够用；运输船长 98m，必须拉到 ±55。
    const sun = new THREE.DirectionalLight(0xffe3c0, 2.4);
    sun.position.set(28, 40, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -55;
    sun.shadow.camera.right = 55;
    sun.shadow.camera.top = 55;
    sun.shadow.camera.bottom = -55;
    sun.shadow.camera.near = 4;
    sun.shadow.camera.far = 160;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);

    // 补光（冷色，从反方向压一点，避免暗部死黑）
    const fill = new THREE.DirectionalLight(0x6f8fd0, 0.7);
    fill.position.set(-24, 16, -20);
    this.scene.add(fill);

    this.scene.add(new THREE.AmbientLight(0x404a5c, 0.6));
  }

  /** 触发一次屏幕震动（受击 / 开火 / 爆炸） */
  shake(amount: number): void {
    this.shakeAmount = Math.min(1.2, this.shakeAmount + amount);
  }

  /** 每帧更新相机：位置 + 朝向 + 后坐力叠加 + 震动偏移 */
  update(dt: number, pose: CameraPose): void {
    const cam = this.camera;

    this.shakeTime += dt * 47;
    this.shakeAmount = Math.max(0, this.shakeAmount - CONFIG.camera.shakeDecay * dt * this.shakeAmount * 0.9 - dt * 0.05);

    const sx = Math.sin(this.shakeTime * 1.7) * this.shakeAmount * 0.09;
    const sy = Math.cos(this.shakeTime * 2.3) * this.shakeAmount * 0.09;

    cam.position.set(pose.pos.x + sx, pose.pos.y + sy, pose.pos.z);

    // 后坐力直接叠加到视角：枪口跳到哪，准星就在哪
    const yaw = pose.yaw + pose.recoilYaw;
    const pitch = pose.pitch + pose.recoilPitch;
    cam.rotation.set(0, 0, 0);
    cam.rotation.order = 'YXZ';
    cam.rotation.y = yaw;
    cam.rotation.x = pitch;
    cam.rotation.z = this.shakeAmount * Math.sin(this.shakeTime * 1.1) * 0.02;
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  render(): void {
    // 后处理链接管主渲染；tone mapping 由 OutputPass 收口
    this.composer.render();
  }

  /** 验证接口用：真实的 draw call / 三角面数（无头下唯一可信的性能指标） */
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
