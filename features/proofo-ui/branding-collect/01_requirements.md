# Branding + collect — требования

Статус: входы для независимого QCSD, bounded L; пользователь одобрил продолжение
branding → collect после dashboard commit `4da1c64b6dcc537a412646183344dcb53645ea02`.
Это не объявление готовности UI или допуска к коду.

## Участники

Владелец проекта редактирует оформление; посетитель пишет отзыв без регистрации;
читатель видит approved отзывы на стене/внешнем widget. Владелец продукта принимает
конкретный test-артефакт; независимый QE проверяет другую модель и текущий SHA.

## Нормативный источник и SHA-256

Нормативная proposed дельта: `openspec/changes/proofo-branding-collect/specs/branding-collect/spec.md`.
Координатор перенёс прежний openspec-draft после dashboard closure; текущие уточнения
на этом пути и в FR mapping согласованы. SHA-256: `2e9966d6e9eb55e24b992ede14761eb086ce64ecf181ca208bf5d969c359cc75`.
Путь дельты установлен; admission требует отдельных QCSD/K1/K2 evidence.

## Функциональные требования и mapping

Все требования MUST; буквальные Given/When/Then находятся в указанной дельте.
Идентификатор и requirement title ниже однозначно определяют соответствующий блок.

| ID | Requirement title | Проверяемые сценарии | Задача |
|---|---|---|---|
| FR-201 | Canonical owner branding | Сохранение и повторное чтение; Атомарный отказ валидации; Редактирование заблокировано во время Save; Две вкладки сохраняют dirty keys | TASK-2, TASK-3, TASK-5 |
| FR-202 | Observable branding effects | Значение действует после reload; Legacy HTTP logo не блокирует сохранение темы в браузере; Новое HTTP logo отклоняется | TASK-2, TASK-4, TASK-5 |
| FR-203 | Stable selected-set ordering | Одинаковые времена и граница выдачи | TASK-4 |
| FR-204 | Optional platform names with preserved provenance | Метки выключены на бесплатном проекте | TASK-4 |
| FR-205 | Existing text and photo collection | Фото с текстом проходят существующий pipeline; Неверные поля или содержимое файла; Padded имя одинаково принимается UI и HTTP; Роль и текст не получают неявный trim | TASK-6 |
| FR-206 | Honest submission and media states | Storage failure и повтор; Публикация после модерации | TASK-6, TASK-8 |
| FR-207 | Truthful production controls | Text-only runtime | TASK-5, TASK-6 |
| FR-208 | Frozen same-component visual evidence | Изменение геометрии обнаруживается | TASK-7 |
| FR-209 | Tenant and request boundary | Permission negative; Роль фактического чтения и записи | TASK-3, TASK-8 |
| FR-210 | Reachable owner branding navigation | Переход из обычного проекта; Подмена ссылки не даёт доступ | TASK-5, TASK-8 |
| NFR-201 | Accessible and bounded rendering | Крайние цвета; Одобренные границы полей; Доступные состояния и legacy ошибка; Длинные значения и reflow | TASK-4, TASK-5, TASK-6, TASK-8 |
| NFR-202 | Compatibility and honest evidence | Схема и rollback; Старые типизированные данные и DTO | TASK-1, TASK-2, TASK-4, TASK-8, TASK-9 |
| NFR-203 | Isolated QA media execution | Настоящий photo путь в изолированной копии; Небезопасный QA config | TASK-1, TASK-8 |

## Контролы и реальный эффект

| Поле | Допустимое значение / default | Где действует |
|---|---|---|
| theme | light/dark, default light | Wall и widget; не тема кабинета |
| review_order | newest/oldest, default newest | Wall all approved; widget newest 50, затем sort |
| show_platform_labels | boolean, default true | Platform name visible/hidden на wall/widget; нейтральный provenance остаётся |
| accent_color | строгий #RRGGBB, legacy default #6701ef | Form/wall/widget; доступный foreground рассчитывается отдельно |
| logo_url | новый HTTPS ≤2048, пусто/null удаляет | Form/wall; сервер не скачивает URL |
| heading | непустой 1–120, без truncate при Save | Form; JSX escaping |

Клиент отправляет dirty keys. Нередактированный legacy HTTP logo не пересохраняется;
при редактировании HTTP видна ошибка HTTPS. Нет silent Save→default/truncate.
Нативный HTML pattern на unchanged legacy HTTP не должен прерывать submit до dirty-key
логики: использовать branding form noValidate + общую ручную валидацию dirty patch.
Это поведение обычного production component, без isFixture/HTTP overrides.
Default accent не меняется на prototype red глобально; offline fixture получает literal red.
Решение владельца 2026-11-12 «выбери контрастнее» записано в
`evidence/design/owner-decision.json`: обычные branding/collect forms всегда получают
palette.fieldBorder=#8e806b вместо #ddd3c2, без изменения геометрии/fill. Same production
views принимают generic explicit palette props; offline literal model получает original
palette. Это одобренное отличие живого UI, не изменение frozen reference.

## Границы

В scope: owner writer, реальные читатели, Proofo layout, text/image/role validation,
pending/success/errors/retry/a11y, локальная migration/permission regression.
Вне scope: rating field/sort, OCR/STT/платежи/тарифные числа, публичные новые стенды/production,
изменение dashboard overview/stable artifact, logo uploader, согласия с версиями/withdrawal endpoint,
новая confidentiality-модель media и exactly-once повтор после потери network response.
Единственная правка existing project page — навигационная ссылка в branding; форма/стена
сохраняют свои ссылки. Отдельный QA runner для этого worktree входит в 30 targets.
Его resources изолированы от stable dashboard даже при одинаковом имени proofwall_ui_test.

Существующий трёхпольный Branding остаётся совместимым input. Canonical reader может
возвращать расширенный ResolvedBranding; typed widget branding additive/optional.
Изменение production SQL контекста на service должно ломать тест фактического SELECT/UPDATE,
даже если explicit account WHERE по-прежнему скрывает foreign rows.

Checkbox взят из frozen `resources/cabinet.js`, checked: «Показывать метки площадок
(«Avito», «Проверить на Яндекс.Картах»)». Новая дельта меняет только представление
исторического FR-PROOF-001: false → «Перенесённый отзыв» + «Первоисточник»/снимок.
Данные, действительная площадка, owner moderation, demo/transcript labels и badge сохраняются.

## Конкретная production delta относительно макета

Убрать rating option и video-first/тарифные обещания; raw text → 10–2000,
name.trim() → 2–80, raw role →120; фото действительно отправляется; demo notices исчезают.
Видео скрыто при существующем false flag. Disclosure: «Текст публикуется без изменений
после проверки владельцем»; не заявлять собственный механизм отзыва согласия.
Этот список нужен для отдельной проверки живых текстов; frozen fixture остаётся точным.
Live field border #8e806b — ещё одно явное owner-approved отличие от макета.
Шесть frozen zero-diff кадров доказывают component/layout с эталонными данными и
original palette; они не доказывают полное pixel-сходство live runtime с исходным PNG.
Success/error/loading/dirty и тёмное состояние требуют своих доказательств,
не объявляются утверждёнными исходными initial-idle PNG.

## Конкретные исправления по шести QCSD conditions

**TESTABILITY-01.** Collect использует noValidate и явные проверки тех же формул,
что HTTP; native minLength/maxLength не должны обрезать raw name/role/text до проверки.
name проверяется по `raw.trim().length` (UTF-16 units), сохраняется raw. Пробел +80 букв
+пробел: raw82/trim80 → browser и HTTP201, БД точно raw82. trim1/81 → client error
без fetch, HTTP400 без testimonial/upload/quota; draft не теряется. Role проверяется
по raw length до blank normalization: 120 пробелов→null, 121→400; непустая raw120
с краевыми пробелами сохраняется полностью. Text10/2000, включая 10 пробелов, допустим;
text9/2001 недопустим. Counter считает raw `.length`, никакого trim/truncate на отправке.

**UX-01.** Выбрана блокировка editing, не versioned draft: после client validation
фиксируется payload и disabled fieldset со всеми шестью settings, обоими color inputs
и Save. Пока запрос pending, нельзя менять draft или посылать второй PATCH. 200
применяет canonical response и снимает dirty; failure разблокирует прежний draft.
Delayed-response browser test пытается менять все controls и проверяет payload/count.
Две вкладки: разные dirty keys переживают обе записи; один key — последнее committed
значение после reload обеих вкладок. Последующие edits разрешены только после ответа.

**ACCESSIBILITY-01.** `accentFill` — сохранённый HEX; `onAccent` — black/white с
максимальным контрастом на fill. `accentText` рассчитывается отдельно для каждого
surface: HEX при ≥4.5:1, иначе контрастный neutral ink. Все необходимые edge/focus используют
свои ≥3:1 токены, а не raw accent. Для двух соседних фонов focus имеет внутренний и
внешний контуры. Oracle берёт computed colors + ancestor alpha compositing фактических
heading/link/button/control/status/provenance/badge в form/wall/widget; обычный текст
≥4.5:1, крупный ≥3:1, необходимые control boundaries/focus ≥3:1. Значения #FFFFFF/#000000/#F8F8F8/#181818/#777777
проверяются при обоих project themes (collect при этом остаётся светлым).
Live branding/collect field borders #8e806b: расчётный ratio3.5035 к #f7f4eb и3.7903
к #fffdf8; browser oracle измеряет фактические computed border/fill/card после compositing,
включая состояния. Возврат #ddd3c2 обязан провалить отдельный live test. Остальные
необходимые границы/focus также ≥3 к фактическому соседнему фону; wall/widget — обе темы.
Original border остаётся только в offline literal palette для frozen layout proof;
isFixture, HTTP fixture/seed/auth override запрещены. Это design fix, не closure finding.

**ACCESSIBILITY-02.** Все inputs имеют label-for/id, hints — aria-describedby; оба
color input имеют разные доступные имена. Pending: aria-busy, disabled controls,
видимый role=status/aria-live=polite вне fieldset получает focus. Error: восстановить
editing, сохранить draft, focus в visible summary role=alert/tabindex=-1; field errors
связаны aria-describedby+aria-invalid и links из summary. Success200/201: focus в
visible status/thanks tabindex=-1 и объявление. Нет trap; Tab/Shift+Tab/Enter/Space
работают. Legacy unchanged HTTP→успешный theme Save; edited HTTP→связанная HTTPS error
и summary focus без write. AX-tree/focus oracle падает при удалении message/relationship;
отдельно требуется manual real screen-reader evidence при owner acceptance опубликованной
test copy, не заменённое DOM проверкой и не означающее production acceptance.

**ACCESSIBILITY-03.** Live reflow 320/360/390 CSS px, light/dark settings: heading120,
padded name82, role120, text2000, filename255, длинная error, HTTPS logo/source URL2048.
Документ и widget host/root не имеют overflow >1px; публичный текст/error/filename
переносится без clipping/ellipsis/line-clamp и совпадает с исходным. Input value полный,
Home/End/selection доступны с внутренней прокруткой поля; фокус/controls видимы после
обычного vertical scroll. Нельзя сокращать содержимое или менять goldens ради reflow.

**SECURITY-01.** Запрет sensitive payload/photo keys относится только к новым
PATCH/UI logs и собственным QA runner/test-recorder записям. Existing photo GET error
logs и inherited child output не входят в этот контракт, не меняются и не объявляются
новой vulnerability. Новый logger проверяется точечно; blanket scan всего photo
pipeline не служит oracle этого scope. Tests могут сравнивать bytes/keys в памяти без вывода.
Новые QA summaries используют whitelist status/hash/count. Передаваемый raw legacy
unit output отдельно обозначается synthetic и может содержать synthetic keys; real
credentials/payloads по-прежнему недопустимы во всём QA output.

## Admission и открытые вопросы

До реализации: QCSD и независимая проверка semantics source labels/legacy URL,
K1 всех новых имён, K2 по актуальным inputs, подтверждённый native hook/runtime.
Изменение approved layout не разрешает перерисовывать frozen baseline.
Доступность фото по ключу — подтверждённый контракт, не новая доказанная уязвимость;
если требуется иная privacy policy, нужен отдельный FR/cache/migration scope.
