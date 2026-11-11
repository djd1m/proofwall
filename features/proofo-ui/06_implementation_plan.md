# План: рабочий dashboard

Дата: 2026-11-11. Tier L; Direct Mode. Автор плана — gpt-6-astra xhigh;
код — отдельный gpt-6.1-sol high; независимый review — отдельная модель/сессия.
Inputs read: `01_requirements.md`, `02_research.md`, `03_adr`, `04_domain_model.md`, `05_architecture.md`, `06_team_execution_plan.md`, `.agents/agentic-qe/agents/code-goal-planner.md`.

## Goal state: SPARC-GOAP

```yaml
goal: implement_proofo_dashboard_overview
current_state:
  existing: [session_auth, RLS, project_dashboard, effective_paid_helper, preview_dashboard]
  missing: [live_overview, honest_metrics_summary, exact_visual_comparison, dashboard_browser_e2e]
  measured_coverage_percent: null
goal_state:
  overview: all_owned_active_projects_without_single_redirect
  metrics: known_counts_and_explicit_unknowns
  billing: existing_per_project_truth
  visual: zero_pixel_diff_on_frozen_dashboard_fixture
  auth: ordinary_session_and_real_RLS
  delivery: local_test_copy_and_reviewable_evidence
  production: separately_authorized_only
sparc:
  specification: FR_001_to_010_and_OpenSpec_delta
  pseudocode: one_snapshot_SQL_aggregates_fixed_server_now
  architecture: pure_view_plus_RLS_projection
  refinement: named_unit_DB_browser_checks_and_visual_mutations
  completion: independent_QE_local_gates_and_owner_acceptance
```

Дизайн заморожен на QCSD snapshot координатора. Изменения по findings выполняются
с новой ревизией, без переиспользования старого host receipt. Имена/пути ниже —
конкретный allowlist; дополнительные файлы требуют согласованной корректировки плана
и повторного K1/K2/source admission до записи кода.

## Tasks

### TASK-1 — Закрыть admission и эталон (FR-008, FR-009, ADR-002)

SPARC: specification. Depends on: none. Owner: координатор + baseline engineer.
Завершить три обязательные QCSD core roles и применимые UI/security/UX perspectives;
проверить host convergence, а не вручную присвоить GO. Выполнить K1 для всех новых
модулей/экспортов, K2 и check-code-targets, затем build-coder-context.
Файлы: `scripts/capture-proofo-reference.mjs`, `scripts/check-proofo-visual.mjs`,
`tools/visual/package.json`, `tools/visual/package-lock.json`.
Test: canonical dashboard-v3 manifest SHA-256
`e7999b11e9fb68cf57f64323c624df5d70693d366d1d69be01a1d7e9e3101684`, 3 dashboard sizes;
tooling selfchecks, scripts/proofo-visual-paths.test.mjs (file/ancestor symlink и fresh-output refusal), refusal missing/changed baseline. Success: admission reports настоящие,
источник preview e2e2f96 неизменён; ранние captures остаются rejected diagnostics.

### TASK-2 — Реальная RLS-проекция и бизнес-состояния (FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, ADR-001)

SPARC: pseudocode → refinement. Depends on: TASK-1. Owner: автор кода.
Файл `apps/web/src/lib/dashboard-summary.ts`, экспорт `getDashboardSummary`.
Выполнить алгоритм `05_architecture.md`: single snapshot, собственные active projects,
stable order, независимые aggregates без multiplication; fixed now; isPaid; title
из branding.name со slug fallback. Typed null неизвестных метрик; ошибки не проглатывать.
Test: `apps/web/tests/dashboard-overview-db.test.ts`,
`apps/web/tests/dashboard-overview.test.ts`.
Success: 0/1/N; A/B tenants; deactivated; окно inclusive start/exclusive now;
повтор домена у двух проектов; several child rows; effective paid; XSS-like title;
успешный ноль отличается от unknown/DB failure. Total=all 4 statuses/all time,
pending=all time; пример по одному каждого статуса → 4/1. Domain activity по config
запросам не обещает текущую установку. Отдельно доказать role/GUC/rolbypassrls=false,
не-owner таблиц и unscoped negative RLS всех четырёх таблиц, включая analytics_events;
whole read model строго один data SQL statement. Risks: A1, A2, A3, A5.

### TASK-3 — Чистая разметка и scoped styling (FR-004, FR-005, FR-006, FR-008, FR-010, ADR-002)

SPARC: architecture → refinement. Depends on: TASK-1; использует DTO TASK-2.
Файлы: `apps/web/src/app/dashboard/dashboard-overview.tsx`, `dashboard.css` в той же
папке; `apps/web/public/proofo/body.woff2`, `apps/web/public/proofo/display.woff2`.
Экспорты: `DashboardOverview`, type `DashboardOverviewModel`. Только pure props,
plain text, без runtime DB/Next/env imports. Повторить actual preview DOM/CSS/fonts,
scoped wrapper `.proofo-dashboard` не ломает project page. Qualified
body:has(.proofo-dashboard) задаёт body fonts/background только dashboard.
Brand/back selflink по макету сохранён.
Test: `apps/web/tests/dashboard-overview.test.ts`; byte SHA fonts; TASK-5 visual.
Success: корректные known/unknown/empty/mixed states, no fake limits/price; keyboard
focus; no overflow в canonical desktop/mobile. Risks: A2, A3, A4, A6.

### TASK-4 — SSR route и повтор ошибки (FR-001, FR-002, FR-004, FR-007, FR-009, FR-010, ADR-001)

SPARC: refinement. Depends on: TASK-2, TASK-3.
Файлы: `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/app/dashboard/error.tsx`.
Сохранить force-dynamic/noindex/session redirect, удалить только single-project
redirect и старый list renderer. Error boundary вызывает настоящий reset; не раскрывает
raw exception. Existing `/dashboard/[slug]` не переписывать, email recovery сохраняется.
Test: `apps/web/tests/dashboard-overview.test.ts`, существующий
`apps/web/tests/dashboard-onboarding.test.ts`, TASK-6 browser.
Success: запрос без session не выдаёт data; authenticated overview не redirect;
DB failure → readable error → restore DB → retry успешно. Risks: A1, A2, A5, A7.

### TASK-5 — Изолированная fixture и exact visual (FR-008, FR-009, ADR-002)

SPARC: refinement. Depends on: TASK-3.
Файлы: `apps/web/tests/dashboard-visual-fixture.test.ts`, `scripts/render-dashboard-fixture.mjs`.
Vitest existing `.test.ts` include + React.createElement/renderToStaticMarkup рендерит
production DashboardOverview с literal data cabinet.js. Артефакт/сервер вне Next route,
localhost-only; wrapper как live; тот же globals.css перед dashboard.css;
никакого synthetic body/iframe/spacer. Server script может
получить output directory только от local runner, не из production request.
Test: `apps/web/tests/dashboard-overview.test.ts` проверяет shared view/no route override;
`scripts/check-proofo-visual.mjs --url http://127.0.0.1:<port>/dashboard.html --screen dashboard --mutations`.
Success: canonical dashboard 3 sizes = 0 changed pixels, font/margin/color mutations
каждая красная, restore зелёный без перезаписи reference. Risks: A4, A6.

### TASK-6 — Живой browser сценарий на isolated PG (FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-009, FR-010, ADR-001, ADR-002)

SPARC: completion. Depends on: TASK-2, TASK-3, TASK-4.
Файлы: `scripts/run-dashboard-preview.mjs`, `tools/visual/dashboard.e2e.test.mjs`.
Runner читает только специально созданный test env через Node util.parseEnv и передаёт
в child process без вывода значений; не загружает production .env. Root владеет isolated
PG и safe env. Обычный login/session; seed DB создаёт 0/1/N, two accounts, inactive,
paid/expired, telemetry boundaries. Не добавлять auth bypass, HTTP fixture или real mail.
Test: browser assertions desktop/mobile, keyboard, owned card → correct project,
foreign project отказ, обновление данных после reload; после успешного login
отозвать SELECT analytics_events у app_authenticated только в isolated PG, проверить
живую session через withService и summary error, восстановить GRANT в finally, затем
настоящий retry должен вернуть данные. Session-store failure проверять отдельно.
Сравнить live HTTP body computed font/background (color/image/size/position) и shell
origin/width/padding с fixture/reference. Для длинного непрерывного Unicode/multiline/
HTML-like имени проверить 360/390/1440 widths: no overflow, visible accessible name,
Tab/focus/Enter фактически открывают project. XSS и slug fallback отдельно.
Success: live actions работают; existing email notice/recovery и project widgets/links
сохранены; отсутствие секретов в reports. Risks: A1, A2, A3, A5, A6, A7.

### TASK-7 — Review, anti-drift и тестовая приёмка (FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010)

SPARC: completion. Depends on: TASK-5, TASK-6.
Локальные applicable tests/typecheck/build, process:check/process:test; независимый
cross-model review конкретного SHA; L-tier fleet traceability/risk/integration/regression.
Сверить FR→OpenSpec→code→evidence, закрыть findings и повторить изменённые проверки.
Success: нет failed/skipped/inconclusive, выданных за pass; delivery guard получает
реальные reports. Owner получает тестовую ссылку/инструкцию. Production не входит.

## Dependency order и checkpoints

TASK-1 → TASK-2 и TASK-3 → TASK-4; TASK-3 → TASK-5;
TASK-2/3/4 → TASK-6; TASK-5/6 → TASK-7. Циклов нет.
До кода: QCSD + K1 + K2 + code-targets + coder-context. После read model: DB truth.
После view: static visual. После route: real browser. Перед test delivery: independent QE.
Параллельно безопасны baseline tools и документы; после admission read-model tests и
view styling могут быть разделены по файлам. Максимум четыре реальных агента с root;
QCSD/fleet волнами организует координатор, автор не подписывает review за других.

## Risk assessment и acid bindings

| Acid | Task | Проверка отказа/защиты |
|---|---|---|
| A1 | TASK-2, TASK-6 | DB A/B не возвращает чужие карточки/aggregate; foreign route refused |
| A2 | TASK-2, TASK-4, TASK-6 | null != 0; DB outage показывает error, restore+retry работает |
| A3 | TASK-2, TASK-3 | expired/invalid paid не становится paid |
| A4 | TASK-1, TASK-5 | font/margin/color mutations fail; changed baseline refused |
| A5 | TASK-2, TASK-4 | 0/1/N без single-project redirect/fake wall cap |
| A6 | TASK-3, TASK-5, TASK-6 | нет production route/HTTP override; ordinary login обязательный |
| A7 | TASK-4, TASK-6 | existing dashboard-onboarding regression и project navigation |

Неподдерживаемую метрику оставлять unknown; не расширять scope telemetry. Недоступный
runtime/gate — BLOCKED соответствующего перехода. Отсутствие baseline — не capture
из фактической реализации. Source admission отказ — исправить inputs/targets, не guard.

## Amendments

AM-1 (координатор/проверенный schema): название хранится в branding.name, не API input project_name. Confirmation: сохраняется реальное название → test `uses stored branding name and slug fallback` in `apps/web/tests/dashboard-overview.test.ts` (fails if reverted).

AM-2 (canonical baseline решение координатора): initial reference скрывает только demo notice/tools, полный shell; fixture без spacer. Confirmation: совпадение shared wrapper → test `fixture uses the production dashboard view without a route override` in `apps/web/tests/dashboard-overview.test.ts` (fails if reverted); pixel mutation проверка обязательна отдельно.

AM-3 (координатор): не добавлять logout/new auth API; existing direct project и email recovery сохраняются. Confirmation: сохранение восстановления → test `кабинет показывает отсутствие письма и постоянный recovery link` in `apps/web/tests/dashboard-onboarding.test.ts` (fails if recovery reverted).

AM-4 (QUALITY-1): counts карточки — все четыре статуса за всё время, pending отдельно за всё время. Confirmation: 4 total/1 pending при четырёх статусах и старых rows → test `counts all statuses and pending over all time` in `apps/web/tests/dashboard-overview-db.test.ts` (fails if reverted).

AM-5 (QUALITY-2): label «Домены с активностью виджета», пояснение по config-запросам без обещания текущей установки. Confirmation: повтор пары, same domain двух стен и missing domain → test `counts observed project domain pairs without claiming installations` in `apps/web/tests/dashboard-overview-db.test.ts` (fails if reverted).

AM-6 (RISK-1): строго один data SQL statement, без multi-SELECT READ ONLY альтернативы. Confirmation: вся проекция в одной команде → test `reads the whole dashboard in one data statement` in `apps/web/tests/dashboard-overview-db.test.ts` (fails if reverted).

AM-7 (RISK-2): проверить реальную роль, GUC, отсутствие BYPASSRLS и table ownership. Confirmation: независимая database authority → test `proves role GUC and unscoped RLS for every dashboard table` in `apps/web/tests/dashboard-overview-db.test.ts` (fails if reverted).

AM-8 (TEST-1): unscoped SELECT к projects/testimonials/analytics_events/widget_installs скрывает B от A, отдельно от явных aggregate filters. Confirmation: analytics_events включена в негативный RLS тест → test `proves role GUC and unscoped RLS for every dashboard table` in `apps/web/tests/dashboard-overview-db.test.ts` (fails if reverted).

AM-9 (TEST-2): summary failure после валидной session через isolated REVOKE SELECT analytics_events; GRANT в finally и настоящий retry; session-store failure отдельно. Confirmation: summary recovery без fake empty → test `summary permission failure recovers through retry after valid login` in `tools/visual/dashboard.e2e.test.mjs` (fails if reverted).

AM-10 (TEST-3): fixture/live используют одинаковые global/dashboard CSS и wrapper, body contract проверяет HTTP SSR. Confirmation: body fonts/background и shell geometry совпадают → test `live dashboard and fixture share body styles and shell geometry` in `tools/visual/dashboard.e2e.test.mjs` (fails if reverted).

AM-11 (TEST-4): long Unicode/multiline/HTML-like live titles на 360/390/1440, no overflow и actual keyboard navigation. Confirmation: видимое имя и focus, Enter ведёт в проект → test `long Unicode titles remain visible and keyboard reachable on every viewport` in `tools/visual/dashboard.e2e.test.mjs` (fails if reverted).

## Фактические gates и границы доказательства

2026-11-11: strict OpenSpec validate exit 0, `Change 'proofo-dashboard' is valid`.
K1 dashboard-summary/getDashboardSummary и dashboard-overview/DashboardOverview/
DashboardOverviewModel — exit 0 FREE; 240 source files, 554 exports, 17 commands.
Helper не видит re-export под другим именем — это остаётся build check. Остальные новые
module names и default error export проверяет координатор до code admission.
Отклонение процесса: scripts/tools visual support inputs созданы до полного app
admission; их K1 после создания не является pre-creation проверкой. Основные новые
app module/export имена проверены FREE до app source. Это раскрыто, не переименовано
в успешный ранний gate. K2/code-targets выполняются по окончательному тексту плана; результаты отдельно в
`13_dashboard_planning_checks.md`. QCSD convergence и product checks пока не закончены.

## Намеренно одинаковые шрифты, не дополнительные цели правки

TWIN_NOT_A_TARGET: features/proofo-ui/preview/assets/body.woff2 — неизменяемый шрифт согласованного прототипа; runtime-копия public/proofo/body.woff2 должна быть побайтово идентичной по FR-008, исходный прототип не редактируется.
TWIN_NOT_A_TARGET: features/proofo-ui/preview/assets/display.woff2 — неизменяемый шрифт согласованного прототипа; runtime-копия public/proofo/display.woff2 должна быть побайтово идентичной по FR-008, исходный прототип не редактируется.
TWIN_NOT_A_TARGET: features/proofo-ui/reference/dashboard-v3/resources/assets/body.woff2 — замороженная копия того же шрифта внутри baseline-v3; это проверяемый эталон FR-008, а не runtime-цель, его байты менять запрещено.
TWIN_NOT_A_TARGET: features/proofo-ui/reference/dashboard-v3/resources/assets/display.woff2 — замороженная копия того же шрифта внутри baseline-v3; это проверяемый эталон FR-008, а не runtime-цель, его байты менять запрещено.

Повторный K2 после появления runtime-копий обнаружил эти пары (до создания файлов
пар не было). Это уточнение области C9 сохраняет все 18 целей, протоколы и baseline.

EXPECTED_CODE_TARGETS:
- apps/web/src/app/dashboard/page.tsx
- apps/web/src/app/dashboard/dashboard-overview.tsx
- apps/web/src/app/dashboard/dashboard.css
- apps/web/src/app/dashboard/error.tsx
- apps/web/src/lib/dashboard-summary.ts
- apps/web/public/proofo/body.woff2
- apps/web/public/proofo/display.woff2
- apps/web/tests/dashboard-overview.test.ts
- apps/web/tests/dashboard-overview-db.test.ts
- apps/web/tests/dashboard-visual-fixture.test.ts
- scripts/render-dashboard-fixture.mjs
- scripts/run-dashboard-preview.mjs
- scripts/capture-proofo-reference.mjs
- scripts/check-proofo-visual.mjs
- scripts/proofo-visual-paths.test.mjs
- tools/visual/package.json
- tools/visual/package-lock.json
- tools/visual/dashboard.e2e.test.mjs
