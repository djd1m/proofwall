# Transactional письма Proofwall

Реализация добавляет одно письмо после создания стены: название, публичная стена,
кабинет/модерация, форма сбора и подтверждение адреса. Следующий шаг — существующий
CSV импорт в кабинете с предпросмотром и последующей модерацией.

Для web нужны три явно заданных значения. Это синтетические placeholders,
не рабочая конфигурация и не инструкция отправлять письмо на example.test:

```dotenv
RESEND_API_KEY=<resend-api-key>
MAIL_FROM=Proofwall <notifications@example.test>
BASE_URL=https://proofwall.example.test
```

Ключ хранится только в runtime окружении web. Для публичных писем требуется HTTPS
origin без пути, query, fragment и userinfo; localhost/private IP не принимаются.
NEXT_PUBLIC_BASE_URL используется только при полностью отсутствующем BASE_URL;
невалидный заданный BASE_URL не заменяется fallback. При включении нужен реальный
адрес Proofwall и подтверждённый sender domain Resend. Эта работа не настраивает
DNS, не проверяет credentials/domain и не отправляет настоящие письма.

Миграция `021_email_verification.sql` добавляет nullable marker существующим
аккаунтам без backfill. До включения кода migration применяется обычной отдельно
согласованной процедурой. В этой работе migration запускалась только на новой
временной тестовой PostgreSQL, не на действующей БД.

API регистрации сохраняет прежние поля и cookie, добавляет `email_delivery`:

| Значение | Смысл |
|---|---|
| `scheduled` | Next `after` callback зарегистрирован |
| `not_configured` | Нет mail configuration, token не выпущен |
| `invalid_origin` | Публичные mail URL не прошли validation, token не выпущен |
| `schedule_failed` | Callback не удалось зарегистрировать; signup сохранён |

`scheduled` не подтверждает отправку или доставку. `after` — best effort без durable
очереди: остановка процесса может потерять работу. Resend вызывается вне транзакции
с timeout 8 секунд, максимум двумя попытками и одним idempotency key на письмо.
Повторяются network/timeout/429/5xx; остальные 4xx не повторяются. Логи
`onboarding_email_sent` / `verification_email_sent` означают приём провайдером,
не попадание в inbox. `_retry` / `_failed` содержат только attempt и категорию;
не добавлять в логи email, token, HTML, provider body или URL.

Подтверждение живёт 24 часа и одноразово. Raw token находится только в письме и
памяти обработчика/браузера; в БД SHA-256. Ссылка передаёт token во fragment;
landing сразу удаляет fragment из адресной строки, GET ничего не погашает.
Кнопка выполняет POST `/api/auth/verify-email`. Перезагрузка очищенной страницы
требует вновь открыть письмо либо запросить новое. Подтверждение доступно без
сессии и при отключённой почте; оно не выдаёт вход, не меняет права и не является
N3 proof. Future email-change flow обязан сбрасывать marker и отзывать tokens.

Повтор: `/verify-email` → «Запросить новое письмо»; без сессии → обычный вход →
возвращение на страницу. POST `/api/auth/resend-verification` берёт адрес только
из текущего аккаунта; не принимает выбор email/account из body. `expected_email` — обязательная precondition показанного адреса; при смене аккаунта в другой вкладке mismatch даёт409 до выпуска/отзыва token. Не чаще одного раза
в минуту, максимум 5/account/hour и 30/IP/hour. Новая ссылка отзывает прежнюю;
уже подтверждённый адрес не вызывает новую отправку. Initial signup spam limiter
не входит в эту дельту. При `503` проверить конфигурацию и безопасные логи.

Preview для ручной проверки: `docs/preview/resend-onboarding.html`, только synthetic
Acme Reviews и example.test. Browser smoke: `node scripts/check-email-preview.cjs
<local-origin> <puppeteer-core-module-path> <chrome-binary> <output-dir>`.
Этот smoke перехватывает API synthetic ответами; настоящие API/DB проверяются
отдельными integration suites. Inbox rendering и настоящая доставка не проверены.
