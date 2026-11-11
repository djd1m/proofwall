# Branding + collect — оценка сложности

Дата: 11.11.2026. Статус: черновик следующего инкремента после dashboard.
Task kind: research

Планируемая реализация: **L**, `/feature-adr --full-qe`, без GitHub CI.
В этом задании разрешены только документы; приложение, env, baseline и production не меняются.
Источник кода при разведке: HEAD `cd7ecb481f1ec6370f8e1d617d2c7e18528a964e`;
dashboard одновременно дорабатывает другой автор, его незавершённые изменения не являются closure.

## Оценка L

| Измерение | Балл | Основание |
|---|---:|---|
| Файлы | 3 | 28 точных code/test/tool targets в плане; документы отдельно |
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
| A7 | Имя 1/81, роль 121, текст 9/2001, spoof MIME/SVG/>5 MiB | Серверный отказ, без отправки в storage и расхода успешной квоты |
| A8 | Storage 503, network failure, 429, double click | Нет ложного success, ввод сохранён, sending блокирует повторный click |
| A9 | HTML в имени/heading/text, CSS/URL payload | Текст неизменен в БД и безопасен в JSX/textContent/JSON-LD |
| A10 | Визуальная мутация font / margin 3px / color | Frozen comparison падает; goldens и expected thresholds не перезаписываются |
| A11 | Legacy branding {}, HTTP logo, malformed JSON value; SQL permission revoked | Честный compatibility path/ошибка; не success при rollback/denied UPDATE |

## Admission

Прочитаны локальный feature-adr, Direct routing, полный code-goal-planner и shift-left.
`dz recall` реально выполнен: 3 hit; используются только ограничения без GitHub CI и
проверенные project contracts. Усечённые lessons не превращены в факты по фото/branding.
AQE recall/runtime, native-hook activation, QCSD, K1 и независимое ревью не подтверждены
этим агентом. `03.5_ideation_report.md` содержит входы/риски, а не вымышленный GO.
Фактический исполнитель документов: `/root/branding_collect_plan`; model/effort сверяет
координатор с метаданными запуска. Матрица ролей в docs/model-matrix.md — назначение,
не свидетельство запусков. Недоступный обязательный runtime/gate блокирует реализацию.
