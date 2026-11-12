# ADR-001: Обновлять существующий Branding через tenant-safe PATCH

## Status
proposed; обратимо до admission. Пересмотреть при необходимости истории версий или
relational constraints. FR-201, FR-202, FR-209, NFR-202.

## Context
JSONB уже хранит настройки и dashboard name. Writer отсутствует; старые rows могут
содержать только часть полей/HTTP logo. RLS и bounded-body helper уже существуют.

## Decision Drivers
Высокий вес: tenant isolation, отсутствие silent data loss, reuse. Средний: rollout/rollback.

## Considered Options
| Вариант | Сильная сторона | Цена/ограничение |
|---|---|---|
| Flat JSONB PATCH, выбран | Reuse текущего хранения/читателя, atomic merge | Runtime validation, JSON может содержать legacy мусор |
| Таблица project_settings | Типы/constraints непосредственно в БД | Новая migration/join/backfill без новой сущности |
| Полная замена JSON через PUT | Простой полный snapshot формы | Stale form может стереть name/неизвестные ключи; нужен version protocol |

## Decision
Добавить GET/PATCH `/api/projects/[slug]/branding` с currentAccountId и withAccount.
GET отдаёт только канонические шесть полей. PATCH принимает только dirty whitelist keys,
валидирует типы/enum/длины/HEX/HTTPS и SQL-safe Unicode (NUL/unpaired surrogate→400),
делает SQL `branding = branding || $patch::jsonb`
в одной tenant transaction; read/check/update одной строки под lock. Объект с неизвестным
полем отвергается целиком. Для видимой legacy non-object JSON записи writer даёт 409
без изменения; reader может показывать defaults. Ошибку не маскировать normalizing write.
Неизвестный/чужой/inactive slug даёт 404; это project policy, moderation 403 сюда не переносится.
Origin проверяется по каноническому baseUrl, body читается readBodyAtMost(4096).
Missing/foreign Origin→403; non-JSON→415; oversized→413; DB failure→503.
Лого с HTTP продолжает читаться; пока его не редактировали, PATCH его не посылает.
Branding form использует noValidate и явную валидацию dirty patch до fetch: нативный
HTTPS pattern иначе блокирует unrelated Save ещё до handler. API валидирует повторно.
Client validation и server validation не имеют fixture-specific веток.
Одноимённые конкурентные dirty keys: last committed write wins; независимые keys не теряются.
UX-01: выбран locked editor на время одного запроса. После explicit client validation
фиксируются draft/payload, disabled fieldset включает все шесть settings, оба color
inputs и Save. Pending edits и второй PATCH невозможны. 200 применяет canonical response
и очищает dirty; failure разблокирует неизменённый draft. Альтернатива versioned draft
с rebasing более поздних edits отклонена: усложняет состояние без требования live-edit.
Две вкладки не блокируют друг друга: SQL merge сохраняет разные keys, один key выбирается
порядком commit, обе вкладки после reload видят его. Optimistic version conflict не обещан.
Pending status вне fieldset получает focus; error summary role=alert связывает invalid
поля через links/aria-describedby и получает focus, затем editing доступен. Unchanged
legacy HTTP допускает keyboard theme Save; edited HTTP даёт logo-specific HTTPS error.
Базовый exported Branding остаётся трёхпольным для прежних typed literals. Новый
ResolvedBranding extends Branding добавляет theme/review_order/show_platform_labels;
readBranding возвращает его с defaults. PATCH type — Partial известных шести полей,
runtime validator всё равно принимает unknown и отвергает неизвестные ключи.

## Rationale
JSONB соответствует текущей consistency boundary проекта. PATCH + merge оставляет
нетронутые данные, а строгий writer устраняет ложное Save→truncate/default.

## Consequences
Плюс: нет production data migration; старый reader игнорирует добавленные поля.
Минус: последний редактор одного поля побеждает; UI не обещает optimistic version lock.
Некорректный legacy JSON требует отдельного восстановления после наблюдения, не этого PATCH.
Follow-up ADR сейчас не нужен; revisiting owner — координатор/владелец продукта через месяц после приёмки.

## Confirmation
- Method: real isolated PostgreSQL/RLS + route tests, затем UI reload.
- Load-bearing property: чужой owner и forbidden fields не меняют проект/name/tier.
- Required automated check: `branding patch preserves unrelated keys` и
  `branding rejects foreign project and revoked permission` в `apps/web/tests/project-branding.test.ts`.
- `branding owner statements retain role and tenant context` в том же файле наблюдает
  current_user и GUC фактических GET/page SELECT и PATCH SELECT/UPDATE на их client/
  transaction. Мутант withService с сохранённым account WHERE обязан упасть; отдельный
  probe helper transaction не считается проверкой statement.
- Monitoring: bounded outcome codes; Success metric: zero unexpected writes/false success.
- Browser check: `legacy HTTP logo permits unrelated theme save` в
  `tools/visual/branding-collect.e2e.test.mjs` доказывает click→PATCH без logo→reload effect,
  затем edited HTTP→ошибка/no write; один repository test недостаточен.
- `branding locks settings during delayed save` и `branding two tabs merge dirty keys in commit order`
  в `tools/visual/branding-collect.e2e.test.mjs`: все controls проверяются под задержанным
  ответом; success/error draft; две вкладки/разные и одинаковые keys + reload обеих.
- `new branding logs omit payloads` в `apps/web/tests/project-branding.test.ts` проверяет
  только новые PATCH/UI logger calls. Existing photo GET logs не входят в NFR-202.
- Owner: автор реализации; независимый QE проверяет результаты и отказные мутации.
