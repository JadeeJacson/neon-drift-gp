/* 纹理工厂：Canvas 程序化生成「做旧军事设施」全套贴图与材质
 * 每种纹理 = 值噪声铺底 + 图案细节（砖缝/划痕/污渍）+ 色斑做旧。
 * 不引用任何外部图片，保证单文件构建。 */
import * as THREE from 'three';
import { seedRng } from './util.js';

const cache = new Map();

/* ---------- 值噪声 ---------- */
let seed = 1337;
// 整数格点散列：32 位整数混淆，同一 (ix,iy) 结果稳定
function hash2(ix, iy) {
  let h = (ix * 374761393 + iy * 668265263 + seed) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function valueNoise(size, cells) {
  const img = new Float32Array(size * size);
  const s = size / cells;
  const at = (ix, iy) => hash2(((ix % cells) + cells) % cells, ((iy % cells) + cells) % cells);
  const sm = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = Math.floor(x / s), gy = Math.floor(y / s);
      const fx = sm((x - gx * s) / s), fy = sm((y - gy * s) / s);
      const a = at(gx, gy), b = at(gx + 1, gy), c = at(gx, gy + 1), d = at(gx + 1, gy + 1);
      img[y * size + x] = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    }
  }
  return img;
}
// 多倍频叠加
function fbm(size, cells, oct) {
  const out = new Float32Array(size * size);
  let amp = 1, tot = 0, c = cells;
  for (let o = 0; o < oct; o++) {
    const n = valueNoise(size, c);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    tot += amp; amp *= 0.5; c *= 2;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}

/* ---------- 画布工具 ---------- */
function newCanvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}
// 把 [0,1] 噪声场映射成颜色铺到画布
function paintNoise(ctx, size, field, lo, hi) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < field.length; i++) {
    const t = field[i];
    d[i * 4] = lo[0] + (hi[0] - lo[0]) * t;
    d[i * 4 + 1] = lo[1] + (hi[1] - lo[1]) * t;
    d[i * 4 + 2] = lo[2] + (hi[2] - lo[2]) * t;
    d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
// 随机污渍团
function splatters(ctx, size, rnd, n, colors, rMin, rMax, alpha) {
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = alpha * (0.4 + rnd() * 0.6);
    ctx.fillStyle = colors[(rnd() * colors.length) | 0];
    const x = rnd() * size, y = rnd() * size, r = rMin + rnd() * (rMax - rMin);
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.6 + rnd() * 0.8), rnd() * 6.28, 0, 6.28); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ---------- 各贴图生成（返回 canvas） ---------- */
const gens = {
  // 泥地碎石（大地面）
  dirt(size) {
    const c = newCanvas(size), ctx = c.getContext('2d'), rnd = seedRng(91);
    paintNoise(ctx, size, fbm(size, 6, 4), [62, 58, 50], [126, 118, 100]);
    // 碎石颗粒
    for (let i = 0; i < size * 1.6; i++) {
      const g = 60 + rnd() * 90;
      ctx.fillStyle = `rgba(${g},${g - 4},${g - 12},${0.25 + rnd() * 0.4})`;
      ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2.5, 1 + rnd() * 2);
    }
    splatters(ctx, size, rnd, 26, ['#2c2a24', '#4a4034', '#39332a'], 6, 26, 0.18);
    return c;
  },
  // 混凝土（室内地面 / 矮墙）
  concrete(size) {
    const c = newCanvas(size), ctx = c.getContext('2d'), rnd = seedRng(44);
    paintNoise(ctx, size, fbm(size, 8, 4), [96, 96, 93], [160, 158, 150]);
    // 裂缝
    ctx.strokeStyle = 'rgba(40,40,38,0.5)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      let x = rnd() * size, y = rnd() * size;
      ctx.moveTo(x, y);
      for (let s = 0; s < 8; s++) { x += (rnd() - 0.5) * size * 0.2; y += (rnd() - 0.5) * size * 0.2; ctx.lineTo(x, y); }
      ctx.lineWidth = 0.8 + rnd(); ctx.stroke();
    }
    splatters(ctx, size, rnd, 20, ['#5b5b57', '#7d7468', '#4c4c48'], 8, 30, 0.2);
    return c;
  },
  // 砖墙（营房外墙）
  brick(size) {
    const c = newCanvas(size), ctx = c.getContext('2d'), rnd = seedRng(77);
    paintNoise(ctx, size, fbm(size, 10, 3), [120, 112, 100], [166, 158, 144]); // 灰浆底色
    const rows = 10, bh = size / rows, bw = size / 4;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * bw * 0.5;
      for (let k = -1; k < 5; k++) {
        const x = k * bw + off + 2, y = r * bh + 2;
        const t = rnd();
        ctx.fillStyle = t < 0.7
          ? `rgb(${104 + rnd() * 44},${52 + rnd() * 26},${40 + rnd() * 22})`
          : `rgb(${80 + rnd() * 30},${72 + rnd() * 26},${62 + rnd() * 22})`;   // 少量灰砖
        ctx.fillRect(x, y, bw - 4, bh - 4);
        ctx.fillStyle = 'rgba(0,0,0,0.16)';
        ctx.fillRect(x, y + bh - 6, bw - 4, 3);                                  // 砖下沿阴影
      }
    }
    splatters(ctx, size, rnd, 16, ['#6e686240', '#00000030', '#8d8478a0'], 6, 24, 0.25);
    return c;
  },
  // 灰泥内墙（剥落）
  plaster(size) {
    const c = newCanvas(size), ctx = c.getContext('2d'), rnd = seedRng(23);
    paintNoise(ctx, size, fbm(size, 5, 4), [118, 112, 100], [168, 162, 148]);
    // 剥落露砖：不规则深色块
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = `rgb(${72 + rnd() * 22},${50 + rnd() * 18},${40 + rnd() * 14})`;
      const x = rnd() * size, y = rnd() * size, w = 8 + rnd() * 30, h = 6 + rnd() * 24;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 1; s < 7; s++) ctx.lineTo(x + (w * s) / 7 * (0.6 + rnd() * 0.6), y + (rnd() - 0.5) * h);
      ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h * (0.7 + rnd() * 0.5));
      ctx.closePath(); ctx.fill();
    }
    splatters(ctx, size, rnd, 18, ['#4a4640', '#5d564b', '#6b6258'], 5, 20, 0.2);
    return c;
  },
  // 波纹铁皮（仓库 / 门板）
  metal(size) {
    const c = newCanvas(size), ctx = c.getContext('2d'), rnd = seedRng(55);
    paintNoise(ctx, size, fbm(size, 12, 3), [104, 110, 116], [150, 156, 162]);
    const stripe = size / 16;
    for (let i = 0; i < 16; i++) {                                // 竖向波纹
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.14)';
      ctx.fillRect(i * stripe, 0, stripe / 2, size);
    }
    // 锈斑
    splatters(ctx, size, rnd, 34, ['#6e4326', '#8a5a30', '#4f2f1b'], 4, 18, 0.4);
    ctx.strokeStyle = 'rgba(30,30,30,0.5)';                       // 横向接缝
    ctx.beginPath(); ctx.moveTo(0, size * 0.5); ctx.lineTo(size, size * 0.5); ctx.lineWidth = 2; ctx.stroke();
    return c;
  },
  // 木箱板条
  crate(size) {
    const c = newCanvas(size), ctx = c.getContext('2d'), rnd = seedRng(66);
    paintNoise(ctx, size, fbm(size, 32, 3), [114, 88, 54], [160, 126, 82]);
    ctx.strokeStyle = 'rgba(60,44,26,0.65)';
    for (let i = 0; i < 22; i++) {                                 // 木纹
      ctx.lineWidth = 0.6 + rnd();
      ctx.beginPath();
      const y = rnd() * size; ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.3, y + (rnd() - 0.5) * 18, size * 0.6, y + (rnd() - 0.5) * 18, size, y + (rnd() - 0.5) * 8);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(46,34,20,0.85)';                        // 板条封边
    ctx.fillRect(0, 0, size, 5); ctx.fillRect(0, size - 5, size, 5);
    ctx.fillRect(0, 0, 5, size); ctx.fillRect(size - 5, 0, 5, size);
    splatters(ctx, size, rnd, 8, ['#3c2c1a', '#5f5138'], 5, 16, 0.22);
    return c;
  },
  // 沙袋
  sandbag(size) {
    const c = newCanvas(size), ctx = c.getContext('2d'), rnd = seedRng(88);
    paintNoise(ctx, size, fbm(size, 24, 3), [120, 108, 76], [172, 158, 116]);
    for (let i = 0; i < size * 2; i++) {                           // 粗麻布纹
      ctx.fillStyle = `rgba(${70 + rnd() * 40},${60 + rnd() * 36},${38 + rnd() * 26},0.28)`;
      ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 3, 1);
    }
    splatters(ctx, size, rnd, 14, ['#4e452e', '#675c3d'], 6, 18, 0.3);
    return c;
  },
  // 血迹贴花（透明底）
  blood(size) {
    const c = newCanvas(size), ctx = c.getContext('2d'), rnd = seedRng(12);
    ctx.clearRect(0, 0, size, size);
    const blob = (x, y, r, a) => {
      ctx.globalAlpha = a; ctx.fillStyle = '#5e0d09';
      ctx.beginPath();
      for (let s = 0; s <= 10; s++) {
        const ang = (s / 10) * Math.PI * 2, rr = r * (0.62 + rnd() * 0.6);
        const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr;
        s ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    };
    blob(size / 2, size / 2, size * 0.28, 0.92);
    for (let i = 0; i < 22; i++) blob(size / 2 + (rnd() - 0.5) * size * 0.8, size / 2 + (rnd() - 0.5) * size * 0.8, size * (0.02 + rnd() * 0.07), 0.5 + rnd() * 0.4);
    ctx.globalAlpha = 1;
    return c;
  },
  // 弹孔贴花（透明底）
  bulletHole(size) {
    const c = newCanvas(size), ctx = c.getContext('2d'), rnd = seedRng(5);
    ctx.clearRect(0, 0, size, size);
    const x = size / 2, y = size / 2;
    ctx.globalAlpha = 0.9; ctx.fillStyle = '#14120f';
    ctx.beginPath(); ctx.arc(x, y, size * 0.1, 0, 7); ctx.fill();
    for (let i = 0; i < 9; i++) {                                  // 放射裂纹
      const a = rnd() * 6.28, l = size * (0.12 + rnd() * 0.22);
      ctx.strokeStyle = 'rgba(20,18,15,0.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * size * 0.09, y + Math.sin(a) * size * 0.09);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
    }
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#000';                 // 边缘尘晕
    ctx.beginPath(); ctx.arc(x, y, size * 0.2, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    return c;
  }
};

/* ---------- 对外：canvas 纹理 / 材质 ---------- */
export function tex(name, repeat = 1) {
  if (!cache.has(name)) {
    const size = name === 'dirt' || name === 'concrete' ? 256 : 192;
    const canvas = gens[name](size);
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(repeat, repeat);
    t.anisotropy = 4;
    cache.set(name, t);
  }
  return cache.get(name);
}

export function mat(name, opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    map: tex(name, opts.repeat || 1),
    roughness: opts.rough == null ? 0.92 : opts.rough,
    metalness: opts.metal == null ? 0.04 : opts.metal,
    color: opts.color == null ? 0xffffff : opts.color,
    transparent: !!opts.transparent,
    alphaTest: opts.alphaTest || 0,
    side: opts.side || THREE.FrontSide
  });
  return m;
}

// 贴花材质（血迹 / 弹孔，半透明多边形）
export function decalMat(name) {
  return new THREE.MeshBasicMaterial({
    map: tex(name, 1), transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
}

// 枪膜/工具色材质（纯色 + 程序化噪点粗粒感由 vm 场景灯光补足）
export function gunMat(color, metal = 0.75, rough = 0.45) {
  return new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough });
}

// 一次性重置随机种子（地图构建开始时调用，保证布局可复现）
export function reseed(s) { seed = s >>> 0; }
