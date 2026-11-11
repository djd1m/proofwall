# ADR-002: Проверять frozen fixture тем же чистым dashboard-компонентом

## Status

proposed — обратимо до принятия baseline и первого UI-инкремента.
Пересмотреть при новом согласованном макете или смене закреплённого browser environment.

## Context

Владелец выбрал конкретный preview. Его DOM/CSS/fonts можно переиспользовать, но
literal Free/Start/Pro copy не является продуктовой правдой. Pixel comparison требует
одинаковых данных и окружения; тестовый auth route в production расширил бы поверхность.

## Decision Drivers

1. Ноль необъяснённых visual differences (высокий вес, FR-008).
2. Отсутствие fixture/auth backdoor в production (высокий вес, FR-009).
3. Честный live SSR и реальная browser navigation (высокий вес, FR-005, FR-010).
4. Повторное использование existing CSS/fonts (средний вес, FR-008).

## Considered Options

### A. Pure view + отдельный static fixture renderer

Плюсы: один production view, детерминированные данные, нет HTTP backdoor.
Минусы: требуется отдельный renderer и отдельный live E2E; fixture сама не проверяет auth.

### B. Production `/__test/dashboard` или query/header fixture override

Плюсы: легко запустить обычный Next renderer. Минусы: новый служебный маршрут, риск
попадания тестовой конфигурации в живые данные, ещё один auth/guard контракт.

### C. Сравнивать live DB данные прямо с demo screenshot

Плюсы: реальный сервер в каждом снимке. Минусы: произвольные данные/время дают diff,
потребуют масок или подмены billing и скрывают смысл visual проверки.

## Decision Matrix

| Драйвер | Вес | A | B | C |
|---|---|---|---|---|
| 0 diff | высокий | одинаковая fixture | одинаковая fixture | данные различны |
| Изоляция tests | высокий | вне Next router | backdoor risk | нет fixture, но masks |
| Live truth | высокий | отдельно E2E | легко смешать modes | вынуждает demo state |
| Reuse | средний | тот же component | тот же component | тот же component |

## Decision

`apps/web/src/app/dashboard/dashboard-overview.tsx` экспортирует `DashboardOverview`
и тип `DashboardOverviewModel`. View рендерит только переданные безопасные данные,
не читает DB/cookies/process.env и не использует `dangerouslySetInnerHTML`.
`dashboard-summary.ts` импортирует тип через `import type` и строит живую модель.
View содержит точную структуру cabinet dashboard; presentation fields позволяют
literal frozen fixture и собственные live copy без нового product feature flag.

`apps/web/tests/dashboard-visual-fixture.test.ts` импортирует тот же component;
`scripts/render-dashboard-fixture.mjs` запускает существующий Vitest, который создаёт
временный HTML через `React.createElement` + `react-dom/server`. Static server слушает только localhost; его `/dashboard.html`
не входит в Next app routes. Прямых fixture/env/header/query overrides в app нет.
`apps/web/src/app/dashboard/dashboard.css` сохраняет релевантные preview declarations,
но ограничивает resets/tokens/typography wrapper `.proofo-dashboard`. Для требуемого
body font/background разрешены qualified `body:has(.proofo-dashboard)` declarations:
они действуют только при dashboard и не меняют project pages. Fixture загружает
тот же `apps/web/src/app/globals.css`, затем тот же dashboard CSS, с тем же wrapper,
без synthetic body styling/iframe/spacer. Шрифты byte-exact в `public/proofo/`.

Baseline сохраняет preview commit/tree, hashes, Chromium revision, OS/image,
viewport, DPR, locale, timezone, color scheme и font readiness. Screenshot region —
`main.cab-shell`; banner, preview navigator, footer исключены только этой границей.
До reference capture скрываются только `.cab-notice` и `#preview-tools`; это
согласованная нормализация demo-only элементов. Fixture и live имеют один wrapper,
никакого spacer для подгонки. Canonical initial baseline — `dashboard-v3`, manifest
SHA-256 `e7999b11e9fb68cf57f64323c624df5d70693d366d1d69be01a1d7e9e3101684`.
Полный shell снимается с `fullPage:true` и ceil bounding box; ранние capture attempts
сохраняются как rejected diagnostics. Геометрия/фон/brand/back внутри региона включены. Проверка требует 0 changed pixels,
не создаёт baseline и проверяет отрицательные font/margin/color mutations.
Живой SSR отдельно проверяется в browser через обычный login и isolated DB.
HTTP E2E после document.fonts.ready сопоставляет computed body font-family/background
(color/image/size/position) и shell origin/width/padding с fixture/reference. Body
за пределами crop включён в style-contract; одинаковой полной высоты при разных
реальных текстах и числе карточек не требуется. Это проверка реальных production CSS,
а не CSS injection screenshot checker. Baseline остаётся неизменным.

## Rationale

A одновременно обеспечивает тот же production view и не выпускает тестовый route.
B отвергнут из-за лишнего production контракта. C не позволяет интерпретировать
pixel diff без масок данных и смешивает визуальное и функциональное доказательство.

## Consequences

Плюсы: reviewable visual proof, exact reusable assets, auth остаётся единственным.
Минусы: нужны два harness; static render не доказывает hydration и DB — это покрывает live E2E.
Follow-up ADRs: сейчас не нужны; новая baseline версия только после review/согласования.
After-action review: baseline engineer и координатор после ручной приёмки проверяют
детерминизм и отсутствие глобальных CSS regressions на project route.

## Confirmation

- Method: frozen screenshot comparison, deliberate mutations, source boundary test, live E2E.
- Required automated check: `tools/visual/dashboard.e2e.test.mjs` —
  `live dashboard and fixture share body styles and shell geometry`.
- Monitoring: immutable hashes и повторяемый local visual check при UI изменениях.
- Success metric: 0 diff на всех согласованных dashboard viewports; 3 mutations отклонены.
- Owner: baseline engineer и автор; независимый reviewer проверяет соответствие артефакту.
- Load-bearing property: fixture рендерит production view, не входит в production routes и не ослабляет auth.
- Required automated check: `apps/web/tests/dashboard-overview.test.ts` — `fixture uses the production dashboard view without a route override`; `tools/visual/dashboard.e2e.test.mjs` — `dashboard requires an ordinary session and opens the owned project`. Visual команды `scripts/check-proofo-visual.mjs` и `scripts/render-dashboard-fixture.mjs` обязательны отдельно.

## Links

FR-008, FR-009, FR-010; Refines ADR-001 presentation boundary;
`../06_team_execution_plan.md`, `../01_requirements.md`.
