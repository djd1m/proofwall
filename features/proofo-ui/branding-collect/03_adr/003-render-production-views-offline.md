# ADR-003: Сравнивать frozen с offline render production views

## Status
proposed; пересмотреть только при новом owner-approved baseline. FR-205…FR-208, NFR-202.

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

## Decision
BrandingView/CollectView принимают явную view-model, production container строит её
из настоящих settings/state. Offline test renderer импортирует эти же components и
передаёт frozen literal data; artifact создаётся вне приложения и временно обслуживается
loopback server. Он не копирует cabinet.js markup. Static fixture не hydrated.
Обычные Next routes, session, real isolated PostgreSQL/storage и browser E2E отдельно
доказывают Save/reload/submit. Никаких env/query/header switches в production route.
Все frozen v3 PNG/JSON/assets остаются read-only; thresholds strict zero, mutations
font/margin/color обязаны ломать сравнение. Новые UI states не объявлять accepted goldens.

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
- Monitoring: local visual gate + mutation reports; success metric: 6 zero-diff cases,
  все три мутации обнаружены, live flow assertions не заменены static output.
- Owner: автор реализует, независимый cross-model QE проверяет.
