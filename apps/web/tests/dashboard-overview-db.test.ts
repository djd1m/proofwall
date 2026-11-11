import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
if (!process.env.TEST_DATABASE_URL) throw new Error('Требуется isolated TEST_DATABASE_URL');
const target = new URL(process.env.TEST_DATABASE_URL);
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.pathname !== '/proofwall_ui_test') throw new Error('Только isolated DB');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { withAccount, withService, closePool, pool } = await import('@proofwall/db');
const { getDashboardSummary } = await import('../src/lib/dashboard-summary.ts' as string) as typeof import('../src/lib/dashboard-summary');
const now = new Date('2026-11-11T12:00:00Z');
const start = new Date(now.getTime() - 30*86400000);
const a = randomUUID(), b = randomUUID(), empty = randomUUID();
const ids = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
const prefix = 'dash-'+randomUUID().slice(0,8);
beforeAll(async () => {
  await withService(async c => {
    for (const id of [a,b,empty]) await c.query('INSERT INTO accounts(id,email,password_hash) VALUES($1,$2,$3)', [id, id+'@example.test', 'synthetic']);
    for (let i=0;i<4;i++) {
      await c.query(`INSERT INTO projects(id,account_id,slug,branding,tier,paid_until,deactivated,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [ids[i], i===3?b:a, `${prefix}-${i}`, { name: `Стена ${i}` }, i===1?'paid':'free', i===1?'2026-12-01':null, i===2, new Date(now.getTime()+i)]);
      for (const status of ['pending','approved','rejected','hidden']) await c.query(`INSERT INTO testimonials(project_id,author_name,status,created_at) VALUES($1,'Синтетический автор',$2,'2020-01-01')`,[ids[i],status]);
      for (const at of [start, new Date(+start-1), new Date(+now-1), now]) {
        await c.query(`INSERT INTO analytics_events(project_id,account_id,event_type,created_at) VALUES($1,$2,'badge_click',$3)`,[ids[i], i===3?b:a, at]);
      }
      await c.query(`INSERT INTO analytics_events(project_id,event_type,created_at) VALUES($1,'badge_impression',$2)`,[ids[i],start]);
      for (const [domain, at] of [['same.example.test',start], ['stale.example.test',new Date(+start-1)], ['future.example.test',now]] as const)
        await c.query('INSERT INTO widget_installs(project_id,domain,last_seen_at) VALUES($1,$2,$3)',[ids[i],domain,at]);
      // Повторный config той же пары только обновляет last_seen_at; новый event без install не считается.
      await c.query(`INSERT INTO widget_installs(project_id,domain,last_seen_at) VALUES($1,'same.example.test',$2) ON CONFLICT(project_id,domain) DO UPDATE SET last_seen_at=excluded.last_seen_at`,[ids[i],start]);
      await c.query(`INSERT INTO analytics_events(project_id,event_type,domain,created_at) VALUES($1,'widget_installed','unregistered.example.test',$2)`,[ids[i],start]);
    }
  });
});
afterAll(async () => {
  // Удаление исключительно UUID, созданных этим тестом, через isolated administrator.
  await pool.query('DELETE FROM accounts WHERE id = ANY($1::uuid[])', [[a,b,empty]]);
  await closePool();
});
it('proves role GUC and unscoped RLS for every dashboard table', async () => {
  await withAccount(a, async c => {
    const authority = (await c.query(`SELECT current_user, current_setting('app.current_account_id') AS tenant, r.rolbypassrls FROM pg_roles r WHERE r.rolname=current_user`)).rows[0];
    expect(authority).toEqual({ current_user:'app_authenticated', tenant:a, rolbypassrls:false });
    const tables = ['projects','testimonials','analytics_events','widget_installs'];
    const owners = (await c.query(`SELECT relname, pg_get_userbyid(relowner) AS owner, relrowsecurity FROM pg_class WHERE relname=ANY($1) AND relnamespace='public'::regnamespace`,[tables])).rows;
    expect(owners).toHaveLength(4);
    for (const row of owners) { expect(row.owner).not.toBe('app_authenticated'); expect(row.relrowsecurity).toBe(true); }
    // Запросы намеренно без account/project WHERE. Изоляцию обеспечивает сама БД.
    const projects = (await c.query('SELECT id FROM projects')).rows.map(r=>r.id);
    expect(projects).toEqual(expect.arrayContaining(ids.slice(0,3))); expect(projects).not.toContain(ids[3]);
    for (const table of ['testimonials','analytics_events','widget_installs']) {
      const rows = (await c.query(`SELECT project_id FROM ${table}`)).rows.map(r=>r.project_id);
      expect(rows).toEqual(expect.arrayContaining(ids.slice(0,3))); expect(rows).not.toContain(ids[3]);
    }
  });
});
it('isolates all dashboard aggregates by account and active project', async () => {
  const model = await getDashboardSummary(a,now);
  expect(model.projects.map(p=>p.slug)).toEqual([`${prefix}-0`,`${prefix}-1`]);
  expect(model.metrics.map(m=>m.value)).toEqual([null,null,2,4]);
  expect(model.billing.description).toBe('Бесплатных: 1 · Платных: 1');
  expect((await getDashboardSummary(b,now)).projects.map(p=>p.slug)).toEqual([`${prefix}-3`]);
  expect((await getDashboardSummary(empty,now)).projects).toEqual([]);
});
it('proves actual summary statement authority on its own client and transaction', async () => {
  type Authority = {
    current_user: string; tenant: string | null; rolbypassrls: boolean;
    backend_pid: number; transaction_id: string;
    table_owners: Array<{ table_name: string; owner: string }>;
  };
  const tables = ['projects', 'testimonials', 'analytics_events', 'widget_installs'];
  const observed: Array<{ client: Client; before: Authority; after: Authority }> = [];
  const nativeQuery = Client.prototype.query;
  const queries = vi.spyOn(Client.prototype, 'query');
  // Наблюдательные SELECT выполняются настоящим pg на том же this до/после
  // исходного data statement. SQL summary, bind-параметры и результат не подменяются.
  queries.mockImplementation(function (this: Client, ...args: unknown[]) {
    if (typeof args[0] !== 'string' || !/^\s*WITH\s+owned\b/i.test(args[0])) {
      return Reflect.apply(nativeQuery, this, args);
    }
    const probe = async (): Promise<Authority> => {
      const result = await Reflect.apply(nativeQuery, this, [`
        SELECT current_user, current_setting('app.current_account_id', true) AS tenant,
          r.rolbypassrls, pg_backend_pid() AS backend_pid,
          txid_current()::text AS transaction_id,
          (SELECT json_agg(json_build_object(
            'table_name', c.relname, 'owner', pg_get_userbyid(c.relowner)))
           FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace
             AND c.relname = ANY($1::text[])) AS table_owners
        FROM pg_roles r WHERE r.rolname = current_user
      `, [tables]]);
      return result.rows[0];
    };
    return (async () => {
      const before = await probe();
      const result = await Reflect.apply(nativeQuery, this, args);
      const after = await probe();
      observed.push({ client: this, before, after });
      return result;
    })();
  });
  try {
    for (const accountId of [a, b]) {
      observed.length = 0;
      const model = await getDashboardSummary(accountId, now);
      expect(model.projects).toHaveLength(accountId === a ? 2 : 1);
      expect(observed).toHaveLength(1);
      const { client, before, after } = observed[0]!;
      expect(client).toBeInstanceOf(Client);
      for (const authority of [before, after]) {
        expect(authority.current_user).toBe('app_authenticated');
        expect(authority.tenant).toBe(accountId);
        expect(authority.rolbypassrls).toBe(false);
        expect(authority.table_owners.map(table => table.table_name).sort()).toEqual([...tables].sort());
        for (const table of authority.table_owners) expect(table.owner).not.toBe(authority.current_user);
      }
      expect(before.backend_pid).toBeGreaterThan(0);
      expect(after.backend_pid).toBe(before.backend_pid);
      expect(before.transaction_id).toMatch(/^\d+$/);
      expect(after.transaction_id).toBe(before.transaction_id);
    }
  } finally { queries.mockRestore(); }
});
it('counts all statuses and pending over all time', async () => {
  const model = await getDashboardSummary(a,now);
  expect(model.projects).toHaveLength(2);
  for (const project of model.projects) expect(project.reviewSummary).toBe('Всего отзывов: 4 · На проверке: 1');
});
it('does not promise creation when an account has only deactivated walls', async () => {
  await withService(c => c.query(
    'INSERT INTO projects(account_id,slug,deactivated) VALUES($1,$2,true)',
    [empty, `${prefix}-inactive-only`],
  ));
  const model = await getDashboardSummary(empty, now);
  expect(model.projects).toEqual([]);
  expect(model.billing).toMatchObject({
    label: 'Нет активных стен', href: '/', action: 'На главную →',
  });
});
it('counts observed project domain pairs without claiming installations', async () => {
  const model=await getDashboardSummary(a,now);
  expect(model.metrics[2]).toEqual({label:'Домены с активностью виджета',value:2});
  expect(model.metricsNote).toContain('один домен с двумя стенами считается дважды');
});
it('reads the whole dashboard in one data statement', async () => {
  const queries=vi.spyOn(Client.prototype,'query');
  try {
    const model=await getDashboardSummary(a,now); expect(model.projects).toHaveLength(2);
    const sql=queries.mock.calls.map(args=>typeof args[0]==='string'?args[0]:'').filter(q=>!/^\s*(?:BEGIN|COMMIT|ROLLBACK|SET LOCAL|SELECT set_config)/i.test(q));
    expect(sql).toHaveLength(1); expect(sql[0]?.trimStart()).toMatch(/^WITH owned/);
    expect(sql[0]?.replace(/;\s*$/,'')).not.toContain(';');
  } finally { queries.mockRestore(); }
});
