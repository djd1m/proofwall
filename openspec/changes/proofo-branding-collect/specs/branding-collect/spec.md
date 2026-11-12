## ADDED Requirements

### Requirement: FR-201 Canonical owner branding
Система MUST предоставлять owner-only GET/PATCH оформления активного проекта. PATCH MUST валидировать весь dirty-key payload и атомарно объединять известные поля JSONB, сохраняя несвязанные данные; ответ success допускается только после commit.

#### Scenario: Сохранение и повторное чтение
- **GIVEN** владелец активного проекта и валидный partial patch
- **WHEN** PATCH завершается и GET/страница повторно загружаются
- **THEN** все переданные поля совпадают, непереданные поля и branding.name сохранены
- **AND** Система MUST читать и сохранять оформление активного проекта через owner-only `GET/PATCH /api/projects/[slug]/branding`.
- **AND** PATCH допускает только изменённые известные ключи `theme`, `review_order`, `show_platform_labels`, `accent_color`, `logo_url`, `heading`.
- **AND** Операция MUST атомарно merge JSONB, сохранять `branding.name`/другие существующие ключи, возвращать канонический Branding только после commit и не менять тариф/владельца/noindex.
- **AND** Существующий non-object branding JSON MUST давать PATCH 409 без перезаписи; чтение может показывать безопасные defaults до отдельного восстановления данных.

#### Scenario: Атомарный отказ валидации
- **GIVEN** неизвестное поле, массив/null, пустой patch, invalid enum/HEX/URL или heading >120
- **WHEN** владелец отправляет PATCH
- **THEN** API возвращает 400 с ошибками полей и не сохраняет ни одного поля

#### Scenario: Редактирование заблокировано во время Save
- **GIVEN** dirty branding editor и задержанный ответ PATCH
- **WHEN** владелец нажимает Save и пытается менять любую настройку до ответа
- **THEN** все шесть settings, включая оба color input, и Save disabled; draft и отправленный payload неизменны, второй PATCH не отправляется
- **AND** при 200 применяется canonical response, поля снова доступны, success подтверждает только этот snapshot; при отказе поля доступны с прежним draft и ошибкой

#### Scenario: Две вкладки сохраняют dirty keys
- **GIVEN** две вкладки одного owned проекта с одинаковыми начальными данными
- **WHEN** они сохраняют разные dirty keys, затем обе перезагружаются
- **THEN** оба изменения сохранены, name и остальные keys не потеряны
- **AND** для одного key тест управляет порядком commit: последнее committed значение видно после reload обеих вкладок; optimistic locking не обещается

### Requirement: FR-202 Observable branding effects
Branding MUST применять валидированные настройки на обещанных поверхностях. Defaults и совместимость legacy значений MUST сохраняться; новый ввод проверяется до SQL, без молчаливого изменения текста. Unrelated dirty-key Save MUST работать при неизменённом legacy HTTP logo.

#### Scenario: Значение действует после reload
- **GIVEN** владелец меняет dark, accent, logo и heading
- **WHEN** публичная форма, стена и виджет заново запрашиваются
- **THEN** каждое поле действует на указанных поверхностях; arbitrary CSS/JS не исполняется
- **AND** `theme` MUST быть `light|dark` (default light); `review_order` — `newest|oldest` (default newest); `show_platform_labels` — boolean (default true).
- **AND** HEX MUST быть `#RRGGBB`; отсутствующий/невалидный legacy accent читается как `#6701ef`.
- **AND** Heading MUST иметь 1–120 UTF-16 units после проверки непустоты без изменения текста.
- **AND** Новые string values MUST отвергаться 400 при NUL или непарном UTF-16 surrogate до SQL; запрещено молча менять текст для сохранения в PostgreSQL JSONB.
- **AND** Новый logo URL MUST быть absolute HTTPS без credentials, ≤2048 units; пусто/null удаляет.
- **AND** Legacy HTTP logo MUST продолжать читаться до явного редактирования; partial PATCH другого поля не должен молча очищать его.
- **AND** Изменение HTTP logo отклоняется с объяснением.
- **AND** Browser form validation MUST не блокировать unrelated dirty-key Save из-за неизменённого legacy HTTP logo; клиент проверяет новые значения изменённых полей, API сохраняет authority.
- **AND** Тема MUST менять wall/widget, accent — form/wall/widget, logo — form/wall, heading — form.
- **AND** Widget не обязан показывать logo/heading; подписи контрола MUST назвать эти поверхности.

#### Scenario: Legacy HTTP logo не блокирует сохранение темы в браузере
- **GIVEN** branding editor показывает существующий HTTP logo и текущую light theme
- **WHEN** владелец меняет только тему на dark и нажимает Save
- **THEN** браузер отправляет PATCH без logo_url, theme действует после reload, исходный HTTP logo сохранён без fake success

#### Scenario: Новое HTTP logo отклоняется
- **GIVEN** открытый branding editor
- **WHEN** владелец меняет logo_url на другой HTTP URL и сохраняет
- **THEN** поле получает понятную HTTPS-ошибку, серверный bypass также даёт 400, сохранённое logo не меняется

### Requirement: FR-203 Stable selected-set ordering
Стена MUST сортировать все approved текущего проекта по `created_at,id`, newest DESC
или oldest ASC. Widget MUST сначала выбрать последние 50 по `created_at DESC,id DESC`,
затем переставить именно этот набор по настройке. Число 50 — технический лимит, не тариф.

#### Scenario: Одинаковые времена и граница выдачи
- **GIVEN** 51 approved с одинаковыми created_at, pending и записи другого проекта
- **WHEN** порядок переключается newest → oldest
- **THEN** widget сохраняет те же 50 id, выдаёт обратный устойчивый порядок и не раскрывает чужие/pending

### Requirement: FR-204 Optional platform names with preserved provenance
Checkbox видимости названия площадки MUST реально работать на wall/widget, сохраняя нейтральный provenance, исходные данные, доказательства и неизменный текст. Proofwall badge, demo disclaimer и machine-transcript label MUST оставаться независимыми от настройки.

#### Scenario: Метки выключены на бесплатном проекте
- **GIVEN** platform testimonial и free либо expired-paid проект
- **WHEN** show_platform_labels=false сохраняется и обе публичные поверхности перезагружаются
- **THEN** название площадки исчезает, нейтральный provenance/доказательство остаются, server badge остаётся
- **AND** Согласованный checked по умолчанию checkbox «Показывать метки площадок» MUST работать.
- **AND** При true wall/widget показывают существующую platform-specific подпись; при false убирают название площадки и её decorative label, сохраняя нейтральную отметку «Перенесённый отзыв» и ссылку «Первоисточник», когда она существует, либо снимок.
- **AND** Исходные `source`, `source_platform`, `source_url`, screenshot и owner moderation MUST оставаться неизменными.
- **AND** Это уточняет presentation исторического FR-PROOF-001.
- **AND** Proofwall badge, demo disclaimer и machine-transcript label MUST не скрываться этим полем.
- **AND** Текст/выдержка отзыва MUST не переписываться и не сокращаться при переключении меток; существующий screenshot MUST оставаться доступным независимо от наличия source URL.

### Requirement: FR-205 Existing text and photo collection
Публичный collect MUST использовать существующий JSON/multipart POST. UI и HTTP
MUST проверять одинаковую UTF-16 length: name.trim() 2–80, raw role ≤120, raw text
10–2000. Имя/текст/непустая роль сохраняются исходными; blank role после проверки длины
становится null. Фото MUST пройти JPEG/PNG/WebP MIME+signature и 5 MiB до upload/квоты.

#### Scenario: Фото с текстом проходят существующий pipeline
- **GIVEN** активный slug, валидные поля и JPEG/PNG/WebP ≤5 MiB
- **WHEN** посетитель отправляет multipart форму
- **THEN** 201 содержит public_id, запись pending и testimonial_created; фото хранится существующим private bucket pipeline

#### Scenario: Неверные поля или содержимое файла
- **GIVEN** name.trim().length 1/81, raw role.length 121, raw text.length 9/2001 либо SVG/spoof MIME/>5 MiB
- **WHEN** запрос обходит клиентскую проверку
- **THEN** сервер отказывает 400 без нового testimonial и upload; UI показывает ошибку и сохраняет ввод

#### Scenario: Padded имя одинаково принимается UI и HTTP
- **GIVEN** имя из пробела, 80 букв и пробела: raw length 82, trim length 80
- **WHEN** обычный browser submit и отдельный прямой HTTP submit проходят проверку
- **THEN** каждый отвечает 201 и сохраняет точные исходные 82 units; raw maxlength/minlength не препятствует вводу и не обрезает значение
- **AND** trim length 1 и 81 дают связанную client error без fetch; HTTP bypass даёт 400 без testimonial/upload/списания квоты; исходный draft сохранён

#### Scenario: Роль и текст не получают неявный trim
- **GIVEN** raw role length 120 с краевыми пробелами, затем 120 или 121 пробел; raw text length 9, 10, 2000 либо 2001
- **WHEN** UI и прямой HTTP применяют одинаковые проверки без native truncation
- **THEN** непустая role120 сохраняется исходной; 120 пробелов превращаются в null, 121 пробел даёт отказ до blank-normalization
- **AND** text10 и text2000, включая 10 пробелов, принимаются и сохраняются исходными; text9/text2001 отклоняются, counter считает raw UTF-16 units

### Requirement: FR-206 Honest submission and media states
Collect MUST показывать правдивые sending/success/error состояния, сохранять ввод при отказе и освобождать preview URL. Success допускается только после 201. Существующий key-based photo contract MUST сохраняться; новая privacy или exactly-once гарантия не вводится.

#### Scenario: Storage failure и повтор
- **GIVEN** реальный storage adapter в изолированном тесте возвращает ошибку
- **WHEN** submit отвечает 503
- **THEN** сервер отзывает квоту, UI не показывает успех и позволяет повторить сохранённый ввод
- **AND** UI MUST различать idle/sending/201-success/error; success только после 201 и с пояснением о проверке владельцем.
- **AND** Во время отправки повторный click блокируется.
- **AND** При 400/404/429/503/network failure текст/имя/роль/выбранный файл MUST сохраняться; повтор разрешён после завершения запроса.
- **AND** Неопределённый network outcome MUST не обещать exactly-once: после потери ответа повтор может создать новую запись.
- **AND** Фото preview MUST освобождать object URL при смене/remove/unmount.
- **AND** `/api/photo/[...key]` сохраняет действующий key-based contract: format guard, sniff, nosniff, CSP sandbox, immutable; approved-only относится к спискам wall/widget.
- **AND** Новая гарантия приватности pending-медиа/отзыва доступа по URL не вводится.

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
Visual evidence MUST сравнивать frozen v3 с offline render тех же production view components и original literal palette во всех трёх размерах. Baseline MUST оставаться неизменным. Обычные routes MUST использовать owner-approved live palette и отдельный E2E без HTTP seed/override; frozen proof не доказывает интерактивность либо полное pixel-сходство live UI.

#### Scenario: Изменение геометрии обнаруживается
- **GIVEN** неизменный frozen v3 и offline fixture production components
- **WHEN** font, margin 3px или color мутируются в ephemeral test context
- **THEN** нулевой pixel-diff gate падает, baseline не обновляется, production UX проверяется отдельным E2E
- **AND** Initial fixture MUST использовать те же production view components, передавая literal frozen model только из test renderer вне Next HTTP routes.
- **AND** Generic explicit palette props MUST передаваться через обычные view-model: live branding/collect всегда fieldBorder #8e806b, offline literal model original #ddd3c2; isFixture, fixture mode и auth/seed override запрещены
- **AND** Шесть frozen zero-diff кадров доказывают component/layout на эталонных данных с original palette; live runtime имеет одобренное владельцем 2026-11-12 отличие рамок и отдельный computed border oracle
- **AND** Он воспроизводит исходный макет и не доказывает поддержку его текста/опций в production.
- **AND** Копия cabinet.js или самописная тестовая HTML-верстка не заменяет production component.
- **AND** Frozen v3 MUST остаться неизменным; сравнение branding/collect идёт в 1440×900, 390×844, 360×800, DPR1 и остальных параметрах manifest.
- **AND** Реальные UI/UX состояния MUST проверяться отдельно на обычных маршрутах; HTTP seed/fixture override запрещён.

### Requirement: FR-209 Tenant and request boundary
Owner read/write MUST исполняться с действующей session, withAccount/RLS и tenant GUC. PATCH MUST проверять origin, тип/размер тела и payload до write transaction. Permission/DB failures MUST откатываться без false success. Тесты MUST наблюдать контекст фактических SELECT/UPDATE.

#### Scenario: Permission negative
- **GIVEN** чужая сессия либо у test DB роли отозван UPDATE projects
- **WHEN** выполняется PATCH
- **THEN** нет изменения или канонического success; foreign получает 404, DB fault — 503
- **AND** Owner GET/PATCH MUST получить account только из действующей session; анонимный, expired/revoked →401 до чтения тела.
- **AND** Чужой/неизвестный/deactivated slug → одинаковый 404 без branded data; owner операции только withAccount/RLS.
- **AND** PATCH MUST требовать Origin равный каноническому baseUrl origin, не cross-site Sec-Fetch-Site, JSON Content-Type и readBodyAtMost ≤4096 bytes до JSON.parse/write-транзакции.
- **AND** Ошибки 403/415/413.
- **AND** Denied UPDATE или DB failure MUST откатиться и дать non-success без утечки тела/секретов.
- **AND** Тест MUST наблюдать current_user=app_authenticated и app.current_account_id=owner на том же client/transaction в момент фактического owner SELECT/UPDATE; helper probe отдельно от проверяемого statement не является доказательством tenant execution.

#### Scenario: Роль фактического чтения и записи
- **GIVEN** обычная owner session и instrumented isolated PostgreSQL client
- **WHEN** owner GET/page читает branding и PATCH выполняет UPDATE
- **THEN** оба фактических statement выполняются как app_authenticated с owner GUC, а замена на withService обнаруживается тестом

### Requirement: FR-210 Reachable owner branding navigation
Existing project page MUST предоставлять доступную ссылку «Оформление стены» на owned branding page с возвратом в тот же проект. Existing collect/wall links сохраняются; branding page MUST самостоятельно проверять ownership и active status.

#### Scenario: Переход из обычного проекта
- **GIVEN** владелец вошёл обычным login и открыл свой активный проект
- **WHEN** он клавиатурой открывает «Оформление стены» и возвращается в проект
- **THEN** открывается owned branding page, обратная ссылка ведёт в тот же проект, Save/reload работает
- **AND** Существующая страница `/dashboard/[slug]` MUST содержать доступную keyboard-ссылку «Оформление стены» на `/dashboard/[slug]/branding`, построенную из server-resolved owned slug.
- **AND** Branding page MUST возвращать ссылкой в тот же проект.
- **AND** Переходы не требуют ручного ввода URL и не меняют права доступа.
- **AND** Existing collect/wall links сохраняются.
- **AND** Новый branding page MUST проверять активность проекта самостоятельно; наличие ссылки на существующей project page не заменяет tenant/active check на целевом маршруте.

#### Scenario: Подмена ссылки не даёт доступ
- **GIVEN** owner A и slug проекта B либо inactive проекта
- **WHEN** адрес ссылки заменён на branding URL этого проекта
- **THEN** branding page/API не раскрывают его данные и отказывают по tenant/active contract

### Requirement: NFR-201 Accessible and bounded rendering
UI MUST иметь label, keyboard focus, accessible errors/status и focus при success/error;
проверки контраста MUST покрывать light/dark и крайние допустимые HEX. Цвета текста
MUST давать ≥4.5:1 (крупный ≥3:1), необходимые границы/focus ≥3:1 к фактическому соседнему фону.
Widget MUST сохранять Shadow DOM, host isolation, server badge и ≤30KB gzip.

#### Scenario: Крайние цвета
- **GIVEN** accent #FFFFFF, #000000, #F8F8F8, #181818 либо #777777 в light/dark project settings
- **WHEN** форма, стена и widget рендерятся
- **THEN** computed foreground/background после alpha compositing дают обычному тексту ≥4.5:1, крупному ≥3:1, всем необходимым control boundaries/indicators и focus ≥3:1 к соседнему цвету
- **AND** accentFill остаётся исходным HEX; onAccent выбирает контрастный black/white для текста на нём, а accentText отдельно сохраняет HEX только при ≥4.5:1 к конкретному surface, иначе использует контрастный neutral ink
- **AND** heading/link на card и текст кнопки на accent измеряются отдельно; raw-white heading на white card обязан провалить oracle даже при доступной кнопке; focus использует независимые контрастные внутренний/внешний контуры
- **AND** collect остаётся на своей светлой поверхности при обоих project theme values; wall/widget проверяются в обеих темах, persisted accent не переписывается

#### Scenario: Одобренные границы полей
- **GIVEN** решение владельца 2026-11-12 «выбери контрастнее» в evidence/design/owner-decision.json и обычные branding/collect routes
- **WHEN** production containers передают live palette тем же production view components
- **THEN** field border #8e806b заменяет #ddd3c2 при прежней толщине/геометрии/fill; расчётный ratio к #f7f4eb равен3.5035:1, к card #fffdf8 равен3.7903:1
- **AND** отдельный browser oracle измеряет фактические computed border/fill/card после compositing для input/textarea/select/color и необходимой photo field boundary в idle/error/focus; все необходимые границы/focus ≥3:1, wall/widget проверяются в обеих темах
- **AND** отрицательная мутация live palette обратно к #ddd3c2 MUST провалить этот oracle; passing frozen screenshots с original palette не компенсируют live failure
- **AND** frozen reference не меняется; owner decision не является QCSD closure, implementation admission, product/AT pass либо production acceptance

#### Scenario: Доступные состояния и legacy ошибка
- **GIVEN** обычные branding/collect routes с label-for/id у всех inputs, включая file, color picker и HEX, и связанными hints
- **WHEN** пользователь проходит Tab/Shift+Tab/Enter/Space через idle, pending, field/global error и подтверждённый success
- **THEN** pending объявляется role=status/aria-live=polite, form aria-busy=true, focus переводится в видимый status вне disabled fieldset; повторная отправка и редактирование заблокированы
- **AND** ошибка сохраняет draft, разблокирует поля, фокусирует видимую summary role=alert/tabindex=-1; invalid fields имеют aria-invalid и aria-describedby на актуальное сообщение, summary links переводят фокус в поле
- **AND** success только после 200 PATCH/201 collect фокусирует видимый status/thanks tabindex=-1 с доступным объявлением; Tab продолжает обычную навигацию без trap
- **AND** unchanged HTTP logo допускает keyboard theme Save без ошибки; edited HTTP даёт связанную с logo HTTPS-ошибку и summary focus без записи
- **AND** browser проверяет accessibility tree/имена/отношения/focus и rejects удалённое сообщение или связь; реальный screen reader проверяется при owner acceptance опубликованной test copy, отсутствие такого прогона не считается pass либо production acceptance

#### Scenario: Длинные значения и reflow
- **GIVEN** production routes и отдельный widget host шириной 320, 360 и 390 CSS px; обе project themes; heading120, padded name82, role120, text2000, filename255, длинная error и HTTPS logo/source URL2048
- **WHEN** непрерывные строки вводятся/рендерятся, ошибки и keyboard focus показываются
- **THEN** document.scrollWidth не превышает clientWidth более чем на 1px; текст карточек/heading/provenance/filename/error переносится без clipping/ellipsis/line-clamp и совпадает с исходным
- **AND** inputs сохраняют полный value, URL доступен Home/End/selection через внутренний scroll без расширения документа; все controls и focused element видимы после обычного vertical scroll
- **AND** widget host/root проверяются отдельно, включая long testimonial и provenance; overflow/clipping mutation обязана ломать oracle, frozen goldens не обновляются

### Requirement: NFR-202 Compatibility and honest evidence
Typed branding/DTO extension MUST сохранять legacy совместимость без новой SQL migration.
Изолированные migration/rollback/permission tests MUST доказывать совместимость.
Новые PATCH/UI и собственные QA runner logs MUST исключать пользовательские payloads
и секреты; существующий photo GET logging не меняется. Gates требуют отдельных evidence.

#### Scenario: Схема и rollback
- **GIVEN** отдельная БД, созданная имеющимися миграциями, и legacy branding
- **WHEN** новый writer обновляет один ключ, затем старый reader читает запись
- **THEN** существующие поля/name/permissions сохранены; rollback не требует data rewrite
- **AND** Изолированная проверка MUST применять существующие SQL migrations и доказывать, что новый Branding работает с legacy `{}`, неизвестными ключами и старым reader после rollback; новая SQL migration не вводится без отдельной причины/изменения плана.
- **AND** Typed расширение MUST быть additive: существующий трёхпольный Branding value остаётся валидным input для прежних form/video consumers; canonical reader возвращает defaults новых полей.
- **AND** Widget DTO получает optional typed branding, missing/malformed значения нормализуются безопасно; старый response без branding продолжает рендериться.
- **AND** Только новые PATCH/UI logs и записи, создаваемые самим QA runner/test recorder, MUST не содержать отзыв, logo URL, cookie/token, photo key или тело PATCH; assertions могут проверять bytes/keys в памяти без их вывода
- **AND** Существующие photo GET error logs и inherited child output не входят в новый logging contract; raw legacy unit output отдельно помечается synthetic и может содержать synthetic photo keys, этот route остаётся вне 30 targets
- **AND** Новые QA summaries используют whitelist status/hash/count; real credentials/payloads недопустимы в любом QA output, отсутствие ключей во всех raw framework logs не обещано
- **AND** QCSD/K1/K2, independent cross-model QE и product tests MUST иметь собственные evidence; прочитанные навыки, static fixture и структура документов не являются их closure.

#### Scenario: Старые типизированные данные и DTO
- **GIVEN** существующий Branding из heading/accent_color/logo_url и widget response без branding
- **WHEN** новые consumers и typecheck используют эти значения
- **THEN** нет обязательного массового изменения трёхпольных literals, light/newest/labels-on defaults действуют

### Requirement: NFR-203 Isolated QA media execution
QA MUST запускаться отдельным allowlist runner с private env, выделенными loopback PostgreSQL/app/S3 и synthetic credentials. Product photo SDK MUST проверяться настоящим локальным upload/read. Stable dashboard и внешние сервисы не затрагиваются; unsafe config MUST отклоняться до spawn.

#### Scenario: Настоящий photo путь в изолированной копии
- **GIVEN** отдельный private QA env, выделенный loopback PostgreSQL и synthetic local S3
- **WHEN** runner запускает обычный Next app и browser отправляет фото
- **THEN** product SDK выполняет upload/read локально, GET photo возвращает прежние bytes, реальная почта/STT/оплата не вызываются
- **AND** E2E setup создаёт только собственные local S3/Next процессы, finally закрывает их даже при partial setup failure; stable preview не останавливается
- **AND** Новый `scripts/run-branding-collect-preview.mjs` MUST использовать только отдельный private QA env и отдельные loopback app/PG/S3 ресурсы; PostgreSQL database name MUST быть proofwall_ui_test.
- **AND** Тот же database name без выделенного экземпляра/endpoint не доказывает изоляцию от работающего stable dashboard preview.
- **AND** Child env MUST строиться allowlist, а не копией inherited env.
- **AND** S3 endpoint — literal loopback HTTP с path-style; access/secret — фиксированные synthetic QA sentinel values, bucket — отдельный QA bucket.
- **AND** Runtime mail/STT/payment credentials MUST отсутствовать, video intake MUST быть false.
- **AND** Symlink/non-private env, external endpoint configurations, unknown S3 credentials и snapshot-update flags MUST отклоняться до spawn.
- **AND** Local S3 test service MUST не выдавать redirects/proxy на внешние endpoints; QA evidence MUST фиксировать локальные SDK requests и отсутствие внешних обращений.
- **AND** Runner MUST не создавать/удалять БД, не менять stable artifact/process/ports и не печатать env values.
- **AND** Product SDK upload/read MUST идти в локальный S3-compatible test service; HTTP tests не могут выдавать fetch mock за full photo pipeline.

#### Scenario: Небезопасный QA config
- **GIVEN** внешний S3/DB, неизвестные credentials, inherited secret либо symlink/public-readable env
- **WHEN** runner валидирует config и формирует child env
- **THEN** небезопасный config отклоняется до spawn, inherited secret не передаётся, stable preview остаётся нетронутым
