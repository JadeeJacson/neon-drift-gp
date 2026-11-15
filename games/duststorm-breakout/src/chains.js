// DUST RUN 2.3-E — Contract chains. 委托完成后自动下发「第二步」加码目标（更高目标、更高报酬）。
// 第一步沿用 2.2 的九项委托与 id（测试与轮换逻辑依赖 save.runs % 3 与原 id，保持不动）。
const chainStep2 = {
  distance: { name: "探路先锋 · 深入", desc: "本次行驶 1000 米", target: 1000, reward: 420, value: (r) => Math.floor(r.distance / 12), unit: "m" },
  kills: { name: "公路清道夫 · 扩大", desc: "本次清除 55 名感染者", target: 55, reward: 480, value: (r) => r.kills, unit: "名" },
  supply: { name: "物尽其用 · 囤积", desc: "本次拾取 5 份补给", target: 5, reward: 400, value: (r) => r.supplies, unit: "份" },
  combo: { name: "连续突破 · 高潮", desc: "本次达成 18 连杀", target: 18, reward: 512, value: (r) => r.maxCombo, unit: "连杀" },
  break: { name: "拆迁行动 · 收网", desc: "本次摧毁 14 段结构", target: 14, reward: 560, value: (r) => r.collapses || 0, unit: "段" },
  air: { name: "离地时刻 · 长空", desc: "本次单次滞空 2.2 秒", target: 2.2, reward: 450, value: (r) => Math.floor(r.maxAir * 10) / 10, unit: "秒" },
  rescue: { name: "不留一人 · 全员", desc: "本次完成 2 次路边救援", target: 2, reward: 580, value: (r) => r.rescues, unit: "次" },
  speed: { name: "风沙竞速 · 全速", desc: "本次通过 2 座测速门", target: 2, reward: 480, value: (r) => r.speedGates, unit: "座" },
  special: { name: "危险清除 · 肃清", desc: "本次清除 10 名特殊感染者", target: 10, reward: 530, value: (r) => r.specialKills, unit: "名" },
};
const chainsBaseUpdate = updateField;
updateField = function (dt) {
  chainsBaseUpdate(dt);
  if (!field || run.finished) return;
  for (let i = 0; i < field.contracts.length; i++) {
    const c = field.contracts[i];
    if (!c.step2 && chainStep2[c.id] && field.completed.includes(c.id)) {
      field.contracts[i] = { ...chainStep2[c.id], id: c.id + "+2", step2: true };
      fieldMessage(
        "委托回执 / 链式追加",
        chainStep2[c.id].name + " 已下发。目标更高，报酬更丰厚。",
        "#e9cb89",
      );
    }
  }
};
