# Архитектура transactional onboarding email

11.11.2026, ветка `feature/resend-onboarding`, проектное предложение.
Архитектор gpt-6-astra xhigh, author gpt-6.1-sol high по фактическому назначению
координатора. Reference feature-adr, ручной анализ, не automated swarm.

## Границы

Next web → withService/Postgres(account/project/session/token) → COMMIT → after →
sendWithRetry → sendViaResend → fixed Resend endpoint. ADR-001/002/003 задают решения.
Ни нового worker/outbox, ни delivery таблицы. Login/access/password reset/N3 прежние.
Service-role isolation явная: account из token hash либо проверенной session.

## Точные интерфейсы

`apps/web/src/lib/onboarding-email.ts`:

- `transactionalMailOrigin(): string | null` — BASE_URL, только при отсутствии
  NEXT_PUBLIC_BASE_URL; установленный invalid source не заменять fallback. HTTPS,
  без userinfo/query/hash/path/control chars/localhost/private literal IP; подробности ADR-003.
- `normalizeProjectDisplayName(value: unknown, slug: string): string` — trim nonempty
  имя, иначе настоящий slug, HTML escape только при рендере.
- `emailVerificationUrl(origin: string, token: string): string` —
  `/verify-email#token=<encoded token>`.
- `projectWelcomeEmail(to: string, name: string, urls: ProjectUrls, verificationUrl: string): EmailMessage`.
- `emailVerificationMessage(to: string, link: string): EmailMessage` — повтор только verify.

`apps/web/src/lib/email-verification.ts`:

- `hashEmailVerificationToken(token: string): string` — SHA-256 без SESSION_SECRET.
- `issueEmailVerification(client, accountId, email, authority?: {sessionHash, ip})`
  — union issued{token,email} / verified / rate_limited / unauthorized; точные поля
  discriminant автор использует одинаково в callers/tests без новых export names.
- `consumeEmailVerification(client, token): Promise<boolean>` — один успешный consume.

Issue: account FOR NO KEY UPDATE → сверка current email → при authority повторная
проверка session hash/account/revoked/TTL → resend rate limits → revoke unused tokens
→ новый randomBytes(32) base64url43, SHA-256 в БД, expiry clock_timestamp()+24h.
Initial issue для нового account без authority; signup spam limiter вне scope.
Resend: 5/account/hour, 30/IP/hour, cooldown60 seconds; reuse rate_limit_events,
hashed IP, try advisory IP lock в свободном namespace после account lock. Проверки
и счётчики в одной транзакции. После ожидания clock_timestamp для TTL; при session
row lock повторно проверить expiry после его получения. Lock order account→IP→token.

Consume: validate token format → read account hint by hash → account FOR NO KEY UPDATE
→ conditional UPDATE token WHERE hash/account/current-email совпадают, unused,
expires_at > clock_timestamp() RETURNING → UPDATE accounts.email_verified_at → COMMIT.
Ошибка второго update откатывает первый. Account lock не конфликтует с session FK
FOR KEY SHARE. No session creation/revocation, no cookie, no N3 enqueue.

## Регистрация и статусы

`register.ts` сохраняет projects.branding.name и возвращает внутренние email/projectName
рядом с текущими полями. Существующие slug/session/referral semantics не меняются.
Route: mailConfigured + strict origin → withService(register + условный issue) →
COMMIT → template → defer callback →201 с прежней cookie. До issue проверить,
что buildProjectUrls result имеет exact origin и `/w/${slug}`, `/dashboard/${slug}`,
`/f/${slug}` без query/hash. Sender/defer injectable как у handleForgot.
Без mail config/валидного origin no issue/no send; rollback no callback.

Поле `email_delivery`: scheduled | not_configured | invalid_origin | schedule_failed.
scheduled — только callback registered. Синхронная ошибка template/defer после
COMMIT даёт schedule_failed и сохраняет 201/cookie. Provider outcome только safe logs;
legacy _sent означает provider accepted, не inbox delivery. after best effort,
process crash теряет задачу; resend позволяет восстановиться. New status API не нужен.
Существующий baseUrl может отвергнуть конфигурацию ещё внутри registration: это
прежний application config failure, а не обещание исправить все URL consumers.

## HTTP и пользовательский путь

POST `/api/auth/verify-email`: bounded JSON `{token}`, success200 `{verified:true}`,
unknown/expired/used/stale email одинаковый400. Не зависит от mailConfigured:
выданный token работает даже при отключённом провайдере. GET никогда не мутирует.
POST `/api/auth/resend-verification`: current session authority, recipient из БД,
body не выбирает account/email; JSON Content-Type и Origin/Fetch-Site guards.
401 без сессии, 429 rate limit, 503 mail unavailable/config/scheduling failure,
200 verified/no-op или202 scheduled. Повтор отзывает старый token; сеть после COMMIT.
Confirm possession-based, не cookie authority: его доступ не связывать с настройкой
почтового провайдера или с активной сессией.

`/verify-email`: server shell и client form. На mount читать fragment в память,
сразу history.replaceState, без автоматического POST. Кнопка confirm, busy disabled,
role=status/alert, generic invalid/expired. При ошибке/отсутствующем token — resend;
401 ведёт к обычному `/login`, затем пользователь возвращается на `/verify-email`.
Refresh после удаления fragment требует повторного открытия письма или resend.
Не хранить token в storage/query/analytics/логах, не подключать внешние resources.
Палитра #f2ede3/#c8492f, Arial, inline email styles; одна welcome+verify, three links,
honest CSV preview/import/moderation next step. User sample/UX scope подтверждены
координатором, final owner acceptance/deploy отдельно.

## Данные и проверки

Миграция021 свободна (последняя020_agent_payments_host.sql). Nullable
accounts.email_verified_at без backfill; token table service-only, unique hash,
partial unique account unused, FK cascade. SQL получает только hash, не raw token.
Новый email-change flow обязан сбрасывать marker и отзывать tokens в транзакции;
такого endpoint сейчас нет, его не создавать. См.04_domain_model/03.5_quality_risks.
DB races только isolated synthetic DB; mail sender mocked. UI smoke отдельным
`scripts/check-email-preview.cjs` с доступным Puppeteer/Chrome без новых npm deps;
mocked API UI smoke не выдаётся за integrated E2E. Preview:
`docs/preview/resend-onboarding.html`; operations: `docs/operations/transactional-email.md`.
