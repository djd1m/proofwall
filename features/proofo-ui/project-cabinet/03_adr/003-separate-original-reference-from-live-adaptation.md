# ADR-003: Отдельный immutable project reference и same-view evidence

## Status
Proposed; original candidate capture уже существует в `evidence/original-project-reference/capture.json`; approval новой адаптации и финальная immutable comparison manifest pending. Старый dashboard-v3 read-only.

## Context / Decision Drivers
В старом manifest нет project cases. Original macro и живой кабинет различаются существенными capability sections. Full-page pixel identity live не является честным oracle. Требуется сохранить исходник и проверить реальный production view без ложной копии HTML.

## Considered Options
1. Выбран: отдельный immutable original capture, импорт общих production view primitives offline, явная геометрическая граница сравнения, полный live functional/visual evidence.
2. Добавить case/переснять старый manifest: отвергнут, нарушает immutable history.
3. Скопировать cabinet.js в fixture и сравнить с original: отвергнут, не связан с production.
4. Замаскировать все отличия full-page diff: отвергнут, выдаёт незамеченный drift за fidelity.

## Decision
Новый `reference/project-v1/` содержит original source hashes, три viewport1440x900/390x844/360x800 PNG+DOM, environment/flags, original resource hashes. Использовать readNoFollow/assertFreshFile/writeNew и capture helpers из `scripts/capture-proofo-reference.mjs`, не менять старый файл/manifest. Capture до product implementation; current invocation ничего не запускает.
`ProjectCabinetView` — реальная stateless production композиция; generic model + slots existing interactive modules. `render-project-cabinet-fixture.mjs` импортирует этот же view; не copied prototype script/HTML. Immutable original geometry проверяется строго (zero diff, no new tolerance) на заранее перечисленных shell/header/title/onboarding primitives с literal original model и оригинальной palette. Rectangles/selectors/boundaries фиксируются до source writes и согласуются вместе с proposal. Slots, новые control/filled states и дополнительный recovery notice не объявляются pixel-identical original. Полный original capture сохраняется без масок; output явно указывает covered regions и excluded semantic deltas. Нельзя расширить exclusions после failing diff.
Обычные persisted live E2E дополнительно проверяют actual default colors и full UI; artifact содержит screenshots empty/filled/error/mobile без объявления accepted golden до owner review. Новая approved adaptation baseline возможна только отдельным решением; нельзя повышать статус предложенной картинки самовольно. Нет Next fixture route/auth bypass.
QA использует новый target-aware runner и guarded Node/browser boundary из 05, поверх existing env helpers; exact PG33186/app33187/S3synthetic33188/foreignhost33189+общий flock. Existing runner e2e не подходит для project. Negative visual/path/config/transport-attempt probes обязательны; ограниченная гарантия не называется OS-wide quarantine.

## Consequences
Чётко разделены original fidelity, адаптация и функциональное доказательство. Нулевой diff части view не доказывает весь live page; это ограничение отражается в отчёте.

## Confirmation
`apps/web/tests/project-cabinet-visual-fixture.test.ts`: `project cabinet fixture imports production view without runtime bypass`. `scripts/project-cabinet-reference.test.mjs`: `project reference refuses overwrite symlinks and altered source`, `project visual gate rejects font spacing and color drift`. `tools/visual/project-cabinet.e2e.test.mjs`: `ordinary persisted project cabinet renders without fixture overrides`.
Owner: author freezes source; coordinator establishes design approval; independent QE checks comparisons.

## Предложенный контракт соответствия адаптации — owner approval PENDING
Решение владельца должно ссылаться на URL `https://proofwall.78.17.53.233.sslip.io/__design/proofo/project-next/`, manifest bytes ниже и выбранные регионы A0–A7. Эти регионы пока proposed, не approved. Root сохраняет точный ответ+дату+source hashes+перечень согласованных/отклонённых регионов в новом decision artifact; нет ответа/изменены bytes/нет решения по filled controls → precode gate остаётся pending. Не дописывать approval на основании опубликованного URL или elapsed.
- `preview/proposal.css` SHA-256 `fe959c30e5faa362adc28ec7be5212dfaae3b989785592fe941e040ed2e96a42`.
- `preview/proposal.js` SHA-256 `b2252e7ce7342c4b54ed632234ce515ef43a9f7077204a88d9fcbee0a10be119`.
- `preview/index.html` SHA-256 `ab7bab18e7c6543fca03eb79bb35869d465597a9648acf3edb369b1de1f41c9c`.
- `preview/README.md` SHA-256 `963274ca9b665236f5addbcc8c3942f67472a414a2bfe531605492b170bb1d4c`.

Viewport для каждого visual region:1440x900,390x844,360x800, DPR1, Chromium148 pinned original environment, ru-RU/UTC/light/fonts.ready/reducedMotion/scroll0.320px только live reflow, без обещания proposal pixel identity. Shared CSS/fonts source hashes дополнительно связываются с existing frozen manifest e7999b11e9fb68cf57f64323c624df5d70693d366d1d69be01a1d7e9e3101684; original source не меняется.

| Region | Proposal locator → live contract | Oracle после approval |
|---|---|---|
| A0 shell/header/title | .cab-shell/.cab-top/.cab-paper/.cab-title → те же scoped classes | computed font/fill/border/radius/padding/gap exact; width/x и внутренние отступы≤1CSSpx; actual name/slug/tariff dynamic |
| A1 steps/recovery | .cab-steps + .proposal-email → .cab-steps + [data-cabinet-email] | 3 якоря в порядке import/reviews/show; permanent verify/reissue и allowlist notice; palette/type/spacing exact, actual text вариативен |
| A2 intake | #import/.cab-tabs/#panel-manual/#panel-csv → те же IDs | порядок section title→tabs→active panel→honest limitation; tab labels/keyboard; формовые label/field/control tokens exact; actual input вместо demo metadata не pixel oracle |
| A3 reviews | #reviews/#review-list/.proposal-review/.proposal-review-head/.proposal-actions → #reviews/[data-review-list]/[data-review-card]/[data-review-header]/[data-review-actions] | empty и2 persisted synthetic cards; author/status→media/transcript→full text→source→actions order; card/control computed tokens exact, allowed actions count/labels по status; clipping/overflow отсутствуют |
| A4 presentation/collect | #show/#snippet, #collect/.cab-collect-link → те же IDs/classes | links/code доступны при0approved, section order и tokens exact, реальныеhref/snippet вместо demo placeholders |
| A5 tariff/status/share | #tariff/.proposal-plan + #compatibility → #tariff/[data-billing-panel]+[data-account-status]+[data-share-section] | single effective tariff, field/button/card tokens, N3/share capability order; price/status/install dynamic; disabled N3 hidden честно |
| A6 password | #password/#password-open/#password-demo → #password/#password-open/#password-form | opener→disclosed3labelled fields→submit/cancel, computed field/control tokens exact; demo-disabled не переносится как runtime state |
| A7 errors/busy | demo status placeholders → live alert/status regions | error/busy semantics из ADR002; full ordinary screenshots, не pixel compare отсутствующих в proposal ошибок |

`project cabinet matches approved adaptation regions` в `tools/visual/project-cabinet.e2e.test.mjs` читает frozen decision/manifest и отказывает при pending/hash mismatch/неназванном region. Для A0–A6 сравнивает точные computed typography/color/radius/border/control padding/gaps с approved proposal region measurements, а допустимые dynamic content/height/URLs перечислены выше; ≤1CSSpx только geometry rounding, не color tolerance. Invariant tokens берутся из semantic token mapping (например .proposal-actions→data-review-actions), никогда blanket ignore региона. Drop action/reorder header/remove source/change field border mutants должны падать. A7 — semantic/live screenshot oracle. Полные ordinary persisted empty/filled/error кадры на всех3размерах сохраняются независимо. Результат не называется full-page pixel identity.
Original comparator отдельно: O0 .cab-top, O1 .cab-title, O2 .cab-steps на3viewport с original literal model через те же production primitives; каждый region screenshot нормализован только к своей boundingBox, zero pixel diff, computed dimensions/type/spacing exact; global vertical position после новых recovery/content sections не oracle. Full original capture остаётся unmasked. Финальная decision обязана назвать O0–O2/A0–A7; новые exclusions/relaxation требуют отдельного решения, не исправляются ради green.
