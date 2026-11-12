## ADDED Requirements

### Requirement: PC-01 Authenticated active project shell
The system SHALL render the Proofo project cabinet at `/dashboard/[slug]` only for the authenticated owner of an active project, using the existing account transaction/RLS boundary. It SHALL display the persisted nonempty `branding.name`, falling back to the project slug, and an effective server-derived tariff.

#### Scenario: Owner opens a named project
- **GIVEN** an active owned project with a nonempty branding name
- **WHEN** the owner opens the project from the dashboard
- **THEN** the cabinet displays the full name, actual slug-linked destinations, effective tariff, and project sections

#### Scenario: Session or ownership does not grant access
- **WHEN** an anonymous request opens the route
- **THEN** it redirects to login with the encoded project return path
- **WHEN** a signed-in owner requests a foreign, absent, or deactivated project
- **THEN** the route returns unavailable/404 without project content

#### Scenario: Read failure differs from empty and denied access
- **GIVEN** an active owned project and a failure in project, testimonials, or widget_installs SQL reading
- **WHEN** the ordinary route renders
- **THEN** it exposes the generic error boundary with retry, never 404, an empty successful cabinet, or partial project data
- **AND** HTTP500 or Next streamed200 with the actual error boundary is distinguished from successful content; recovery after restoring the database rereads all data
- **WHEN** the same active project has genuinely zero testimonials and installs
- **THEN** the response is200 with the real empty cabinet
- **AND** ordinary HTTP tests independently assert login redirect for anonymous,404 with no project name/text/URLs/snippet for foreign/missing/inactive, and200 with only owned data for the owner

### Requirement: PC-02 Real onboarding and email recovery
The system SHALL retain allowlisted onboarding email delivery notices, a persistent verification/reissue link, and first-step navigation to import, reviews, and presentation sections. Step completion SHALL derive only from persisted testimonials and actual widget installations.

#### Scenario: Email delivery did not succeed
- **GIVEN** `email_delivery` is scheduled, not_configured, invalid_origin, or schedule_failed
- **WHEN** the cabinet opens
- **THEN** it shows the corresponding honest notice and `/verify-email` recovery
- **AND** unknown query values produce no invented notice or rendered markup

#### Scenario: Return visit and unfinished setup
- **WHEN** the owner returns without the email query parameter
- **THEN** verification/reissue remains reachable and first steps link to real sections
- **AND** viewing or copying the snippet alone does not claim an installation

### Requirement: PC-03 Honest existing import methods
The system SHALL keep the existing manual platform intake and CSV preview/commit workflows accessible in the import section. It SHALL describe source links/screenshots as evidence, SHALL NOT claim OCR, remote link extraction, batch image parsing, or fabricated ingestion results, and SHALL preserve existing validation, pending status, duplicate handling, and failure recovery.

#### Scenario: Manual evidence and CSV are usable
- **WHEN** the owner submits valid manual URL/text evidence or a supported screenshot
- **THEN** the existing platform endpoint creates a pending item with source provenance
- **WHEN** the owner previews then commits a valid CSV
- **THEN** preview reports accepted/rejected rows without testimonial insertion and commit reports actual inserted/skipped counts

#### Scenario: Import failure
- **WHEN** validation, upload, rate limit, network, or server processing fails
- **THEN** the UI reports the failure without success claims, preserves recoverable input, and allows a legitimate retry

#### Scenario: Mounted drafts preserve real file bytes across methods and failures
- **GIVEN** separate manual and CSV drafts including pasted or selected screenshot bytes, URL, platform, author fields, text, CSV bytes and mapping
- **WHEN** the owner switches between methods or receives400/429/known prewrite503/network failure
- **THEN** those drafts remain mounted with the same recoverable values and actual retry payload, including the screenshot bytes
- **AND** screenshot-only allows empty name/text; success clears only its submitted draft; persistence across reload is not promised
- **AND** a network failure with unknown commit outcome never claims no insertion, rollback or success and never triggers an automatic retry

#### Scenario: CSV commit is bound to its successful preview
- **GIVEN** a successful preview for exact CSV bytes and mapping
- **WHEN** either input changes
- **THEN** preview becomes invalid and commit is disabled until another successful preview
- **WHEN** commit is explicitly chosen
- **THEN** it sends the exact successful preview snapshot; pending controls are locked and stale file-read/response generations are ignored
- **AND** failed preview cannot leave an older valid preview and failures preserve recoverable draft without false success

### Requirement: PC-04 Complete moderation and provenance
The system SHALL preserve the existing pending, approved, rejected, and hidden moderation states and every allowed transition, author content, photos, screenshots, video/transcript indicators and source links. It SHALL render user content as escaped text and keep errors visible without pretending a failed state transition succeeded.

#### Scenario: Moderate a mixed content list
- **GIVEN** persisted items in all four states including manual platform evidence
- **WHEN** the owner uses allowed approve/reject/hide actions and reloads
- **THEN** the resulting persisted state matches the action and public visibility matches approved status
- **AND** screenshot/source provenance and original text remain visible where applicable

#### Scenario: Denied or failed moderation
- **WHEN** another owner, an invalid transition, a conflict, or network failure prevents a mutation
- **THEN** the existing denial/error is retained and no false successful card state is shown

#### Scenario: Persisted changes reconcile at an explicit refresh boundary
- **WHEN** manual or CSV intake succeeds
- **THEN** it displays the actual result and an explicit full-reload link explaining that counters/list update and unfinished drafts are cleared
- **AND** no fabricated item or completion state appears before reload
- **WHEN** moderation succeeds
- **THEN** the displayed item and its pending count change together; failure or409 changes neither
- **AND** changed server snapshot props replace the moderation list while same-slug intake drafts remain mounted; installation/share projection updates on explicit reload
- **AND** onboarding remains navigation without invented completion badges

### Requirement: PC-05 Immediate links and real widget code
The system SHALL expose collect, public wall, branding, and widget destinations immediately for an active project, including an empty one. It SHALL reuse the configured-origin URL/snippet authority, encode internal slug paths, and display snippet source as escaped text. Actual installation domains and explicit-consent share behavior SHALL remain available.

#### Scenario: Empty project has useful destinations
- **WHEN** the owner opens a project with zero approved testimonials
- **THEN** collect, wall, branding, and widget snippet remain available with an honest empty-state hint
- **AND** the widget source uses the real configured origin and current asset path

#### Scenario: Sharing requires explicit confirmation
- **GIVEN** a persisted external-domain installation
- **WHEN** the owner cancels the share prompt
- **THEN** no share POST or browser share side effect occurs
- **WHEN** the owner explicitly confirms
- **THEN** the existing share flow uses the actual project and installation domain

### Requirement: PC-06 Existing billing and N3 capability
The system SHALL preserve BillingBlock and N3Status contracts, effective paid/expired/free state, checkout idempotency/recovery, and truthful disabled/unconfigured states. It SHALL NOT invent Start/Pro tiers, campaigns, unlimited entitlements, payment success, or email delivery.

#### Scenario: Tariff and checkout failure
- **GIVEN** free, current paid, and expired paid projects
- **WHEN** each cabinet opens
- **THEN** displayed entitlement matches the existing server tariff calculation
- **WHEN** checkout is unconfigured, canceled, or fails
- **THEN** the UI exposes the existing recoverable result without a paid success claim

#### Scenario: N3 status and explicit action
- **WHEN** N3 is disabled
- **THEN** the existing disabled behavior remains
- **WHEN** N3 is enabled in verified, bound, pending, failed, refund_review, completed, or canceled state
- **THEN** the corresponding capability/status remains accessible and sending proof still requires its explicit action

### Requirement: PC-07 Existing password security
The system SHALL retain current/new/repeat validation and the existing password-change endpoint semantics: revoke old sessions and issue a new cookie to the current browser. A reveal/cancel presentation SHALL clear secrets on cancel and SHALL NOT imply a password change occurred.

#### Scenario: Password mismatch and successful change
- **WHEN** new/repeat values differ or the server rejects the current password
- **THEN** the form exposes the error without success and allows correction
- **WHEN** a valid synthetic account changes its password
- **THEN** old sessions are revoked and the current browser retains access via the reissued cookie

#### Scenario: Cancel does not imply rollback of an in-flight password change
- **WHEN** cancel is chosen before submit
- **THEN** secrets/errors are cleared, focus returns to the opener, and no POST occurs
- **WHEN** the password POST is pending
- **THEN** fields, submit and cancel remain disabled with an announced busy state until the actual response
- **AND** successful reissued session is preserved, errors remain recoverable, and an unknown network outcome is not labelled canceled or rolled back

### Requirement: PC-08 Scoped product presentation
The system SHALL apply the Proofo paper shell and typography with cabinet accent `#c8492f` and necessary control borders `#8e806b`, independent of project public custom branding. It SHALL preserve the custom public accent/theme and full visible user content.

#### Scenario: Default and custom branding remain distinct
- **GIVEN** one new default project and one persisted custom-accent project
- **WHEN** their ordinary authenticated cabinet routes render
- **THEN** cabinet chrome remains terracotta and computed necessary field borders use the approved contrast palette
- **AND** collect, wall, and widget retain their own resolved branding contracts

#### Scenario: Small screen and keyboard operation
- **WHEN** the cabinet renders at widths 320, 360, 390, and 1440 with long names, URLs, source text, filenames, and errors
- **THEN** content and controls remain available without horizontal page overflow or truncation
- **AND** labels, error relationships, busy/status announcements, visible focus, keyboard navigation, and contrast remain usable

#### Scenario: Keyboard, field errors and asynchronous results are explicit
- **WHEN** keyboard navigation enters the two mounted method tabs
- **THEN** selected-tab Tab order, Left/Right wrapping, Home/End, selected/controls/labelledby attributes and hidden inactive panels agree while drafts remain
- **WHEN** field validation fails
- **THEN** labelled fields expose invalid/describedby error relationships and a focused alert summary with working field links
- **WHEN** manual/CSV/moderation/password operations are pending or complete
- **THEN** busy/disabled and text/live status announce the result; moderation retains focus on the same card's available action, failure preserves the original action, and cancel returns to the password opener
- **AND** automated DOM/ARIA-tree evidence is separate from a manual real-screen-reader acceptance record; unavailable assistive technology is unverified

### Requirement: PC-09 Independent reference and live evidence
The implementation SHALL preserve the existing dashboard-v3 manifest/resources and freeze the project reference separately. Offline comparison SHALL import the same production view primitives and disclose every adaptation boundary. Ordinary authenticated E2E SHALL exercise persisted projects and actual UI/runtime defaults. No production fixture route, hidden auth bypass, copied prototype-as-product comparison, or baseline regeneration is allowed.

#### Scenario: Immutable original and sensitive comparison
- **WHEN** the separate project reference is captured before implementation
- **THEN** original resources, three viewports, hashes, environment, and capture parameters are recorded without changing old baselines
- **WHEN** font, spacing, or color of a compared production region is mutated
- **THEN** the visual gate fails and the original reference hashes remain unchanged

#### Scenario: Real runtime is independently checked
- **WHEN** live tests run with an ordinary session and persisted default/custom project data
- **THEN** effective colors, navigation, ingestion, moderation, recovery, and public widget behavior are asserted independently from offline models
- **AND** original macro-only and new filled states are not misreported as identical or owner-approved

#### Scenario: Approved adaptation has its own comparison contract
- **GIVEN** the published proposal bytes and O0–O2/A0–A7 region mapping in ADR-003
- **WHEN** the owner has not explicitly approved the exact manifest, filled/control regions and comparison scope
- **THEN** product source admission remains pending
- **WHEN** an actual decision approves those bytes and regions
- **THEN** the named live oracle compares their semantic action order and exact computed style tokens at1440x900,390x844,360x800 with at most1CSSpx geometry rounding
- **AND** full persisted empty/filled/error screenshots remain separate from original same-view zero pixel diff; unsupported dynamic states are explicitly identified

### Requirement: PC-10 Isolated verification and external side effects
All QA SHALL use dedicated synthetic data and the project-specific target-aware runner, exact endpoint checks and shared lock. It SHALL deny and record disallowed controlled Node transport/child and browser-context application requests before network effects, without claiming an OS-wide sandbox, and avoid real email, payment, STT, storage, or provider calls. Verification SHALL record actual outcomes and preserve unrelated deployed artifacts.

#### Scenario: Runtime configuration and provider boundaries
- **GIVEN** the isolated QA ports and synthetic local services
- **WHEN** E2E needs billing, N3, or upload failure behavior
- **THEN** it uses explicit local stubs or browser transport fixtures and records that limitation
- **AND** invalid/foreign runtime configuration fails before server spawn, no production migration or deployment occurs

#### Scenario: Exact suite execution and observed deny probes
- **WHEN** the project runner starts
- **THEN** it checks exact loopback roles PG33186/app33187/S3synthetic33188/foreignhost33189, holds the shared flock through teardown, and dispatches only the named project E2E or mutation suite
- **AND** wrong port, occupied lock, unknown target or missing guard acknowledgement fails before application spawn
- **WHEN** guarded Node fetch/socket/DNS, propagated child/worker, or browser fetch/navigation/WebSocket attempts a forbidden synthetic destination
- **THEN** it is refused before DNS/connect with an attributable deny record and zero connections at the local forbidden sentinel
- **AND** any unplanned denied attempt fails the ordinary scenario and run; unsupported/unobserved transport scope is explicit and cannot claim isolation success
