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
валидирует типы/enum/длины/HEX/HTTPS, делает SQL `branding = branding || $patch::jsonb`
в одной tenant transaction; read/check/update одной строки под lock. Объект с неизвестным
полем отвергается целиком. Для видимой legacy non-object JSON записи writer даёт 409
без изменения; reader может показывать defaults. Ошибку не маскировать normalizing write.
Неизвестный/чужой/inactive slug даёт 404; это project policy, moderation 403 сюда не переносится.
Origin проверяется по каноническому baseUrl, body читается readBodyAtMost(4096).
Missing/foreign Origin→403; non-JSON→415; oversized→413; DB failure→503.
Лого с HTTP продолжает читаться; пока его не редактировали, PATCH его не посылает.
Одноимённые конкурентные dirty keys: last committed write wins; независимые keys не теряются.

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
- Monitoring: bounded outcome codes; Success metric: zero unexpected writes/false success.
- Owner: автор реализации; независимый QE проверяет результаты и отказные мутации.
