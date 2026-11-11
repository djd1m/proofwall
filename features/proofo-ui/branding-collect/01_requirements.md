# Branding + collect — требования

Статус: proposed L scope; пользователь одобрил последовательность dashboard → branding
→ collect и full-QE. Это не объявление готовности UI или допуска к коду.

## Участники

Владелец проекта редактирует оформление; посетитель пишет отзыв без регистрации;
читатель видит approved отзывы на стене/внешнем widget. Владелец продукта принимает
конкретный test-артефакт; независимый QE проверяет другую модель и текущий SHA.

## Нормативный источник и SHA-256

Будущая активная дельта: `openspec/changes/proofo-branding-collect/specs/branding-collect/spec.md`.
На время dashboard QE она сохранена как черновик:
`features/proofo-ui/branding-collect/openspec-draft/specs/branding-collect/spec.md`.
SHA-256 черновика: `2cc357bb74a152b9b9dfded29e71b3fd50b78ee1163b2a49b9b146be9a804bdb`.
Перенос в OpenSpec выполняет координатор после dashboard review; байты и hash сверяются.
До переноса/валидации эта привязка является входом планирования, не активной authority.

## Функциональные требования и mapping

Все требования MUST; буквальные Given/When/Then находятся в указанной дельте.
Идентификатор и requirement title ниже однозначно определяют соответствующий блок.

| ID | Requirement title | Проверяемые сценарии | Задача |
|---|---|---|---|
| FR-201 | Canonical owner branding | Сохранение и повторное чтение; Атомарный отказ валидации | TASK-2, TASK-3 |
| FR-202 | Observable branding effects | Значение действует после reload | TASK-2, TASK-4, TASK-5 |
| FR-203 | Stable selected-set ordering | Одинаковые времена и граница выдачи | TASK-4 |
| FR-204 | Optional platform names with preserved provenance | Метки выключены на бесплатном проекте | TASK-4 |
| FR-205 | Existing text and photo collection | Фото с текстом проходят существующий pipeline; Неверные поля или содержимое файла | TASK-6 |
| FR-206 | Honest submission and media states | Storage failure и повтор; Публикация после модерации | TASK-6, TASK-8 |
| FR-207 | Truthful production controls | Text-only runtime | TASK-5, TASK-6 |
| FR-208 | Frozen same-component visual evidence | Изменение геометрии обнаруживается | TASK-7 |
| FR-209 | Tenant and request boundary | Permission negative | TASK-3, TASK-8 |
| NFR-201 | Accessible and bounded rendering | Крайние цвета | TASK-4, TASK-5, TASK-6, TASK-8 |
| NFR-202 | Compatibility and honest evidence | Схема и rollback | TASK-1, TASK-8, TASK-9 |

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
Default accent не меняется на prototype red глобально; offline fixture получает literal red.

## Границы

В scope: owner writer, реальные читатели, Proofo layout, text/image/role validation,
pending/success/errors/retry/a11y, локальная migration/permission regression.
Вне scope: rating field/sort, OCR/STT/платежи/тарифные числа, новые стенды/production,
изменение dashboard, logo uploader, согласия с версиями/withdrawal endpoint,
новая confidentiality-модель media и exactly-once повтор после потери network response.

Checkbox взят из frozen `resources/cabinet.js`, checked: «Показывать метки площадок
(«Avito», «Проверить на Яндекс.Картах»)». Новая дельта меняет только представление
исторического FR-PROOF-001: false → «Перенесённый отзыв» + «Первоисточник»/снимок.
Данные, действительная площадка, owner moderation, demo/transcript labels и badge сохраняются.

## Конкретная production delta относительно макета

Убрать rating option и video-first/тарифные обещания; текст → 10–2000, имя → 2–80,
роль →120; фото действительно читается/отправляется; demo notices исчезают.
Видео скрыто при существующем false flag. Disclosure: «Текст публикуется без изменений
после проверки владельцем»; не заявлять собственный механизм отзыва согласия.
Этот список нужен для отдельной проверки живых текстов; frozen fixture остаётся точным.
Success/error/loading/dirty и тёмное состояние требуют своих доказательств,
не объявляются утверждёнными исходными initial-idle PNG.

## Admission и открытые вопросы

До реализации: QCSD и независимая проверка semantics source labels/legacy URL,
K1 всех новых имён, K2 по актуальным inputs, подтверждённый native hook/runtime.
Изменение approved layout не разрешает перерисовывать frozen baseline.
Доступность фото по ключу — подтверждённый контракт, не новая доказанная уязвимость;
если требуется иная privacy policy, нужен отдельный FR/cache/migration scope.
