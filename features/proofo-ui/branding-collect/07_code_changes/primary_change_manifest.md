# Branding + collect — изменения PRIMARY автора

Автор: gpt-6.1-sol/high, thread `01a1cc8d-9a7a-79a0-98ae-8bf830ab3d6f`. Авторская реализация и проверки; независимое QE и поставка не объявляются.

## Собственные 25 targets

- `apps/web/src/lib/branding.ts`
- `apps/web/src/lib/project-branding.ts`
- `apps/web/src/app/api/projects/[slug]/branding/route.ts`
- `apps/web/src/app/dashboard/[slug]/branding/page.tsx`
- `apps/web/src/app/dashboard/[slug]/branding/branding-editor.tsx`
- `apps/web/src/app/f/[slug]/page.tsx`
- `apps/web/src/app/f/[slug]/submit-form.tsx`
- `apps/web/src/app/f/[slug]/intake-tabs.tsx`
- `apps/web/src/lib/wall.ts`
- `apps/web/src/app/w/[slug]/page.tsx`
- `apps/web/src/lib/widget-config.ts`
- `apps/widget/src/types.ts`
- `apps/widget/src/index.ts`
- `apps/widget/src/render.ts`
- `apps/widget/src/styles.ts`
- `apps/web/tests/branding.test.ts`
- `apps/web/tests/project-branding.test.ts`
- `apps/web/tests/wall.test.ts`
- `apps/web/tests/widget-config.test.ts`
- `apps/widget/tests/widget-branding.test.ts`
- `tools/visual/branding-collect.e2e.test.mjs`
- `apps/web/tests/branding-collect-schema.test.ts`
- `apps/web/tests/branding-collect-mutation.mjs`
- `apps/web/src/app/dashboard/[slug]/page.tsx`
- `scripts/run-branding-collect-preview.mjs`

Пять UI targets принадлежат другому автору; PRIMARY их не редактировал. Текущие SHA-256 всех 30 и результаты команд — в `../evidence/author/verification-summary.json`. Новых SQL migrations: 0.

## FR → spec → код → проверка

Нормативная дельта: `openspec/changes/proofo-branding-collect/specs/branding-collect/spec.md`, SHA-256 `2e9966d6e9eb55e24b992ede14761eb086ce64ecf181ca208bf5d969c359cc75`.

| Требования | Реализация | Авторское доказательство |
|---|---|---|
| FR-201/202/209 | branding validator, owner repository, GET/PATCH, editor | Real PG role/GUC на page/read/locked SELECT/UPDATE; atomic dirty merge, refusal/rollback; source mutants |
| FR-203/204 | wall/widget readers, Shadow DOM render | Same newest50/stable ID tests; provenance/screenshot/badge E2E |
| FR-205/206/207 | SubmitForm/IntakeTabs, production form page | Raw/trim corpus, local SDK PUT/GET bytes,503/retry,201-only success, blob cleanup/cancel race |
| FR-208 | Pure views/offline renderer другого UI автора | Source-bound6 zero-diff +18 visual mutants;29 frozen files verified |
| FR-210 | Ссылка из проекта и owned branding page | Ordinary login→project→branding→back; foreign/inactive/expired refusals |
| NFR-201 | Contrast roles, approved live border, focus/status/error relations |13 browser tests;40 computed color contexts;320/360/390 reflow; DOM negative probes |
| NFR-202/203 | Compatible DTO/defaults, private QA runner |957 web +39 widget tests;3 live skips; unsafe config before spawn, schema/legacy/rollback |

## Проверки и ограничения

Build/typecheck web+widget,63 process tests,12 source mutants и13 E2E прошли. V8 production18 files:940/944 lines,99.58%; каждый executable file≥90%. Widget gzip3513B≤30KiB. Raw artifacts остаются в `.secrets/`; там же `.secrets/branding-author-handoff.json`.

State/host/journals/vendor/baselines и receipts не менялись автором. Lint scripts для web/widget отсутствуют. Manual screen-reader, owner acceptance и независимый QE — следующие действия root/владельца. Production-поставка не выполнялась.
