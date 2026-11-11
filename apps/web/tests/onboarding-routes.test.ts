import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
if (!process.env.TEST_DATABASE_URL) throw new Error('Требуется отдельная TEST_DATABASE_URL');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.SESSION_SECRET = 'synthetic-route-test-session-secret';
const { withService, closePool } = await import('@proofwall/db');
const { handleRegister } = await import('../src/app/api/auth/register/route');
const { handleResendVerification } = await import('../src/app/api/auth/resend-verification/route');
const confirm = await import('../src/app/api/auth/verify-email/route');
const { EmailProviderError } = await import('../src/lib/email');
const { issueEmailVerification } = await import('../src/lib/email-verification');
const { registerAccountAndProject } = await import('../src/lib/register');
afterAll(closePool);
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const origin = 'https://proofwall.example.test';
beforeEach(() => {
  vi.stubEnv('BASE_URL', origin); vi.stubEnv('RESEND_API_KEY', 'synthetic-not-a-key');
  vi.stubEnv('MAIL_FROM', 'Proofwall <sender@example.test>');
});
function request(path: string, body: unknown, cookie?: string) {
  return new Request(origin + path, { method: 'POST', headers: { origin, 'content-type': 'application/json',
    ...(cookie ? { cookie: `pw_session=${cookie}` } : {}) }, body: JSON.stringify(body) });
}
function input() {
  const slug = `route-${randomUUID().slice(0, 8)}`;
  return { email: `${slug}@example.test`, password: 'synthetic-password', project_name: 'Acme Reviews', desired_slug: slug };
}

describe('FR-101 / FR-103: регистрация → commit → deferred message', () => {
  it('defer и sender видят committed account/token, API не выдаёт recipient/token и не обещает delivery', async () => {
    const tasks: (() => Promise<void>)[] = []; const sent: string[] = []; const i = input();
    const send = vi.fn(async m => { sent.push(m.text); });
    const response = await handleRegister(request('/api/auth/register', i), send, task => { tasks.push(task); });
    expect(response.status).toBe(201); expect(send).not.toHaveBeenCalled(); expect(tasks).toHaveLength(1);
    const body = await response.json(); expect(body.email_delivery).toBe('scheduled');
    expect(response.headers.get('set-cookie')).toContain('pw_session=');
    expect(JSON.stringify(body)).not.toContain(i.email); expect(JSON.stringify(body)).not.toContain('verified');
    const tokens = await withService(c => c.query('select token_hash from email_verification_tokens where account_id=$1', [body.account_id]));
    expect(tokens.rowCount).toBe(1); // Отдельная транзакция видит commit прежде sender.
    await tasks[0]!(); expect(send).toHaveBeenCalledTimes(1);
    expect(sent[0]).toContain(body.urls.wall_of_love); expect(sent[0]).toContain('Acme Reviews');
    const token = new URL(sent[0]!.match(/https:\/\/\S+\/verify-email#token=\S+/)![0]!).hash.slice(7);
    vi.stubEnv('RESEND_API_KEY', ''); // Уже выданное подтверждение независимо от провайдера.
    const verified = await confirm.POST(request('/api/auth/verify-email', { token }));
    expect(verified.status).toBe(200); expect(verified.headers.get('set-cookie')).toBeNull();
    expect(await verified.json()).toEqual({ verified: true });
    expect((await confirm.POST(request('/api/auth/verify-email', { token }))).status).toBe(400);
  });
  it.each(['not_configured', 'invalid_origin'])('честный %s: signup сохраняется, mail token не выпускается', async state => {
    if (state === 'not_configured') vi.stubEnv('RESEND_API_KEY', '');
    else vi.stubEnv('BASE_URL', '/');
    const send = vi.fn(); const defer = vi.fn();
    const r = await handleRegister(request('/api/auth/register', input()), send, defer);
    expect(r.status).toBe(201); const b = await r.json(); expect(b.email_delivery).toBe(state);
    expect(send).not.toHaveBeenCalled(); expect(defer).not.toHaveBeenCalled();
    const rows = await withService(c => c.query('select id from email_verification_tokens where account_id=$1', [b.account_id]));
    expect(rows.rowCount).toBe(0);
  });
  it('duplicate/откат не планируют письмо, отказ defer не откатывает созданный account', async () => {
    const i = input(); const defer = vi.fn(); const send = vi.fn();
    const created = await handleRegister(request('/api/auth/register', i), send, () => { throw new Error('synthetic scheduler failure'); });
    expect(created.status).toBe(201); expect((await created.json()).email_delivery).toBe('schedule_failed');
    const duplicate = await handleRegister(request('/api/auth/register', i), send, defer);
    expect(duplicate.status).toBe(409); expect(defer).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
  });
  it('provider400 после ответа сохраняет account/201; logs безопасны', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    let task!: () => Promise<void>;
    const r = await handleRegister(request('/api/auth/register', input()), async () => { throw new EmailProviderError(400); }, t => { task = t; });
    expect(r.status).toBe(201); const b = await r.json(); await task();
    expect((await withService(c => c.query('select id from accounts where id=$1', [b.account_id]))).rowCount).toBe(1);
    expect(JSON.stringify(errors.mock.calls)).toContain('provider_400');
    expect(JSON.stringify(errors.mock.calls)).not.toContain('@');
  });
});

describe('FR-102: bounded confirm/resend HTTP contracts', () => {
  it('confirm GET отсутствует; invalid/oversized bodies не подтверждают и не создают session', async () => {
    expect('GET' in confirm).toBe(false);
    for (const body of [{ token: 'bad' }, { token: 'x'.repeat(43), email: 'other@example.test' }, [], null]) {
      const response = await confirm.POST(request('/api/auth/verify-email', body));
      expect(response.status).toBe(400); expect(response.headers.get('set-cookie')).toBeNull();
    }
    expect((await confirm.POST(request('/api/auth/verify-email', { token: 'v'.repeat(5000) }))).status).toBe(413);
  });
  it('resend берёт current email из session, не принимает чужой address, соблюдает cooldown', async () => {
    const i = input(); const o = await withService(c => registerAccountAndProject(c, i));
    if (!o.ok) throw new Error('signup failed');
    const tasks: (() => Promise<void>)[] = []; const send = vi.fn().mockResolvedValue(undefined);
    expect((await handleResendVerification(request('/api/auth/resend-verification', {}), send, () => {})).status).toBe(401);
    expect((await handleResendVerification(request('/api/auth/resend-verification', { email: 'foreign@example.test' }, o.token), send, () => {})).status).toBe(400);
    const r = await handleResendVerification(request('/api/auth/resend-verification', {}, o.token), send, t => tasks.push(t));
    expect(r.status).toBe(202); expect(await r.json()).toEqual({ email_delivery: 'scheduled' });
    expect(send).not.toHaveBeenCalled(); await tasks[0]!(); expect(send.mock.calls[0]![0].to).toBe(i.email);
    expect(send.mock.calls[0]![0].html).not.toContain('Стена');
    expect((await handleResendVerification(request('/api/auth/resend-verification', {}, o.token), send, () => {})).status).toBe(429);
  });
  it('resend отклоняет cross origin и не настроенную почту', async () => {
    const foreign = new Request(origin + '/api/auth/resend-verification', { method: 'POST',
      headers: { origin: 'https://foreign.example.test', 'content-type': 'application/json' }, body: '{}' });
    expect((await handleResendVerification(foreign)).status).toBe(403);
    vi.stubEnv('RESEND_API_KEY', '');
    expect((await handleResendVerification(request('/api/auth/resend-verification', {}))).status).toBe(503);
  });
});
