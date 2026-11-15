// DUST RUN 2.3 meta — normalization guard, settings toggle, unified physics hook, QA snapshot.
// expedition 的 normalizeField 会按 2.2 键清单重建 fieldStats 并丢失新增键；本层在内层调用前
// 保留额外键、调用后回填，并补齐 2.3 新增存档字段默认值（旧档自动升级）。
const metaNormalizeField = normalizeField;
normalizeField = function () {
  const keep = save.fieldStats || {};
  metaNormalizeField();
  if (typeof save.settings.horde !== "boolean") save.settings.horde = true;
  const baseKeys = ["rescues", "supplies", "specialKills", "structures", "speedGates", "contracts", "maxAir", "cash"];
  for (const k in keep)
    if (!baseKeys.includes(k)) save.fieldStats[k] = Math.max(0, Number(keep[k]) || 0);
  // 2.3 新增统计键必须初始化存在（否则 Math.max(undefined, n) 会污染为 NaN）
  for (const k of ["bosses", "nests", "lobbers", "screamers", "endlessDist", "endlessKills"])
    save.fieldStats[k] = Math.max(0, Number(save.fieldStats[k]) || 0);
  save.endlessBest = {
    dist: Math.max(0, Number(save.endlessBest?.dist) || 0),
    kills: Math.max(0, Number(save.endlessBest?.kills) || 0),
  };
};
normalizeField();

// 设置面板：尸潮追击压力开关（关闭 = 2.2 平静节奏，低压/辅助模式）。
$("weatherToggle")
  .closest(".settings-row")
  .insertAdjacentHTML(
    "afterend",
    '<div class="settings-row"><span>尸潮追击压力</span><button class="toggle" id="hordeToggle"></button></div>',
  );
const metaRenderSettings = renderSettings;
renderSettings = function () {
  metaRenderSettings();
  $("hordeToggle").textContent = save.settings.horde ? "开启" : "关闭";
  $("hordeToggle").classList.toggle("on", !!save.settings.horde);
};
$("hordeToggle").onclick = () => {
  save.settings.horde = !save.settings.horde;
  persist();
  renderSettings();
};

// 帮助页追加 2.3 玩法说明。
$("help")
  .querySelector(".field-help")
  .insertAdjacentHTML(
    "afterend",
    '<p class="field-help">2.3 尸潮觉醒：尸潮会从后方追击，减速停靠（救援/修整）时注意贴身撕咬——保持移动或用导弹清场。投石者远程抛掷爆燃物（落点有预警圈），尖啸者会动员周围尸群，尸巢持续孵化（冲撞或引爆清除）。每区终点前有防线塔：引爆塔上 TNT 或撞穿核心甲板即可瓦解并获奖。远征档案内可进入无尽远征。设置「尸潮追击压力」关闭后回到 2.2 的平静节奏。</p>',
  );

// 启动按钮在 expedition.js 加载时捕获了旧包装函数，会绕过 2.3 包装链；在最后重新绑定到最外层。
$("launchBtn").onclick = () => {
  endlessPending = false;
  startRun();
};
$("retryBtn").onclick = () => startRun();

// 统一物理钩子：各 2.3 子系统按序更新，再进入既有链（远征 updateField → 结构/军械/核心物理）。
const metaPhysics = physics;
physics = function (dt) {
  if (state === "run" && field && run && !run.finished) {
    updateHorde(dt);
    updateMutants(dt);
    updateBoss(dt);
    updateEndless(dt);
  }
  metaPhysics(dt);
};

// QA 检查端点：版本 2.3.0，附加子系统只读快照。
const metaSnapshot = window.DustRun.snapshot;
window.DustRun = {
  version: "2.3.0",
  snapshot: () => {
    const s = metaSnapshot();
    s.v23 = {
      horde: horde
        ? {
            wave: horde.wave,
            chasers: zombies.reduce((n, z) => n + (z.horde && !z.hit ? 1 : 0), 0),
            timer: horde.timer,
          }
        : null,
      nests: nests.map((n) => ({ x: n.x, hp: n.hp, dead: n.dead })),
      shots: mutantShots.length,
      marks: mutantMarks.length,
      lobbers: zombies.filter((z) => z.variant === "lobber" && !z.hit).length,
      screamers: zombies.filter((z) => z.variant === "screamer" && !z.hit).length,
      boss: boss ? { x: boss.x, hp: boss.hp, defeated: boss.defeated, name: run?.bossName || "" } : null,
      endless: run?.endless
        ? { generatedTo: endlessGen?.generatedTo ?? 0, chunks: endlessGen?.chunks ?? 0 }
        : null,
    };
    return s;
  },
};
