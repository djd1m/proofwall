#!/usr/bin/env node
// Repository guardrail, not a security boundary or a QE runner.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, lstatSync, realpathSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateQeInstallation } from './verify-qe-installation.mjs';

const STATE = 'features/proofo-ui/implementation-state.json';
const MANIFEST = '.agents/agentic-qe/UPSTREAM-MANIFEST.json';
const EVENT_LOG = '.agentic-qe/proofwall-hook-events.jsonl';
const REQUIRED = ['unit', 'typecheck', 'build', 'integration', 'e2e', 'visual', 'accessibility', 'independent-review'];
const HOOK_COMMAND = 'node "$(git rev-parse --show-toplevel)/scripts/process-guard.mjs" hook';
const sha = value => createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(message); };
const secret = path => /(^|\/)(\.env[^/]*|\.secret[^/]*|\.?credentials?(?:[.-][^/]*)?)(\/|$)/i.test(path);
function localFile(root, path) {
  if (typeof path !== 'string' || !path || isAbsolute(path) || secret(path)) fail('Недопустимый путь входа');
  const target = resolve(root, path);
  if (relative(root, target) === '..' || relative(root, target).startsWith(`..${sep}`) || target === root) fail('Путь за пределами проекта');
  let cursor = target;
  while (cursor !== root) {
    if (lstatSync(cursor).isSymbolicLink()) fail('Symlink не допускается в доказательствах/входах');
    cursor = dirname(cursor);
  }
  if (!lstatSync(target).isFile()) fail('Нечитаемый обязательный вход');
  return target;
}
const bytes = (root, path, allowEmpty = true) => {
  const value = readFileSync(localFile(root, path));
  if (!allowEmpty && !value.length) fail('Пустой обязательный вход');
  return value;
};
const parseJson = value => {
  try { return JSON.parse(value); } catch { fail('Неверный или пустой JSON (содержимое скрыто)'); }
};
const json = (root, path) => parseJson(bytes(root, path));
export function repositoryRoot(cwd) {
  return realpathSync(execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' }).trim());
}
function inputPaths(root) {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0').filter(Boolean).filter(path => path !== STATE && path !== EVENT_LOG && !secret(path));
}
export function inputDigest(root) {
  const paths = inputPaths(root);
  const entries = [...new Set(paths)].sort().map(path => [path, sha(bytes(root, path))]);
  if (!entries.length) fail('Нет входов для digest');
  return sha(JSON.stringify(entries));
}
export function validateManifest(root) {
  const manifest = json(root, MANIFEST);
  if (manifest.schemaVersion !== 1 || !manifest.repository || !/^[a-f0-9]{40}$/.test(manifest.commit || '') ||
      !manifest.runtime || manifest.runtime.package !== 'agentic-qe' || !manifest.runtime.version ||
      !Array.isArray(manifest.packages) || !manifest.packages.length) fail('Неверный upstream manifest');
  let count = 0;
  for (const pkg of manifest.packages) {
    if (!pkg.name || !pkg.version || !pkg.root || !pkg.files || !Object.keys(pkg.files).length) fail('Пустой пакет manifest');
    for (const [path, digest] of Object.entries(pkg.files)) {
      if (!/^[a-f0-9]{64}$/.test(digest) || sha(bytes(root, `${pkg.root}/${path}`)) !== digest) fail('Vendor hash mismatch');
      count++;
    }
  }
  const runtime = json(root, 'node_modules/agentic-qe/package.json');
  if (runtime.name !== manifest.runtime.package || runtime.version !== manifest.runtime.version) fail('Локальный agentic-qe runtime отсутствует или версия не совпадает');
  return { files: count, runtime: runtime.version };
}
export function readState(root) {
  const state = json(root, STATE);
  if (state.schemaVersion !== 1 || state.feature !== 'proofo-ui' || state.fullQe !== true ||
      !['planned', 'implementing', 'ready'].includes(state.stage) || typeof state.activeProductChange !== 'boolean' ||
      !['unclassified', 'S', 'M', 'L', 'XL'].includes(state.complexityTier) ||
      !Array.isArray(state.requiredChecks) || REQUIRED.some(id => !state.requiredChecks.includes(id))) fail('Неверное состояние --full-qe');
  if (state.complexityTier === 'XL' && ['security', 'performance'].some(id => !state.requiredChecks.includes(id))) fail('XL требует security и performance checks');
  return state;
}
export function validateDelivery(root) {
  validateQeInstallation(root);
  validateManifest(root);
  const state = readState(root);
  if (state.stage !== 'ready') fail(`Поставка заблокирована: stage=${state.stage}`);
  const receipt = state.receipt;
  if (!receipt || typeof receipt !== 'object') fail('Отсутствует QE receipt');
  validateImplementationAdmission(root);
  const issued = Date.parse(receipt.issuedAt);
  if (!Number.isFinite(issued) || issued > Date.now() + 60000 || Date.now() - issued > 86400000) fail('Receipt просрочен (24 часа) или имеет неверную дату');
  const included = new Set(inputPaths(root));
  for (const id of state.requiredChecks) {
    const check = receipt.checks?.[id];
    if (check?.status !== 'passed' || !/^[a-f0-9]{64}$/.test(check.evidenceSha256 || '')) fail(`Нет успешного доказательства: ${id}`);
    const reportBytes = bytes(root, check.evidence, false);
    if (!included.has(check.evidence)) fail(`Evidence отсутствует в поставляемых входах: ${id}`);
    if (sha(reportBytes) !== check.evidenceSha256) fail(`Устаревшее доказательство: ${id}`);
    const report = parseJson(reportBytes);
    if (report.status !== 'passed' || report.exitCode !== 0 || typeof report.command !== 'string' || !report.command.trim()) fail(`Проверка не пройдена: ${id}`);
    if (['visual', 'e2e'].includes(id) && (!Array.isArray(report.artifacts) || !report.artifacts.length)) fail(`Нет артефактов: ${id}`);
    for (const artifact of report.artifacts || []) {
      bytes(root, artifact, false);
      if (!included.has(artifact)) fail(`Artifact отсутствует в поставляемых входах: ${id}`);
    }
  }
  if (receipt.inputDigest !== inputDigest(root)) fail('Receipt не соответствует текущим входам (stale digest)');
  return state;
}

export function validateImplementationAdmission(root) {
  const state = readState(root);
  if (state.stage === 'planned') fail('Продуктовый код заблокирован: stage=planned');
  if (state.complexityTier === 'unclassified') fail('До кода требуется complexity assessment');
  const admission = state.implementationAdmission;
  if (!admission?.plan || !Array.isArray(admission.specifications) || !admission.specifications.length) fail('Нет допуска реализации с планом и OpenSpec');
  const refs = [admission.plan, ...admission.specifications];
  if (!admission.plan.path?.startsWith('features/proofo-ui/') || admission.specifications.some(ref => !ref.path?.startsWith('openspec/changes/'))) fail('Неверные пути плана/OpenSpec');
  for (const ref of refs) if (!/^[a-f0-9]{64}$/.test(ref.sha256 || '') || sha(bytes(root, ref.path, false)) !== ref.sha256) fail('Допуск реализации устарел: план/OpenSpec изменён');
  const designDigest = sha(JSON.stringify(refs.map(ref => [ref.path, ref.sha256]).sort((a, b) => a[0].localeCompare(b[0]))));
  for (const id of ['K1', 'K2']) {
    const check = admission.checkpoints?.[id];
    if (check?.status !== 'passed' || !check.evidence || !/^[a-f0-9]{64}$/.test(check.evidenceSha256 || '')) fail(`Нет реального checkpoint: ${id}`);
    const evidence = bytes(root, check.evidence, false);
    const report = parseJson(evidence);
    if (sha(evidence) !== check.evidenceSha256 || report.status !== 'passed' || report.exitCode !== 0 || !report.command?.trim() || report.designDigest !== designDigest) fail(`Checkpoint не соответствует текущему дизайну: ${id}`);
  }
  return state;
}

function audit(root, event, decision) {
  if (!['SessionStart', 'PreToolUse', 'Stop'].includes(event?.hook_event_name)) return;
  const dir = resolve(root, '.agentic-qe');
  mkdirSync(dir, { recursive: true });
  if (lstatSync(dir).isSymbolicLink()) fail('Audit directory must not be a symlink');
  const path = resolve(root, EVENT_LOG);
  try { if (lstatSync(path).isSymbolicLink()) fail('Audit log must not be a symlink'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  appendFileSync(path, `${JSON.stringify({ event: event.hook_event_name, timestamp: new Date().toISOString(), decision })}\n`, { mode: 0o600 });
}

function aqeLifecycle(root, event) {
  // Upstream hooks can exit 0 on failure. Never forward their output as a gate decision.
  try {
    const cli = localFile(root, 'node_modules/agentic-qe/dist/cli/bundle.js');
    const node = localFile(root, 'node_modules/node/bin/node');
    const start = event.hook_event_name === 'SessionStart';
    const args = start ? ['hooks', 'session-start', '--session-id', `codex-${sha(String(event.session_id || 'anonymous')).slice(0, 24)}`, '--json'] : ['hooks', 'session-end', '--save-state', '--json'];
    const output = execFileSync(node, [cli, ...args], { cwd: root, input: '', encoding: 'utf8', timeout: 8000, maxBuffer: 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
    const result = JSON.parse(output);
    return result.success !== false && (start ? result.initialized === true : result.stateSaved === true) ? 'reported-complete' : 'failed';
  } catch (error) { return error.code === 'ENOENT' ? 'unavailable' : 'failed'; }
}

function productDiff(root) {
  let base = 'HEAD';
  try { base = execFileSync('git', ['merge-base', 'HEAD', '@{upstream}'], { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); } catch { /* No upstream: compare working tree to HEAD. */ }
  let changed = '';
  try { changed = execFileSync('git', ['diff', '--name-only', base, '--', 'apps', 'services', 'packages'], { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }); }
  catch { changed = execFileSync('git', ['diff', '--cached', '--name-only', '--', 'apps', 'services', 'packages'], { cwd: root, encoding: 'utf8' }); }
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'apps', 'services', 'packages'], { cwd: root, encoding: 'utf8' });
  return Boolean((changed + untracked).trim());
}

function expandedCommand(root, command, depth = 0) {
  if (depth > 4) fail('Слишком глубокая цепочка npm scripts');
  const pkg = json(root, 'package.json');
  return command.replace(/\bnpm\s+run\s+([\w:-]+)/g, (match, name) => {
    const script = pkg.scripts?.[name];
    return script ? `${match}\n${expandedCommand(root, script, depth + 1)}` : match;
  });
}

function simpleReadOnly(command, depth = 0) {
  if (typeof command !== 'string' || depth > 2 || /[\n\r;&|<>`]|\$[({]/.test(command)) return false;
  // A deliberately small shell lexer: no expansion, substitution or command chains.
  const tokens = [];
  let token = '', quote = null, started = false;
  for (let i = 0; i < command.length; i++) {
    const char = command[i];
    if (char === '\\' && quote !== "'") { if (++i === command.length) return false; token += command[i]; started = true; }
    else if (quote) { if (char === quote) quote = null; else token += char; started = true; }
    else if (char === '"' || char === "'") { quote = char; started = true; }
    else if (/\s/.test(char)) { if (started) { tokens.push(token); token = ''; started = false; } }
    else { token += char; started = true; }
  }
  if (quote) return false;
  if (started) tokens.push(token);
  const [bin, ...args] = tokens;
  if (['bash', 'sh'].includes(bin) && args.length === 2 && args[0] === '-c') return simpleReadOnly(args[1], depth + 1);
  if (['cat', 'head', 'tail', 'ls', 'pwd', 'stat', 'wc'].includes(bin)) return true;
  if (['rg', 'grep'].includes(bin)) return !args.some(arg => /^--(?:pre|pre-glob|output)(?:=|$)/.test(arg));
  if (bin === 'sed' && args.length >= 3 && args[0] === '-n' && /^\d+(?:,\d+)?p$/.test(args[1]) && args.slice(2).every(arg => !arg.startsWith('-'))) return true;
  if (['python', 'python3'].includes(bin) && args.length === 2 && args[0] === '-c') {
    return /^print\(open\((['"])[\w./-]+\1\)\.read\(\)\)$/.test(args[1]);
  }
  if (bin === 'node' && args.length === 2 && ['-p', '--print'].includes(args[0])) {
    return /^require\((['"])(?:node:)?fs\1\)\.readFileSync\((['"])[\w./-]+\2\s*,\s*(['"])(?:utf8|utf-8)\3\)$/.test(args[1]);
  }
  return false;
}
export function checkTool(root, event) {
  const input = event.tool_input;
  if (!input || (typeof input !== 'object' && typeof input !== 'string')) fail('Пустой tool_input');
  const raw = typeof input === 'string' ? input : JSON.stringify(input);
  const command = typeof input === 'object' ? (input.command ?? input.cmd ?? input.input ?? input.patch ?? '') : input;
  const shell = /Bash|exec_command|shell/.test(event.tool_name || '');
  if (shell && simpleReadOnly(command)) return;
  const text = shell && typeof command === 'string' ? expandedCommand(root, command) : raw;
  const baselinePath = /(?:^|[\s/"'])(?:reference|baselines?|__snapshots__|snapshots|[^\s/"']+-snapshots)(?:\/|[\s"'])|\.snap(?:[\s"']|$)/i;
  const writes = shell ? /(?:\b(?:cp|mv|rm|install|tee|touch|sed|perl|python\w*|node|bash|sh|git\s+(?:restore|checkout|reset))\b|>{1,2})/.test(text) : /apply_patch|Edit|Write|write_file|edit_file/.test(event.tool_name || '');
  // Inspect edit destinations, not quoted examples in process documentation.
  const patchSources = typeof input === 'string' ? [input] : ['command', 'cmd', 'input', 'patch'].map(key => input[key]).filter(value => typeof value === 'string');
  const patchTargets = patchSources.flatMap(source => [...source.matchAll(/^\*\*\* (?:(?:Add|Update|Delete) File: |Move to: )(.+)$/gm)].map(match => match[1]));
  if (!shell && /apply_patch/.test(event.tool_name || '') && !patchTargets.length) fail('Не удалось разобрать назначения patch');
  const targets = shell ? text : [typeof input === 'object' ? input.file_path ?? input.path ?? '' : '', ...patchTargets].join('\n');
  if (writes && /(?:^|[\s/"'])(?:apps|services|packages)\//.test(targets)) validateImplementationAdmission(root);
  if ((shell && /--update-snapshots\b|--updateSnapshot\b|\b(?:playwright|vitest|jest)\b[^\n]*(?:\s-u\b)/.test(text)) || (baselinePath.test(targets) && writes)) fail('Автоматическая замена baseline запрещена; нужен отдельный проверенный процесс согласования');
  const sourcePublication = shell && /\bgit\s+push\b|\bgh\s+pr\s+merge\b/i.test(text);
  if (sourcePublication && (readState(root).activeProductChange || productDiff(root))) validateDelivery(root);
  if (shell && /(?:^|[\s/"'])scripts\/stand\.sh["']?\s+(?:up|restart|recreate|start|build|create)\b/.test(text)) validateDelivery(root);
  if ((shell && /\b(?:deploy|publish|release)\b|\b(?:scp|rsync|ssh|kubectl|helm|vercel|netlify)\b|\bdocker\s+(?:compose\b[^\n]*\bup\b|stack\s+deploy\b)/i.test(text)) || /(?:deploy|publish|release)/i.test(event.tool_name || '')) validateDelivery(root);
}

export function hook(root, event) {
  if (event.hook_event_name === 'SessionStart') {
    validateQeInstallation(root);
    const verified = validateManifest(root);
    readState(root);
    const lifecycle = aqeLifecycle(root, event);
    return { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: `feature-adr --full-qe: vendor (${verified.files} files), local agentic-qe ${verified.runtime} проверены. AQE lifecycle: ${lifecycle} (не QE gate). План → K1/K2/checkpoints → код → unit/integration/E2E/visual/accessibility → независимое ревью → anti-drift. Поставка требует актуальный receipt; planned заблокирован. Наличие hooks не доказывает runtime activation или готовность E2E.` } };
  }
  if (event.hook_event_name === 'PreToolUse') { checkTool(root, event); return {}; }
  if (event.hook_event_name === 'Stop') {
    const state = readState(root);
    const info = { systemMessage: `AQE lifecycle: ${aqeLifecycle(root, event)}; это не продуктовый QE результат.` };
    if (!state.activeProductChange || state.stage === 'planned') return info;
    try { validateDelivery(root); return info; }
    catch (error) {
      if (event.stop_hook_active) return { continue: false, stopReason: `QE не завершён: ${error.message}`, systemMessage: 'Продуктовая поставка остаётся заблокирована; сообщите владельцу фактический blocker.' };
      return { decision: 'block', reason: `Активное продуктовое изменение не прошло --full-qe: ${error.message}. Выполните применимые проверки либо завершите с честным blocker; не создавайте фиктивные evidence.` };
    }
  }
  fail('Неизвестное hook event');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let event;
  let root;
  try {
    const mode = process.argv[2] || 'hook';
    if (mode === 'hook') event = parseJson(readFileSync(0, 'utf8'));
    root = repositoryRoot(event?.cwd || process.cwd());
    if (mode === 'digest') console.log(inputDigest(root));
    else if (mode === 'check-delivery') { validateDelivery(root); console.log('QE delivery receipt valid'); }
    else if (mode === 'check-product-diff') {
      const [base, head] = process.argv.slice(3);
      if (![base, head].every(value => /^[a-f0-9]{40}$/.test(value || ''))) fail('CI base/head должны быть явными 40-hex SHA');
      const args = /^0{40}$/.test(base) ? ['ls-tree', '--name-only', '-r', head, '--', 'apps', 'services', 'packages'] : ['diff', '--name-only', base, head, '--', 'apps', 'services', 'packages'];
      const changes = execFileSync('git', args, { cwd: root, encoding: 'utf8' });
      if (changes.trim()) { validateDelivery(root); console.log('Product diff: current QE delivery receipt valid'); }
      else console.log('Process-only diff: product delivery gate not required');
    }
    else if (mode === 'check-config') {
      validateQeInstallation(root);
      validateManifest(root); readState(root);
      const config = json(root, '.codex/hooks.json');
      if (Object.keys(config.hooks || {}).sort().join(',') !== 'PreToolUse,SessionStart,Stop') fail('Expected exactly three hook events');
      for (const name of ['SessionStart', 'PreToolUse', 'Stop']) {
        const groups = config.hooks?.[name];
        if (!Array.isArray(groups) || groups.length !== 1) fail(`Expected one hook group: ${name}`);
        for (const group of groups) {
          if (group.matcher !== undefined && !['', '*'].includes(group.matcher)) fail(`Hook must match all: ${name}`);
          if (!Array.isArray(group.hooks) || group.hooks.length !== 1) fail(`Expected one hook handler: ${name}`);
          for (const handler of group.hooks) if (handler.type !== 'command' || (handler.async !== undefined && handler.async !== false) || handler.command !== HOOK_COMMAND) fail(`Invalid hook handler: ${name}`);
        }
      }
      console.log('Process configuration and vendor hashes valid');
    }
    else if (mode === 'hook') {
      const result = hook(root, event);
      audit(root, event, result.decision === 'block' ? 'block' : result.continue === false ? 'stopped' : 'allow');
      console.log(JSON.stringify(result));
    }
    else fail('Неизвестный режим');
  } catch (error) {
    try { if (root) audit(root, event, 'deny'); } catch { /* Never replace a blocking response with an audit error. */ }
    const reason = `Process guard: ${error.message}`;
    if (event?.hook_event_name === 'PreToolUse') console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
    else if (event?.hook_event_name === 'SessionStart') console.log(JSON.stringify({ continue: false, stopReason: reason, systemMessage: reason }));
    console.error(reason);
    process.exitCode = 2;
  }
}
