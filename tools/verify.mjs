#!/usr/bin/env node
// game-lab 验证入口：把一个项目的所有可自动化检查串成一条命令。
// 用法:
//   node tools/verify.mjs 06              # 导入 + 加载 + sim 断言 + 资产检查
//   node tools/verify.mjs 06 --skip-import
//   node tools/verify.mjs 06 --tests-only
// 任一环节失败即整体退出码 1（路线图 §4 的执行体）。
//
// 日志落在 _scratch/verify/（已 gitignore），表格里的计数只统计 Godot 的
// "ERROR:" / "WARNING:" / "SCRIPT ERROR" 前缀，避免把正文里的单词算进去。

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG_DIR = path.join(ROOT, '_scratch', 'verify');

const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith('--')) || '06';
const flags = new Set(argv.filter((a) => a.startsWith('--')));

function die(msg) {
  console.error('[verify] ' + msg);
  process.exit(1);
}

function findEngine() {
  const base = path.join(ROOT, 'engines', 'godot');
  if (!fs.existsSync(base)) die('engines/godot 不存在，见 engines/README.md');
  for (const ver of fs.readdirSync(base)) {
    const dir = path.join(base, ver);
    if (!fs.statSync(dir).isDirectory()) continue;
    const consoleExe = fs.readdirSync(dir).find((f) => /_console\.exe$/i.test(f));
    if (consoleExe) return path.join(dir, consoleExe);
  }
  die('未找到 *_console.exe（普通版不输出脚本报错，不能用于验证）');
}

function findProject() {
  const base = path.join(ROOT, 'projects');
  const hit = fs.readdirSync(base).find((d) => d.startsWith(target + '-') || d === target);
  if (!hit) die('projects/ 下没有编号 ' + target + ' 的项目');
  return path.join(base, hit);
}

function countProblems(text) {
  const patterns = [/\bERROR:/g, /\bWARNING:/g, /SCRIPT ERROR/g];
  let n = 0;
  const lines = [];
  for (const line of text.split(/\r?\n/)) {
    if (patterns.some((re) => re.test(line))) {
      n++;
      lines.push(line.trim());
    }
  }
  return { n, lines };
}

const engine = findEngine();
const project = findProject();
const name = path.basename(project);
fs.mkdirSync(LOG_DIR, { recursive: true });

const results = [];

function run(label, args, opts = {}) {
  const started = Date.now();
  const res = spawnSync(engine, args, {
    cwd: ROOT,
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
    timeout: opts.timeout || 600000,
  });
  const out = (res.stdout || '') .toString('utf8') + (res.stderr || '').toString('utf8');
  const logFile = path.join(LOG_DIR, label + '.log');
  fs.writeFileSync(logFile, out);
  const { n, lines } = countProblems(out);
  const ok = res.status === 0 && n === 0;
  results.push({
    label,
    ok,
    exit: res.status,
    problems: n,
    detail: opts.parse ? opts.parse(out) : '',
    ms: Date.now() - started,
  });
  if (!ok && lines.length) {
    for (const l of lines.slice(0, 5)) console.log('    ! ' + l);
  }
  return ok;
}

console.log('');
console.log('=== 验证 ' + name + ' ===');
console.log('引擎: ' + path.relative(ROOT, engine));
console.log('');

const headless = ['--headless', '--path', project];

if (!flags.has('--tests-only')) {
  if (!flags.has('--skip-import')) {
    run('import', [...headless, '--import']);
  }
  run('load', [...headless, '--quit']);
}

const GUT = [
  ...headless,
  '-s', 'addons/gut/gut_cmdln.gd',
  '-gdir=res://sim/tests',
  '-gexit',
];

run('sim-tests', GUT, {
  parse: (out) => {
    // 全过时 GUT 只打「Asserts  430」，有失败时才打「Asserts  416/428」
    const m = out.match(/Asserts\s+(\d+)(?:\s*\/\s*(\d+))?/);
    const t = out.match(/Passing Tests\s+(\d+)/);
    const f = out.match(/Failing Tests\s+(\d+)/);
    if (!m && !t) return '无 GUT 输出（可能没有测试目录）';
    const asserts = m ? (m[2] ? m[1] + '/' + m[2] : m[1]) : '?';
    return `断言 ${asserts}  通过 ${t ? t[1] : '?'}  失败 ${f ? f[1] : '0'}`;
  },
});

if (fs.existsSync(path.join(project, 'tools', 'verify_assets.gd'))) {
  run('assets', [...headless, '-s', 'res://tools/verify_assets.gd']);
}

if (fs.existsSync(path.join(project, 'tools', 'preview_waves.gd'))) {
  run('waves', [...headless, '-s', 'res://tools/preview_waves.gd', '--', '--seeds=4'], {
    parse: (out) => {
      const m = out.match(/分钟\s+min=([\d.]+)\s+中位=([\d.]+)\s+max=([\d.]+)/);
      return m ? `整局 ${m[2]} 分钟（区间 ${m[1]}–${m[3]}，目标 10–15）` : '';
    },
  });
}

const pad = (s, w) => String(s).padEnd(w);
console.log(pad('步骤', 14) + pad('结果', 6) + pad('EXIT', 6) + pad('ERROR/WARNING', 15) + '详情');
console.log('-'.repeat(76));
for (const r of results) {
  console.log(
    pad(r.label, 14) +
    pad(r.ok ? 'PASS' : 'FAIL', 6) +
    pad(r.exit, 6) +
    pad(r.problems, 15) +
    (r.detail || '') + '  (' + (r.ms / 1000).toFixed(1) + 's)'
  );
}
const failed = results.filter((r) => !r.ok);
console.log('');
console.log(failed.length === 0
  ? '全部通过。日志在 ' + path.relative(ROOT, LOG_DIR) + '/'
  : failed.length + ' 项失败，见上面的 ! 行与日志');
process.exit(failed.length === 0 ? 0 : 1);
