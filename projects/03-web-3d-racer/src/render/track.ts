/**
 * 赛道视觉：从 sim 的 TrackGeometry 生成 three.js 网格——
 * 路面 ribbon、车道虚线、路缘条纹、起跑线、地面、赛道边装饰（树木/岩石/建筑/灯柱）。
 * 颜色按主题（TrackTheme）区分。
 */
import * as THREE from 'three';
import type { TrackGeometry, TrackTheme } from '../sim/track';

export interface ThemeVisual {
  skyTop: number;
  skyBottom: number;
  fog: number;
  road: number;
  wall: number;
  ground: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  sunColor: number;
  sunIntensity: number;
  bloom?: number;
  /** 装饰物体颜色 */
  propA: number;
  propB: number;
  /** 装饰类型 */
  propKind: 'trees' | 'rocks' | 'buildings' | 'lamps' | 'storm';
}

export const THEME: Record<TrackTheme, ThemeVisual> = {
  dawn: {
    skyTop: 0x3a6fa0, skyBottom: 0xfdb99b, fog: 0xfedccb,
    road: 0x3a3f4b, wall: 0xff9e7d, ground: 0x6b8fb5,
    hemiSky: 0xfff0d0, hemiGround: 0x6b8fb5, hemiIntensity: 0.55,
    sunColor: 0xffe8c0, sunIntensity: 1.6,
    propA: 0x2d6a4f, propB: 0x1b4332, propKind: 'trees',
  },
  canyon: {
    skyTop: 0x4a5a8a, skyBottom: 0xffcf9e, fog: 0xe8a86a,
    road: 0x4a3b32, wall: 0xc0653a, ground: 0xb5764a,
    hemiSky: 0xffe0b0, hemiGround: 0x8a5030, hemiIntensity: 0.5,
    sunColor: 0xffd0a0, sunIntensity: 1.5,
    propA: 0x8a4a2a, propB: 0x6a3520, propKind: 'rocks',
  },
  coast: {
    skyTop: 0x4a90c0, skyBottom: 0xcfeaf2, fog: 0xcfeaf2,
    road: 0x394048, wall: 0x4fc3c7, ground: 0x2f6f7a,
    hemiSky: 0xbfe8ff, hemiGround: 0x2f6f7a, hemiIntensity: 0.6,
    sunColor: 0xffffff, sunIntensity: 1.7,
    propA: 0x2a7a5a, propB: 0x1a5a3a, propKind: 'trees',
  },
  neon: {
    skyTop: 0x0a0620, skyBottom: 0x2a1a4a, fog: 0x2a1a4a,
    road: 0x16121f, wall: 0xff3df0, ground: 0x0e0a1a,
    hemiSky: 0x403080, hemiGround: 0x1a0a2a, hemiIntensity: 0.35,
    sunColor: 0x8080ff, sunIntensity: 0.6,
    propA: 0xff3df0, propB: 0x00ffff, propKind: 'buildings', bloom: 1.2,
  },
  storm: {
    skyTop: 0x2a3038, skyBottom: 0x6b7682, fog: 0x6b7682,
    road: 0x33373f, wall: 0x8fd0ff, ground: 0x3a4250,
    hemiSky: 0x8a9aaa, hemiGround: 0x2a3038, hemiIntensity: 0.4,
    sunColor: 0xa0b8d0, sunIntensity: 0.5,
    propA: 0x4a5a6a, propB: 0x3a4a5a, propKind: 'storm',
  },
};

export function buildTrackVisual(geo: TrackGeometry): THREE.Group {
  const theme = THEME[geo.def.theme];
  const group = new THREE.Group();
  const half = geo.def.width / 2;
  const n = geo.segments.length;

  // —— 路面 ribbon（与物理 trimesh 同一组顶点，视觉与碰撞一致）——
  const roadPos: number[] = [];
  const roadIdx: number[] = [];
  for (let i = 0; i < n; i++) {
    const s = geo.segments[i]!;
    roadPos.push(
      s.center.x - s.normal.x * half, s.center.y + 0.01, s.center.z - s.normal.z * half,
      s.center.x + s.normal.x * half, s.center.y + 0.01, s.center.z + s.normal.z * half,
    );
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2, b = i * 2 + 1;
    const c = ((i + 1) % n) * 2, d = ((i + 1) % n) * 2 + 1;
    roadIdx.push(a, b, c, b, d, c);
  }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
  roadGeo.setIndex(roadIdx);
  roadGeo.computeVertexNormals();
  const road = new THREE.Mesh(
    roadGeo,
    new THREE.MeshStandardMaterial({ color: theme.road, roughness: 0.92, metalness: 0.05 }),
  );
  road.receiveShadow = true;
  group.add(road);

  // —— 车道虚线（每隔几段画一段白色短线）——
  const dashMat = new THREE.MeshStandardMaterial({ color: 0xf0f0e0, roughness: 0.8 });
  const dashGeo = new THREE.BoxGeometry(0.3, 0.02, 3.0);
  for (let i = 0; i < n; i += 4) {
    const s = geo.segments[i]!;
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.position.set(s.center.x, s.center.y + 0.03, s.center.z);
    dash.rotation.y = s.yaw;
    group.add(dash);
  }

  // —— 路缘条纹（红白交替，紧贴路面两侧）——
  const curbRed = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.7 });
  const curbWhite = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 });
  const curbGeo = new THREE.BoxGeometry(0.6, 0.08, 2.0);
  for (let i = 0; i < n; i += 2) {
    const s = geo.segments[i]!;
    const mat = (Math.floor(i / 2) % 2 === 0) ? curbRed : curbWhite;
    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(curbGeo, mat);
      const cx = s.center.x + s.normal.x * side * (half + 0.3);
      const cz = s.center.z + s.normal.z * side * (half + 0.3);
      curb.position.set(cx, s.center.y + 0.04, cz);
      curb.rotation.y = s.yaw;
      group.add(curb);
    }
  }

  // —— 两侧视觉护栏（装饰，无碰撞）——
  const wallH = 1.4;
  for (const side of [-1, 1]) {
    const wpos: number[] = [];
    const widx: number[] = [];
    for (let i = 0; i < n; i++) {
      const s = geo.segments[i]!;
      const bx = s.center.x + s.normal.x * side * (half + 0.6);
      const bz = s.center.z + s.normal.z * side * (half + 0.6);
      const by = s.center.y;
      wpos.push(bx, by, bz, bx, by + wallH, bz);
    }
    for (let i = 0; i < n; i++) {
      const a = i * 2, b = i * 2 + 1;
      const c = ((i + 1) % n) * 2, d = ((i + 1) % n) * 2 + 1;
      widx.push(a, b, c, b, d, c);
    }
    const wgeo = new THREE.BufferGeometry();
    wgeo.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3));
    wgeo.setIndex(widx);
    wgeo.computeVertexNormals();
    const wall = new THREE.Mesh(
      wgeo,
      new THREE.MeshStandardMaterial({
        color: theme.wall, roughness: 0.55, metalness: 0.1,
        side: THREE.DoubleSide,
        emissive: theme.propKind === 'buildings' ? theme.wall : 0x000000,
        emissiveIntensity: theme.propKind === 'buildings' ? 0.6 : 0,
      }),
    );
    group.add(wall);
  }

  // —— 起跑/终点线（黑白棋盘格）——
  const s0 = geo.segments[0]!;
  const checkerWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const checkerBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
  const checkSize = geo.def.width / 8;
  for (let row = 0; row < 1; row++) {
    for (let col = -4; col <= 4; col++) {
      const mat = ((row + col) % 2 === 0) ? checkerWhite : checkerBlack;
      const sq = new THREE.Mesh(new THREE.BoxGeometry(checkSize, 0.02, checkSize), mat);
      const offX = s0.normal.x * col * checkSize;
      const offZ = s0.normal.z * col * checkSize;
      sq.position.set(s0.center.x + offX, s0.center.y + 0.03, s0.center.z + offZ);
      sq.rotation.y = s0.yaw;
      group.add(sq);
    }
  }

  // —— 地面（远处以雾隐没）——
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(5000, 5000),
    new THREE.MeshStandardMaterial({ color: theme.ground, roughness: 1, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  group.add(ground);

  // —— 赛道边装饰物体 ——
  addScenery(group, geo, theme);

  return group;
}

/** 在赛道两侧随机散布装饰物体（树木/岩石/建筑/灯柱），不参与碰撞 */
function addScenery(group: THREE.Group, geo: TrackGeometry, theme: ThemeVisual): void {
  const half = geo.def.width / 2;
  const n = geo.segments.length;

  // 共享几何体
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.5, 6);
  const leafGeo = new THREE.ConeGeometry(1.5, 3.5, 6);
  const rockGeo = new THREE.DodecahedronGeometry(1.5, 0);
  const buildingGeo = new THREE.BoxGeometry(3, 12, 3);
  const lampPostGeo = new THREE.CylinderGeometry(0.08, 0.1, 6, 6);
  const lampHeadGeo = new THREE.SphereGeometry(0.25, 8, 6);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: theme.propA, roughness: 0.85 });
  const rockMat = new THREE.MeshStandardMaterial({ color: theme.propA, roughness: 0.95, flatShading: true });
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e, roughness: 0.6, metalness: 0.2,
    emissive: theme.propB, emissiveIntensity: 0.4,
  });
  const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
  const lampHeadMat = new THREE.MeshStandardMaterial({
    color: 0xffffcc, emissive: 0xffee88, emissiveIntensity: 1.2,
  });

  // 伪随机（按段索引，确定性）
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  for (let i = 0; i < n; i += 3) {
    const s = geo.segments[i]!;
    for (const side of [-1, 1]) {
      // 每 3 段放 1-2 个装饰，距离路缘 8-25m
      if (rand() < 0.55) continue;
      const dist = 8 + rand() * 18;
      const px = s.center.x + s.normal.x * side * (half + dist);
      const pz = s.center.z + s.normal.z * side * (half + dist);
      const py = s.center.y - 0.3;

      let obj: THREE.Mesh;
      switch (theme.propKind) {
        case 'trees': {
          const g = new THREE.Group();
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = 1.25;
          trunk.castShadow = true;
          const leaf = new THREE.Mesh(leafGeo, leafMat);
          leaf.position.y = 4.0;
          leaf.castShadow = true;
          g.add(trunk, leaf);
          g.position.set(px, py, pz);
          g.rotation.y = rand() * Math.PI * 2;
          const sc = 0.7 + rand() * 0.8;
          g.scale.set(sc, sc, sc);
          group.add(g);
          continue;
        }
        case 'rocks': {
          obj = new THREE.Mesh(rockGeo, rockMat);
          obj.position.set(px, py + 0.5, pz);
          obj.rotation.set(rand() * 0.5, rand() * Math.PI * 2, rand() * 0.5);
          const sc = 0.8 + rand() * 1.5;
          obj.scale.set(sc, sc * (0.7 + rand() * 0.5), sc);
          obj.castShadow = true;
          group.add(obj);
          continue;
        }
        case 'buildings': {
          obj = new THREE.Mesh(buildingGeo, buildingMat);
          obj.position.set(px, py + 6, pz);
          obj.rotation.y = rand() * Math.PI * 2;
          const sc = 0.8 + rand() * 1.2;
          obj.scale.set(sc, sc, sc);
          group.add(obj);
          continue;
        }
        case 'lamps':
        case 'storm':
        default: {
          const g = new THREE.Group();
          const post = new THREE.Mesh(lampPostGeo, lampPostMat);
          post.position.y = 3;
          const head = new THREE.Mesh(lampHeadGeo, lampHeadMat);
          head.position.y = 6;
          g.add(post, head);
          g.position.set(px, py, pz);
          group.add(g);
          continue;
        }
      }
    }
  }
}
