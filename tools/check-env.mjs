#!/usr/bin/env node
// game-lab 环境探测：检查引擎与工具链就位状态，并打印实测版本号
// 用法: node tools/check-env.mjs

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINES = path.join(ROOT, 'engines');

// 正式期路线只依赖 Godot；Blender 是按需工具（改模/烘焙时才装），Unity 已放弃。
// required=false 的项缺失不算异常，只打印提示。
const ENGINE_SPECS = [
  {
    name: 'Godot',
    dir: 'godot',
    re: /^godot.*\.exe$/i,
    versionArgs: ['--version'],
    required: true,
    hint: 'https://godotengine.org/download/windows/',
  },
  {
    name: 'Blender',
    dir: 'blender',
    re: /^blender(-launcher)?\.exe$/i,
    versionArgs: ['--version'],
    required: false,
    optionalNote: '按需：当前素材自带动画 + 程序化补件，暂不需要',
    hint: 'https://www.blender.org/download/',
  },
];

const SYS_TOOLS = [
  { cmd: 'node', args: ['-v'] },
  { cmd: 'npm', args: ['-v'] },
  { cmd: 'git', args: ['--version'] },
  { cmd: 'dotnet', args: ['--version'] },
  { cmd: 'python', args: ['--version'] },
  { cmd: 'uv', args: ['--version'] },
];

// 直接执行 --version 取版本。比 where/which 可靠：
// Git Bash 下 PATH 含 MSYS 风格路径，where.exe 无法解析。
function probe(cmd, args, timeout = 8000) {
  const candidates = [cmd];
  if (process.platform === 'win32' && !/\.(exe|cmd|bat)$/i.test(cmd)) {
    candidates.push(cmd + '.cmd', cmd + '.exe');
  }
  for (const c of candidates) {
    try {
      const out = execFileSync(c, args, {
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout,
        windowsHide: true,
      });
      const first = out.toString().trim().split(/\r?\n/)[0].trim();
      if (first) return first;
    } catch {
      /* 尝试下一个候选 */
    }
  }
  // Windows 上 Node 禁止 execFile 直接执行 .cmd/.bat（CVE-2024-27980 修复所致），
  // npm 这类批处理入口必须走 shell 回退。
  if (process.platform === 'win32') {
    try {
      const out = execSync([cmd, ...args].join(' '), {
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout,
        windowsHide: true,
      });
      const first = out.toString().trim().split(/\r?\n/)[0].trim();
      if (first) return first;
    } catch {
      /* 忽略 */
    }
  }
  return null;
}

function walk(dir, depth = 0, out = []) {
  if (depth > 5) return out;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, depth + 1, out);
    else out.push(full);
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

function findEngines(spec) {
  const base = path.join(ENGINES, spec.dir);
  if (!fs.existsSync(base)) return [];
  return walk(base).filter((f) => spec.re.test(path.basename(f)));
}

const line = '='.repeat(58);

console.log('');
console.log('game-lab 环境探测');
console.log('根目录: ' + ROOT);
console.log(line);

let missingRequired = 0;

console.log('');
console.log('[ 引擎 ]');
for (const spec of ENGINE_SPECS) {
  const found = findEngines(spec);
  if (found.length === 0) {
    if (spec.required) {
      missingRequired++;
      console.log('  [缺失] ' + spec.name.padEnd(9) + '未安装（路线依赖）  ' + spec.hint);
    } else {
      console.log('  [ -- ] ' + spec.name.padEnd(9) + (spec.optionalNote || '未安装（可选）'));
    }
    continue;
  }
  const ver = spec.versionArgs ? probe(found[0], spec.versionArgs) : null;
  console.log('  [ OK ] ' + spec.name.padEnd(9) + (ver || '已就位（未探测版本）'));
  for (const f of found) console.log('       ' + rel(f));
}

console.log('');
console.log('[ 系统工具 ]');
for (const t of SYS_TOOLS) {
  const ver = probe(t.cmd, t.args);
  console.log('  [' + (ver ? 'OK' : '--') + '] ' + t.cmd.padEnd(9) + (ver || '未解析到'));
}

console.log('');
console.log(line);
if (missingRequired === 0) {
  console.log('路线依赖就绪（Godot 已安装）。未安装的可选工具不影响现有项目。');
} else {
  console.log(missingRequired + ' 项路线依赖缺失，获取方式见 engines/README.md');
  console.log('下一步：确认要装的版本与体积，再执行下载。');
}
process.exit(missingRequired === 0 ? 0 : 1);
