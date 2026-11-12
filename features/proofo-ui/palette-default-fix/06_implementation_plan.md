# План S: исправление дефолта Proofo

Inputs read: AGENTS.md, CLAUDE.md, docs/development/workflow.md,
docs/acceptance/core-cjm.md, docs/model-matrix.md, docs/review-policy.md,
.agents/skills/feature-adr/SKILL.md, .agents/agentic-qe/PROOFWALL-INTEGRATION.md,
branding-collect requirements/дельта и текущее устройство reader/widget/forms.

## Goal state
Новый проект без сохранённого акцента выглядит в согласованной палитре;
валидный сохранённый accent не изменяется. План реализации дан владельцем.
Переиспользуем readBranding, applyWidgetBranding, существующий CSS и QA runner;
новые production modules/exports не создаются. Архитектура и хранилище прежние.

## Tasks / Dependency order
- [ ] FR-301: добавить ранний E2E `new project uses agreed default palette before customization` в tools/visual/branding-collect.e2e.test.mjs: ordinary registration, NULL/missing stored accent, computed CSS branding input/button/heading/mark, collect heading/button, wall/config; без injection. По возможности red до правки.
- [ ] FR-301, FR-302: заменить fallback только в apps/web/src/lib/branding.ts, apps/widget/src/render.ts, apps/widget/src/styles.ts; обновить существующие ожидания apps/web/tests/branding.test.ts и apps/widget/tests/widget-branding.test.ts.
- [ ] FR-303: browser `saved custom accents including purple survive reload` через обычный PATCH/save и reload; сохранить существующие validators и contrast rules. В конце восстановить отсутствие accent только у своего synthetic проекта для следующих tests.
- [ ] FR-301, FR-302, FR-303: focused branding/readers unit, полная web suite один раз, widget full suite, web/widget typecheck, widget build и настоящий Next build через QA runner; затем полный E2E с Chrome148 и существующий offline six-frame visual proof. Все runtime проверки под одним flock .secrets/branding-qe-runtime.lock, PG33186/app33187/S3loopback.
- [ ] FR-301, FR-302, FR-303: публичный focused report с FR → spec → source → checks, хешами source/logs/командами/exits; private handoff .secrets/palette-fix-author-handoff.json; process/admission и anti-drift. Передать независимое Astra review координатору.

## Parallel groups / checkpoints
Последовательно: план → настоящий K1 reuse paths → настоящий K2 --tier=S
--require-requirements → implementing/receipt null admission → test/code → проверки.
Независимое ревью и receipt не входят в авторский verdict. Полный fleet не нужен S-tier.

## Risk assessment
Основной риск: fixture скрывает runtime default; regression исполняет настоящие
routes до любой кастомизации. Второй риск: перезаписать намеренный purple;
проверяем сохранённые #6701ef и #123456. БД меняется только synthetic QA account.
Baseline не обновляется, old landing globals.css не меняется.

## Amendments
AM-1 (владелец): вернуть согласованный default, устранить fixture-vs-live пробел. Confirmation: обычный новый проект → test `new project uses agreed default palette before customization` in `tools/visual/branding-collect.e2e.test.mjs` (fails if reverted).
AM-2 (владелец): сохранить explicit purple. Confirmation: сохранение и reload → test `saved custom accents including purple survive reload` in `tools/visual/branding-collect.e2e.test.mjs` (fails if reverted).

EXPECTED_CODE_TARGETS:
- apps/web/src/lib/branding.ts
- apps/widget/src/render.ts
- apps/widget/src/styles.ts
- apps/web/tests/branding.test.ts
- apps/widget/tests/widget-branding.test.ts
- tools/visual/branding-collect.e2e.test.mjs
