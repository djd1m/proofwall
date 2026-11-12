# Конкретная адаптация project screen

Статус: предложение для review, НЕ новое согласование владельца. Предыдущая команда «продолжай» разрешает следующий инкремент общего переноса; этот документ не превращает ещё не наблюдавшиеся состояния в утверждённые goldens.

Порядок листа: header/back → настоящее branding.name + effective тариф → email notice/recovery при наличии → «Первые шаги» → #import → #reviews → #show → сбор новых отзывов → #tariff + N3 → password. Shell, бумажная карточка, шрифты, границы/отступы и terracotta сохраняют macro.

| Макет | Живой кабинет | Причина |
|---|---|---|
| «Тихий берег · демо» | branding.name при непустой строке, иначе настоящий slug | Пользовательское название не теряется |
| OCR 20 картинок / поиск по ссылке / локальный paste demo | Два доступных способа: «С внешней площадки» (существующий PlatformForm) и «CSV» (ImportForm), короткий текст «Текст вводится вручную; ссылка и скриншот подтверждают источник» | Backend OCR/link scraping отсутствует; существующий intake работает |
| Пустая область reviews | Тот же empty-state + existing ModerationList при реальных данных, pending badge, status/actions/provenance | Populated reference не наблюдался; controls сохраняются полностью |
| Нет URL/snippet до одного отзыва | URL стены и код виджета доступны сразу; пустой hint «Отзывы появятся после одобрения» | Существующий FR-001 и onboarding entry point |
| «Открыть демоформу» | «Открыть форму сбора» + настоящий public URL | Живой продукт |
| Start/Pro цены/кампании | Existing BillingBlock + N3Status; точная реальная цена и статус | Новые коммерческие обязательства не разрешены |
| Demo password и утверждение «текущий останется» | Existing ChangePassword и точный текст session revoke + новая cookie | Сохранение фактической модели безопасности |
| Border #ddd3c2 | Live necessary control border #8e806b; accent #c8492f | Уже выбранный контраст/палитра; оригинальный frozen source неизменен |

Filled state proposal: вертикальный список карточек внутри #reviews; author/role/status сверху, полный testimonial text с переносом, photo/video/transcript и источник в существующих разрешённых местах, текущие действия кнопками под карточкой. Никаких новых значений статуса, рейтингов, редактирования текста или искусственно показанных отзывов. Pending first согласно текущему query. Ошибка действия остаётся рядом с item; не скрывать карточку при ошибке.

Нужное owner decision до product source writes: согласование конкретного static render этой адаптации и ранее не наблюдавшихся filled states. Нового разрешения общего scope/backend/цены здесь не просим и не предполагаем. Сейчас разрешены только static proposal/mockup и планирование с независимым QCSD. AGENTS.md требует сначала показать и согласовать конкретный UI; design approval остаётся pending. K1/K2/source admission выполняются после этого решения и закрытия применимых условий. Последующая ручная приёмка работающей тестовой копии — отдельный этап, не замена design approval. Нельзя объявлять новый filled golden accepted либо поставлять production.

Visual evidence: оригинал project-v1 неизменен. Offline renderer импортирует тот же ProjectCabinetView, что SSR. Области новых form/filled states явно исключены из утверждения pixel-identity original; они проверяются live и отдельными reviewable screenshots. Нельзя подкладывать копию cabinet.js/HTML вместо production component. Геометрия неизменённых shell/header/onboarding измеряется по original, полный offline original model допустим только через те же реальные view primitives, без fixture-specific production branch.
