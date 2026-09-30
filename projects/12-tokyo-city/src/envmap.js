// envmap.js — HDRI 环境光照接入（Poly Haven，CC0，已登记 SOURCES.md §15）。
//
// 解决的是 env.js 里一直存在的一个问题：程序化城市里所有金属材质（车漆、车轮、
// 晴空塔格构、东京塔桁架）没有环境贴图反射时会发黑，夜里尤其明显。
// scene.environment 一给上，金属立刻有了可反射的东西。
//
// 关键取舍：HDRI 是「外部世界」的贴图，直接当环境光会和本作自定义的
// 昼夜天空穹顶打架（白天亮、晚上也亮）。所以强度由 DayNightRig 按 uDay
// 每帧调制：白天全开，夜里压到很低只留一点金属高光。
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const DIR = '/assets/hdri/polyhaven/';
const NAME = 'urban_alley_01_1k.hdr';

export async function loadEnvironment(scene) {
  // three 0.180 起 RGBELoader 已废弃并告警，改用等价的 HDRLoader
  const loader = new HDRLoader();
  loader.setPath(DIR);
  const tex = await loader.loadAsync(NAME);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = tex;
  scene.environmentIntensity = 0.5;   // 初值，随后由 rig 每帧接管
  return tex;
}
