# ADR-003: Сравнивать frozen с offline render production views

## Status
proposed; owner-approved live border delta от 2026-11-12, baseline неизменен.
FR-205…FR-208, NFR-201, NFR-202; независимая проверка delta/admission pending.

## Context
Frozen v3 содержит prototype-only текст/опции. Живой продукт имеет реальные branding,
auth, photo и video flag. Точное сравнение разных текстов не доказывает одинаковый layout.

## Decision Drivers
Высокий: неизменность goldens, отсутствие fake routes, связь теста с production component.

## Considered Options
| Вариант | Сильная сторона | Цена/ограничение |
|---|---|---|
| Pure production views + offline literal model, выбран | Точный исходный layout без HTTP override | Static render не доказывает интерактивность |
| Seed/fixture route внутри Next | Удобен для browser test | Тестовая поверхность попадает в приложение и создаёт ложный runtime proof |
| Копия prototype HTML в test | Простая zero-diff сверка | Код production может разойтись; сравнивается чужая реализация |
| Сохранить original border и в live UI | Нет различий палитры | Контраст1.35:1 не проходит oracle; владелец выбрал контрастнее |

## Decision
BrandingView/CollectView принимают явную view-model, production container строит её
из настоящих settings/state. Offline test renderer импортирует эти же components и
передаёт frozen literal data; artifact создаётся вне приложения и временно обслуживается
loopback server. Он не копирует cabinet.js markup. Static fixture не hydrated.
Владелец 2026-11-12 ответил «выбери контрастнее»; authority —
`evidence/design/owner-decision.json`. Production containers всегда передают generic
explicit palette props существующих view-model: fieldBorder #8e806b, прежние fieldFill
#f7f4eb/cardSurface #fffdf8. Offline literal model передаёт original border #ddd3c2
тому же component/CSS. Palette — presentation data, не isFixture/route switch/новый
пользовательский control. Толщина/геометрия не меняются; frozen artifacts неизменны.
Обычные Next routes, session, real isolated PostgreSQL/storage и browser E2E отдельно
доказывают Save/reload/submit. Никаких env/query/header switches в production route.
Все frozen v3 PNG/JSON/assets остаются read-only; thresholds strict zero, mutations
font/margin/color обязаны ломать сравнение. Новые UI states не объявлять accepted goldens.
Live models используют единую explicit validation без fixture-specific switches:
noValidate, name.trim().length 2–80, role raw.length≤120 до blank→null, text raw.length
10–2000. Native raw name maxlength80 отклонён как несовместимый с raw82/trim80 valid case.
Raw accepted значения сохраняются, text10spaces допустим. Test browser + HTTP201/400
проверяет exact persisted values и отсутствие upload/quota при rejection.
Доступность проверяется на live routes/Shadow DOM, отдельно от frozen idle PNG:
accentFill/onAccent/accentText различаются, computed fg/bg oracle проверяет heading
и button независимо. label-for/id, describedby/errors, busy/status/summary focus и
keyboard flow проверяются во всех states; ручной screen-reader evidence обязателен.
320/360/390 live reflow обеих themes с предельными длинными строками проверяет полный
контент и доступность controls без overflow/clipping. Input внутренний scroll допустим.
Альтернатива «достаточно frozen mobile screenshot» отклонена: он не покрывает новые
данные/состояния/темы, contrast либо assistive announcements. Goldens не обновляются.
Live field border #8e806b имеет расчётные ratios3.5035/3.7903 к fill/card. Все необходимые
границы/focus ≥3 к фактическому соседнему фону; text≥4.5/large≥3; wall/widget в обеих
темах. Computed border compositing oracle и mutation→original #ddd3c2 проверяются
отдельно от frozen proof. Шесть zero-diff кадров доказывают component/layout с original
palette, не pixel-identity live UI: различие рамок явно одобрено. Accessibility origin
проверяет эту delta; manual screen-reader acceptance — на test copy, не production.

## Rationale
Два слоя evidence измеряют разные свойства и не подменяют друг друга. SubmitForm
сохраняет настоящие fetch/FormData/preview lifecycle, pure view только выводит состояние.

## Consequences
Плюс: дизайн проверяет production разметку; live functional tests не зависят от демо.
Минус: два набора моделей; drift ловится import/DOM contract и live E2E.
Follow-up не требуется; after-action через месяц после приёмки, owner — UI/QE координатор.

## Confirmation
- Method: offline same-component render и browser workflow в изолированной копии.
- Load-bearing property: изменение production layout обнаруживается, fixture недоступна в Next.
- Required automated check: `production views render frozen models offline` в
  `apps/web/tests/branding-collect-visual-fixture.test.ts`; `branding collect real flows`
  в `tools/visual/branding-collect.e2e.test.mjs`.
- В том же E2E: `collect preserves padded names and raw role text boundaries`,
  `branding contrast covers accent text and accent fill`,
  `forms expose labels errors statuses and managed focus`,
  `live forms and widget reflow without truncation`. Oracles/negative mutations
  закреплены в NFR-201/FR-205 и architecture, а не выводятся из screenshot resemblance.
- `live forms use owner approved field borders` в `tools/visual/branding-collect.e2e.test.mjs`
  измеряет computed boundary/fill/card и ловит возврат runtime palette к #ddd3c2;
  offline test по-прежнему требует original palette и неизменные шесть goldens.
- Monitoring: local visual gate + mutation reports; success metric: 6 zero-diff cases,
  все три мутации обнаружены, live flow assertions не заменены static output.
- Owner: автор реализует, независимый cross-model QE проверяет.
