# План реализации: transactional onboarding email

11.11.2026; Tier L; planner gpt-6-astra xhigh, author gpt-6.1-sol high по назначению.
Reference/manual; документ не доказывает выполнение code/QE/приёмки.
Inputs read: 00_complexity_assessment.md, 01_requirements.md, 02_research.md,
03_adr/001-send-onboarding-after-commit.md, 03_adr/002-bind-one-use-verification-to-email.md,
03_adr/003-validate-external-mail-links.md, 03.5_quality_risks.md, 04_domain_model.md,
05_architecture.md; исходники register,
email, urls, password-reset, n3-proof, tenant, migration003/014 и dashboard CSV import.

## Goal state

Сейчас registration создаёт account/project/session без welcome/local verification.
Цель: одно branded письмо после COMMIT, current-email one-use token24h, GET-safe
landing, authenticated resend и честный delivery state. Login/access/N3 прежние.
Нет новых worker/outbox, live send/DNS/deploy/live DB. Coverage процент не измерен.

## Tasks

- TASK-1 (specification): сверить FR-101, FR-102, FR-103, ADR-001, ADR-002, ADR-003
  с OpenSpec; добавить resend/current email/rate limit scenario и SHA в01 при дельте.
  Targets: openspec/changes/resend-onboarding/specs/transactional-email/spec.md,
  openspec/changes/resend-onboarding/tasks.md, features/resend-onboarding/01_requirements.md.
  Depends:none. Done: OpenSpec strict validate, настоящие K1 имён и K2 exit0.
- TASK-2 (architecture/refinement): FR-102, ADR-002, A1, A2; migration021 и hash-only
  token24h, account lock→token CAS→verified timestamp, revoke-on-reissue, current
  email binding, resend/session/rate-limit. Targets: packages/db/migrations/021_email_verification.sql,
  apps/web/src/lib/email-verification.ts, apps/web/tests/email-verification.test.ts.
  Depends:TASK-1. Done: isolated synthetic DB tests sequential/concurrent consume,
  expiry/garbage/changed email, rollback after claim, concurrent issue, TTL crossed
  during lock wait; absence session/N3 writes. No live migration.
- TASK-3 (refinement): FR-101, FR-103, ADR-003, A3, A5; strict configured origin,
  builder-link validation до issue, branding.name, escaped text/html, safe subject,
  CSV-only next step. Targets: apps/web/src/lib/onboarding-email.ts,
  apps/web/src/lib/register.ts, apps/web/tests/onboarding-email.test.ts,
  apps/web/tests/register.test.ts. Depends:TASK-1. Done: hostile/control name,
  missing/bad/private/path/query/userinfo origin, text/html parity и legacy signup.
- TASK-4 (refinement): FR-101, FR-102, FR-103, ADR-001, ADR-002, A4, A5, A6;
  injectable sender/defer, after только после COMMIT, honest email_delivery,
  no issue без config, schedule failure сохраняет201/cookie. Targets:
  apps/web/src/app/api/auth/register/route.ts,
  apps/web/src/app/api/auth/verify-email/route.ts,
  apps/web/src/app/api/auth/resend-verification/route.ts,
  apps/web/src/lib/email.ts, apps/web/tests/onboarding-routes.test.ts,
  apps/web/tests/email.test.ts. Depends:TASK-2,TASK-3. Fixed provider redirect:error;
  bounded body/token, no Set-Cookie confirm, confirm работает при отключённой почте,
  resend current session+Origin/Fetch-Site+JSON guards+limits. Done: no-network-before-
  commit/after-rollback, GET-safe,401/429/503, provider failure/timeout, stable retry
  idempotency key, safe logs, response body never exposes token/recipient.
- TASK-5 (refinement): FR-101, FR-102, FR-103, ADR-002, ADR-003, A6; landing по
  присланному образцу/UX scope, fragment memory+history strip, button-only POST,
  busy/result/error, resend/обычный login при401. Targets:
  apps/web/src/app/verify-email/page.tsx,
  apps/web/src/app/verify-email/verification-form.tsx,
  docs/preview/resend-onboarding.html, scripts/check-email-preview.cjs.
  Depends:TASK-4. Done: runnable Puppeteer smoke desktop/mobile/keyboard,
  no POST on GET, one explicit confirm, errors/missing-token/resend; HTML preview
  synthetic only. Tool path via explicit argument/env name, no npm deps changes.
  Screenshot artifacts можно хранить в features/resend-onboarding/evidence/.
  Mock API UI smoke обозначать отдельно от DB/API integration; no baseline repaint.
- TASK-6 (completion): FR-103, ADR-001, ADR-003, A4, A5; operations guide в
  docs/operations/transactional-email.md. Depends:TASK-4,TASK-5. Только names и
  synthetic placeholders RESEND_API_KEY/MAIL_FROM/BASE_URL, без чтения .env.
  Указать sender-domain/DNS checks до live enable, after best effort,
  scheduled≠delivered, retry/cooldown/expiry/resend, _sent=provider accepted,
  no delivery status API. Done: reviewable guide без выдуманной live проверки.
- TASK-7 (completion): FR-101, FR-102, FR-103, ADR-001, ADR-002, ADR-003,
  A1, A2, A3, A4, A5, A6. Depends:TASK-2..TASK-6. Проверить
  apps/web/tests/email-verification.test.ts, apps/web/tests/onboarding-email.test.ts,
  apps/web/tests/onboarding-routes.test.ts, apps/web/tests/email.test.ts,
  apps/web/tests/register.test.ts, apps/web/tests/password-reset.test.ts,
  apps/web/tests/urls.test.ts, apps/web/tests/n3-proof.test.ts,
  apps/web/tests/csv-import-route.test.ts, scripts/check-email-preview.cjs.
  Выполнить tests/typecheck/build и mutation probes CAS/email binding/GET-safe/
  origin/escape; вернуть mutations. Независимый reviewer по model-matrix,
  для astra-authored docs другая модель. Done: FR→spec→code→evidence,
  закрытые findings, ограничения/owner acceptance явно; никаких fake QE receipts.

## Dependency order

TASK-1 → {TASK-2,TASK-3} → TASK-4 → TASK-5 → TASK-6 → TASK-7.

## Parallel groups

TASK-2/TASK-3 независимы по файлам, автор пишет последовательно. Архитектор пишет
только03/03.5/04/05/06, author — code/tests/spec/00/01/02. Review после фиксированного SHA.

## Checkpoints

До source K1/K2/OpenSpec; после TASK-2 isolated DB races; после TASK-4 HTTP contracts;
после TASK-5 desktop/mobile preview; после TASK-7 independent review closure.
User sample/UX direction подтверждены координатором; owner acceptance/deploy отдельно.

## Risk assessment

Stale email race: account lock+CAS. after loss: honest status+resend. Origin/HTML:
strict validation+escape. Scanner: GET-safe explicit POST. Resend spam: shared
account/IP/cooldown. Initial signup spam limiter вне scope. Не обещать access gating,
mail delivery или проверенные credentials/DNS. Существующий URL config failure
до COMMIT не превращать в успешную регистрацию. RLS не заменяет service filters.

## Amendments

AM-1 (Terra P2 review a346567/e65fe5d): Verify server page показывает email из действующей сессии, landing всегда предоставляет вход в другой аккаунт, включая already-verified. Recipient не выбирается из body. Confirmation: session B отображается как B и no-session ведёт на login → test `страница подтверждения показывает email сессии и постоянный вход` in `apps/web/tests/dashboard-onboarding.test.ts` (fails if reverted).

AM-2 (Terra P2 review a346567): Signup передаёт email_delivery в dashboard handoff, кабинет показывает honest state и постоянную ссылку verify/resend. Confirmation: человек видит статус/восстановление без первого письма → test `кабинет показывает отсутствие письма и постоянный recovery link` in `apps/web/tests/dashboard-onboarding.test.ts` (fails if reverted).

AM-3 (Terra P2 review a346567): Нормализовать NUL в project name до PostgreSQL text/JSONB boundary, сохранив HTML escape на рендере. Confirmation: signup с NUL не падает → test `название с NUL нормализуется до SQL и не откатывает регистрацию` in `apps/web/tests/register.test.ts` (fails if reverted).

## Проверки и фактическое состояние

Recall архитектора exit0/no matching patterns, применённых уроков0. K1 указанных
в05 exports: автор сообщил free exit0. K2 запускается отдельно установленным script:
`node /home/proofwall/.agents/skills/feature-adr/scripts/check-plan-completeness.mjs features/resend-onboarding --tier=L --require-requirements`.
Команды автора: `npm run openspec -- validate resend-onboarding --type change --strict --no-interactive`,
`npm run test --workspace apps/web`, `npm run typecheck`, `npm run build:widget`,
`npm run build`. TEST_DATABASE_URL явно только isolated synthetic DB, никогда
implicit DATABASE_URL fallback. Root lint --if-present без lint script не lint PASS.

Фактический первый K2 архитектора: exit0, PASS, 0 failures/0 warnings/0 skips,
3 ADR, all3 requirement IDs referenced, 18 targets/4 present/0 unlisted twins.
После дополнения03.5/04 повтор также PASS exit0, 0 failures/0 warnings/0 skips;
18 targets/7 present/0 unlisted twins. Это structural completeness, не QE pass.

EXPECTED_CODE_TARGETS:
- packages/db/migrations/021_email_verification.sql
- apps/web/src/lib/email-verification.ts
- apps/web/src/lib/onboarding-email.ts
- apps/web/src/lib/register.ts
- apps/web/src/lib/email.ts
- apps/web/src/app/api/auth/register/route.ts
- apps/web/src/app/api/auth/verify-email/route.ts
- apps/web/src/app/api/auth/resend-verification/route.ts
- apps/web/src/app/verify-email/page.tsx
- apps/web/src/app/verify-email/verification-form.tsx
- apps/web/tests/email-verification.test.ts
- apps/web/tests/onboarding-email.test.ts
- apps/web/tests/onboarding-routes.test.ts
- apps/web/tests/email.test.ts
- apps/web/tests/register.test.ts
- scripts/check-email-preview.cjs
- docs/preview/resend-onboarding.html
- docs/operations/transactional-email.md
- apps/web/src/app/page.tsx
- apps/web/src/app/dashboard/[slug]/page.tsx
- apps/web/tests/dashboard-onboarding.test.ts
