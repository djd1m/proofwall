// POST /api/auth/register — FR-001. HTTP-обёртка над registerAccountAndProject.
// Роут отвечает только за транспорт: разбор тела, коды, cookie. Бизнес-правила — в lib/register.ts.

import { after, NextResponse } from 'next/server';
import { MAX_JSON_BODY, readBodyAtMost } from '@/lib/request-body';
import { withService } from '@proofwall/db';
import { registerAccountAndProject, type RegisterInput } from '@/lib/register';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';
import { extractClientIP } from '@/lib/client-ip';
import { REF_COOKIE } from '@/lib/referral';
import { signupReceipt } from '@/lib/n3-referral';
import { n3Failure } from '@/lib/n3-http';
import { mailConfigured, sendViaResend, sendWithRetry, type EmailSender, type EmailMessage } from '@/lib/email';
import { transactionalMailOrigin, emailVerificationUrl, projectWelcomeEmail } from '@/lib/onboarding-email';
import { issueEmailVerification } from '@/lib/email-verification';

// Роут ходит в БД — статически его пререндерить нельзя.
export const dynamic = 'force-dynamic';

export async function handleRegister(
  request: Request, send: EmailSender = sendViaResend,
  defer: (task: () => Promise<void>) => void = after,
): Promise<NextResponse> {
  let body: unknown;
  try {
    // L-2 ревью: предел был у входа и отсутствовал здесь — закрытой оставалась одна
    // дверь из двух. Неаутентифицированный маршрут не должен читать в память что угодно.
    const raw = await readBodyAtMost(request, MAX_JSON_BODY);
    if (raw === null) {
      return NextResponse.json({ errors: ['тело запроса слишком большое'] }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ errors: ['тело запроса: ожидается JSON'] }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ errors: ['тело запроса: ожидается объект'] }, { status: 400 });
  }

  // Каст безопасен: все поля RegisterInput объявлены как unknown и проверяются
  // внутри registerAccountAndProject — тип здесь описывает форму, а не доверие к вводу.
  // IP и реферальная cookie берутся из ЗАПРОСА, а не из тела: клиент не должен иметь
  // возможности назвать чужой IP (обход anti-fraud) или подставить чужую метку.
  const cookieRef = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${REF_COOKIE}=`))
    ?.slice(REF_COOKIE.length + 1);

  const input: RegisterInput = {
    ...(body as RegisterInput),
    client_ip: extractClientIP(request),
    cookie_ref: cookieRef,
  };

  let receipt;
  try { receipt = signupReceipt(request.headers.get('cookie'), (body as { n3_promo_code?: unknown }).n3_promo_code); }
  catch (error) { return n3Failure(error); }
  const configured = mailConfigured();
  const origin = transactionalMailOrigin();
  let emailDelivery = !configured ? 'not_configured' : !origin ? 'invalid_origin' : 'schedule_failed';
  const { result, message } = await withService(async (client) => {
    const result = await registerAccountAndProject(client, input, receipt);
    let message: EmailMessage | null = null;
    if (result.ok && configured && origin) {
      // Проверить фактические URL ДО выпуска token. Ошибка шаблона не отменяет signup.
      try { projectWelcomeEmail(result.email, result.projectName, result.urls, emailVerificationUrl(origin, 'v'.repeat(43))); }
      catch { emailDelivery = 'invalid_origin'; return { result, message }; }
      const issued = await issueEmailVerification(client, result.accountId, result.email);
      if (issued.kind === 'issued') {
        message = projectWelcomeEmail(result.email, result.projectName, result.urls, emailVerificationUrl(origin, issued.token));
      }
    }
    return { result, message };
  });

  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }
  if (message) {
    try {
      defer(async () => { await sendWithRetry(send, message, 'onboarding_email'); });
      emailDelivery = 'scheduled';
    } catch { console.error('onboarding_email_schedule_failed'); }
  }

  const response = NextResponse.json(
    {
      account_id: result.accountId,
      project_slug: result.slug,
      urls: result.urls,
      email_delivery: emailDelivery,
    },
    { status: 201 },
  );
  // Токен уходит ТОЛЬКО в httpOnly-cookie и никогда в тело ответа: иначе его увидел бы
  // любой скрипт на странице, и httpOnly потерял бы смысл (Architecture §3.2).
  response.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions());
  return response;
}

export function POST(request: Request): Promise<NextResponse> { return handleRegister(request); }
