import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hooks = JSON.parse(fs.readFileSync(path.join(root, '.codex/hooks.json'), 'utf8')).hooks;
const toml = value => {
  if (Array.isArray(value)) return `[${value.map(toml).join(', ')}]`;
  if (value && typeof value === 'object') return `{ ${Object.entries(value).map(([key, item]) => `${JSON.stringify(key)} = ${toml(item)}`).join(', ')} }`;
  return JSON.stringify(value);
};
const mcp = {
  command: path.join(root, 'node_modules/node/bin/node'),
  args: [path.join(root, 'node_modules/agentic-qe/dist/mcp/bundle.js')],
  startup_timeout_sec: 60,
  env: { AQE_PROJECT_ROOT: root, AQE_MEMORY_PATH: path.join(root, '.agentic-qe/memory.db'), AQE_WORKERS_ENABLED: 'false', AQE_HTTP_PORT: '0' },
};
// CLI config is an active layer even when repository trust has not been persisted.
// Pass the reviewed project definitions explicitly; never modify global config.
const result = spawnSync('codex', ['--cd', root, '--no-daemon', '--dangerously-bypass-hook-trust', '-c', `hooks=${toml(hooks)}`, '-c', `mcp_servers.agentic-qe=${toml(mcp)}`, ...process.argv.slice(2)], { cwd: root, stdio: 'inherit', env: process.env });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
