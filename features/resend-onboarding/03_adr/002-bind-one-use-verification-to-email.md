# ADR-002: Подтверждать текущий email одноразовым token без входа

## Status

proposed, 11.11.2026; пересмотреть при появлении email-change flow или нового способа
авторизации. Решение описывает локальное владение адресом, не N3 proof и не вход.

## Context

FR-102 требует TTL 24 часа, одноразовое погашение и отсутствие мутации на GET.
`password-reset.ts` даёт образец random token + SHA-256, но его блокировки и
session revocation нельзя копировать целиком. `n3-proof.ts` связывает отдельное
подтверждение с N3 referral/session и enqueue; эта семантика остаётся отдельной.

## Decision Drivers

1. Высокий: concurrent consume и смена email не подтверждают чужой адрес, A1/A2.
2. Высокий: переход по ссылке сканером не меняет состояние, A6.
3. Высокий: login/access/N3 поведение сохраняется, FR-102.
4. Средний: после истечения/отказа есть ограниченный безопасный повтор.

## Considered Options

| Вариант | Плюсы | Минусы |
|---|---|---|
| Отдельный opaque token + snapshot email | Одна ясная ответственность, отзыв/одноразовость в БД | Таблица и транзакционная логика |
| Переиспользовать N3 proof | Готовые token и rate limit | Меняет смысл referral evidence, требует N3 context/session |
| Stateless signed token | Не нужна таблица выдачи | Одноразовость/отзыв всё равно требуют state; key lifecycle |

## Decision Matrix

| Driver | Вес | Отдельный token | N3 reuse | Stateless |
|---|---|---|---|---|
| One-use/current email | Высокий | Прямой DB invariant | Зависимость от N3 | Нужна дополнительная БД |
| GET безопасен | Высокий | Fragment + explicit POST | Возможно, но иная authority | Возможно |
| Нет auth/N3 изменений | Высокий | Да | Нет | Да |
| Повтор | Средний | Отзыв старого, новый random | Только referred accounts | Сложнее отозвать |

## Decision

`email-verification.ts` экспортирует `issueEmailVerification`,
`consumeEmailVerification`, `hashEmailVerificationToken`. Token: randomBytes(32),
base64url, 43 символа; SHA-256 считается в приложении до SQL. В БД только hash,
account_id, email snapshot, timestamps. Миграция `021_email_verification.sql`
добавляет nullable `accounts.email_verified_at` без backfill и отдельную таблицу.

Все issue/consume берут account `FOR NO KEY UPDATE` перед изменением token rows;
этот режим не конфликтует с session INSERT FK `FOR KEY SHARE`. Consume сначала
читает account_id по hash без lock, затем блокирует account, перечитывает актуальный
email и выполняет conditional UPDATE token: hash/account/email совпадают,
used_at IS NULL, expires_at > clock_timestamp(). Лишь RETURNING row разрешает
UPDATE accounts.email_verified_at в той же транзакции. Ошибка второго UPDATE
откатывает погашение; второй concurrent consume возвращает false.

Issue блокирует account, отзывает прежние unused tokens и вставляет новый на 24h.
Уникальный partial index на account_id WHERE used_at IS NULL — последний барьер
против нескольких живых ссылок. Не ловить 23505 и продолжать aborted transaction:
ошибку либо предотвращает lock/ON CONFLICT, либо откатывает внешний withService.
Повтор после expiry/provider failure доступен через действующую сессию, email
берётся из accounts, body не выбирает account/email. Уже verified — no-op без mail.
Новый адрес в будущем обязан сбрасывать email_verified_at и отзывать unused tokens
в той же транзакции; нового email-change endpoint сейчас нет, его не создавать.

Ссылка `/verify-email#token=<encoded token>`; JS читает fragment в память и убирает
его через history.replaceState. GET ничего не гасит; только явная кнопка делает
JSON POST `/api/auth/verify-email`. API принимает только token, выдаёт одинаковый
invalid response для unknown/expired/used/stale email; не создаёт и не отзывает
сессии, не ставит auth cookie, не вызывает N3 enqueue. Landing без внешних ресурсов,
без analytics; token не писать в storage, DOM copy, logs или URL query.

## Rationale

DB compare-and-set и общий lock order закрывают первый драйвер, fragment/POST —
второй, отдельная таблица и API без auth side effects — третий. N3 reuse отвергнут
из-за иной authority; signed token не уменьшает состояние при требовании one-use.

## Consequences

Плюсы: атомарность, возможность отзыва, подтверждение доступно с другого устройства.
Минусы: cookie session всё ещё выдаётся до подтверждения намеренно; подтверждение
не является login. Старые письма теряют силу после resend, это объясняется в UI.
Fragment уменьшает access-log leakage, но JS/XSS и агрессивный browser automation
остаются trust boundary; explicit POST не обещает защиту от сканера, нажимающего кнопки.
Follow-up: email-change feature должна явно реализовать сброс marker, не считать
старый timestamp доказательством нового адреса. Owner: web maintainer;
after-action review через месяц после включения или при добавлении email-change.

## Confirmation

1. `apps/web/tests/email-verification.test.ts`: A1 sequential/concurrent consume,
   A2 expiry/garbage/changed-email, hash-only storage, rollback after claim,
   concurrent reissue, lock wait crossing TTL, отсутствие N3/session side effects.
2. `apps/web/tests/onboarding-routes.test.ts`: A6 GET no write, bounded body/token,
   confirm without session, no Set-Cookie; resend current account only и rate limit.
3. `apps/web/tests/onboarding-routes.test.ts` и runnable browser smoke
   `scripts/check-email-preview.cjs`: fragment убран, GET не делает POST,
   кнопка делает один POST; invalid/expired result предлагает повтор после входа.

Метод: DB integration на отдельной synthetic БД и browser UI checks без сети почты.
Monitoring: безопасные категории API, без токенов. Критерий: ровно один успешный
consume и ноль auth/N3 мутаций. Owner: автор + независимый reviewer. Load-bearing
property: актуальный адрес и использованность проверяются под общей транзакцией.

## Links

FR-102; `apps/web/src/lib/password-reset.ts`; `apps/web/src/lib/n3-proof.ts`;
[модель](../04_domain_model.md).
