import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendViaResend, sendWithRetry, EmailProviderError, EMAIL_TIMEOUT_MS } from '../src/lib/email';
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const message = { to: 'owner@example.test', subject: 'Synthetic', text: 'test', html: '<p>test</p>' };
describe('FR-103 Resend transport, сеть всегда stub', () => {
  it('fixed endpoint, timeout, no redirect и provider idempotency header', async () => {
    vi.stubEnv('RESEND_API_KEY', 'synthetic-not-a-key'); vi.stubEnv('MAIL_FROM', 'sender@example.test');
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 })); vi.stubGlobal('fetch', fetcher);
    await sendViaResend({ ...message, idempotencyKey: 'synthetic-message-1' });
    const [endpoint, options] = fetcher.mock.calls[0]!;
    expect(endpoint).toBe('https://api.resend.com/emails'); expect(options.redirect).toBe('error');
    expect(options.signal).toBeInstanceOf(AbortSignal); expect(EMAIL_TIMEOUT_MS).toBe(8000);
    expect(options.headers['idempotency-key']).toBe('synthetic-message-1');
    expect(JSON.parse(options.body).to).toEqual(['owner@example.test']);
  });
  it('transient failure/timeout повторяет один ключ, permanent400 не повторяет, logs не содержат данные', async () => {
    const logs: unknown[] = []; vi.spyOn(console, 'info').mockImplementation((...v) => { logs.push(v); });
    vi.spyOn(console, 'error').mockImplementation((...v) => { logs.push(v); });
    const send = vi.fn().mockRejectedValueOnce(Object.assign(new Error(message.to), { name: 'TimeoutError' })).mockResolvedValue(undefined);
    expect(await sendWithRetry(send, message, 'synthetic', 0)).toBe(true);
    expect(send.mock.calls).toHaveLength(2);
    expect(send.mock.calls[0]![0].idempotencyKey).toBe(send.mock.calls[1]![0].idempotencyKey);
    const permanent = vi.fn().mockRejectedValue(new EmailProviderError(400));
    expect(await sendWithRetry(permanent, message, 'synthetic', 0)).toBe(false); expect(permanent).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logs)).not.toContain(message.to); expect(JSON.stringify(logs)).toContain('timeout');
  });
});
