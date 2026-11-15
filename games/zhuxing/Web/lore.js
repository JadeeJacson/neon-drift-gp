"use strict";
// 0.8: 向经典科幻致敬的原创遗迹。方碑致敬克拉克《2001太空漫游》，档案环致敬阿西莫夫《银河百科全书》。
// 它们不解锁、不强制、没有失败；发现与回应本身就是回报。
let loreReady = false,
  monolith = null,
  monolithResponded = false;
const loreOld = {
  init,
  initContent,
  updateHUD,
  makeSave,
  validSave,
  restoreSave,
};

initContent = function () {
  loreOld.initContent();
  const steel = mat(0x304852);
  // 玄砾 · 缄默方碑：1:4:9 比例的黑色石板。长久注视会得到一次微弱回应。
  {
    const s = site(
      "monolith",
      "缄默方碑",
      5,
      "比例精确为一比四比九的黑色石板，立在陨击坑的边缘。当你在近处长久注视它，表面的刻痕似乎亮了一瞬——也许是光的把戏，也许是回答。它不发布任务，也不要求崇拜。",
      [-0.15, 0.62, 0.77],
      0,
    );
    const g = atSite(s);
    s.root = g;
    box(g, [14, 0.6, 14], [0, -0.2, 0], mat(0x565c66));
    monolith = box(
      g,
      [1.4, 11.2, 5.6],
      [0, 5.3, 0],
      mat(0x0a0c10, { metalness: 0.65, roughness: 0.3, emissive: 0x1a2b44, emissiveIntensity: 0 }),
    );
    for (let k = 0; k < 5; k++) {
      const a = (k * Math.PI * 2) / 5 + 0.6;
      const slab = mesh(new THREE.BoxGeometry(0.8, 3.2, 0.8), steel, g);
      slab.position.set(Math.sin(a) * 6.4, 1.6, Math.cos(a) * 6.4);
      slab.rotation.y = -a;
      glowGem(g, [Math.sin(a) * 6.4, 3.4, Math.cos(a) * 6.4], 0x8fb4d9, 0.2);
    }
    glowGem(g, [0, 11.4, 0], 0xbcd2ef, 0.24);
  }
  // 静潮 · 银河档案环：十二块记忆石与一台可操作的索引台。
  {
    const s = site(
      "archive",
      "银河档案环",
      10,
      "十二块记忆石围成一圈，像一部摊开的百科全书。G 操作索引台，读取三条幸存的档案摘录。抄写者早已离场，但条目仍然朝着每一个愿意倾听的人开放。",
      [-0.5, 0.55, 0.67],
      0,
    );
    const g = rootSite(s);
    const stone = mat(0xb9c4c0);
    const ring = mesh(
      new THREE.TorusGeometry(9.6, 0.22, 6, 48),
      mat(0xc9ab7a, { emissive: 0x5c4a24, emissiveIntensity: 0.4 }),
      g,
    );
    ring.position.y = 0.35;
    ring.rotation.x = Math.PI / 2;
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6,
        h = 3.4 + (k % 3) * 0.9;
      const slab = mesh(new THREE.BoxGeometry(1.5, h + 10, 0.55), stone, g);
      slab.position.set(Math.sin(a) * 9.6, (h - 10) / 2, Math.cos(a) * 9.6);
      slab.rotation.y = -a;
      solidBoxes.push({ mesh: slab, half: V(0.8, (h + 10) / 2, 0.35) });
      glowGem(g, [Math.sin(a) * 9.6, h + 0.5, Math.cos(a) * 9.6], 0x9fd9cd, 0.16);
    }
    for (let k = 0; k < 3; k++) {
      const holo = mesh(
        new THREE.CylinderGeometry(0.12, 0.5, 2.6 - k * 0.5, 6),
        mat(0x9fe4d8, {
          emissive: 0x4f9f92,
          emissiveIntensity: 0.9,
          transparent: true,
          opacity: 0.65,
        }),
        g,
      );
      holo.position.y = 3.2 + k * 0.9;
    }
    consoleAt(s, g, "档案摘录 1 / 2 / 3", 3);
  }
};

updateHUD = function () {
  loreOld.updateHUD();
  if (!loreReady || !monolith || driving) return;
  const cameraF = V(0, 0, -1).applyQuaternion(camera.quaternion),
    toStone = monolith.getWorldPosition(V()).sub(camera.position),
    dist = toStone.length();
  const facing = dist < 110 && cameraF.dot(toStone.normalize()) > 0.992;
  monolith.material.emissiveIntensity +=
    ((facing ? 0.55 : 0) - monolith.material.emissiveIntensity) * 0.06;
  if (facing && !monolithResponded) {
    monolithResponded = true;
    sound("discover");
    toast("方碑回应了你的注视。刻痕亮了一瞬，又归于沉默。", 6);
    saveGame(false);
  }
};

makeSave = function () {
  const d = loreOld.makeSave();
  d.lore = { monolithResponded };
  return d;
};
validSave = function (d) {
  if (!loreOld.validSave(d)) return false;
  if (d.lore === undefined) return true;
  return !!(d.lore && typeof d.lore.monolithResponded === "boolean");
};
restoreSave = function (d) {
  if (!validSave(d)) throw Error("遗迹档案存档数据无效。");
  const ok = loreOld.restoreSave(d);
  monolithResponded = !!d.lore?.monolithResponded;
  return ok;
};

// 索引台读数：三条向经典科幻致敬的原创档案摘录。
const LORE_ARCHIVE = [
  "档案 0042：银河各邦一致同意——好奇心列为第一资源，仅次于氧气。",
  "档案 1187：所有长久的倾听者，最终都会成为播音者。",
  "档案 2001：我们仰望星空的时间，长于星空俯视我们的时间。",
];
const loreOldReadout = instrumentReadout;
instrumentReadout = function (it) {
  if (it.id === "archive") return LORE_ARCHIVE[actions.archive || 0];
  return loreOldReadout(it);
};

init = function () {
  loreOld.init();
  loreReady = true;
};
