# Branding + collect — оценка сложности

Дата: 11.11.2026. Статус: уточнённые входы QCSD следующего одобренного инкремента.
Task kind: research

Планируемая реализация: **L**, `/feature-adr --full-qe`, без GitHub CI.
Текущий этап работы автора ограничен подготовкой документов: app code, env, baseline
и production не меняются. Пользователь разрешил дальнейшую реализацию после actual
gates/admission; эти документы сами такой допуск не устанавливают.
Текущий source baseline: HEAD `4da1c64b6dcc537a412646183344dcb53645ea02`, branch
`feature/proofo-branding-collect`, worktree `/tmp/proofwall-branding-collect`.
Dashboard завершён в этом базовом commit; его публичный preview обслуживается отдельным
stable artifact и не является target. Пользователь одобрил продолжение branding + collect.
Историческая разведка на cd7ecb4 сохранена как история, не текущая source revision.

## Оценка L

| Измерение | Балл | Основание |
|---|---:|---|
| Файлы | 3 | Ровно 30 code/test/tool targets: добавлены project navigation и отдельный QA runner; документы отдельно |
| Домены | 3 | Оформление проекта, приём отзыва, публичная публикация |
| Интеграции | 1 | Новых провайдеров нет; reuse PostgreSQL и существующего photo storage |
| Breaking changes | 2 | Явная семантическая дельта меток источника; DTO добавляется совместимо |
| Модель | 2 | Расширение существующего JSON VO Branding; новых сущностей/таблиц нет |
| Сквозные аспекты | 3 | Tenant write/CSRF, согласованность публичных читателей и UI |
| **Итого** | **14** | **L**; последовательность branding → collect остаётся ограниченной |

Шаги полного будущего цикла: 0, 1, 2, 3, 3.5, 4, 5, 6, K1, K2, 7, 8, 9.
Текущая работа создаёт входы 0–6, но не подтверждает QCSD, checkpoint/admission или шаги 7–9.
Ориентир для планирования: требования/research 30 мин, архитектура 45 мин,
реализация 3–5 ч, изолированное QE/review 2–3 ч; это оценка труда, не обещание runtime.

## Acid corpus

| ID | Реальный отрицательный вход | Требуемый отказ/инвариант |
|---|---|---|
| A1 | Anonymous/expired/revoked session или slug другого владельца | 401 либо неразличимый 404; чужое оформление не читается/не меняется |
| A2 | PATCH с tier/account_id/name/noindex/paid_until или вложенным JSON | 400, ни одной записи; существующий branding.name сохраняется |
| A3 | theme=system, sort=rating, invalid HEX, javascript logo, heading 121 | 400 без частичного сохранения; SQL-порядок только whitelist |
| A4 | Missing/foreign Origin, cross-site request, >4096 streamed bytes | 403/413 до записи, без зависимости от Content-Length |
| A5 | 51 approved + pending/foreign записи с одинаковым created_at | Widget выбирает те же newest 50 для обоих порядков; id tie-break; tenant/status filters |
| A6 | show_platform_labels=false у platform отзыва на free/expired | Название площадки скрывается; перенос/доказательство остаются, server badge остаётся |
| A7 | name.trim().length 1/81; raw role.length121; raw text.length9/2001; spoof MIME/SVG/>5 MiB | UI и HTTP одинаково отказывают без upload/квоты; padded name raw82/trim80 принимается и сохраняется исходным |
| A8 | Storage 503, network failure, 429, double click | Нет ложного success, ввод сохранён, sending блокирует повторный click |
| A9 | HTML в имени/heading/text, CSS/URL payload | Текст неизменен в БД и безопасен в JSX/textContent/JSON-LD |
| A10 | Визуальная мутация font / margin 3px / color | Frozen comparison падает; goldens и expected thresholds не перезаписываются |
| A11 | Legacy branding {}, HTTP logo, malformed JSON value; SQL permission revoked | Честный compatibility path/ошибка; не success при rollback/denied UPDATE |
| A12 | QA runner с remote/shared DB, remote S3, real credentials, symlink env или snapshot-update | Отказ до spawn; allowlist child env, отдельные loopback ресурсы, только synthetic local S3 |
| A13 | White/near-white accent heading на light surface; near-black на dark | Отдельный accentText fallback; computed contrast oracle проваливает невидимый heading даже при корректном onAccent |
| A17 | Live form palette возвращена с owner-approved #8e806b на старую рамку #ddd3c2 | Computed field border/fill/card contrast падает ниже3; отдельный live oracle проваливается, frozen fixture не подменяет его |
| A14 | Удалены error message/aria-describedby, pending/success focus target | Accessibility-tree/keyboard assertions падают; реальный screen-reader run отдельно |
| A15 | Неразрывные предельные строки на 320/360/390, nowrap/clipping mutation | Полное содержимое доступно, нет document overflow; widget root/host измерены отдельно |
| A16 | Изменение настройки во время задержанного Save; две вкладки | Все settings disabled до ответа; разные dirty keys сохраняются, один key last committed wins после reload |

## Admission

Прочитаны локальный feature-adr, Direct routing, полный code-goal-planner и shift-left.
`dz recall --json` реально повторён в новом worktree: 3 полных hit. Применён урок
`teach:6e27eb95f25a6367`: роль и tenant GUC проверяются на фактическом owner read/write
statement того же client/transaction, не в отдельном helper probe. Применён SQL-safe
string урок: новый branding writer отвергает NUL/некорректный Unicode до SQL, без переписывания.
Прочие lessons не превращены в новые продуктовые требования.
Ранний runtime audit прочитан из `/tmp/proofwall-branding-runtime-handoff.json`:
Sol/high live process, native SessionStart/PreToolUse, AQE fleet_init/query успешны;
query пустой, retrieved lessons 0. Stop этого audit не наблюдался, semantic search
не подтверждён. Это runtime prerequisites, не QCSD/K1/K2/product review closure.
`03.5_ideation_report.md` содержит входы/риски, а не вымышленный GO.
Фактический исполнитель документов: `/root/branding_collect_plan`; model/effort сверяет
координатор с метаданными запуска. Матрица ролей в docs/model-matrix.md — назначение,
не свидетельство запусков. Недоступный обязательный runtime/gate блокирует реализацию.
