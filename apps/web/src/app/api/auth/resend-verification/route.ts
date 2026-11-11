import { after, NextResponse } from 'next/server';
import { withService } from '@proofwall/db';
import { readBodyAtMost, MAX_JSON_BODY } from '@/lib/request-body';
import { SESSION_COOKIE, hashSessionToken } from '@/lib/session';
import { extractClientIP } from '@/lib/client-ip';
import { issueEmailVerification } from '@/lib/email-verification';
import { emailVerificationMessage, emailVerificationUrl, transactionalMailOrigin } from '@/lib/onboarding-email';
import { mailConfigured, sendViaResend, sendWithRetry, type EmailSender } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function handleResendVerification(
  request: Request, send: EmailSender = sendViaResend,
  defer: (task: () => Promise<void>) => void = after,
): Promise<NextResponse> {
  const json = (body: object, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  const origin = transactionalMailOrigin();
  if (!origin || !mailConfigured()) return json({ error: 'отправка писем пока не настроена' }, 503);
  if (request.headers.get('origin') !== origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ error: 'источник запроса не разрешён' }, 403);
  }
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    return json({ error: 'ожидается JSON' }, 400);
  }
  const raw = await readBodyAtMost(request, MAX_JSON_BODY);
  if (raw === null) return json({ error: 'тело запроса слишком большое' }, 413);
  try {
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length) return json({ error: 'ожидается пустой объект' }, 400);
  } catch { return json({ error: 'ожидается JSON' }, 400); }
  const cookie = request.headers.get('cookie')?.split(';').map(c => c.trim())
    .find(c => c.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!cookie || !/^[A-Za-z0-9_-]{43}$/.test(cookie)) return json({ error: 'войдите в аккаунт' }, 401);
  const sessionHash = hashSessionToken(cookie);
  const result = await withService(async client => {
    const account = (await client.query<{ id: string; email: string }>(`select a.id,a.email from accounts a
      join sessions s on s.account_id=a.id where s.token_hash=$1 and s.revoked_at is null
      and s.expires_at>clock_timestamp()`, [sessionHash])).rows[0];
    if (!account) return { kind: 'unauthorized' as const };
    return issueEmailVerification(client, account.id, account.email, { sessionHash, ip: extractClientIP(request) });
  });
  if (result.kind === 'unauthorized') return json({ error: 'войдите в аккаунт' }, 401);
  if (result.kind === 'rate_limited') return json({ error: 'повторите позже: не чаще раза в минуту' }, 429);
  if (result.kind === 'verified') return json({ verified: true }, 200);
  const message = emailVerificationMessage(result.email, emailVerificationUrl(origin, result.token));
  try { defer(async () => { await sendWithRetry(send, message, 'verification_email'); }); }
  catch { console.error('verification_email_schedule_failed'); return json({ error: 'не удалось запланировать письмо' }, 503); }
  return json({ email_delivery: 'scheduled' }, 202);
}

export function POST(request: Request): Promise<NextResponse> { return handleResendVerification(request); }
