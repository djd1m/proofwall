import { afterEach, describe, expect, it, vi } from 'vitest';
import { projectWelcomeEmail, emailVerificationMessage, emailVerificationUrl, transactionalMailOrigin,
  normalizeProjectDisplayName } from '../src/lib/onboarding-email';
import { buildProjectUrls } from '../src/lib/urls';

afterEach(() => vi.unstubAllEnvs());
const origin = 'https://proofwall.example.test';
const token = 'v'.repeat(43);

describe('FR-101 / A3 / A5: письма с фактическими ссылками', () => {
  it('экранирует название, очищает subject и содержит только поддержанный CSV next step', () => {
    vi.stubEnv('BASE_URL', origin);
    const name = '<img src=x onerror=alert(1)> & "Acme"\r\nBcc: attacker@example.test';
    const urls = buildProjectUrls('acme-reviews');
    const m = projectWelcomeEmail('owner@example.test', name, urls, emailVerificationUrl(origin, token));
    expect(m.html).toContain('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;Acme&quot;');
    expect(m.html).not.toContain('<img');
    expect(m.subject).not.toMatch(/[\r\n]/);
    for (const u of [urls.wall_of_love, urls.dashboard, urls.submission_form]) {
      expect(m.text).toContain(u); expect(m.html).toContain(`href="${u}"`);
    }
    expect(m.text).toContain('CSV'); expect(m.html).toContain('предпросмотр');
    expect(m.text + m.html).not.toMatch(/YouTube|Google|найдём|автоматическ/i);
    expect(m.html).not.toMatch(/<script|<img|https:\/\/fonts\./);
  });
  it('ссылка содержит fragment, а не query; повтор не обещает welcome', () => {
    const u = new URL(emailVerificationUrl(origin, token));
    expect(u.pathname).toBe('/verify-email'); expect(u.search).toBe(''); expect(u.hash).toBe(`#token=${token}`);
    const m = emailVerificationMessage('owner@example.test', u.href);
    expect(m.text).toContain('24 часа'); expect(m.text).toContain('Предыдущая ссылка');
    expect(m.html).not.toContain('Стена');
  });
  it('отклоняет подменённые ссылки кабинета до отправки', () => {
    vi.stubEnv('BASE_URL', origin);
    const urls = buildProjectUrls('acme');
    for (const bad of ['https://attacker.example.test/dashboard/acme', `${origin}/dashboard/foreign`, `${origin}/dashboard/acme?next=evil`]) {
      expect(() => projectWelcomeEmail('owner@example.test', 'Acme', { ...urls, dashboard: bad }, emailVerificationUrl(origin, token))).toThrow();
    }
    expect(() => emailVerificationMessage('owner@example.test', 'javascript:alert(1)')).toThrow();
    expect(() => emailVerificationMessage('owner@example.test', `https://user:pass@proofwall.example.test/verify-email#token=${token}`)).toThrow();
  });
  it.each([undefined, '', '/', 'http://proofwall.example.test', 'https://user:pass@proofwall.example.test',
    'https://proofwall.example.test/path', 'https://proofwall.example.test?q=x', 'https://proofwall.example.test#x',
    'https://localhost', 'https://localhost.', 'https://127.0.0.1', 'https://10.2.3.4', 'https://172.16.2.3', 'https://192.168.1.1',
    'https://[::1]', 'https://proofwall', 'https://proofwall.example.test\n'])('отказывает для invalid origin %j без fallback', value => {
    vi.stubEnv('BASE_URL', value); vi.stubEnv('NEXT_PUBLIC_BASE_URL', value === undefined ? '' : origin);
    expect(transactionalMailOrigin()).toBeNull();
  });
  it('использует только явно заданный HTTPS origin; имя без ввода — реальный slug', () => {
    vi.stubEnv('BASE_URL', origin + '/'); expect(transactionalMailOrigin()).toBe(origin);
    vi.stubEnv('BASE_URL', undefined); vi.stubEnv('NEXT_PUBLIC_BASE_URL', origin); expect(transactionalMailOrigin()).toBe(origin);
    expect(normalizeProjectDisplayName('  Acme Reviews  ', 'acme')).toBe('Acme Reviews');
    expect(normalizeProjectDisplayName('', 'actual-slug')).toBe('actual-slug');
  });
});
