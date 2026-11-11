# ADR-003: Проверять origin письма и сохранять название в существующем branding

## Status

proposed, 11.11.2026; пересмотреть при поддержке нескольких публичных origin или
новых import providers. Визуальный образец передан владельцем через координатора;
это разрешение на reviewable implementation, не окончательная owner acceptance.

## Context

FR-101 требует название и реальные маршруты `/w`, `/dashboard`, `/f`.
`buildProjectUrls` знает эти маршруты, но `baseUrl` в dev/test имеет localhost fallback
и допускает path/query/userinfo в конфигурации. Название пока использовалось только
для slug. Существующий dashboard содержит CSV import с preview, commit и moderation.

## Decision Drivers

1. Высокий: письмо не содержит выдуманный/fallback origin, A5.
2. Высокий: пользовательский текст не становится HTML или mail header, A3.
3. Высокий: onboarding обещает только существующее поведение, FR-101.
4. Средний: reuse URL builder, branding JSON и существующей палитры.

## Considered Options

| Вариант | Плюсы | Минусы |
|---|---|---|
| Строгий mail boundary + существующий builder | Нет regressions для всех URL callers, проверка на выходе | Отдельная узкая validation policy |
| Глобально ужесточить baseUrl | Единая политика для продукта | Меняет login/dashboard/reset/widget за пределами дельты |
| Собрать ссылки в HTML без проверки | Малый diff | Ошибки конфигурации доходят до получателя |

## Decision Matrix

| Driver | Вес | Mail boundary | Global baseUrl | Inline links |
|---|---|---|---|---|
| Валидный origin | Высокий | Да | Да | Нет |
| Escaping/honesty | Высокий | Явные template tests | Всё равно нужен template | Не гарантированы |
| Reuse/scope | Средний | Узкий diff | Слишком широкий | Дублирование маршрутов |

## Decision

`onboarding-email.ts` экспортирует `transactionalMailOrigin`, `emailVerificationUrl`,
`normalizeProjectDisplayName`, `projectWelcomeEmail`, `emailVerificationMessage`.
Origin выбирается из явного BASE_URL, а при его отсутствии — NEXT_PUBLIC_BASE_URL;
заданный, но невалидный первый источник не заменяется вторым или localhost.
Принимается абсолютный HTTPS origin без userinfo, query, hash, path кроме `/`,
control characters и loopback/private literal IP/single-label/localhost host.
Никакого DNS lookup или обещания доступности: это syntactic configured-origin check.
Тестовый `.example` host используется только в synthetic fixtures без отправки.

Проверка выполняется до выдачи mail token. Письмо получает результат существующего
`buildProjectUrls` и подтверждает, что три ссылки имеют этот exact origin и expected
route+slug без query/hash. Любой mismatch => invalid_origin, письмо не планируется.
Общая политика `baseUrl`, reset links и widget остаётся отдельной существующей
границей; новая проверка не объявляет их проверенными. Если нужен дополнительный
параметр origin для builder, он обязан сохранять прежний default для всех callers.

Сохранить trim-normalized project_name в `projects.branding.name`; для отсутствующего
или пустого названия использовать реальный slug. Не удалять HTML из хранения:
HTML template экранирует `& < > " '`, включая атрибуты href; subject отдельно
убирает C0/C1 controls и ограничивает длину. Текстовая версия сохраняет понятное
название и те же ссылки. Тестовый preview не содержит настоящих адресов/token.

Welcome содержит название, три ссылки, CTA «Подтвердить email» с TTL 24 часа и
следующий шаг «Импортируйте отзывы из CSV в кабинете; после импорта одобрите их».
Не обещать поиск по интернету, YouTube/Google/social imports, готовые отзывы или
доставку письма. Палитра #f2ede3 / #c8492f, Arial, inline styles; без внешних assets,
tracking pixel, unsubscribe маркетинга и фиктивных интеграций. Повторное письмо —
только подтверждение и срок. Draft preview: `docs/preview/resend-onboarding.html`.

## Rationale

Mail boundary закрывает A5 без изменения общей URL политики. Разделение stored name,
HTML escape и subject normalization закрывает A3 без потери видимого текста.
Reuse branding/builder и честный CSV next step выполняют третий/четвёртый драйверы.
Глобальная переделка URL и inline links отклонены из-за scope и drift соответственно.

## Consequences

Плюсы: реальные routes, узнаваемый бренд, проверяемая копия письма. Минусы: ошибочная
mail конфигурация отключает письмо; API явно сообщает причину, аккаунт при успешной
основной регистрации сохраняется. Проверка синтаксиса не доказывает DNS/TLS и
подтверждение sender domain; эксплуатация проверяет это отдельно до live отправки.
Follow-up ADR не требуется. Owner: web maintainer; review через месяц после включения
или при появлении multi-origin. Производственная конфигурация сейчас не проверялась.

## Confirmation

1. `apps/web/tests/onboarding-email.test.ts`: A3 hostile name/control chars,
   атрибуты escape, одинаковые text/html ссылки, honest CSV copy; A5 missing/malformed/
   credentialed/query/path/loopback origin и mismatch builder links отклонены.
2. `apps/web/tests/register.test.ts`: branding.name и внутренний result сохраняют
   название/email; legacy desired_slug и сессия не меняются.

Метод: pure template tests и synthetic preview review. Monitoring: safe
invalid_origin category, без значения конфигурации в логах. Success: ноль fallback
ссылок и executable HTML из пользовательского названия. Owner: автор + reviewer.
Load-bearing property: все externally emitted URL проходят одну строгую границу.

## Links

FR-101, FR-103; `apps/web/src/lib/urls.ts`; `apps/web/src/lib/branding.ts`;
`apps/web/src/app/dashboard/[slug]/import-form.tsx`; [ADR-001](001-send-onboarding-after-commit.md).
