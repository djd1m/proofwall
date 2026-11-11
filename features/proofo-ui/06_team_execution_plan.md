# План реализации Proofo UI/UX в Proofwall

Актуальная редакция: 11.11.2026. Этот документ заменяет предварительный публичный план.
Владелец поручил закрепить свежие full-QE skills с хуками и включить строгую визуальную
приёмку. Разрешён отдельный поток Resend по новому примеру письма. Продуктовая реализация
трёх экранов ещё не выполнена; статический макет не является работающим приложением.

## Источники и границы

- Исследование публичных экранов: 01/03; авторизованного кабинета: 07/08;
  независимые проверки: 05/09/10. Приватные данные и credentials остаются в .secrets/.
- Эталон первого UI-инкремента — опубликованный интерактивный Proofwall-макет
  `/__design/proofo/?screen=dashboard`, `branding`, `collect` на существующем sslip.io.
  Исходный Proofo служит evidence; меняющийся внешний сайт не подменяет закреплённый эталон.
- Остальные опубликованные экраны: home/login/forgot/wall/install/project/collect-video/
  empty-wall входят в следующие инкременты, каждый с собственной матрицей состояний.
- Платные и заполненные состояния Proofo не наблюдались. OCR, импорт по ссылке,
  ratings, billing/campaigns требуют самостоятельных FR/API и согласованного scope.
  Их внешний вид не даёт права выдавать неработающий backend за готовый.
- Сохраняем Next.js/npm workspaces, PostgreSQL, tenant isolation, серверный badge и
  работающую Cloud.ru S3-интеграцию. Текущий DNS/production не переключаем.

## Команда, модели, режим

| Роль | Модель / reasoning | Режим, инструменты, результат |
|---|---|---|
| Координатор/интегратор | gpt-6.1-sol / high | Разбиение, зависимости, ownership, реальные evidence, Git/npm/Compose |
| Исследователь/reuse | gpt-6.1-sol / high | Read-only код и screenshots, rg/браузер, карта API/состояний |
| Архитектор/планировщик | gpt-6-astra / xhigh | Новая сессия: FR/OpenSpec/reuse/ADR/QCSD/план, полный QE |
| Автор UI | gpt-6.1-sol / high | Изолированная ветка/worktree, перенос существующей вёрстки, React/Next/CSS |
| Автор backend/email | gpt-6.1-sol / high | Отдельный worktree, контракты/миграции/Resend, focused integration |
| Независимый QE/reviewer кода Sol | gpt-6-astra / xhigh | Новая сессия без истории автора; самостоятельно изучает SHA, код и тесты |
| Проверяющий архитектуры/плана Astra | gpt-6.1-terra / xhigh | Новая сессия, cross-model проверка решений/пробелов |
| Владелец | Человек | Фиксация эталона, решения об исключениях, ручная приёмка и разрешение production |

Максимум 4 агента одновременно с координатором; большие QCSD/fleet-роли исполняются
волнами. Reviewer получает требования/ADR/план/версию, а не историю авторских выводов.
Каждый реальный запуск фиксирует model ID, effort, task/session и SHA. Роль в таблице
не означает уже выполненный запуск; разный effort одной модели не создаёт cross-model.

## Навыки и воспроизводимость

`/feature-adr --full-qe`: 9 полных core-протоколов из agentic-qe HEAD
`98f241fc8b9d48d017cbdb63ab890104e30397d0`, runtime npm `agentic-qe@3.15.19`.
Файлы/лицензия/hashes: `.agents/agentic-qe/UPSTREAM-MANIFEST.json`, порядок загрузки:
`.agents/agentic-qe/PROOFWALL-INTEGRATION.md`. Дополнительно visual-testing-advanced,
accessibility-testing и 5 штатных Codex entry skills. Native Claude Task/Skill calls
адаптируются к фактическим Codex collaboration tools; фиктивные агенты не допускаются.

Установленные навыки: shift-left-testing → ADR/testability; qcsd-ideation-swarm →
риски; code-goal-planner → зависимости; brutal-honesty-review → независимый QE;
requirements-validation/risk-based/integration/regression/coverage → fleet QE.
Инструменты: dz recall/teach, OpenSpec, Git/worktrees, TypeScript/npm, Playwright,
pixel diff/overlays, axe, Docker Compose/Caddy. `lint` пока содержит workspace no-op:
его exit 0 не выдаётся за статический анализ. Настройка реальной применимой проверки
входит в первый затрагивающий код инкремент.

AQE memory: query/search возвращает ключи → retrieve/get загружает значения.
Проверяется persistence KV между процессами. Semantic/vector search при недоступном
embedder не объявляется рабочим. Ошибка recall записывается отдельно от verdict QE.

## Порядок исполнения и условия перехода

| Этап | Работа и ответственный | Условие выхода / доказательство |
|---|---|---|
| 0. Процесс | Sol: pinned skills/runtime, hooks, negative tests; Astra: review | Hashes совпадают; CLI/MCP smoke; guard запрещает контролируемые нарушения; native hook activation доказана отдельно |
| 1. Эталон | Sol+владелец: заморозить 3 макета и все наблюдаемые состояния | Git SHA, manifest ресурсов, state matrix и desktop/mobile snapshots; зарегистрированы допустимые отличия |
| 2. Требования | Sol исследование, Astra план, Terra проверка | Сложность L/XL по фактам; OpenSpec FR→scenario+SHA; reuse; ADR/QCSD; данные/API; закрыты обязательные K1/K2/checkpoints |
| 3. Общие UI-блоки | Sol UI | Перенесены typography/tokens/CSS/markup макета в React-компоненты; общий presentation слой и fixtures; layout совпадает с эталоном |
| 4. Обзор стен | Sol UI/API | Реальные проекты/метрики/переходы, empty/loading/error; tenant isolation и reload; visual+E2E green |
| 5. Оформление стены | Sol UI/API | Поля/темы/порядок/бейдж/цвета/логотип привязаны к контракту; save/error/reload; файловые операции через S3 в scope |
| 6. Сбор отзывов | Sol UI/API | Реальный public slug, validation/submission/pending/success/error; сохранение, безопасный рендер и tenant isolation |
| 7. Остальные экраны | Sol UI, Astra архитектура нужных backend-дельт | Landing/auth/help/legal, project/moderation/import, wall/widget, video только в согласованных пределах; свои baselines+E2E |
| 8. Отдельный email-поток | Sol email + отдельные Astra planner/reviewer | Образец Resend из Clipmkr изучен, качественные HTML+text письма; 3 реальных URL и безопасная verification; focused tests, cross-model review |
| 9. Общая приёмка | Независимые Astra/Terra, Sol исправления | FR→spec→code→tests; visual/E2E/accessibility/unit/integration/typecheck/build; для XL обязательны security и performance review с evidence; закрытые findings, anti-drift, актуальные receipts |
| 10. Тестовая поставка | Sol | Версионированный артефакт, отдельная тестовая копия/БД, ссылка+инструкция, evidence привязано к тому же SHA/digest |
| 11. Приёмка владельца | Владелец, затем Sol | Ручное решение записано для версии; production того же артефакта только по отдельному разрешению, rollback готов |

В каждом продуктовом инкременте повторяется применимая цепочка feature-adr:
router → FR/OpenSpec → reuse → ADR/shift-left → QCSD → архитектура/план → K1/K2 →
код → QE/fleet → независимое ревью → anti-drift. Новое замечание исправляется и
проверяется предметно; старые receipts не переносятся на изменившиеся bytes.
Класс сложности фиксируется до допуска к коду. Для XL security и performance —
обязательные отдельные проверки/reports, даже если выбран обычный `--full-qe`, а не
extended. Их наличие проверяет delivery guard; специализированные протоколы
подключаются явно перед зависимой работой, пропуск требует изменения scope.

## Строгая визуальная приёмка трёх экранов

1. Замораживаем не только URL: commit HTML/CSS/JS/fonts/assets и synthetic fixture data.
   Составляем перечень состояний: dashboard overview/empty; branding выбранные темы,
   sort/checkbox/input/save feedback; collect idle/focus/validation. Loading/network/error/
   success приложения, которых в макете нет, получают отдельный утверждаемый baseline.
2. Используем существующие CSS, локальные WOFF2, иконки и структуру макета как исходник
   компонентов. Презентационный слой отделён от API; fixture mode подключается только
   в тестовом окружении и не выдаётся за реальную сохранённую информацию.
3. Фиксируем Playwright/browser/OS/container, locale/timezone/DPR=1, viewport 1440x900,
   390x844, 360x800; ждём document.fonts.ready, fonts/resources и стабильную геометрию.
   Одинаковые содержимое, переносы, scroll/state и deterministic clock/animations.
   Для трёх основных размеров эталон и приложение снимаются в одной среде.
4. Полностраничные/компонентные screenshots, pixel diff и прозрачное наложение.
   Точный pixel threshold=0 и maxDiffPixels=0 для стабильных областей в закреплённой
   среде; отдельный diff всего экрана, DOM boxes и computed styles для font/color/
   spacing. Антиалиасинг не оправдывает геометрический сдвиг; для другого браузера
   свои baselines. Никаких общих больших процентов, скрывающих сломанную секцию.
5. Demo-banner/навигация макета исключаются только из заранее названных screenshot
   регионов; нельзя маскировать продуктовую кнопку/отзыв/ошибку/неудобное расхождение.
   Список исключений и причин версионируется. Новая маска = изменение эталона и отдельная
   приёмка. Реальные данные сравниваются через те же deterministic fixtures.
6. Эталон нельзя автоматически создавать/обновлять внутри обычного CI. Неисполненный
   baseline, missing snapshot, flaky/inconclusive тест или неподтверждённая маска — BLOCKED.
   Ожидаемая смена baseline оформляется diff-артефактами и решением владельца для версии.
7. Контрольные поломки: подменить font, margin и цвет в тестовой копии → visual gate
   обязан покраснеть; восстановить → green. Подмена baseline без разрешения → отказ.
   Это доказывает чувствительность стража, а не только его наличие.
8. Визуальные тесты дополняются настоящими E2E: клики, клавиатура, ошибки API, save+
   reload, отправка/модерация/стена, tenant isolation. Pixel parity не доказывает backend.

Критерий: ноль необъяснённых визуальных расхождений в зафиксированных условиях.
Попиксельная тождественность любого браузера/ОС не обещается. На иных устройствах
проверяется responsive UX, а не перенос неподходящего baseline.

## Отдельный поток Resend

Ветка/worktree независимы от UI/QE. Источник подхода — GitHub djd1m/clipmkr;
ключи и production-конфигурация Clipmkr не копируются. Письмо о создании стены:
название, рабочие wall/dashboard/collect URL, один ясный следующий шаг на основе
реального импорта Proofwall, подтверждение адреса. HTML+plain text, адаптивность,
доступные ссылки, корректное экранирование, timeout/retry/idempotency и наблюдаемая
ошибка. Verification — hash-only token, срок, одно использование, безопасное погашение;
не подтверждать адрес просто от открытия GET сканером почты. Проверки без реальных
писем/клиентских адресов. Новые credentials только локально, в Git placeholders.
Реальная отправка, доменная верификация и live migrations отдельно от готовности кода.

## Что контролирует соблюдение

- AGENTS + полный feature-adr задают порядок и обязательные артефакты. Это инструкции,
  их выполнение подтверждается evidence, а не названием режима.
- Native Codex SessionStart проверяет pinned QE и напоминает режим. PreToolUse guard
  проверяет защищённые действия, baseline и delivery. Stop проверяет только активный
  продуктовый change, не блокирует обычные вопросы/подготовку плана бесконечным циклом.
- `implementation-state.json` хранит состояние допуска. Default planned: поставка
  продукта запрещена. Receipt требует актуальный inputDigest, настоящие reports/artifacts
  и все обязательные passed checks; missing/stale/failed/skipped не считаются успехом.
- CI проверяет hashes/конфигурацию и негативные тесты guard уже сейчас. Обязательный
  GitHub check привязывается к main после первого успешного CI. Полные продуктовые
  visual/E2E job и отдельный deploy runner вводятся этапами 1–2 до UI-кода;
  их отсутствие сейчас не скрывается названием CI. Server guard повторяется на поставке.
- Независимый cross-model reviewer изучает конкретную версию, проверяет результаты и
  закрытие findings. Автор не может самостоятельно объявить независимую приёмку.
- Приёмка владельца относится к конкретным baseline/артефакту. Она не заменяется записью
  passed, созданной агентом; production остаётся отдельным решением.

Ни hooks, ни state JSON не являются абсолютной защитой от root или администратора:
они могут переписать scripts/state/CI или выполнить прямой Docker/SSH. Для технической
защиты от обхода нужны внешние protected checks, отдельные права/секрет deploy-runner и
неизменяемое подписанное evidence. До этого гарантия ограничена контролируемым маршрутом
поставки и наблюдаемыми проверками; обещание «обойти невозможно» было бы неверным.

## Текущий статус

Аудит, публичные/кабинетные макеты и S3-проверка уже выполнены ранее. В этом пуле
обновляются QE, guards и план; отдельная ветка email готовится параллельно. Приложение
ещё не объявляется идентичным макету. Отчёт фактических проверок процесса и native hooks
будет добавлен отдельно; этот план не является receipt успешной реализации.

Внешний blocker установки CI: текущий GitHub OAuth не имеет workflow scope. Файл
готов локально и проверен чистой установкой; публикация CI/required check ожидает
обновления авторизации владельцем. Это не считается пройденным GitHub gate.
