import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const probe = mkdtempSync(path.join(tmpdir(), 'proofwall-qe-smoke-'));
const env = { ...process.env, AQE_PROJECT_ROOT: probe, AQE_MEMORY_PATH: path.join(probe, '.agentic-qe/memory.db'), AQE_WORKERS_ENABLED: 'false', AQE_HTTP_PORT: '0' };
const bundle = path.join(root, 'node_modules/agentic-qe/dist/cli/bundle.js');
const key = `proofwall-process-${Date.now()}`;
const namespace = 'proofwall-process-smoke';
const value = { probe: 'synthetic-full-qe-check', confidence: 1 };
let child;
const checks = [];
try {
  const cli = args => {
    const result = spawnSync(process.execPath, [bundle, 'memory', ...args, '--namespace', namespace, '--json'], { cwd: probe, env, encoding: 'utf8', timeout: 20000 });
    assert.equal(result.status, 0, 'CLI exit status');
    const data = JSON.parse(result.stdout);
    assert.equal(data.success, true, 'CLI JSON success');
    return data.data;
  };
  const stored = cli(['store', '--key', key, '--value', JSON.stringify(value)]);
  assert.equal(stored.stored, true);
  assert.deepEqual(cli(['get', '--key', key]).value, value);
  assert(cli(['search', '--pattern', key]).entries.some(entry => entry.key === key));
  assert.equal(cli(['delete', '--key', key]).deleted, true);
  assert.equal(cli(['get', '--key', key]).found, false);
  checks.push('CLI persistent KV: store/get/search/delete across separate processes');

  child = spawn(process.execPath, [path.join(root, 'node_modules/agentic-qe/dist/mcp/bundle.js')], { cwd: probe, env, stdio: ['pipe', 'pipe', 'pipe'], detached: true });
  child.stderr.resume();
  const pending = new Map();
  readline.createInterface({ input: child.stdout }).on('line', line => {
    let result;
    try { result = JSON.parse(line); } catch { return; }
    const request = pending.get(result.id);
    if (!request) return;
    clearTimeout(request.timer); pending.delete(result.id);
    if (result.error) request.reject(new Error(`MCP RPC error ${result.error.code}`));
    else request.resolve(result.result);
  });
  let id = 0;
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`MCP timeout: ${method}`)); }, 45000);
    pending.set(requestId, { resolve, reject, timer });
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params })}\n`);
  });
  const init = await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'proofwall-process-smoke', version: '1' } });
  assert.match(init.protocolVersion, /^\d{4}-\d{2}-\d{2}$/);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
  const listed = await call('tools/list');
  for (const name of ['fleet_init', 'memory_store', 'memory_query', 'memory_retrieve', 'memory_delete']) assert(listed.tools.some(tool => tool.name === name), `Missing tool ${name}`);
  const tool = async (name, args) => {
    const result = await call('tools/call', { name, arguments: args });
    assert.notEqual(result.isError, true, `MCP tool error ${name}`);
    const parsed = result.structuredContent || JSON.parse(result.content.find(item => item.type === 'text').text);
    assert.notEqual(parsed.success, false, `MCP JSON failure ${name}`);
    return parsed.data || parsed;
  };
  await tool('fleet_init', {});
  await tool('memory_store', { key, value, namespace });
  const query = await tool('memory_query', { pattern: key, namespace, semantic: false });
  assert(JSON.stringify(query).includes(key), 'MCP query must find synthetic key');
  const retrieved = await tool('memory_retrieve', { key, namespace });
  assert(JSON.stringify(retrieved).includes(value.probe), 'MCP retrieve must contain stored value');
  await tool('memory_delete', { key, namespace });
  checks.push('MCP initialize/tools/list/fleet_init/store/query/retrieve/delete');
  console.log(JSON.stringify({ status: 'passed', checks, semanticVectorIndex: stored.vectorIndex?.status || 'not-established', llmAgentExecution: 'not-tested' }, null, 2));
} finally {
  if (child?.pid) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Already stopped. */ }
    await new Promise(resolve => setTimeout(resolve, 300));
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* Already stopped. */ }
  }
  rmSync(probe, { recursive: true, force: true });
}
