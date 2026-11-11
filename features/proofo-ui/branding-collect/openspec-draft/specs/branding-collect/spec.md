## ADDED Requirements

### Requirement: FR-201 Canonical owner branding
Система MUST читать и сохранять оформление активного проекта через owner-only
`GET/PATCH /api/projects/[slug]/branding`. PATCH допускает только изменённые известные
ключи `theme`, `review_order`, `show_platform_labels`, `accent_color`, `logo_url`, `heading`.
Операция MUST атомарно merge JSONB, сохранять `branding.name`/другие существующие ключи,
возвращать канонический Branding только после commit и не менять тариф/владельца/noindex.
Существующий non-object branding JSON MUST давать PATCH 409 без перезаписи; чтение
может показывать безопасные defaults до отдельного восстановления данных.

#### Scenario: Сохранение и повторное чтение
- **GIVEN** владелец активного проекта и валидный partial patch
- **WHEN** PATCH завершается и GET/страница повторно загружаются
- **THEN** все переданные поля совпадают, непереданные поля и branding.name сохранены

#### Scenario: Атомарный отказ валидации
- **GIVEN** неизвестное поле, массив/null, пустой patch, invalid enum/HEX/URL или heading >120
- **WHEN** владелец отправляет PATCH
- **THEN** API возвращает 400 с ошибками полей и не сохраняет ни одного поля

### Requirement: FR-202 Observable branding effects
`theme` MUST быть `light|dark` (default light); `review_order` — `newest|oldest`
(default newest); `show_platform_labels` — boolean (default true). HEX MUST быть
`#RRGGBB`; отсутствующий/невалидный legacy accent читается как `#6701ef`.
Heading MUST иметь 1–120 UTF-16 units после проверки непустоты без изменения текста.
Новый logo URL MUST быть absolute HTTPS без credentials, ≤2048 units; пусто/null удаляет.
Legacy HTTP logo MUST продолжать читаться до явного редактирования; partial PATCH
другого поля не должен молча очищать его. Изменение HTTP logo отклоняется с объяснением.
Тема MUST менять wall/widget, accent — form/wall/widget, logo — form/wall, heading — form.
Widget не обязан показывать logo/heading; подписи контрола MUST назвать эти поверхности.

#### Scenario: Значение действует после reload
- **GIVEN** владелец меняет dark, accent, logo и heading
- **WHEN** публичная форма, стена и виджет заново запрашиваются
- **THEN** каждое поле действует на указанных поверхностях; arbitrary CSS/JS не исполняется

### Requirement: FR-203 Stable selected-set ordering
Стена MUST сортировать все approved текущего проекта по `created_at,id`, newest DESC
или oldest ASC. Widget MUST сначала выбрать последние 50 по `created_at DESC,id DESC`,
затем переставить именно этот набор по настройке. Число 50 — технический лимит, не тариф.

#### Scenario: Одинаковые времена и граница выдачи
- **GIVEN** 51 approved с одинаковыми created_at, pending и записи другого проекта
- **WHEN** порядок переключается newest → oldest
- **THEN** widget сохраняет те же 50 id, выдаёт обратный устойчивый порядок и не раскрывает чужие/pending

### Requirement: FR-204 Optional platform names with preserved provenance
Согласованный checked по умолчанию checkbox «Показывать метки площадок» MUST работать.
При true wall/widget показывают существующую platform-specific подпись; при false
убирают название площадки и её decorative label, сохраняя нейтральную отметку
«Перенесённый отзыв» и ссылку «Первоисточник», когда она существует, либо снимок.
Исходные `source`, `source_platform`, `source_url`, screenshot и owner moderation
MUST оставаться неизменными. Это уточняет presentation исторического FR-PROOF-001.
Proofwall badge, demo disclaimer и machine-transcript label MUST не скрываться этим полем.

#### Scenario: Метки выключены на бесплатном проекте
- **GIVEN** platform testimonial и free либо expired-paid проект
- **WHEN** show_platform_labels=false сохраняется и обе публичные поверхности перезагружаются
- **THEN** название площадки исчезает, нейтральный provenance/доказательство остаются, server badge остаётся

### Requirement: FR-205 Existing text and photo collection
Публичный `/f/[slug]` MUST принимать отзыв без регистрации через существующий POST
`/api/testimonials`: JSON без фото или multipart с `photo`. Имя проверяется trim 2–80,
роль ≤120 (blank → null), текст 10–2000 по исходной строке. Текст/имя/непустая роль
MUST сохраняться без переписывания. Фото MUST пройти MIME+signature JPEG/PNG/WebP и
предел 5 MiB до storage/расхода квоты. UI ограничения MUST совпадать с сервером.

#### Scenario: Фото с текстом проходят существующий pipeline
- **GIVEN** активный slug, валидные поля и JPEG/PNG/WebP ≤5 MiB
- **WHEN** посетитель отправляет multipart форму
- **THEN** 201 содержит public_id, запись pending и testimonial_created; фото хранится существующим private bucket pipeline

#### Scenario: Неверные поля или содержимое файла
- **GIVEN** name 1/81, role 121, text 9/2001 либо SVG/spoof MIME/>5 MiB
- **WHEN** запрос обходит клиентскую проверку
- **THEN** сервер отказывает 400 без нового testimonial и upload; UI показывает ошибку и сохраняет ввод

### Requirement: FR-206 Honest submission and media states
UI MUST различать idle/sending/201-success/error; success только после 201 и с
пояснением о проверке владельцем. Во время отправки повторный click блокируется.
При 400/404/429/503/network failure текст/имя/роль/выбранный файл MUST сохраняться;
повтор разрешён после завершения запроса. Неопределённый network outcome MUST не
обещать exactly-once: после потери ответа повтор может создать новую запись.
Фото preview MUST освобождать object URL при смене/remove/unmount.
`/api/photo/[...key]` сохраняет действующий key-based contract: format guard, sniff,
nosniff, CSP sandbox, immutable; approved-only относится к спискам wall/widget.
Новая гарантия приватности pending-медиа/отзыва доступа по URL не вводится.

#### Scenario: Storage failure и повтор
- **GIVEN** реальный storage adapter в изолированном тесте возвращает ошибку
- **WHEN** submit отвечает 503
- **THEN** сервер отзывает квоту, UI не показывает успех и позволяет повторить сохранённый ввод

#### Scenario: Публикация после модерации
- **GIVEN** pending text/photo и owner session
- **WHEN** владелец одобряет отзыв обычным moderation API
- **THEN** отзыв появляется только в wall/widget соответствующего проекта

### Requirement: FR-207 Truthful production controls
UI MUST сохранять согласованную компоновку с явной production delta: нет rating sort,
video-first обещания, фиктивного тарифного лимита, demo-only предупреждений или
обещания собственного механизма отзыва согласия. Disclosure MUST говорить о
неизменённом тексте и публикации после проверки, без имитации consent registry.
Видео MUST продолжать подчиняться существующему флагу; этот инкремент не включает его.
Каждый доступный сохраняемый control MUST иметь проверенный reader и реальный эффект.

#### Scenario: Text-only runtime
- **GIVEN** videoIntakeEnabled=false
- **WHEN** посетитель открывает collect
- **THEN** видео-контрола нет, обычный text/photo путь работает, флаг/STT не меняются

### Requirement: FR-208 Frozen same-component visual evidence
Initial fixture MUST использовать те же production view components, передавая literal
frozen model только из test renderer вне Next HTTP routes. Он воспроизводит исходный
макет и не доказывает поддержку его текста/опций в production. Копия cabinet.js
или самописная тестовая HTML-верстка не заменяет production component.
Frozen v3 MUST остаться неизменным; сравнение branding/collect идёт в 1440×900,
390×844, 360×800, DPR1 и остальных параметрах manifest. Реальные UI/UX состояния
MUST проверяться отдельно на обычных маршрутах; HTTP seed/fixture override запрещён.

#### Scenario: Изменение геометрии обнаруживается
- **GIVEN** неизменный frozen v3 и offline fixture production components
- **WHEN** font, margin 3px или color мутируются в ephemeral test context
- **THEN** нулевой pixel-diff gate падает, baseline не обновляется, production UX проверяется отдельным E2E

### Requirement: FR-209 Tenant and request boundary
Owner GET/PATCH MUST получить account только из действующей session; анонимный,
expired/revoked →401 до чтения тела. Чужой/неизвестный/deactivated slug → одинаковый
404 без branded data; owner операции только withAccount/RLS. PATCH MUST требовать
Origin равный каноническому baseUrl origin, не cross-site Sec-Fetch-Site, JSON
Content-Type и readBodyAtMost ≤4096 bytes до JSON.parse/транзакции. Ошибки 403/415/413.
Denied UPDATE или DB failure MUST откатиться и дать non-success без утечки тела/секретов.

#### Scenario: Permission negative
- **GIVEN** чужая сессия либо у test DB роли отозван UPDATE projects
- **WHEN** выполняется PATCH
- **THEN** нет изменения или канонического success; foreign получает 404, DB fault — 503

### Requirement: NFR-201 Accessible and bounded rendering
UI MUST иметь label, keyboard focus, accessible errors/status и focus при success/error;
проверки контраста MUST покрывать light/dark и крайние допустимые HEX. Цвета текста
выбираются безопасно, декоративный accent не делает текст нечитаемым.
Widget MUST сохранять Shadow DOM, host isolation, server badge и ≤30KB gzip.

#### Scenario: Крайние цвета
- **GIVEN** accent #FFFFFF либо #000000 в каждой теме
- **WHEN** форма, стена и widget рендерятся
- **THEN** обычный текст имеет ≥4.5:1, control/focus остаются видимыми; keyboard завершает форму

### Requirement: NFR-202 Compatibility and honest evidence
Изолированная проверка MUST применять существующие SQL migrations и доказывать, что
новый Branding работает с legacy `{}`, неизвестными ключами и старым reader после
rollback; новая SQL migration не вводится без отдельной причины/изменения плана.
Логи MUST не содержать отзыв, logo URL, cookie/token, photo key или тело PATCH.
QCSD/K1/K2, independent cross-model QE и product tests MUST иметь собственные evidence;
прочитанные навыки, static fixture и структура документов не являются их closure.

#### Scenario: Схема и rollback
- **GIVEN** отдельная БД, созданная имеющимися миграциями, и legacy branding
- **WHEN** новый writer обновляет один ключ, затем старый reader читает запись
- **THEN** существующие поля/name/permissions сохранены; rollback не требует data rewrite
