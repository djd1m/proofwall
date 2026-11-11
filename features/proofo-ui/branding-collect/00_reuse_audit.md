# Branding + collect: reuse/gap audit

Дата: 11.11.2026. Read-only разведка кода `/tmp/proofwall-ui-dashboard` для следующих
двух экранов уже согласованной последовательности dashboard → branding → collect.
Это не QCSD, допуск к реализации, прогон приложения или приёмка. Изменён только этот
новый файл. Сеть/S3, секреты, `.env`, credentials и private objects не проверялись.
Текущая работоспособность Cloud.ru на main — входное условие от координатора, не
результат этой разведки. Продуктовых тестов и миграций не запускал.

Эталон: `features/proofo-ui/reference/dashboard-v3/resources/cabinet.js:16-18`,
`cabinet.css`; доступная копия — `features/proofo-ui/preview/cabinet.js`.
Макет — источник компоновки/контролов; действующий Proofwall — источник контрактов.

## Основной вывод

Collect — **M**, преимущественно перенос существующей рабочей формы в новый UI.
Есть JSON/multipart submit, фото, pending/success/error и feature flag видео.
Комментарий в начале `f/[slug]/page.tsx` «фото ещё не реализовано» устарел:
`submit-form.tsx`, `/api/testimonials`, storage и тесты уже реализуют полный путь.

Branding с честным Save/reload только трёх имеющихся полей — **M**. Все контролы
макета с действительным эффектом на стене/виджете — **L**: нет write API и нет
контракта theme/order/show-platform. Нельзя считать настройку готовой лишь потому,
что JSON записался в БД. Рейтинг — отдельная новая способность, не вариант sort.

## Карта branding

| Контрол эталона | Факт в текущем коде | Реализация в согласованном UI-этапе |
|---|---|---|
| Светлая/тёмная тема | `Branding` содержит только `heading/accent_color/logo_url`; wall и widget не читают тему | Небольшая дельта JSON/API, но обязательные читатели и CSS **обоих** wall/widget; до этого не обещать сохранённую тему |
| Сначала свежие | `wall.ts` и `widget-config.ts`: `created_at desc`; widget максимум 50 | Reuse текущего порядка. Это лимит выдачи widget, не free entitlement |
| Сначала старые | Нет настройки; всегда DESC | Добавить enum newest/oldest и одинаковую семантику отбора/сортировки на wall/widget, с устойчивым tie-break. Не менять 50 и не вводить «12 на free» |
| С высокой оценкой | Ни поля rating в схеме/API, ни ввода оценки, ни читателей | Не реализовывать псевдосортировку. Отдельные FR/schema/API/приёмка; пункт исключить/явно недоступен по согласованной дельте эталона |
| «Видео всегда над стеной» | Wall отображает единый список; widget не имеет контракта отдельной видео-полки | Текст эталона не подтверждён кодом. Убрать обещание из текущей версии; отдельная видео-работа |
| Метки площадок checkbox | `source_platform/source_url` существуют; wall показывает источник, widget получает `source_label/source_url`; настройки видимости нет | Reuse данных, новая boolean-настройка + читатели. Это **метки источников**, не Proofwall badge; нельзя связать их выключение с `badge_required` |
| Цвет HEX | `readBranding`: строгий `#RRGGBB`, default `#6701ef`; форма и стена читают | Reuse reader и безопасное применение; добавить write validator. Widget цвет пока не получает. Эталонный красный не менять глобально без явной дельты |
| Лого URL | `readBranding` допускает HTTP и HTTPS; форма и wall выводят `<img>`; пусто → null | Write API должен определить HTTPS-only согласно макету, не молча «успешно» отбрасывать ввод. Для старых HTTP нужна явная совместимость/ошибка. Это URL, не загрузчик лого в S3 |
| Заголовок формы | `heading` default «Оставьте отзыв», reader обрезает до 120, React escape; только `/f` | Reuse чтения/рендера; writer валидирует max 120 и правило пустой строки. Не выдавать truncate reader за валидацию Save |
| Save + reload | Ни branding page/route, ни writer по поиску `branding/accent_color/logo_url` в `apps/*/src` нет | Новый authenticated route/action, форма загрузки/ошибки/успеха, повторный серверный read. Merge известных ключей с JSON, сохранить `branding.name` — его использует dashboard |

`projects.branding` — существующий `jsonb not null default '{}'` в
`packages/db/migrations/003_core.sql`, поэтому базовым полям миграция не нужна.
Наличие свободного JSON не заменяет whitelist/enum/length/URL validation.
`apps/widget/src/types.ts` имеет необязательный `branding?: Record`, но сервер
`WidgetConfigResponse` branding не возвращает и renderer его не использует.

Предлагаемый bounded write-контракт: PATCH `/api/projects/[slug]/branding`
(новый, имя ещё не зафиксировано) принимает **только** поля оформления, возвращает
каноническое прочитанное значение; rejected ввод → 400, отсутствие сессии → 401,
чужой проект → проектная tenant policy. `tier/paid_until/noindex/account_id` не
принимать и не обновлять. Один атомарный JSON merge сохраняет посторонние ключи;
проверки владения и UPDATE выполняются в одном tenant context.

## Карта collect

| Контрол/состояние | Реальный контракт | Reuse/gap |
|---|---|---|
| Публичная страница | `/f/[slug]`, dynamic SSR; `findProjectBySlug`: только active project, иначе 404; без регистрации | Полный reuse существующего route, `readBranding`, текста вступления и brand heading/logo/color |
| Имя | API: trim используется **для проверки** 2–80, сохраняется исходная строка | В макете maxlength 120; переносить 2–80 из Proofwall. Не trim/escape перед отправкой |
| Роль/компания | Опционально, API max 120; пустая/blank → null | Макет maxlength 200 неверен; текущему input также не хватает client maxLength 120 |
| Текст + счётчик | API 10–2000 по исходной строке; `type: text` | Reuse; минимум 10 должен быть явным в HTML/ошибке. Авторский текст не переписывать |
| Фото | Optional JPEG/PNG/WebP ≤ 5 MiB; multipart key `photo` | Уже есть file selection, blob preview/revoke, remove; перенос UI сохраняет настоящий pipeline |
| Согласие | В реальном `SubmitForm` нет текста/checkbox; DTO/БД не записывают согласие и его версию | Текст из макета можно обсуждать как disclosure, но нельзя объявлять учёт согласия/самостоятельный отзыв согласия реализованными. Встроенного публичного withdrawal endpoint не найдено |
| Submit | POST `/api/testimonials`: JSON без фото; multipart с `slug,type,name,role,text,photo` | Reuse; кнопка disabled during sending, поля сохраняются при ошибке |
| Success | Только 201 `{public_id}`; БД testimonial status=pending, audit testimonial_created | Reuse thanks state «после проверки владельцем». Не обещать моментальную публикацию |
| Ошибки | 400 `{errors}`; 404 missing/deactivated; 429; storage 503 `{error}`; network catch | Reuse отображения, добавить доступные alert/status и focus semantics; проверить повтор после отказа без потери текста |
| Видео | Сервер `videoIntakeEnabled()` true только для literal `VIDEO_INTAKE_ENABLED=true`; UI не показывает вкладку при false; video POST → 403 | Сохранить выключенным согласно текущему условию STT. Макетная вторая вкладка не разрешает включать флаг/расходы/новую интеграцию |

Реальный consent-текст должен отделять факты (pending, неизменённый текст,
публикация после проверки) от несуществующих функций. Если требуется доказуемое
согласие с версией/временем и каналом отзыва, это отдельная контрактная дельта;
одна декоративная checkbox её не заменяет.

## Tenant, storage и тарифные границы

- Auth reuse: `currentAccountId()` → `withAccount(accountId)` → `app_authenticated`
  и RLS по account; `projects` уже даёт select/update этой роли. Для чужого проекта
  следовать существующему 403 + audit `cross_project` контракту, не принимать
  owner/account из клиента. См. `.claude/rules/security.md`, `tenant.ts`, moderate route.
- Public reuse: `withService` обходится без RLS; slug разрешается сервером в project id,
  после чего запросы явно фильтруются этим id. Не доверять клиентскому project_id.
- Текстовая квота: 5 отправок/IP/project/час, существующий `form_submission` scope;
  validation до расхода, storage failure возвращает 503 и отзывает квоту.
- Фото: API проверяет файл, `validatePhoto` сверяет размер/MIME/сигнатуру; SVG/HTML/GIF
  отвергаются. `uploadPhoto` → приватный S3 bucket → ключ `projectId/uuid.ext` без
  оригинального имени → БД `/api/photo/<key>`; браузеру не нужны S3 keys/credentials,
  прямые bucket URLs или public-read ACL. Cloud.ru/MinIO поддержаны одним SDK.
- Отдача `/api/photo/[...key]` повторно sniff MIME, nosniff, CSP sandbox, inline.
  **Существующий отдельный gap:** route проверяет формат ключа, но не статус отзыва,
  active project или ownership; любой знающий точный ключ может получить pending
  фото, cache public immutable на год. Нельзя называть это защитой приватности pending
  медиа. Если требуется approved-only/public + owner-preview, нужен явный DB guard и
  пересмотр cache; не раскрывать реальные object keys при проверках. Сеть не проверена.
- `request.formData()` вызывается до per-file size check: комментарии про отказ «до
  чтения в память» относятся лишь к последующему `arrayBuffer`, не к доказанному
  ограничению целого multipart. В полном UI/QE сохранить это как известный риск,
  не выдумывать проверенную транспортную квоту.
- `isPaid/badgeRequiredFor` в `lib/tariff.ts`: paid **и** future paid_until из БД.
  Free/expired/unknown fail closed; branding API не меняет эти значения. Единственная
  текущая тарифная capability — badge; Proofo prices/12-review-limit/campaigns не
  являются контрактом Proofwall. Wall сегодня выбирает все approved, widget — 50.

## Ближайший bounded инкремент

1. После dashboard взять **branding + collect как L в рамках первого UI-этапа**:
   новый tenant-safe save/read для whitelist branding, UI collect поверх готового
   submit/photo, без смены env/STT/платёжных условий.
2. Для theme/newest-oldest/source-label включить ровно необходимую дельту существующих
   wall/widget читателей (данные, порядок и CSS; не полный редизайн этих экранов).
   Иначе эти контролы явно недоступны и нельзя считать весь branding исполненным.
   Исключение rating sort, обещания video-first и чисел Proofo оформить в FR/baseline
   как фактические ограничения, а не скрытые неподключённые поля.
3. Приёмка: reload сохраняет и **применяет** настройки к заявленным поверхностям;
   чужой account ничего не читает/не меняет; public slug не даёт подменить tenant;
   text/photo → pending → owner approve → wall/widget; storage/network/429/400 дают
   правдивые состояния. Video flag false остаётся false. Server badge invariant
   проверяется и для free/expired и synthetic paid fixture без имитации оплаты.
4. Reuse существующих тестов `branding`, `testimonial`, `photo`, `storage-cloudru`,
   `widget-config`, `wall`; добавить только проверки новой записи/читателей/tenant
   и UI E2E/visual всех 3 размеров из общего плана. Existing tests не запускались,
   их наличие не является pass evidence. Success/error states требуют своих baseline.

Отдельный scope, не входящий сюда: ratings; OCR/скриншоты как новый импорт; поиск
отзывов по внешней ссылке; billing/campaigns/rewards; включение STT; загрузчик лого,
если вместо URL потребуется новая функция. Эти способности не следуют из рисунка UI.

Recall выполнен: `npm run dz -- recall 'Proofwall branding collect public form photo
tenant' --project /home/proofwall --limit 3`; 2 hit (без GitHub CI, email onboarding),
специфичного знания по branding/collect не найдено. Выводы выше основаны на коде.
