# Domain model — reuse существующих границ

Статус: плановый L artifact; новых aggregates, таблиц или migration нет.

| Context | Aggregate / данные | Владение и инвариант |
|---|---|---|
| Owned project | Project(id, account_id, slug, deactivated, branding, tier, paid_until) | currentAccountId → withAccount/RLS; active owned project only; branding.name display, не новый write API |
| Testimonial intake/moderation | Testimonial(project_id, status, author, text, transcript, media, provenance) | Pending intake; оригинальный текст не переписывается; state transition server authoritative |
| Public presentation/growth | ProjectUrls, widget_installs(project_id,domain), Share | URL authority existing; actual install unique project/domain; share только consent |
| Account capabilities | email verification, password sessions, Billing/N3 | Существующие endpoint states/permissions; UI не вычисляет entitlements и не имитирует effects |

ProjectCabinetModel — presentation projection, не новый persisted aggregate. В неё входят title, slug/links, effective tariff label, delivery notice, first steps, real counts; interactive capability modules остаются ответственными за их current client state. Public accent не является product chrome configuration.

Moderation state machine без новых transitions: pending→approved/rejected; approved→rejected/hidden; rejected→approved/hidden; hidden→approved/rejected. `ALLOWED_TRANSITIONS` остаётся authority. Конфликт409 не превращается в local success. Media/provenance сохраняются и для screenshot-only items с пустым text/name.

Onboarding остаётся тремя навигационными ссылками без completion badges. No analytics/install при просмотре snippet. Presentation snapshot обновляется только explicit full reload; UI заранее предупреждает, что drafts очищаются. После success intake — actual result+reload link, список не дополняется фиктивно. Moderation item и pending badge меняются вместе только по подтверждённому response. Install/ShareCta меняются после реального persisted install+reload. Changed serverSnapshotRevision remount только ModerationList; same revision сохраняет local state; intake остаётся mounted на том же slug. Navigation к другому slug очищает весь local state.

Нулевой список — настоящий empty, query failure — error boundary/ошибка, не пустой успех. Missing title → actual slug, missing/unknown effective tier → существующий isPaid/tierSummary free rule. Такой fallback не применяется к external origin: существующая baseUrl validation обязательна.

Client-only draft aggregates: manual(File bytes+metadata, URL/platform/name/role/text), CSV(raw bytes+mapping+preview snapshot generation); не сохраняются в localStorage/БД и не обещаются после reload. Preview validity привязана к exact csv+mapping, изменения инвалидируют commit. Successful submit очищает только свой draft; recoverable failure сохраняет bytes/fields; network outcome unknown не является failed-write доказательством.
Query-error distinct from absent: project SELECT zero rows →null/404, любой query rejection→generic inherited error boundary, ни empty success, ни404. Next streamed200 error boundary не называется успешным cabinet response. Точный ordinary HTTP и rollback/retry oracle — архитектура.
