# ADR-002: Скрывать название площадки, сохраняя provenance

## Status
proposed; обратимо до admission. Пересмотреть при новом согласованном определении
checkbox. FR-203, FR-204, NFR-201.

## Context
Frozen branding checkbox checked: «Показывать метки площадок («Avito», «Проверить на
Яндекс.Картах»)». Текущий FR-PROOF-001 и оба renderer всегда показывают platform label.
Пользователь запросил рабочий согласованный UI. Источник и badge имеют разную семантику.

## Decision Drivers
Высокий: реальный эффект control и честное происхождение. Средний: совместимость DTO.

## Considered Options
| Вариант | Сильная сторона | Цена/ограничение |
|---|---|---|
| Убирать platform name, оставлять нейтральный provenance, выбран | Рабочий toggle, происхождение доступно | Новый wording и отдельная нормативная delta |
| Полностью скрыть attribution block | Буквально чистая карточка без метки | Теряется явное отличие imported от написанного здесь |
| Оставить checked disabled | Сохраняет исторический FR без изменения | Контрол макета заведомо не работает; не выполняет поручение |

## Decision
Добавить boolean show_platform_labels default true. False убирает конкретное название
площадки на wall/widget, оставляя «Перенесённый отзыв», HTTPS ссылку «Первоисточник»
при наличии и неизменный снимок. Canonical source fields в БД/DTO не стираются; widget
использует наличие исходного source_label для определения provenance и флаг для caption.
Никакого переименования реальной площадки. Proofwall badge/server tariff,
demo disclaimer и machine-transcript labels независимы от настройки.
Текст/выдержка отзыва неизменны; screenshot не исчезает при наличии source URL.
Widget DTO получает optional typed WidgetBranding (theme/accent_color/show_platform_labels),
без tariff/owner fields. Старый ответ без поля и malformed network value нормализуются
к light/default accent/labels-on. Серверные и widget типы проверяются contract tests;
новый shared workspace ради трёх полей не создаётся.
Новый OpenSpec requirement явно уточняет presentation исторического FR-PROOF-001.

## Rationale
Убирается декоративная platform-specific метка, которую выбирает owner; сохраняется
доказательство переноса. Это ограниченная интерпретация подтверждённого checkbox.

## Consequences
Плюс: рабочая настройка не разрушает proof metadata. Минус: остаётся нейтральная строка,
поэтому нельзя описывать toggle как «убрать любое указание источника».
Follow-up: только при ином product решении; after-action через месяц после приёмки,
owner — владелец продукта/архитектор.

## Confirmation
- Method: wall render + real widget tests на отдельном origin.
- Load-bearing property: false меняет caption, но не proof/source/badge.
- Required automated check: `platform labels hide names but preserve provenance` в
  `apps/web/tests/wall.test.ts` и `apps/widget/tests/widget-branding.test.ts`.
- Monitoring: schema DTO contract/regression, без логирования пользовательского source URL.
- Success metric: одинаковая семантика обеих поверхностей; 0 потерянных metadata.
- Owner: автор и независимый QE, не текущий planning agent.
