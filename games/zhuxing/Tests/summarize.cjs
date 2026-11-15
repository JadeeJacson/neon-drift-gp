// 由 TestOutput/*-results.json 汇总生成 Docs/QA_SUMMARY.json。用法：node Tests/summarize.cjs
const fs = require("fs"),
  path = require("path");
const OUT = path.resolve(__dirname, "../TestOutput"),
  DOCS = path.resolve(__dirname, "../Docs");
const suites = [
  ["core", "core-results.json"],
  ["flight", "flight-results.json"],
  ["extra", "extra-results.json"],
  ["offline", "offline-results.json"],
  ["migration", "migration-results.json"],
  ["rifts", "rift-results.json"],
  ["quantum", "quantum-results.json"],
  ["lore", "lore-results.json"],
  ["goals", "goals-results.json"],
  ["touch", "touch-results.json"],
  ["visual-smoke", "visual-smoke-results.json"],
];
let total = 0,
  passed = 0,
  allPassed = true;
const rows = suites.map(([suite, file]) => {
  const data = JSON.parse(
    fs.readFileSync(path.join(OUT, file), "utf8"),
  );
  const checks = data.results.length,
    ok = data.results.filter((r) => r.pass).length;
  total += checks;
  passed += ok;
  if (ok !== checks) allPassed = false;
  return { suite, checks, passed: ok };
});
const summary = {
  version: "0.9",
  totalChecks: total,
  allPassed,
  environment:
    "Windows Chromium (Playwright) / SwiftShader, 1440x900 desktop, 390x844 touch",
  suites: rows,
  generatedAt: new Date().toISOString().slice(0, 10),
};
fs.writeFileSync(
  path.join(DOCS, "QA_SUMMARY.json"),
  JSON.stringify(summary, null, 2) + "\n",
);
console.log(JSON.stringify(summary));
process.exit(allPassed ? 0 : 1);
