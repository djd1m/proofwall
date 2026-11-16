# Project cabinet — SPARC-GOAP implementation plan

Статус: design rework по13 independent QCSD origins; **не допущен к product code**. Owner design approval и независимая верификация исправлений pending. Inputs read: 00_complexity_assessment, 01_requirements, 02_research, 03_adr, 03.5_ideation_report, 04_domain_model, 05_architecture, design-adaptation, Direct code-goal-planner и shift-left-testing. Original capture прочитан; никаких K1/K2/GO или успешных тестов не заявлено.

## Goal state
Current: real project loader и семь capability components, legacy purple presentation; original macro empty и содержит fake backend/paid states. Goal: approved adapted Proofo cabinet с сохранением capabilities, scoped actual palette, documented immutable original geometry и ordinary persisted live proof. Coverage текущего slice ещё не измерена. Goal completion — reviewable isolated artifact + независимое QE; production deployment вне scope.

## Tasks

- TASK-1 — Specification, FR-309, NFR-303, ADR-003. Зафиксировать precode design approval точного static proposal `preview/` + его hash/URL, включая filled/control states и visual comparison boundaries. Direct QCSD шестью actual roles, закрыть formal findings и обновить spec SHA. Только затем K1/K2/native plan admission. Original candidate уже `evidence/original-project-reference/capture.json`; source snapshot и старый9case manifest неизменны. Done: реальные decisions/gates, не выдуманные receipts. Depends: none. A13 — `branding QA runner refuses unsafe configuration` в `apps/web/tests/branding-collect-schema.test.ts` уже existing, reuse allowlist test перед QA runtime.
- TASK-2 — Architecture/refinement, FR-301, NFR-302, ADR-001. Создать `apps/web/src/lib/project-cabinet.ts` и `apps/web/tests/project-cabinet.test.ts`; extraction existing read-only queries, одна withAccount transaction, explicit deactivated=false, branding.name без mutation, items/installs. Page оставляет currentAccountId redirect/notFound. A1 — `project cabinet loader enforces owner role and active scope`: active/foreign/missing/inactive, actual SELECT current_user/GUC; withService/remove active predicate mutant падает. Done: no new API/schema; raw branded name и slug fallback корректны. Depends: TASK-1.
- TASK-3 — Architecture/refinement, FR-302, FR-305, FR-308, NFR-301, ADR-001, ADR-002. Создать `project-cabinet-view.tsx`, `project-cabinet.css`; page компонует production view и actual modules. Реальные title/effective tier, persistent recovery, allowlisted notice, first steps #import/#reviews/#show, immediate URLs/snippet/branding/collect, actual ShareCta. A2/A6/A8/A10/A11 — tests `ordinary persisted project cabinet renders without fixture overrides`, `project cabinet exposes links before first review`, `live project cabinet keeps terracotta chrome and custom public branding` в `tools/visual/project-cabinet.e2e.test.mjs`. Done: ordinary login→overview→project, no fake endpoint/metrics, cabinet colors fixed while public custom persists. Existing `apps/web/tests/dashboard-onboarding.test.ts` stays green with its persistent recovery contract. Depends: TASK-2.
- TASK-4 — Refinement, FR-303, FR-304, NFR-301, NFR-302, ADR-001, ADR-002. Создать `project-cabinet-intake.tsx` для двух real methods; изменить class/semantics existing ImportForm, PlatformForm, ModerationList. Все existing request payloads/server rules unchanged. Draft input сохраняется при switching; busy/error recovery; screen-reader names and live status. A3/A4/A5 — `project cabinet preserves intake moderation and provenance` и `project cabinet reports failed uploads and conflicting moderation` в `tools/visual/project-cabinet.e2e.test.mjs`. Screenshot-only+URL/text, CSV accepted/rejected preview/commit/dedupe, all8 allowed transitions, full escaped payload/source/photo/video/transcript; upload503/HTTP400/429/network fail without false success. Done: reload matches persisted state, approved public wall/widget correct, hidden/rejected absent. Depends: TASK-3.
- TASK-5 — Refinement, FR-306, FR-307, FR-305, ADR-001, ADR-002. Purposeful class/semantics updates BillingBlock/N3Status/ShareCta/ChangePassword; preserve request_key retry/canceled/new-purchase, effective tariff, N3 all existing states, explicit share and proof action. Password disclose/cancel clears secrets without changing other drafts; all old sessions revoked and browser cookie reissued. A7/A8/A9 — `project cabinet retains account recovery billing password and share` в `tools/visual/project-cabinet.e2e.test.mjs`. Local transport fixtures for checkout/N3 clearly labelled; real password endpoint synthetic account, no actual mail/payment. Done: cancel no side effect; failed operations stay errors. Depends: TASK-3.
- TASK-6 — Refinement, FR-309, NFR-302, ADR-003. Создать `capture-project-cabinet-reference.mjs`, `check-project-cabinet-visual.mjs`, `scripts/project-cabinet-reference.test.mjs`; freeze standalone project-v1 manifest from already captured original bytes, no recapture/old manifest update. Capture helpers readNoFollow/assertFreshFile/writeNew reused. Manifest binds original resource SHA, environment, viewport, full image/DOM and preapproved invariant-region coordinates/selectors. A12 — `project reference refuses overwrite symlinks and altered source` и `project visual gate rejects font spacing and color drift`. Done: baseline immutable, missing/altered inputs refused; three negative mutations genuinely red, full original unmasked. Depends: TASK-1, can execute alongside TASK-2 only after gates.
- TASK-7 — Refinement, FR-309, ADR-003. `scripts/render-project-cabinet-fixture.mjs` imports ProjectCabinetView; `apps/web/tests/project-cabinet-visual-fixture.test.ts` verifies `project cabinet fixture imports production view without runtime bypass`. Same original literal model for shared primitives, declared semantic slots boundary; no copy cabinet.js markup, test fixture route, env/header auth branch. A12 — invariant shell/header/title/onboarding strict zero at3viewports; full adaptation images separately labelled, not full-page identity. Done: reviewer can trace rendered code to production import; mutate production layout→red. Depends: TASK-3, TASK-6.
- TASK-8 — Completion, FR-301, FR-302, FR-303, FR-304, FR-305, FR-306, FR-307, FR-308, FR-309, NFR-301, NFR-302, NFR-303, ADR-001, ADR-002, ADR-003. Execute ordinary live `tools/visual/project-cabinet.e2e.test.mjs` and `apps/web/tests/project-cabinet-mutation.mjs` through the dedicated project runner specified by TASK-QA, with one shared lifecycle lock. A1/A2/A3/A4/A5/A6/A7/A8/A9/A10/A11/A12/A13 all covered by task-owned tests/oracles. `project cabinet controls remain accessible with long content`: widths320/360/390/1440, real default/custom persisted projects, contrast compositing, tab/focus/labels/status/errors, no page overflow/clipping, strict CSP; second origin33189 widget with real built bundle and escaped XSS. Done: red mutants then restored green, ordinary HTTP and no fixture override; safe local adapters named. Depends: TASK-4, TASK-5, TASK-7.
- TASK-9 — Completion, NFR-302, NFR-303. Run applicable local unit/integration/typecheck/lint/build, process checks, Direct Step8 plus Step9 requirements/risk/integration/regression/coverage, fresh cross-model review and anti-drift FR→spec→code→evidence. Record actual SHA/model/session/results/skips; static screen does not count live. Done: all high findings resolved and exact artifact ready for manual test-copy acceptance. No GitHub CI or production. Depends: TASK-8.

- TASK-QA — Refinement, FR-309, NFR-303, ADR-003, A13. После TASK-1 создать `scripts/run-project-cabinet-qa.mjs`, `tools/visual/project-cabinet-node-egress-guard.mjs`, `tools/visual/project-cabinet-browser-egress.mjs`, `apps/web/tests/project-cabinet-qa-runtime.test.mjs` по точной границе05. Existing branding runner используется только как env helper: его e2e dispatch не запускает project suite. Exact127.0.0.1 ports33186/33187/33188/33189, закрытые e2e/mutation/all modes, actual suite realpath+SHA+exit receipt. `project QA runner refuses wrong ports lock and suite` и `project QA boundary records and refuses synthetic egress` проверяют pre-spawn отказ и наблюдаемые Node/browser synthetic attempts до реального network effect. Один владелец flock: root запускает новый runner БЕЗ внешнего flock; если root уже держит lock, сначала завершает свой lock lifecycle, не блокируется повторно. Runner lock охватывает spawn→tests→teardown; занятый lock fail-closed. Гарантия только контролируемые Node JS transports/guarded children и browser-context application traffic, не kernel firewall. Ненаблюдаемый транспорт — unresolved/failure соответствующего scenario. Done: guard ack, negative probes, suite identity и teardown доказаны. Depends: TASK-1; TASK-8 additionally depends TASK-QA.

## Dependency order / parallel groups
TASK-1 → {TASK-2,TASK-6,TASK-QA} → TASK-3 → {TASK-4,TASK-5,TASK-7} → TASK-8 → TASK-9. TASK-4/5 share CSS: one source author owns it, no concurrent writes. Architectural docs author distinct from Sol code author; fresh review per model matrix. Parallel groups are implementation ordering, not evidence of actual agent execution.

## Names and K1 inventory
New modules/exports before creation: `project-cabinet` / `readOwnedProjectCabinet,ProjectCabinetData`; `project-cabinet-view` / `ProjectCabinetView,ProjectCabinetModel`; `project-cabinet-intake` / `ProjectCabinetIntake`; `capture-project-cabinet-reference` / `captureProjectCabinetReference`; `check-project-cabinet-visual` / `compareProjectCabinetRegions`; renderer/test/mutation new basenames listed in targets. Export inventory may be reduced before admission, never expanded silently. Existing framework default/page and current components not declared globally FREE. Exact canonical path checks for bracket routes required; name-check source sweep must establish domain export availability (exit2 inconclusive, exit1 rename). Coordinator runs actual K1 after owner decision, then K2 with tierL/require-requirements.

New K1 inventory additionally: run-project-cabinet-qa / assertProjectCabinetQaConfig,runProjectCabinetSuite; project-cabinet-node-egress-guard / installProjectCabinetNodeGuard; project-cabinet-browser-egress / attachProjectCabinetBrowserGuard; project-cabinet-qa-runtime.test basename. Actual gate still not-run.

## Checkpoints
CP0 design approval of exact proposal bytes + independent Direct QCSD/native prepare; currently pending. CP1 exact K1 + `node .agents/skills/feature-adr/scripts/check-plan-completeness.mjs features/proofo-ui/project-cabinet --tier=L --require-requirements` + cross-model plan validation + native source admission; currently not-run. CP2 loader/RLS red→green. CP3 component composition and reference evidence. CP4 live real flows/negative mutations. CP5 independent QE/test-copy manual acceptance. Code cannot start on plan skeleton, missing owner decision, stale old receipt, or nonzero gate.

## Verification inventory and exact oracles
Reuse existing `apps/web/tests/csv-import.test.ts`, `csv-import-route.test.ts`, `platform-proof.test.ts`, `moderation.test.ts`, `tariff.test.ts`, `n3-checkout.test.ts`, `n3-billing.test.ts`, `n3-proof.test.ts`, `n3-payment.test.ts`, `password-change.test.ts`, `password-change-argon2.test.ts`, `password-change-route.test.ts`, `share-cta-guard.test.ts`, `dashboard-onboarding.test.ts`, `project-branding.test.ts`, `wall.test.ts`, `widget-config.test.ts`, `urls.test.ts` where present. Existing test inventory verifies original backend contracts; don't rewrite tests to mirror new markup. Build artifact/live tests required independently.
Live default/custom color oracle: absent branding and explicitly saved arbitrary valid accent both render product accent rgb(200,73,47), field boundary rgb(142,128,107); custom public values unchanged in DB/collect/wall/widget. Hover/focus/shadows must not inherit purple. text≥4.5:1, large≥3, necessary boundaries/focus≥3 using composed actual background.
Long corpus:120+ nonbreaking project name, longest persisted author/text/role/source URL,255filename,long servererror; scrollWidth≤clientWidth+1; no ellipsis/clamp/hidden clipped content; input internal scroll allowed. All8 ALLOWED_TRANSITIONS exercised through UI or existing integration plus one UI transition per source/media state. Exact full text preserved and literal XSS appears without execution in cabinet/wall/foreign widget.
RLS refusal mutation checks actual statement role/GUC, not wrapper source string. Upload error oracle checks no inserted testimonial/success state; source-only screenshot remains previewable. Billing tests use local response fixture and do not claim provider integration; password mutation uses actual local endpoint/session persistence. No skipped provider test labelled pass.

## Risk assessment / fallback
Critical: tenant leakage/XSS/provider escape; High: capability loss/fixture camouflage/default palette; Medium: responsiveness/status focus. Mitigations mapped TASK-2/4/8, TASK-3/6/7, TASK-5/8. Failure returns to exact owning task. No fallback to fake OCR, dropped components, changed baseline tolerance or reference mode. Estimated24code/test/tool files, bounded L; 4–8h author+QE indicative, not elapsed claim/SLA. No new dependencies/migrations.

## Amendments
Авторские design corrections, не независимое closure и не результаты тестов. Детальные contracts —05 иADR003. TASK-2 выполняет AM-5/9, TASK-3 AM-4/13, TASK-4 AM-1/7/8/11/12, TASK-5 AM-10 и moderation/password focus, TASK-QA AM-2/3/6; TASK-8 проверяет все.

AM-1 (QCSQ-01): Сохранить clipboard paste и отдельный file picker, screenshot-only, bytes в retry multipart. Confirmation: заявленная граница → test `project cabinet preserves pasted and selected screenshots across methods and retries` in `tools/visual/project-cabinet.e2e.test.mjs` (fails if reverted).

AM-2 (QCRISK-01-egress-boundary): Scoped Node/browser guard и refusal audit; не OS-wide гарантия. Confirmation: заявленная граница → test `project QA boundary records and refuses synthetic egress` in `apps/web/tests/project-cabinet-qa-runtime.test.mjs` (fails if reverted).

AM-3 (QCRISK-02-project-runner): Новый exact-port target-aware runner, один lifecycle flock, suite hash/exit. Confirmation: заявленная граница → test `project QA runner refuses wrong ports lock and suite` in `apps/web/tests/project-cabinet-qa-runtime.test.mjs` (fails if reverted).

AM-4 (TST-01): Explicit full reload после intake/install, item+badge after moderation, changed props reconcile; drafts boundary объявлен. Confirmation: заявленная граница → test `project cabinet refresh reconciles items counts and installs` in `tools/visual/project-cabinet.e2e.test.mjs` (fails if reverted).

AM-5 (TST-02): Каждое из3SQL failure идёт в generic boundary, не404/empty; true-empty200 и retry. Confirmation: заявленная граница → test `project cabinet read failures do not become empty or not found` in `apps/web/tests/project-cabinet.test.ts` (fails if reverted).

AM-6 (TST-03): Реальные synthetic transport attempts отдельно от config guard, unknown coverage не pass. Confirmation: заявленная граница → test `project QA boundary records and refuses synthetic egress` in `apps/web/tests/project-cabinet-qa-runtime.test.mjs` (fails if reverted).

AM-7 (A11Y-01): Mounted tabs Tab/arrows/Home/End и focus после moderation/cancel по05. Confirmation: заявленная граница → test `project cabinet keyboard tabs preserve drafts and focus` in `tools/visual/project-cabinet.e2e.test.mjs` (fails if reverted).

AM-8 (A11Y-02): Field error relations, busy/live result, DOM/ARIA-tree и отдельный manual AT record. Confirmation: заявленная граница → test `project cabinet fields announce validation busy errors and retry` in `tools/visual/project-cabinet.e2e.test.mjs` (fails if reverted).

AM-9 (QCSEC-01-http-denial): Ordinary persisted A/B HTTP status/body: anonymous redirect; foreign/missing/inactive404 безprojectdata. Confirmation: заявленная граница → test `project cabinet HTTP denies anonymous foreign missing and inactive access` in `tools/visual/project-cabinet.e2e.test.mjs` (fails if reverted).

AM-10 (QCSEC-02-password-cancel-inflight): Pre-submit cancel clears/POST0; in-flight cancel disabled до реального response/reissued cookie. Confirmation: заявленная граница → test `project cabinet password cancel respects in-flight mutation` in `tools/visual/project-cabinet.e2e.test.mjs` (fails if reverted).

AM-11 (UX-01): Preview exact csv+mapping snapshot; любое изменение invalidates commit; stale generation ignored. Confirmation: заявленная граница → test `project cabinet binds CSV commit to the successful preview` in `tools/visual/project-cabinet.e2e.test.mjs` (fails if reverted).

AM-12 (UX-02): Mounted manual File/fields и CSV/mapping/preview через switching/error/retry, only-own-success clear. Confirmation: заявленная граница → test `project cabinet preserves all intake draft fields on recoverable failure` in `tools/visual/project-cabinet.e2e.test.mjs` (fails if reverted).

AM-13 (UX-03): ADR003 exact pending owner bytes иO0–O2/A0–A7 regions/3viewport/oracles; no fabricated approval. Confirmation: заявленная граница → test `project cabinet matches approved adaptation regions` in `tools/visual/project-cabinet.e2e.test.mjs` (fails if reverted).

TST-02 дополнительно тот же named oracle в `tools/visual/project-cabinet.e2e.test.mjs` проверяет ordinary HTTP error boundary/неpartial, DB faults и restore. A11Y-01 дополнительно `project cabinet moderation and password retain keyboard focus` там же. Все tests planned; отсутствующий manual AT record = unverified.

EXPECTED_CODE_TARGETS:
- apps/web/src/lib/project-cabinet.ts
- apps/web/src/app/dashboard/[slug]/page.tsx
- apps/web/src/app/dashboard/[slug]/project-cabinet-view.tsx
- apps/web/src/app/dashboard/[slug]/project-cabinet-intake.tsx
- apps/web/src/app/dashboard/[slug]/project-cabinet.css
- apps/web/src/app/dashboard/[slug]/import-form.tsx
- apps/web/src/app/dashboard/[slug]/platform-form.tsx
- apps/web/src/app/dashboard/[slug]/moderation-list.tsx
- apps/web/src/app/dashboard/[slug]/billing-block.tsx
- apps/web/src/app/dashboard/[slug]/n3-status.tsx
- apps/web/src/app/dashboard/[slug]/share-cta.tsx
- apps/web/src/app/dashboard/[slug]/change-password.tsx
- apps/web/tests/project-cabinet.test.ts
- apps/web/tests/project-cabinet-visual-fixture.test.ts
- apps/web/tests/project-cabinet-mutation.mjs
- tools/visual/project-cabinet.e2e.test.mjs
- scripts/render-project-cabinet-fixture.mjs
- scripts/capture-project-cabinet-reference.mjs
- scripts/check-project-cabinet-visual.mjs
- scripts/project-cabinet-reference.test.mjs
- scripts/run-project-cabinet-qa.mjs
- tools/visual/project-cabinet-node-egress-guard.mjs
- tools/visual/project-cabinet-browser-egress.mjs
- apps/web/tests/project-cabinet-qa-runtime.test.mjs
