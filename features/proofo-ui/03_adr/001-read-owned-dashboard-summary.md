# ADR-001: Читать обзор одной RLS-проекцией существующих данных

## Status

proposed — для независимого архитектурного review до кода; обратимо без миграции.
Пересмотреть при появлении подтверждённой telemetry wall/widget или account subscription.

## Context

Dashboard объединяет проекты, отзывы, активность и тарифы. У приложения уже есть
аутентификация, RLS и per-project billing, но нет account-level subscription,
wall opens и полных widget impressions. В выбранном макете эти поля заполнены demo.

## Decision Drivers

1. Tenant isolation и отсутствие обхода RLS (высокий вес, FR-002).
2. Достоверность данных и тарифов (высокий вес, FR-003, FR-004, FR-005).
3. Минимальное изменение работающего монолита (средний вес, FR-007).
4. Проверяемые время, ошибки и границы окна (высокий вес, FR-003, FR-009).

## Considered Options

### A. SSR read model через существующий withAccount

Плюсы: повторно использует tenant boundary и схему; не нужен клиентский API; данные
можно проверить настоящей БД. Минусы: требуется агрегирование и явная unknown модель;
честный live copy отличается от demo fixture.

### B. Новый summary API и клиентская загрузка

Плюсы: независимый fetch и локальный refresh. Минусы: новая attack surface и waterfall,
дублирование auth/error logic, API не нужен SSR-странице.

### C. Literal preview и новые telemetry/subscription таблицы

Плюсы: легко повторить demo текст; будущие метрики полнее. Минусы: literal copy лжёт
сейчас, а collectors/subscriptions расширяют scope и требуют новых требований/миграций.

## Decision Matrix

| Драйвер | Вес | A | B | C |
|---|---|---|---|---|
| RLS/auth | высокий | reuse boundary | ещё одна boundary | требует нового дизайна |
| Честные данные | высокий | explicit known/unknown | возможно, но не преимущество | literal неверен до внедрения |
| Малый scope | средний | 1 read module | endpoint + client state | несколько новых подсистем |
| Тестируемость | высокий | account + fixed now | API + client clock | длительная интеграция |

## Decision

`apps/web/src/lib/dashboard-summary.ts` предоставляет `getDashboardSummary(accountId, now)`.
`accountId` берётся только из `currentAccountId`, `now` из серверных часов; injection времени
доступен как обычный function argument для unit/DB tests, не как HTTP parameter.
Чтение проходит через `withAccount`, без `withService`, в одном SQL statement с
агрегирующими подзапросами/CTE. Это строго один data statement всей проекции:
несколько SELECT не разрешены, READ ONLY не обеспечивает общий snapshot при
READ COMMITTED. Так исключается межкомандное рассогласование и N+1. Active project scope применяется также
к events/installs/testimonials, а не только к карточкам. Параметры SQL bind-only.

Метрики: `badge_click` в `[now−30d,now)`; наблюдённые пары project/domain по
`last_seen_at` в том же окне. Live label «Домены с активностью виджета»; пояснение
«За 30 дней по обращениям к виджету; один домен с двумя стенами считается дважды».
Config-запрос не доказывает текущую установку. Повтор одной пары не увеличивает count;
отсутствующий зарегистрированный домен не добавляет пару. Wall opens и widget impressions остаются `null`,
рендерятся `—` с «Нет данных». Существующий `badge_impression` не заменяет impressions.
Count после успешного запроса может быть 0; ошибка query пробрасывается в Next error
boundary. Название — строковый непустой branding.name, иначе slug; counts
отзывов считаются отдельным агрегатом, без перемножения events×testimonials×installs.
«Всего отзывов» включает все 4 статуса за всё время; «На проверке» — pending за всё
время. Заголовок метрик «30 дней» на эти card counts не распространяется.
`isPaid(tier, paid_until, now)` определяет effective tier; mixed summary не приписывает
один тариф аккаунту. Overview не создаёт checkout и не дублирует цену.

## Rationale

A сохраняет существующую security boundary и даёт фиксированное время тестам.
B добавляет поверхность без нужной этому инкременту функции. C смешивает UI-перенос
с новой аналитикой/коммерческой моделью и потому отклонён.

## Consequences

Положительные: нет миграций/API, правдивые counts и тарифы, существующие direct URL работают.
Принятый минус: два счётчика пока неизвестны, historical completeness логов не доказана.
Мера: ясная подпись; отдельная telemetry фича потребует собственного ADR.
Follow-up ADRs: сейчас не нужны; при новой telemetry пересмотреть этот ADR.
After-action review: координатор после ручной приёмки первого инкремента проверяет,
понимает ли владелец unknown и mixed billing без новых обязательств продукта.

## Confirmation

- Method: unit/SSR и настоящая isolated Postgres проверка; source/query-count check строго одного data SQL statement.
- Independent RLS proof: seed отдельно service role; внутри withAccount(A) проверить
  current_user, rolbypassrls=false, отсутствие ownership всех четырёх таблиц, GUC=A;
  прямые SELECT без tenant WHERE к projects/testimonials/analytics_events/widget_installs
  видят A, не видят B. Dashboard aggregate с inactive children проверяется отдельно.
- Required automated check: `apps/web/tests/dashboard-overview-db.test.ts` —
  `proves role GUC and unscoped RLS for every dashboard table` и
  `reads the whole dashboard in one data statement`.
- Monitoring: локальный regression run при изменении dashboard/query/tariff.
- Success metric: A/B isolation, 0/1/N, deactivated, boundaries, unknown и expired paid проходят.
- Owner: автор реализации; независимый reviewer подтверждает результаты.
- Load-bearing property: RLS не допускает чужую строку/aggregate; нет фиктивных нулей/платного тарифа.
- Required automated check: `apps/web/tests/dashboard-overview-db.test.ts` — `isolates all dashboard aggregates by account and active project`; `apps/web/tests/dashboard-overview.test.ts` — `shows unknown metrics without fabricated zero` и `uses effective paid status at one fixed instant`.

## Links

FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007; `../02_research.md`;
Refined by ADR-002 только в части view/fixture boundary, не в semantics данных.
