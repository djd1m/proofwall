# Branding + collect — domain model

Proposed. Новые bounded contexts/сервисы не создаются.

## Контексты и язык

| Контекст | Термин | Значение/граница |
|---|---|---|
| Project ownership | Owner | account из session, никогда из PATCH |
| Project ownership | Branding | VO оформления, не billing/entitlement |
| Intake | Submission | Авторский текст/photo, pending до модерации |
| Publication | Approved set | Только approved текущего server-resolved project |
| Publication | Platform label | Настраиваемое название площадки, не source metadata |
| Publication | Provenance | Нейтральное указание переноса + доступное доказательство |
| Publication | Badge | Серверный tariff-derived Proofwall attribution, не platform label |

## Aggregates и инварианты

Project — существующий aggregate root: id/account_id/slug/deactivated/branding.
Branding VO: heading/accent_color/logo_url + theme/review_order/show_platform_labels.
Он не владеет name/tier/paid_until/noindex. PATCH меняет VO в project transaction;
последний committed patch одного key выигрывает, несвязанные keys сохраняются.

Testimonial — существующая entity, status/author/text/photo/source fields неизменны
на этом этапе. Form validation имеет серверную authority; public slug резолвится
в project_id, а все анонимные DB reads фильтруются этим id.
Submission pending и GET photo key-based — различные контракты; pending не означает
введённую этой фичей авторизацию image URL.

## Relationships и mapping

Project/Branding → supplier для FormPage, WallPage и WidgetConfigResponse.
Intake → существующая moderation → Publication. Web→widget JSON DTO является open host
contract; types расширяются совместимо, absent branding → безопасные defaults.
Новая bus/event модель не нужна; существующий testimonial_created сохраняется.

## Потоки

Owner session → tenant GET → editable draft → PATCH dirty keys → commit → canonical
response → saved → public reload. Ошибка оставляет draft, не создаёт saved state.
Visitor → client preview/validation → JSON/multipart → server validation/storage →
pending+audit → 201 thanks; owner approve → wall/widget. Network ambiguity не exactly-once.

Имена новых modules/exports перечислены в плане; K1 ещё не выполнен.
