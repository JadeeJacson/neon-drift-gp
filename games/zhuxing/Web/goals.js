"use strict";
// 0.8: 目标感层。里程碑、航线志与照片模式——全部可选，不设门槛、不解锁内容、不惩罚失败。
let goalsReady = false,
  unlocked = new Set(),
  travelLog = [],
  photoCount = 0,
  photoMode = false,
  photoCapture = false,
  goalsTimer = 0;
const GOALS = [
  {
    id: "all-worlds",
    title: "足迹 · 十一世界",
    desc: "到访全部 11 颗固态天体（近地 20 米内）。",
    check: () => visited.size >= 11,
  },
  {
    id: "all-sites",
    title: "探索者 · 全档案",
    desc: "亲手记录全部 47 处发现点。",
    check: () => discovered.size >= sites.length,
  },
  {
    id: "rift-crosser",
    title: "折叠旅人 · 双航路",
    desc: "两条折叠航路各成功穿越一次。",
    check: () => {
      const froms = new Set(riftRecords.map((r) => r.from));
      return froms.has("rift-a-in") && froms.has("rift-b-in");
    },
  },
  {
    id: "rift-probe",
    title: "探针先行者",
    desc: "让探针替你穿越一次黑洞。",
    check: () => riftRecords.some((r) => r.kind === "probe"),
  },
  {
    id: "quantum-traveler",
    title: "量子旅人 · 凝视穿越",
    desc: "趁观星者航标被观测时飞入环心。",
    check: () => quantumRecords.length > 0,
  },
  {
    id: "quantum-witness",
    title: "坍缩目击者",
    desc: "在碎晶跃迁后的瞬间重新注视它。",
    check: () => quantumWitnessed,
  },
  {
    id: "monolith-gaze",
    title: "方碑的回答",
    desc: "长久注视玄砾的缄默方碑。",
    check: () => monolithResponded,
  },
  {
    id: "star-prox",
    title: "逐星者 · 曦心近域",
    desc: "飞到曦心热边界 300 米以内，然后活着回来。",
    check: () => {
      const b = driving ? ship : player;
      return b.pos.distanceTo(starPos) - SYSTEM.star.r < 300;
    },
  },
];
const goalsOld = {
  init,
  physicsStep,
  updateHUD,
  renderJournal,
  makeSave,
  validSave,
  restoreSave,
};

function photoSnapshot() {
  try {
    const url = renderer.domElement.toDataURL("image/png"),
      a = document.createElement("a");
    a.href = url;
    a.download =
      "逐星-照片-" +
      new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) +
      ".png";
    a.click();
    photoCount++;
    toast("照片已保存 · 第 " + photoCount + " 张", 3);
    saveGame(false);
  } catch (e) {
    toast("此预览环境不支持导出照片，请截图工具替代。", 4);
  }
}

function setPhotoMode(on) {
  photoMode = on;
  document.body.classList.toggle("photo-mode", on);
  if (on) toast("照片模式 · X 保存画面 · C 退出", 4);
  else $("photoHint")?.classList.add("hidden");
}

init = function () {
  goalsOld.init();
  // 照片模式期间不允许暂停弹窗抢走按键焦点（例如切后台恢复）。
  const baseSetModal = setModal;
  setModal = function (id) {
    if (photoMode && id === "pause") return;
    baseSetModal(id);
  };
  const hint = document.createElement("div");
  hint.id = "photoHint";
  hint.className = "hidden";
  hint.textContent = "照片模式 · X 保存画面 · C 退出";
  document.body.append(hint);
  // 渲染包装：在下一帧渲染完成后同步抓取画布（不保留绘图缓冲的前提下可靠）。
  const baseRender = renderer.render.bind(renderer);
  renderer.render = function (sc, cam) {
    baseRender(sc, cam);
    if (photoCapture) {
      photoCapture = false;
      photoSnapshot();
    }
  };
  window.addEventListener("keydown", (e) => {
    if (
      !started ||
      e.repeat ||
      e.ctrlKey ||
      e.metaKey ||
      /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)
    )
      return;
    if (e.code === "KeyC" && !modal) {
      setPhotoMode(!photoMode);
      e.preventDefault();
    } else if (e.code === "KeyX" && photoMode && !modal) {
      photoCapture = true;
      e.preventDefault();
    }
  });
  goalsReady = true;
  Object.assign(__sandbox, {
    goals: {
      get unlocked() {
        return [...unlocked];
      },
      get travelLog() {
        return [...travelLog];
      },
      get photoCount() {
        return photoCount;
      },
      get photoMode() {
        return photoMode;
      },
      definitions: GOALS.map((g) => ({ id: g.id, title: g.title })),
    },
  });
  Object.assign(__sandbox, {
    step: physicsStep,
    restore: restoreSave,
    export: makeSave,
    getSave: makeSave,
    validSave,
    scan: scanSites,
  });
};

physicsStep = function (dt) {
  goalsOld.physicsStep(dt);
  if (!goalsReady || !started || paused) return;
  // 航线志：记录每颗天体的首次踏足时刻。
  const b = driving ? ship : player,
    p = nearest(b.pos);
  if (altitude(b.pos, p) < 20 && !travelLog.some((x) => x.i === p.index)) {
    travelLog.push({ i: p.index, t: Math.round(elapsed) });
    if (p.index !== 0)
      toast(
        "航线志：" +
          p.name +
          " · 第 " +
          travelLog.length +
          " 站 · 星系时刻 " +
          Math.round(elapsed) +
          " s",
        4,
      );
  }
  // 碎晶目击：跃迁后的短暂时窗内重新注视它。
  for (const q of quantumShards)
    if (
      !quantumWitnessed &&
      q.lastShift !== undefined &&
      simTime - q.lastShift < 1.4 &&
      q.observed
    )
      quantumWitnessed = true;
  // 里程碑轮询（约每秒一次）。
  goalsTimer += dt;
  if (goalsTimer > 1) {
    goalsTimer = 0;
    for (const g of GOALS)
      if (!unlocked.has(g.id) && g.check()) {
        unlocked.add(g.id);
        sound("discover");
        toast("里程碑达成：" + g.title, 6);
        saveGame(false);
      }
  }
};

updateHUD = function () {
  goalsOld.updateHUD();
  if (!goalsReady) return;
  if (photoMode)
    $("photoHint").classList.toggle("hidden", !photoMode);
};

renderJournal = function () {
  goalsOld.renderJournal();
  if (!goalsReady) return;
  const note = document.createElement("section");
  note.className = "rift-log";
  note.innerHTML =
    "<h3>航行志 · 里程碑</h3><p>已达成 " +
    unlocked.size +
    " / " +
    GOALS.length +
    " · 航经 " +
    travelLog.length +
    " 个世界 · 保存照片 " +
    photoCount +
    " 张。没有失败，没有错过——只有还没走到的地方。</p>" +
    "<p><small>" +
    GOALS.map(
      (g) =>
        (unlocked.has(g.id) ? "● " : "○ ") +
        g.title +
        " —— " +
        g.desc,
    ).join("<br>") +
    "</small></p>" +
    (!travelLog.length
      ? ""
      : "<p><small>航线：" +
        travelLog
          .map((x) => planets[x.i].name + " " + x.t + "s")
          .join(" → ") +
        "</small></p>");
  $("journalList").prepend(note);
};

makeSave = function () {
  const d = goalsOld.makeSave();
  d.goals = {
    unlocked: [...unlocked],
    travelLog: travelLog.map((x) => ({ ...x })),
    photoCount,
  };
  return d;
};
validSave = function (d) {
  if (!goalsOld.validSave(d)) return false;
  if (d.goals === undefined) return true;
  const g = d.goals;
  return !!(
    g &&
    Array.isArray(g.unlocked) &&
    g.unlocked.every((id) => GOALS.some((x) => x.id === id)) &&
    Array.isArray(g.travelLog) &&
    g.travelLog.length <= 12 &&
    g.travelLog.every(
      (x) =>
        x &&
        Number.isInteger(x.i) &&
        x.i >= 0 &&
        x.i < planets.length &&
        Number.isFinite(x.t) &&
        x.t >= 0,
    ) &&
    Number.isInteger(g.photoCount) &&
    g.photoCount >= 0
  );
};
restoreSave = function (d) {
  if (!validSave(d)) throw Error("航行志存档数据无效。");
  const ok = goalsOld.restoreSave(d);
  unlocked = new Set(d.goals?.unlocked || []);
  travelLog = (d.goals?.travelLog || []).map((x) => ({ ...x }));
  photoCount = d.goals?.photoCount || 0;
  setPhotoMode(false);
  return ok;
};
