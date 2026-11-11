import { afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
if (!process.env.TEST_DATABASE_URL) throw new Error('Требуется отдельная TEST_DATABASE_URL');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.SESSION_SECRET = 'synthetic-email-test-session-secret';
process.env.BASE_URL = 'https://proofwall.example.test';
const { withService, closePool, pool } = await import('@proofwall/db');
const { registerAccountAndProject } = await import('../src/lib/register');
const { issueEmailVerification: issue, consumeEmailVerification: consume, hashEmailVerificationToken: digest } = await import('../src/lib/email-verification');
const { hashSessionToken } = await import('../src/lib/session');
afterAll(closePool);

async function owner() {
  const slug = `verify-${randomUUID().slice(0, 8)}`;
  const r = await withService(c => registerAccountAndProject(c, {
    email: `${slug}@example.test`, password: 'synthetic-valid-password', project_name: 'Acme Reviews', desired_slug: slug,
  }));
  if (!r.ok) throw new Error('synthetic signup failed');
  return r;
}
async function issued(o: Awaited<ReturnType<typeof owner>>) {
  const r = await withService(c => issue(c, o.accountId, o.email));
  if (r.kind !== 'issued') throw new Error('expected token');
  return r.token;
}

describe('FR-102: настоящая PostgreSQL, one-use/current-email invariants', () => {
  it('хранит hash/TTL24h, marker только после consume, не создаёт session/N3 proof', async () => {
    const o = await owner(); const token = await issued(o);
    const row = await withService(async c => (await c.query(`select token_hash,email,
      extract(epoch from expires_at-clock_timestamp())::int as ttl from email_verification_tokens where account_id=$1`, [o.accountId])).rows[0]);
    expect(row.token_hash).toBe(digest(token)); expect(row.token_hash).not.toBe(token);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/); expect(row.email).toBe(o.email);
    expect(row.ttl).toBeGreaterThan(86390); expect(row.ttl).toBeLessThanOrEqual(86400);
    expect(await withService(c => consume(c, token))).toBe(true);
    const facts = await withService(async c => (await c.query(`select email_verified_at,
      (select count(*)::int from sessions where account_id=$1) as sessions,
      (select count(*)::int from n3_email_proofs where account_id=$1) as proofs from accounts where id=$1`, [o.accountId])).rows[0]);
    expect(facts.email_verified_at).not.toBeNull(); expect(facts.sessions).toBe(1); expect(facts.proofs).toBe(0);
    expect(await withService(c => consume(c, token))).toBe(false);
  });
  it('A1: десять concurrent consume дают ровно один успех', async () => {
    const o = await owner(); const token = await issued(o);
    const outcomes = await Promise.all(Array.from({ length: 10 }, () => withService(c => consume(c, token))));
    expect(outcomes.filter(Boolean)).toHaveLength(1);
  });
  it('A2: expiry, malformed, unknown и смена email не подтверждают аккаунт', async () => {
    const o = await owner(); const token = await issued(o);
    await withService(c => c.query("update email_verification_tokens set expires_at=clock_timestamp()-interval '1 second' where account_id=$1", [o.accountId]));
    for (const t of [token, 'bad', 'x'.repeat(43)]) expect(await withService(c => consume(c, t))).toBe(false);
    const fresh = await issued(o);
    await withService(c => c.query('update accounts set email=$2 where id=$1', [o.accountId, `${randomUUID()}@example.test`]));
    expect(await withService(c => consume(c, fresh))).toBe(false);
    const state = await withService(c => c.query('select email_verified_at from accounts where id=$1', [o.accountId]));
    expect(state.rows[0].email_verified_at).toBeNull();
  });
  it('rollback после claim сохраняет и token, и непроверенный marker', async () => {
    const o = await owner(); const token = await issued(o);
    await expect(withService(async c => { expect(await consume(c, token)).toBe(true); throw new Error('forced rollback'); })).rejects.toThrow('forced rollback');
    expect(await withService(c => consume(c, token))).toBe(true);
  });
  it('concurrent reissue оставляет одну живую ссылку и отзывает предыдущую', async () => {
    const o = await owner(); const old = await issued(o);
    const tokens = await Promise.all(Array.from({ length: 6 }, () => issued(o)));
    expect(await withService(c => consume(c, old))).toBe(false);
    const active = await withService(c => c.query('select token_hash from email_verification_tokens where account_id=$1 and used_at is null', [o.accountId]));
    expect(active.rowCount).toBe(1); expect(tokens.map(digest)).toContain(active.rows[0].token_hash);
  });
  it('TTL проверяется после ожидания account lock, clock_timestamp вместо transaction now', async () => {
    const o = await owner(); const token = await issued(o);
    const blocker = await pool.connect();
    try {
      await blocker.query('begin');
      await blocker.query('select id from accounts where id=$1 for no key update', [o.accountId]);
      await blocker.query("update email_verification_tokens set expires_at=clock_timestamp()+interval '120 milliseconds' where account_id=$1", [o.accountId]);
      const waiting = withService(c => consume(c, token));
      await blocker.query('select pg_sleep(0.2)'); await blocker.query('commit');
      expect(await waiting).toBe(false);
    } finally { await blocker.query('rollback'); blocker.release(); }
  });
  it('resend validates active session, enforces cooldown и verified no-op', async () => {
    const o = await owner(); const token = await issued(o);
    const authority = { sessionHash: hashSessionToken(o.token), ip: randomUUID() };
    expect((await withService(c => issue(c, o.accountId, o.email, { ...authority, sessionHash: 'bad' }))).kind).toBe('unauthorized');
    const r = await withService(c => issue(c, o.accountId, o.email, authority));
    expect(r.kind).toBe('issued');
    expect((await withService(c => issue(c, o.accountId, o.email, authority))).kind).toBe('rate_limited');
    expect(await withService(c => consume(c, token))).toBe(false);
    if (r.kind !== 'issued') throw new Error('expected token');
    expect(await withService(c => consume(c, r.token))).toBe(true);
    expect((await withService(c => issue(c, o.accountId, o.email, authority))).kind).toBe('verified');
  });
  it('resend account/IP hourly caps и истёкшая session закрывают выдачу', async () => {
    const o = await owner(); const ip = randomUUID(); const sessionHash = hashSessionToken(o.token);
    await withService(c => c.query(`insert into rate_limit_events(scope,key,created_at)
      select 'email_verify_account',$1,clock_timestamp()-interval '2 minutes' from generate_series(1,5)`, [o.accountId]));
    expect((await withService(c => issue(c, o.accountId, o.email, { sessionHash, ip }))).kind).toBe('rate_limited');
    const other = await owner(); const otherHash = hashSessionToken(other.token);
    await withService(c => c.query(`insert into rate_limit_events(scope,key,created_at)
      select 'email_verify_ip',$1,clock_timestamp()-interval '2 minutes' from generate_series(1,30)`, [digest(ip)]));
    expect((await withService(c => issue(c, other.accountId, other.email, { sessionHash: otherHash, ip }))).kind).toBe('rate_limited');
    await withService(c => c.query("update sessions set expires_at=clock_timestamp()-interval '1 second' where account_id=$1", [other.accountId]));
    expect((await withService(c => issue(c, other.accountId, other.email, { sessionHash: otherHash, ip: randomUUID() }))).kind).toBe('unauthorized');
  });
});
