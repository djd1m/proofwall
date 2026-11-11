# Доменная модель email onboarding

11.11.2026. Применяется только к FR-101…FR-103 и ADR-001…ADR-003.

## Контексты и язык

Registration владеет account/project/session creation и успешным COMMIT.
Transactional onboarding создаёт представление этого результата и планирует письмо.
Local email verification фиксирует факт владения текущим адресом; этот факт не
даёт доступ, не создаёт session и не заменяет отдельный N3 email proof/referral flow.
Delivery здесь означает планирование и ограниченную попытку передачи провайдеру;
доставка в ящик не наблюдается. Термин verified относится к адресу, не личности.

## Сущности

| Сущность | Поля/идентичность | Инвариант |
|---|---|---|
| Account | existing id/email/password_hash + nullable email_verified_at | Null для existing и new accounts до явного подтверждения; auth прежняя |
| Project | existing id/account_id/slug/branding | branding.name сохраняет отображаемое имя; slug/ownership прежние |
| EmailVerificationToken | uuid id, account_id FK cascade, email text snapshot, token_hash text unique, expires_at, used_at nullable, created_at | Raw token в БД отсутствует, максимум одна unused строка/account |
| EmailMessage | existing to/subject/text/html/idempotencyKey | Значение в памяти; не таблица, не event outbox |
| EmailDeliveryState | scheduled/not_configured/invalid_origin/schedule_failed | Никакой статус не утверждает inbox delivery |

Миграция `packages/db/migrations/021_email_verification.sql`: добавить колонку account
без backfill, создать email_verification_tokens и partial unique index
`(account_id) WHERE used_at IS NULL`. Expired unused token по-прежнему занимает
partial index: issue отзывает его перед INSERT. Unique token_hash предотвращает
тихую коллизию. CHECK допустим для sha256 hex длины64 и expires_at>created_at.
Grant select/insert/update только app_service, не app_authenticated/public.
Отдельный DELETE/cleanup worker сейчас не нужен; token rows удаляются с account,
политика retention может быть отдельной эксплуатационной задачей.

Таблица не полагается на tenant RLS: consume выбирает account только из hash row,
resend — из проверенной сессии. account_id/email из request body не authority.
Существующие tables N3 и password_reset_tokens не изменяются.

## Состояния и переходы

| До | Событие | После | Условие |
|---|---|---|---|
| Аккаунт отсутствует | Registration COMMIT | Account/project/session, marker null | Mail token появляется в том же COMMIT только при годной mail config/origin |
| Нет token | Issue | Unused token | 32 random bytes, raw только в памяти, hash+24h в БД |
| Unused token | Explicit confirm POST | used_at и email_verified_at | Current account email равен snapshot; TTL годен после lock |
| Used/expired/unknown/stale token | Confirm | Нет изменений | Одинаковый invalid result |
| Unused token | Authenticated resend | Старый used, новый unused | Current email/session, rate limits, atomic transaction |
| Verified account | Authenticated resend | Без новых token/mail | Verified/no-op, текущий email не изменялся |
| Любой token | Landing GET | Без изменений | Fragment доступен только browser, нет auto POST |

Будущая смена email обязана в той же транзакции сбрасывать email_verified_at и
отзывать unused tokens. Такой flow сейчас не найден/не добавляется; marker нельзя
переносить на новый адрес или использовать для доступа без отдельного решения.
Текущий consume проверяет именно актуальный email, включая прямую замену в DB fixture.

## Транзакционные инварианты

Все issue/resend/consume: account FOR NO KEY UPDATE перед token writes.
Подтверждение получает account hint по hash без row lock, затем блокирует account,
после чего повторно проверяет token/email/TTL атомарным UPDATE RETURNING. Не делать
read-valid→unconditional-update. Второй запрос после lock видит used_at, успех один.
accounts.email_verified_at update в той же withService, ошибка откатывает claim.
Expiry измеряется clock_timestamp после lock wait, не transaction-start now().

Resend authority может блокировать session после account; expiry перепроверяется
после возможного ожидания. IP advisory lock try-only, общая таблица rate_limit_events,
атомарные счётчики и cooldown. Порядок account→session→IP→token не инвертировать.
FOR NO KEY UPDATE сохраняет совместимость с session FK insert; NO KEY не значит
отсутствие сериализации самих обновлений account.

## События и внешние эффекты

После COMMIT route имеет ephemeral данные email/name/urls/raw token. Он строит
EmailMessage, назначает одну bounded retry operation через after и отвечает201.
Постоянное доменное событие или очередь не создаются. Provider timeout/error не
откатывает account/token. Изоляция от сети следует из сигнатур доменного модуля:
issue/consume принимают PoolClient, не EmailSender.
Raw token не попадает в SQL, JSON response регистрации/resend, storage или logs.
Confirm JSON body содержит token по назначению; body logging для него недопустим.
