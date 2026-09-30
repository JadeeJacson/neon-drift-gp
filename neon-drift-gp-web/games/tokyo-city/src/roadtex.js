// roadtex.js — ambientCG Road007 沥青 PBR 接入（CC0，已登记 SOURCES.md §15）。
//
// 之前路面是「一块纯色 + 一张高频噪声」，近看是糊的、远看是噪点。
// 换上真实的 albedo / 法线 / 粗糙度三张图之后，路面才有骨料颗粒和湿痕。
//
// 这张素材有个坑：ambientCG 的 Road007 **不是可平铺路面，而是一整条路的截面图**——
// Color 图里烤死了「两条白色边线 + 一条中央虚线」。直接平铺到每条路上，
// 整座城会凭空多出成百上千条假标线，和几何体真正的标线打架（实测能看见）。
// 所以这里在贴图进 GPU 之前先把标线抹掉，抹法按图分开处理：
//   · albedo / roughness：标线是又细又亮（albedo）或又细又暗（roughness）的**离群值**。
//     拿同一张图做一次高斯模糊当参考，凡偏离模糊结果超过阈值的像素就换成模糊值。
//     沥青本身的斑驳相对模糊值只有 ±20%，标线能到 3 倍以上，阈值卡在 1.6 分得很干净。
//   · normal：标线是**极细的凹槽**（宽度不到 4px），沥青骨料起伏的尺度明显更大。
//     所以整张图做一次 3px 模糊就行——凹槽被抹平，骨料保留。
//
// 另外两处工程细节：
// 1) tiling 不能靠 texture.repeat。路面条用的是共享 BoxGeometry，UV 是 0..1，
//    repeat 一设，13m 支路和 30m 主干道的纹理密度就不一样了。所以 UV 已经在
//    ground.js 的 tileBoxUV() 里按世界尺度烘进几何体了，这里 repeat 必须是 1。
// 2) Color 图要走 sRGB 解释，Normal / Roughness 必须留在线性空间。
//    搞反了法线会整体偏色，路面看起来像蒙了一层脏。
import * as THREE from 'three';

const DIR = './assets/textures/ambientcg/Road007/';

// mode: 'outlier' 抹离群标线 | 'blur' 整体轻模糊（抹细凹槽）
const FILES = {
  map: { file: 'Road007_1K-JPG_Color.jpg', mode: 'outlier', srgb: true },
  normalMap: { file: 'Road007_1K-JPG_NormalGL.jpg', mode: 'blur', blur: 3, srgb: false },
  roughnessMap: { file: 'Road007_1K-JPG_Roughness.jpg', mode: 'outlier', srgb: false },
};

const OUTLIER_RATIO = 1.6;
const OUTLIER_BLUR = 5;

function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// 把 image 上「相对模糊结果偏离过大」的像素替换成模糊值
function stripOutliers(image) {
  const w = image.width, h = image.height;
  const src = canvasOf(w, h).getContext('2d', { willReadFrequently: true });
  src.drawImage(image, 0, 0);
  const a = src.getImageData(0, 0, w, h);

  const bctx = canvasOf(w, h).getContext('2d', { willReadFrequently: true });
  bctx.filter = `blur(${OUTLIER_BLUR}px)`;
  bctx.drawImage(image, 0, 0);
  const b = bctx.getImageData(0, 0, w, h);

  const d = a.data, m = b.data;
  for (let i = 0; i < d.length; i += 4) {
    for (let k = 0; k < 3; k++) {
      const v = d[i + k];
      const ref = Math.max(1, m[i + k]);
      if (v > ref * OUTLIER_RATIO || v < ref / OUTLIER_RATIO) d[i + k] = m[i + k];
    }
    d[i + 3] = 255;
  }
  src.putImageData(a, 0, 0);
  return src.canvas;
}

function softenNormals(image, radius) {
  const c = canvasOf(image.width, image.height);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(image, 0, 0);
  return c;
}

function loadTex(loader, spec) {
  return new Promise((resolve, reject) => {
    loader.load(
      DIR + spec.file,
      (tex) => {
        try {
          const src = stripOutliers(tex.image);
          tex.image = spec.mode === 'blur' ? softenNormals(src, spec.blur) : src;
        } catch (e) {
          // 去标线纯属锦上添花，失败就用原图，别让整条路变纯色
          console.warn('[road] 去标线处理失败，用原图：', e.message);
        }
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1); // 世界尺度已经烘进 UV，这里不能再放大
        tex.anisotropy = 8;   // 掠射角下的路面对各向异性最敏感
        tex.colorSpace = spec.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      reject
    );
  });
}

export async function applyRoadTexture(mat) {
  if (!mat) return null;
  const loader = new THREE.TextureLoader();
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([slot, spec]) => [slot, await loadTex(loader, spec)])
  );

  for (const [slot, tex] of entries) mat[slot] = tex;
  // albedo 已经是真实的深灰沥青，底色就不能再压暗，否则夜里路面会糊成一团黑
  mat.color.setHex(0xffffff);
  mat.normalScale.set(0.85, 0.85);
  mat.roughness = 1.0;
  mat.needsUpdate = true;
  return mat;
}
