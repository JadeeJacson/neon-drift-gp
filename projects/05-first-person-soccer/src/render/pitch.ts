/**
 * 场地渲染 —— 草坪 + 白线 + 球门 + 围板。全部程序化生成（零外部资产）。
 *
 * 草坪用 canvas 画条纹 + 白色标线，贴到一块大平面上：一次 draw call 拿到整个球场外观。
 */
import * as THREE from 'three';
import { CONFIG } from '../core/config';
import { pitchWalls } from '../sim/pitch';

const P = CONFIG.pitch;

/** 生成草坪纹理：横向条纹 + 中圈 + 禁区 + 中线 */
function makePitchTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 草坪底 + 条纹（沿长边方向）
    ctx.fillStyle = '#2f7a34';
    ctx.fillRect(0, 0, W, H);
    const stripes = 12;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#338339' : '#2c7331';
      ctx.fillRect((i / stripes) * W, 0, W / stripes + 1, H);
    }

    // 白色标线
    ctx.strokeStyle = 'rgba(240,248,240,0.9)';
    ctx.lineWidth = 6;
    const pad = 44;
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);

    // 中线
    ctx.beginPath();
    ctx.moveTo(W / 2, pad);
    ctx.lineTo(W / 2, H - pad);
    ctx.stroke();

    // 中圈
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * 0.14, 0, Math.PI * 2);
    ctx.stroke();

    // 两端禁区
    const boxW = W * 0.18;
    const boxH = H * 0.44;
    ctx.strokeRect(pad, (H - boxH) / 2, boxW, boxH);
    ctx.strokeRect(W - pad - boxW, (H - boxH) / 2, boxW, boxH);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function buildPitch(scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group();
  group.name = 'pitch';

  // 草坪平面（XZ），贴图为长边方向
  const groundW = (P.halfLength + P.goalDepth) * 2;
  const groundD = P.halfWidth * 2;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(groundW, groundD),
    new THREE.MeshLambertMaterial({ map: makePitchTexture() }),
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  // 场地外围（深色边）
  const surround = new THREE.Mesh(
    new THREE.PlaneGeometry(groundW + 120, groundD + 120),
    new THREE.MeshLambertMaterial({ color: 0x1d4a22 }),
  );
  surround.rotation.x = -Math.PI / 2;
  surround.position.y = -0.02;
  group.add(surround);

  // 围板（半透明，能看见但透光）
  const wallMat = new THREE.MeshLambertMaterial({
    color: 0xdfe8f0,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
  });
  for (const b of pitchWalls()) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(b.half.x * 2, b.half.y * 2, b.half.z * 2),
      wallMat,
    );
    mesh.position.set(b.pos.x, b.pos.y, b.pos.z);
    group.add(mesh);
  }

  // 球门：门柱 + 横梁（两侧）
  const postMat = new THREE.MeshLambertMaterial({ color: 0xf4f6f8 });
  const gw = P.goalWidth / 2;
  const postR = 0.09;
  for (const sx of [1, -1] as const) {
    for (const z of [gw, -gw]) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(postR, postR, P.goalHeight, 8),
        postMat,
      );
      post.position.set(sx * P.halfLength, P.goalHeight / 2, z);
      group.add(post);
    }
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(postR, postR, P.goalWidth, 8),
      postMat,
    );
    bar.rotation.x = Math.PI / 2;
    bar.position.set(sx * P.halfLength, P.goalHeight, 0);
    group.add(bar);

    // 球门网（半透明网格感：用低透明度盒子）
    const net = new THREE.Mesh(
      new THREE.BoxGeometry(P.goalDepth, P.goalHeight, P.goalWidth),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    net.position.set(sx * (P.halfLength + P.goalDepth / 2), P.goalHeight / 2, 0);
    group.add(net);
  }

  scene.add(group);
  return group;
}
