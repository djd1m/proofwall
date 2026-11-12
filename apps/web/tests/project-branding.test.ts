import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';

const actor = vi.hoisted(() => ({ id: null as string | null }));
vi.mock('../src/lib/current-session', () => ({ currentAccountId: async () => actor.id }));
if (!process.env.TEST_DATABASE_URL) throw new Error('Isolated TEST_DATABASE_URL required');
const target = new URL(process.env.TEST_DATABASE_URL);
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '33186' || target.pathname !== '/proofwall_ui_test') throw new Error('Only allocated branding QA database');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
// Vite резервирует BASE_URL для своего base path; сохраняем явный QA origin.
process.env.BASE_URL = process.env.BRANDING_QA_ORIGIN;
const { pool, closePool } = await import('@proofwall/db');
const { readOwnedBranding, patchOwnedBranding } = await import('../src/lib/project-branding.ts' as string) as typeof import('../src/lib/project-branding');
const { GET, PATCH } = await import('../src/app/api/projects/[slug]/branding/route.ts' as string) as typeof import('../src/app/api/projects/[slug]/branding/route');
const owner = randomUUID(), foreign = randomUUID();
const slug = 'brand-' + randomUUID().slice(0, 8);
const context = { params: Promise.resolve({ slug }) };
const origin = process.env.BASE_URL!;
function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request(origin + '/api/projects/' + slug + '/branding', {
    method: 'PATCH', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
}
beforeAll(async () => {
  for (const id of [owner, foreign]) await pool.query('INSERT INTO accounts(id,email,password_hash) VALUES($1,$2,$3)', [id, id + '@example.test', 'synthetic']);
  await pool.query('INSERT INTO projects(account_id,slug,branding) VALUES($1,$2,$3)', [owner, slug, { name: 'Preserved', unknown: { retained: true }, logo_url: 'http://legacy.example/logo' }]);
  actor.id = owner;
});
afterAll(async () => { await pool.query('DELETE FROM accounts WHERE id=ANY($1::uuid[])', [[owner, foreign]]); await closePool(); });

it('branding patch preserves unrelated keys', async () => {
  expect((await patchOwnedBranding(owner, slug, { theme: 'dark' })).status).toBe(200);
  expect((await readOwnedBranding(owner, slug))?.branding).toMatchObject({ theme: 'dark', logo_url: 'http://legacy.example/logo' });
  const results = await Promise.all([
    patchOwnedBranding(owner, slug, { heading: 'Concurrent heading' }),
    patchOwnedBranding(owner, slug, { accent_color: '#123456' }),
  ]);
  expect(results.map(r => r.status)).toEqual([200, 200]);
  const stored = (await pool.query('SELECT branding,tier FROM projects WHERE slug=$1', [slug])).rows[0];
  expect(stored).toMatchObject({ tier: 'free', branding: { name: 'Preserved', unknown: { retained: true }, heading: 'Concurrent heading', accent_color: '#123456' } });
  const before = stored.branding;
  expect((await patchOwnedBranding(owner, slug, { theme: 'light', name: 'clobber' })).status).toBe(400);
  expect((await pool.query('SELECT branding FROM projects WHERE slug=$1', [slug])).rows[0].branding).toEqual(before);
  await patchOwnedBranding(owner, slug, { heading: 'First commit' });
  await patchOwnedBranding(owner, slug, { heading: 'Last commit' });
  expect((await readOwnedBranding(owner, slug))?.branding.heading).toBe('Last commit');
});

it('branding rejects foreign project and revoked permission', async () => {
  expect(await readOwnedBranding(foreign, slug)).toBeNull();
  expect((await patchOwnedBranding(foreign, slug, { theme: 'light' })).status).toBe(404);
  await pool.query('UPDATE projects SET deactivated=true WHERE slug=$1', [slug]);
  expect(await readOwnedBranding(owner, slug)).toBeNull();
  expect((await patchOwnedBranding(owner, slug, { theme: 'light' })).status).toBe(404);
  await pool.query('UPDATE projects SET deactivated=false WHERE slug=$1', [slug]);
  const before = (await pool.query('SELECT branding FROM projects WHERE slug=$1', [slug])).rows[0].branding;
  await pool.query('REVOKE UPDATE ON projects FROM app_authenticated');
  try {
    await expect(patchOwnedBranding(owner, slug, { theme: 'light' })).rejects.toMatchObject({ code: '42501' });
    expect((await PATCH(request({ theme: 'light' }), context)).status).toBe(503);
  } finally { await pool.query('GRANT UPDATE ON projects TO app_authenticated'); }
  expect((await pool.query('SELECT branding FROM projects WHERE slug=$1', [slug])).rows[0].branding).toEqual(before);
});

it('malformed stored branding returns 409 without normalizing writes', async () => {
  const old = (await pool.query('SELECT branding FROM projects WHERE slug=$1', [slug])).rows[0].branding;
  try {
    for (const value of [42, 'scalar', null, []]) {
      await pool.query('UPDATE projects SET branding=$2::jsonb WHERE slug=$1', [slug, JSON.stringify(value)]);
      expect((await patchOwnedBranding(owner, slug, { theme: 'light' })).status).toBe(409);
      expect((await pool.query('SELECT branding FROM projects WHERE slug=$1', [slug])).rows[0].branding).toEqual(value);
    }
  } finally { await pool.query('UPDATE projects SET branding=$2 WHERE slug=$1', [slug, old]); }
});

it('branding owner statements retain role and tenant context', async () => {
  const native = Client.prototype.query;
  const observed: Array<{ sql: string; before: Record<string, unknown>; after: Record<string, unknown> }> = [];
  const spy = vi.spyOn(Client.prototype, 'query');
  spy.mockImplementation(function (this: Client, ...args: unknown[]) {
    const sql = args[0];
    if (typeof sql !== 'string' || !/^\s*(?:SELECT (?:slug, branding|branding) FROM projects|UPDATE projects SET branding)/i.test(sql)) return Reflect.apply(native, this, args);
    const probe = async () => (await Reflect.apply(native, this, [
      `SELECT current_user, current_setting('app.current_account_id',true) AS tenant,
        pg_backend_pid() AS pid, txid_current()::text AS tx, r.rolbypassrls,
        (SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid='projects'::regclass) AS table_owner
       FROM pg_roles r WHERE r.rolname=current_user`,
    ])).rows[0];
    return (async () => {
      const before = await probe();
      const result = await Reflect.apply(native, this, args);
      observed.push({ sql, before, after: await probe() });
      return result;
    })();
  });
  try {
    const React = await import('react'); vi.stubGlobal('React', React);
    actor.id = owner;
    const { default: BrandingPage } = await import('../src/app/dashboard/[slug]/branding/page.tsx' as string);
    await BrandingPage(context);
    await readOwnedBranding(owner, slug);
    await patchOwnedBranding(owner, slug, { review_order: 'oldest' });
    expect(observed).toHaveLength(4);
    for (const statement of observed) {
      for (const authority of [statement.before, statement.after]) {
        expect(authority.current_user).toBe('app_authenticated'); expect(authority.tenant).toBe(owner);
        expect(authority.rolbypassrls).toBe(false); expect(authority.table_owner).not.toBe('app_authenticated');
      }
      expect(statement.before.pid).toBe(statement.after.pid);
      expect(statement.before.tx).toBe(statement.after.tx);
    }
    expect(observed[2]!.before.tx).toBe(observed[3]!.after.tx);
  } finally { spy.mockRestore(); vi.unstubAllGlobals(); }
});

it('branding rejects cross origin and oversized stream', async () => {
  actor.id = null;
  expect((await GET(new Request(origin), context)).status).toBe(401);
  expect((await PATCH(request({ theme: 'dark' }), context)).status).toBe(401);
  actor.id = owner;
  expect((await GET(new Request(origin), context)).headers.get('cache-control')).toBe('private, no-store');
  for (const value of ['', 'https://foreign.example']) expect((await PATCH(request({ theme: 'dark' }, { origin: value }), context)).status).toBe(403);
  expect((await PATCH(request({ theme: 'dark' }, { 'sec-fetch-site': 'cross-site' }), context)).status).toBe(403);
  expect((await PATCH(request({}, { 'content-type': 'text/plain' }), context)).status).toBe(415);
  expect((await PATCH(request({ heading: 'x'.repeat(5000) }, { 'content-length': '1' }), context)).status).toBe(413);
  expect((await PATCH(new Request(origin, { method: 'PATCH', headers: { origin, 'content-type': 'application/json' }, body: '{' }), context)).status).toBe(400);
});

it('new branding logs omit payloads', async () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const native = Client.prototype.query;
  let committed = false;
  const queries = vi.spyOn(Client.prototype, 'query').mockImplementation(function(this: Client, ...args: unknown[]) {
    const result = Reflect.apply(native, this, args);
    return args[0] === 'COMMIT' ? Promise.resolve(result).then(value => { committed = true; return value; }) : result;
  });
  const verifyEvent = (calls: unknown[][], status: number, code: string, correlation: string | null) => {
    expect(calls).toHaveLength(1);
    expect(calls[0]![0]).toBe('branding_patch');
    expect(calls[0]![1]).toEqual({ outcome: status === 200 ? 'committed' : status >= 500 ? 'failed' : 'rejected', status, code, correlation });
    expect(correlation).toMatch(/^[a-f0-9-]{36}$/);
  };
  try {
    actor.id = owner;
    const sentinel = 'private-payload-photo-key-sentinel';
    info.mockImplementation(() => { expect(committed).toBe(true); });
    const success = await PATCH(request({ heading: sentinel }), context);
    expect(success.status).toBe(200); expect(committed).toBe(true);
    verifyEvent(info.mock.calls, 200, 'COMMITTED', success.headers.get('x-request-id'));
    expect(warn).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
    const rejected = await PATCH(request({ name: sentinel }), context);
    expect(rejected.status).toBe(400); verifyEvent(warn.mock.calls, 400, 'PATCH_INVALID', rejected.headers.get('x-request-id'));
    warn.mockClear();
    const originRejected = await PATCH(request({ heading: sentinel }, { origin: 'https://foreign.example.test' }), context);
    expect(originRejected.status).toBe(403); verifyEvent(warn.mock.calls, 403, 'ORIGIN_REJECTED', originRejected.headers.get('x-request-id'));
    await pool.query('REVOKE UPDATE ON projects FROM app_authenticated');
    try {
      const failed = await PATCH(request({ heading: sentinel }), context);
      expect(failed.status).toBe(503); verifyEvent(error.mock.calls, 503, 'DB_PERMISSION', failed.headers.get('x-request-id'));
    } finally { await pool.query('GRANT UPDATE ON projects TO app_authenticated'); }
    expect(JSON.stringify([info.mock.calls, warn.mock.calls, error.mock.calls, log.mock.calls])).not.toContain(sentinel);
    expect(info).toHaveBeenCalledTimes(1);
  } finally { queries.mockRestore(); [info,warn,error,log].forEach(s => s.mockRestore()); }
});

it('credential-bearing logo mixed PATCH is rejected before repository write', async () => {
  actor.id = owner;
  const before = (await pool.query('SELECT branding FROM projects WHERE slug=$1', [slug])).rows[0].branding;
  for (const logo_url of ['https://synthetic:synthetic@logo.example.test/logo', 'https://synthetic@logo.example.test/logo', 'https://:synthetic@logo.example.test/logo', 'https://%73ynthetic:%70ass@logo.example.test/logo']) {
    expect((await patchOwnedBranding(owner, slug, { logo_url, theme: 'light' })).status).toBe(400);
    const response = await PATCH(request({ logo_url, heading: 'Must not persist' }), context);
    expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ errors: { logo_url: expect.any(String) } });
    expect((await pool.query('SELECT branding FROM projects WHERE slug=$1', [slug])).rows[0].branding).toEqual(before);
  }
});

it('PATCH commit failure emits failed signal without committed success', async () => {
  actor.id = owner;
  const before = (await pool.query('SELECT branding FROM projects WHERE slug=$1', [slug])).rows[0].branding;
  const native = Client.prototype.query;
  const queries = vi.spyOn(Client.prototype, 'query').mockImplementation(function(this: Client, ...args: unknown[]) {
    if (args[0] === 'COMMIT') return Promise.reject(new Error('private-commit-fault-sentinel'));
    return Reflect.apply(native, this, args);
  });
  const info = vi.spyOn(console, 'info').mockImplementation(() => {}), error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const failed = await PATCH(request({ heading: 'not-committed-sentinel' }), context);
    expect(failed.status).toBe(503); expect(info).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1); expect(error.mock.calls[0]).toEqual(['branding_patch', { outcome: 'failed', status: 503, code: 'WRITE_FAILED', correlation: failed.headers.get('x-request-id') }]);
    expect(JSON.stringify(error.mock.calls)).not.toContain('sentinel');
  } finally { queries.mockRestore(); info.mockRestore(); error.mockRestore(); }
  expect((await pool.query('SELECT branding FROM projects WHERE slug=$1', [slug])).rows[0].branding).toEqual(before);
});

it('branding API reports canonical success and owned not-found conflict failures', async () => {
  actor.id = owner;
  const success = await PATCH(request({ heading: 'Route canonical', show_platform_labels: false }), context);
  expect(success.status).toBe(200); expect(await success.json()).toMatchObject({ branding: { heading: 'Route canonical', show_platform_labels: false } });
  actor.id = foreign;
  expect((await GET(new Request(origin), context)).status).toBe(404);
  expect((await PATCH(request({ theme: 'dark' }), context)).status).toBe(404);
  actor.id = owner;
  const stored = (await pool.query('SELECT branding FROM projects WHERE slug=$1', [slug])).rows[0].branding;
  try {
    await pool.query("UPDATE projects SET branding='42'::jsonb WHERE slug=$1", [slug]);
    expect((await PATCH(request({ theme: 'dark' }), context)).status).toBe(409);
  } finally { await pool.query('UPDATE projects SET branding=$2 WHERE slug=$1', [slug, stored]); }
  await pool.query('REVOKE SELECT ON projects FROM app_authenticated');
  try { expect((await GET(new Request(origin), context)).status).toBe(503); }
  finally { await pool.query('GRANT SELECT ON projects TO app_authenticated'); }
});
