# ADR-001: Отправлять одно onboarding письмо после commit существующим адаптером

## Status

proposed, 11.11.2026. Предложение архитектора для реализации в ветке; не подтверждает
owner acceptance или production readiness. Пересмотреть при требовании гарантированной
доставки или при измеренных потерях фоновых заданий.

## Context

FR-101 и FR-103 добавляют письмо к существующей атомарной регистрации аккаунта,
проекта и сессии. `withService` возвращает результат только после COMMIT.
`email.ts` уже реализует Resend, timeout 8 секунд, максимум две попытки с одним
idempotency key и безопасные категории отказа. `forgot/route.ts` использует Next `after`.
Домен и реальные mail credentials не выбраны/не проверяются в этой работе.

## Decision Drivers

1. Высокий: ошибка почты не отменяет созданный проект, FR-103, A4.
2. Высокий: ответ API не выдаёт запланированную работу за доставку, FR-103.
3. Средний: минимальный scope, reuse адаптера и отсутствие нового сервиса.

## Considered Options

| Вариант | Плюсы | Минусы |
|---|---|---|
| Одно welcome+verify письмо через `after` | Reuse; одна отправка; регистрация не ждёт сеть | Best effort, нет durable queue; нет гарантии доставки |
| Transactional outbox + worker | Durable retry и наблюдаемый lifecycle | Новая ответственность worker, миграции состояния и эксплуатации |
| Send в транзакции регистрации | Можно видеть ответ провайдера до HTTP ответа | Держит соединение БД; внешняя отправка не откатывается вместе с БД |

## Decision Matrix

| Driver | Вес | after | Outbox | Send в транзакции |
|---|---|---|---|---|
| Регистрация переживает сбой почты | Высокий | Да | Да | Нет |
| Честное состояние | Высокий | scheduled, исход только в логах | Полный lifecycle | Всё равно не доказывает inbox delivery |
| Reuse и scope | Средний | Лучший | Существенная новая подсистема | Малый diff, плохая граница |

## Decision

В `register/route.ts` проверить `mailConfigured()` и строгий origin, затем внутри
одной `withService` вызвать регистрацию и, лишь при годной конфигурации, выпуск
verification token. После успешного возврата `withService` построить одно письмо
из `onboarding-email.ts` и зарегистрировать `after` callback. Callback вызывает
`sendWithRetry(sendViaResend, message, 'onboarding_email')`; сеть не входит в транзакцию.

Отправку и defer внедрять как параметры handler по образцу `handleForgot`, чтобы
тесты работали без сети. Token и recipient не возвращать в HTTP body. Cookie сессии
и существующие поля регистрации сохраняются. Дополнительное поле `email_delivery`
содержит `scheduled`, `not_configured`, `invalid_origin` либо `schedule_failed`.
`scheduled` означает только успешную регистрацию callback; `schedule_failed`
допустим при синхронном отказе defer после COMMIT. Любой mail-related отказ после
COMMIT сохраняет успешную регистрацию и cookie. Отказ самой транзакции — обычный
отказ регистрации, callback не создаётся.

Повторная выдача через аутентифицированный endpoint отправляет только verification
письмо, а не welcome повторно. Resend 2xx означает приём провайдером, не inbox delivery.
Текущий лог `*_sent` трактуется именно так; документация не обещает статус доставки.
Новый delivery status API, webhook, outbox и worker в эту дельту не входят.

## Rationale

Первые два драйвера обеспечены порядком COMMIT → defer и ограниченным словарём
состояний. Третий обеспечен reuse. Outbox оправдан только новым требованием
durability; отправка внутри транзакции отвергнута из-за непоправимого рассогласования
письма и rollback. Два первоначальных письма увеличивали бы квоту и число отказов.

## Consequences

Плюсы: один transactional message, короткие транзакции, отказ почты не ломает вход.
Минусы: остановка процесса после COMMIT или во время `after` может потерять письмо;
пользователь может повторить подтверждение. Retry ограничен одной фоновой задачей,
клиент не получает окончательный результат. Не утверждать успешную доставку по тесту mock.
Follow-up ADR сейчас не требуется. Владелец разбора — сопровождающий web;
after-action review через месяц после реального включения почты или при первой потере задания.

## Confirmation

1. `apps/web/tests/onboarding-routes.test.ts`: отправка и defer только после успешного
   COMMIT; rollback не ставит callback; отсутствие конфигурации не выпускает token;
   timeout/provider refusal сохраняет 201/cookie; отказ defer даёт schedule_failed.
2. `apps/web/tests/email.test.ts`: reuse bounded retry, один idempotency key на письмо,
   безопасный журнал без recipient/token/provider body; добавить redirect:error для
   фиксированного Resend endpoint и проверить redirect rejection.

Метод: unit/handler tests с фальшивым sender, ручная проверка логов теста. Monitoring:
существующие безопасные категории, без новых метрик доставки. Критерий: A4 проходит,
HTTP никогда не содержит delivered/sent claim. Owner: автор и независимый reviewer.
Load-bearing property: ни одна сеть до COMMIT, никакой выдуманной гарантии доставки.

## Links

FR-101, FR-103; [архитектура](../05_architecture.md); `apps/web/src/lib/email.ts`;
`packages/db/src/tenant.ts`; `apps/web/src/app/api/auth/forgot/route.ts`.
