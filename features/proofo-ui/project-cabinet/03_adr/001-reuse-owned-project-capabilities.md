# ADR-001: Сохранить существующие capability modules и owner boundary

## Status
Proposed, не code admission. Design approval и независимый QCSD pending.

## Context / Decision Drivers
Project macro содержит фиктивные OCR/link и paid states; реальный cabinet уже содержит рабочие intake/moderation/billing/N3/password/share. Главный риск — скрыть или заменить настоящие возможности ради сходства пустого макета. В текущем page query не виден explicit deactivated=false, тогда как overview и branding его используют.

## Considered Options
1. Выбран: вынести account loader в `readOwnedProjectCabinet`, сохранить withAccount/RLS и current module API, добавить явный active filter и branding.name; переоформить composition.
2. Копировать cabinet.js и дописать новые OCR/link/tiers: отвергнут, нет FR/API/наблюдённых результатов и пользовательского разрешения новых обязательств.
3. Только оболочка вокруг прежней страницы без переупорядочивания: минимальный риск, но не достигает согласуемого section/onboarding flow.

## Decision
`apps/web/src/lib/project-cabinet.ts` содержит `readOwnedProjectCabinet(accountId, slug)`: одна withAccount транзакция, explicit slug + deactivated=false query с branding и existing items/installs. Page сохраняет currentAccountId/redirect/notFound и buildProjectUrls, строит view model. Никаких withService/inferred owner/fixture overrides. Items/Install shapes продолжают принадлежать current modules; допустим type-only import. Network payloads/handlers/libs/DB schema unchanged.
Manual PlatformForm+CSV ImportForm работают в #import; ModerationList в #reviews; links/snippet, ShareCta в #show; BillingBlock+N3Status в #tariff; ChangePassword в password. Email notice+verify/reissue постоянно доступны. Import source URL — provenance, не запрос удалённой страницы. Product title читает nonempty string branding.name; malformed/array branding fallback на slug без записи/нормализации stored JSON.

## Consequences
Сохраняется security/backend semantics и снижается surface нового кода. Часть filled-state дизайна ещё нужно утвердить отдельно; presentation нельзя путать с copied source behavior. Reuse не отменяет live регрессию и все четыре status transitions.

## Confirmation
`apps/web/tests/project-cabinet.test.ts`: `project cabinet loader enforces owner role and active scope` проверяет actual executing SELECT role/GUC и foreign/inactive/absent. `tools/visual/project-cabinet.e2e.test.mjs`: `project cabinet preserves intake moderation and provenance`, `project cabinet retains account recovery billing password and share`. Negative mutations withService/remove active filter/drop recovery должны падать.
Owner: native author; независимый QE подтверждает.

## QCSD design refinement
Client API неизменен, но state contract уточнён: explicit full reload после intake/install с предупреждением о потере drafts; no fabricated local item, moderation item+pending badge atomic local update только после server success, changed serverSnapshotRevision remount list. Mounted manual/CSV drafts сохраняют File bytes/paste/raw fields и preview validity; success очищает только свой draft. CSV commit связан с exact successful preview snapshot; любое csv/mapping change инвалидирует его. SSR query failures всех3чтений идут в generic inherited error boundary, never null/empty; ordinary HTTP denial и fault/retry — самостоятельные named tests в 05/06, не loader-only.
