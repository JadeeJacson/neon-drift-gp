// signs.js — 程序化日文招牌：竖霓虹看板（突出式/贴墙式）、横幅广告牌、楼体大屏。
// 全部用 canvas 画字（Windows 自带 Yu Gothic / Meiryo / MS Gothic 渲染汉字假名）。
import * as THREE from 'three';
import { nightEmissive } from './fx.js';
import { makeRng } from './layout.js';

const NEON = [0xff4d6d, 0x4dd2ff, 0xffd24d, 0x7dff8a, 0xff8a3c, 0xc17dff, 0xfff2f2];
const BGS = ['#101423', '#0a0c10', '#231019', '#0e1a1a', '#1a1030'];

const V_WORDS = [
  '居酒屋', 'カラオケ', 'ラーメン', 'パチンコ', '美容室', '喫茶', 'スナック',
  '寿司', '薬局', '将棋', 'ゲーム', '雑貨', '焼肉', '鮨', '蕎麦', '貸事務所',
  'バー', '銭湯', 'マッサージ', '一部', '税理士',
];
const B_TEXTS = [
  '営業中', '24時間', '生ビール', '冷奴', '渋谷駅前', '本日限定', '新装開店',
  'サクラ航空', '電気街', '空席あり', '賃貸', '祝日も営業', '特売', 'スタミナ',
];
const SCREEN_ADS = [
  { bg: ['#ff5f8f', '#ff9966'], big: '渋谷', sub: 'SHIBUYA STATION' },
  { bg: ['#3f7dff', '#41d8ff'], big: 'SKY', sub: '東京スカイツリー 634m' },
  { bg: ['#25c485', '#a0ffb0'], big: 'MEGA CITY', sub: '東京メトロ' },
  { bg: ['#8a4dff', '#ff4dd2'], big: 'NIGHT LIFE', sub: '夜の東京を歩こう' },
  { bg: ['#ffb42e', '#ff5f5f'], big: 'ラーメン', sub: '深夜2時まで営業中' },
];

function hex(n) {
  return '#' + n.toString(16).padStart(6, '0');
}
function mixWhite(css, k) {
  const c = parseInt(css.slice(1), 16);
  const r = Math.round(((c >> 16) & 255) * (1 - k) + 255 * k);
  const g = Math.round(((c >> 8) & 255) * (1 - k) + 255 * k);
  const b = Math.round((c & 255) * (1 - k) + 255 * k);
  return `rgb(${r},${g},${b})`;
}

function pick(rng, arr) {
  return arr[(rng() * arr.length) | 0];
}

const FONT = (px) => `bold ${px}px "Yu Gothic", "Meiryo", "MS Gothic", "Microsoft YaHei", sans-serif`;

// ---- 竖向看板纹理（文字竖排 + 霓虹描边）----
export function makeVerticalSignTexture(word, opts = {}) {
  const rng = opts.rng || Math.random;
  const fg = opts.fg || hex(pick(rng, NEON));
  const bg = opts.bg || pick(rng, BGS);
  const chars = [...word];
  const cw = 150, ch = 108;
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = Math.min(768, chars.length * ch + 46);
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  // 边框
  ctx.strokeStyle = mixWhite(fg, 0.15);
  ctx.lineWidth = 7;
  ctx.globalAlpha = 0.85;
  ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
  ctx.globalAlpha = 1;
  // 外发光 + 近白字芯
  const isKana = /[\u3000-\u9fff\uff01-\uffee]/.test(word);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = FONT(84);
  ctx.shadowColor = fg;
  ctx.shadowBlur = 26;
  ctx.fillStyle = fg;
  chars.forEach((ch2, i) => {
    const y = 30 + ch / 2 + i * ch;
    if (isKana) ctx.fillText(ch2, c.width / 2, y);
  });
  if (!isKana) {
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(word, 0, 0, c.height * 0.8);
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = mixWhite(fg, 0.62);
  chars.forEach((ch2, i) => {
    const y = 30 + ch / 2 + i * ch;
    if (isKana) ctx.fillText(ch2, c.width / 2, y);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ---- 横向广告牌纹理 ----
export function makeBillboardTexture(text, opts = {}) {
  const rng = opts.rng || Math.random;
  const fg = opts.fg || hex(pick(rng, NEON));
  const bg1 = opts.bg1 || pick(rng, BGS);
  const c = document.createElement('canvas');
  c.width = 512; c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg1;
  ctx.fillRect(0, 0, 512, 192);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 180);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = FONT(92);
  ctx.shadowColor = fg;
  ctx.shadowBlur = 22;
  ctx.fillStyle = fg;
  ctx.fillText(text, 256, 96, 460);
  ctx.shadowBlur = 0;
  ctx.fillStyle = mixWhite(fg, 0.55);
  ctx.fillText(text, 256, 96, 460);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---- 楼体大屏（可轮播广告）----
export function makeScreenTexture(variantIndex = 0) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const state = { canvas: c, ctx: c.getContext('2d'), tex, idx: variantIndex % SCREEN_ADS.length };
  drawScreen(state);
  return state;
}

export function drawScreen(state) {
  const { ctx, idx } = state;
  const ad = SCREEN_ADS[idx % SCREEN_ADS.length];
  const grad = ctx.createLinearGradient(0, 0, 512, 256);
  grad.addColorStop(0, ad.bg[0]);
  grad.addColorStop(1, ad.bg[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);
  // 装饰圆
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(430, 60, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(60, 220, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(0, 168, 512, 44);
  ctx.font = FONT(86);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(ad.big, 256, 96, 470);
  ctx.shadowBlur = 0;
  ctx.font = FONT(30);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(ad.sub, 256, 190, 480);
  state.tex.needsUpdate = true;
}

// 把一批大屏注册进轮播（main 每 6 秒换一则）
export const screens = [];
export function registerScreen(state) {
  screens.push(state);
}
export function tickScreens() {
  for (const s of screens) {
    s.idx = (s.idx + 1 + ((Math.random() * 2) | 0)) % SCREEN_ADS.length;
    drawScreen(s);
  }
}

// ---- 依据建筑列表挂招牌 ----
export function decorateBuildings(scene, buildings, seed = 99) {
  const rng = makeRng(seed);
  const g = new THREE.Group();
  g.name = 'signs';
  const signGeo = new THREE.PlaneGeometry(1, 1);
  let count = 0;

  for (const b of buildings) {
    const density = b.zone === 'shibuya' ? 5 : b.zone === 'mid' ? (rng() < 0.45 ? 1 : 0) : 0;
    if (!density) continue;
    // 选一面临街（随机墙）
    for (let i = 0; i < density && count < 280; i++) {
      const side = (rng() * 4) | 0; // 0:+x 1:-x 2:+z 3:-z
      const nx = side === 0 ? 1 : side === 1 ? -1 : 0;
      const nz = side === 2 ? 1 : side === 3 ? -1 : 0;
      const wallHalf = nx !== 0 ? b.w / 2 : b.d / 2;
      const alongMin = -wallHalf + 2.2, alongMax = wallHalf - 2.2;
      if (alongMax <= alongMin) continue;
      const along = alongMin + rng() * (alongMax - alongMin);
      const px = b.x + nx * wallHalf;
      const pz = b.z + nz * wallHalf;
      const word = pick(rng, V_WORDS).trim() || '営業中';
      const L = 3.2 + rng() * 3.4; // 看板长度(米)
      const y = 4.5 + rng() * Math.max(4, Math.min(b.h - L - 2, 22));
      if (y + L > b.h - 1) continue;

      const tex = makeVerticalSignTexture(word, { rng });
      const mat = nightEmissive(
        new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.7, side: THREE.DoubleSide }),
        1.3
      );
      const mesh = new THREE.Mesh(signGeo, mat);
      mesh.scale.set(1.25, L, 1);
      // 朝向：60% 突出式（板面平行街道），40% 贴墙
      if (rng() < 0.6) {
        // 板面法线沿街道方向（切向）
        const yaw = nz !== 0 ? Math.PI / 2 : 0;
        mesh.rotation.y = yaw;
        const out = 0.1 + 0.625; // 半板宽 + 少许贴墙
        mesh.position.set(px + nx * out, y + L / 2, pz + nz * out);
        if (nx !== 0) mesh.position.z += along;
        else mesh.position.x += along;
      } else {
        const yaw = nx !== 0 ? (nx > 0 ? Math.PI / 2 : -Math.PI / 2) : nz > 0 ? 0 : Math.PI;
        mesh.rotation.y = yaw;
        mesh.position.set(px + nx * 0.12, y + L / 2, pz + nz * 0.12);
        if (nx !== 0) mesh.position.z += along;
        else mesh.position.x += along;
      }
      g.add(mesh);
      count++;
    }
    // 大广告牌（上部）
    if (b.zone === 'shibuya' && b.h > 14 && rng() < 0.75 && count < 300) {
      const side = (rng() * 4) | 0;
      const nx = side === 0 ? 1 : side === 1 ? -1 : 0;
      const nz = side === 2 ? 1 : side === 3 ? -1 : 0;
      const wallHalf = nx !== 0 ? b.w / 2 : b.d / 2;
      const tex = makeBillboardTexture(pick(rng, B_TEXTS), { rng });
      const mat = nightEmissive(
        new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, roughness: 0.6 }),
        1.15
      );
      const bw = Math.min(wallHalf * 1.4, 4.5 + rng() * 4);
      const mesh = new THREE.Mesh(signGeo, mat);
      mesh.scale.set(bw, bw * 0.375, 1);
      const yaw = nx !== 0 ? (nx > 0 ? Math.PI / 2 : -Math.PI / 2) : nz > 0 ? 0 : Math.PI;
      mesh.rotation.y = yaw;
      const y = b.h * (0.55 + rng() * 0.3);
      mesh.position.set(b.x + nx * (wallHalf + 0.1), y, b.z + nz * (wallHalf + 0.1));
      g.add(mesh);
      count++;
    }
  }
  scene.add(g);
  return count;
}
