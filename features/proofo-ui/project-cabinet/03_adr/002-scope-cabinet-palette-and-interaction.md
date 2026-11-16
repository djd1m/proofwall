# ADR-002: Разделить product chrome и публичный branding

## Status
Proposed, design adaptation approval pending; уже выбранная владельцем terracotta/default border не пересматриваются.

## Context / Decision Drivers
Legacy globals используют purple переменные/gradients, public custom branding сохраняет реальные пользовательские цвета. Копирование cabinet CSS также переносит некоторые purple shadows. Нельзя «починить» UI, сбросив сохранённый public accent или скрыв live ошибку explicit fixture palette.

## Considered Options
1. Выбран: route-scoped `.proofo-project`, отдельные product palette variables и полное override используемых legacy button states.
2. Изменить globals.css: отвергнут, влияет на несвязанные routes.
3. Использовать project accent как chrome: отвергнут, не соответствует product palette и создаёт contrast drift.

## Decision
Новый project-cabinet.css изолирует shell, typography, fields/buttons/default/hover/focus/error/disabled, границы, shadows. Product accent #c8492f; necessary control border #8e806b; field fill #f7f4eb/card #fffdf8. Public custom branding читается только на своих публичных surfaces. No global CSS reset. Existing capability modules получают purposeful class/semantic adjustments, без API changes. Import tabs следуют keyboard tab pattern либо используют обычные доступные кнопки/disclosures; семантика согласуется с фактическим поведением. Form busy/error/status labels и focus не ухудшаются. Полные name/text/provenance wrapping, без line-clamp/ellipsis.

## Consequences
Больше scoped selectors, но остальные routes не меняются. Offline original palette может отличаться только через явные generic presentation props; live models всегда product palette. Не добавлять fixture env/query branch.

## Confirmation
`tools/visual/project-cabinet.e2e.test.mjs`: `live project cabinet keeps terracotta chrome and custom public branding`; `project cabinet controls remain accessible with long content`. Проверяются computed colors/compositing/320+360+390+1440/hover/focus и full text; mutation live default→purple, border→old #ddd3c2, nowrap должны падать.
Owner: author; independent accessibility/QE reviewer.

## QCSD interaction refinement
Выбраны mounted tabs, не альтернативный disclosure: roving Tab/Left/Right wrap/Home/End и linked aria attributes; inactive hidden/inert. Manual/CSV/password field-specific errors связаны id/describedby/invalid, summary alert focus; operation busy/disabled/live status. Moderation success фокус на следующей доступной action той же карточки, failure сохраняет исходный action; cancel password до submit возвращает focus opener, после submit disabled до действительного ответа. Точные sequences и DOM/ARIA-tree+ручной AT oracle в 05. Confirmation дополнительно: `project cabinet keyboard tabs preserve drafts and focus`, `project cabinet fields announce validation busy errors and retry`, `project cabinet moderation and password retain keyboard focus`, `project cabinet password cancel respects in-flight mutation` в `tools/visual/project-cabinet.e2e.test.mjs`.
