# Требования: первый рабочий dashboard

Дата: 2026-11-11. Статус: ready for QCSD; реализация и приёмка ещё не выполнены.
Нормативная дельта: `openspec/changes/proofo-dashboard/specs/dashboard-overview/spec.md`.
SHA-256: `57e33113157e014fd741f04be2e8d0594d3d64fcf010d5915e51b8c07484c7ce`.

## Цель и согласование

Владелец выбрал макет
`https://proofwall.78.17.53.233.sslip.io/__design/proofo/?screen=dashboard`
и ответил «да давай» на план dashboard → branding → collect. Ближайший результат —
рабочий обзор стен. Существующие аудиты и `06_team_execution_plan.md` сохраняются.
Визуальный источник freeze: preview из commit `e2e2f96`, tree
`d9acba4e57aacbd35c2736523d08a8874f744b30`; точные SHA файлов/PNG пишет baseline manifest.

## Проверяемые требования и привязка

Все requirement/scenario ниже находятся в указанной выше OpenSpec-дельте с единым SHA.
Каждая строка задаёт принятую границу, а не утверждение о выполненном тесте.

| ID | Требование и критерий | OpenSpec requirement → scenario | Будущее доказательство |
|---|---|---|---|
| FR-001 | Authenticated `/dashboard` SSR показывает 0/1/N собственных активных проектов, без single-project redirect | Обзор собственных стен → Один или несколько проектов; Нет проектов; Нет сессии | SSR/DB tests + browser E2E |
| FR-002 | RLS `withAccount`; ни чужие, ни deactivated rows не участвуют в карточках/aggregate | Обзор собственных стен → Один или несколько проектов; Честные метрики → Изоляция и границы окна | Настоящие A/B tenants в isolated PG |
| FR-003 | Окно `[now − 30 суток, now)` UTC; badge_click count; «Домены с активностью виджета» — наблюдённые пары project/domain по last_seen_at | Честные метрики → Доступные события; Изоляция и границы окна | Граничные строки, повтор domain у двух проектов |
| FR-004 | Wall opens/widget impressions неизвестны; `—` + «Нет данных»; unavailable не равен 0; DB error не становится empty success | Честные метрики → Неизвестные показатели; Отказ хранилища | Nullable model/render/error tests |
| FR-005 | Existing `isPaid` определяет effective tier; mixed summary отражает per-project truth; только ссылка на существующий billing | Действующий тариф каждой стены → Бесплатная, оплаченная и просроченная стены | Expired/invalid/future tariff cases |
| FR-006 | Название из branding.name со slug fallback, текст экранирован; «Всего отзывов» = все 4 статуса за всё время; «На проверке» = pending за всё время; ссылки разрешаются | Точные данные карточки и действительная навигация → Название и содержимое; Состав числа отзывов | SSR/XSS/count/link checks |
| FR-007 | Email delivery/recovery и существующие project interactions сохранены | Точные данные карточки и действительная навигация → Совместимость созданной стены | Existing dashboard-onboarding regression + E2E navigation |
| FR-008 | Frozen literal fixture того же view имеет 0 pixel diff внутри main.cab-shell; immutable baseline; font/margin/color mutations красные | Визуальная идентичность согласованному dashboard → Сравнение с эталоном; Чувствительность проверки | capture/check reports, images + mutations |
| FR-009 | Fixture не является Next route/auth override; live E2E использует обычную session и isolated DB | Визуальная идентичность согласованному dashboard → Изоляция fixture; Доступный живой сценарий → Переход со сводки | Source boundary + live auth E2E |
| FR-010 | Keyboard/focus/mobile/desktop; no overflow, понятные unknown/error/empty states; без реальных писем | Доступный живой сценарий → Переход со сводки; Честные метрики → Отказ хранилища | Browser measurements and keyboard assertions |

## Состояния и продуктовая честность

- **0 стен:** явное empty state, ссылка `/` на существующий путь начала создания.
  Наличие этого пути не обещает добавление второй стены к текущему аккаунту.
- **1 стена:** карточка остаётся в обзоре, ссылка ведёт на `/dashboard/<slug>`.
- **N стен:** все собственные активные проекты, количество и тарифы; stable order.
- **Mixed billing:** нет вымышленной «подписки аккаунта»; сводка числа бесплатных/платных
  стен, управление тарифом через страницу проекта. Денежную цену overview не дублирует.
- **Нет телеметрии:** доступная подпись «Нет данных» для двух показателей и открытий карточки.
- **Ошибка чтения:** отдельное error state с повтором, без возврата успешного `[]`/нулей.

`badge_impression` отражает только выдачи config с обязательным badge: это не число
показов всех виджетов. `last_seen_at` обновляется по config-запросу; один домен с двумя стенами
считается двумя наблюдёнными парами. Видимая подпись: «Домены с активностью виджета».
Пояснение: «За 30 дней по обращениям к виджету; один домен с двумя стенами считается
дважды». Это не обещание подтверждённой текущей установки. Историческая полнота логов не обещается.

## Визуальный контракт

Pure component получает presentation model. Замороженная fixture может содержать
буквальные demo «Free · 1 стена · до 12 отзывов», Start 990 и четыре нуля, потому что
это текст принятого визуального образца; он существует только в tests/fixture.
Live mapper никогда не выдаёт эти ограничения/цены как продуктовую правду.
CSS, шрифты и DOM структура повторно используются из preview, не воспроизводятся по памяти.
Два контракта проверяются отдельно: 0 diff на одинаковой fixture и данные/auth на live SSR.
`main.cab-shell` включает brand/back и article; banner/nav/footer находятся вне региона.
До initial reference capture скрываются только `.cab-notice` и `#preview-tools`;
полный shell снимается с fullPage и ceil bounds. Fixture не добавляет spacer.
Новые маски, изменение эталона и смена браузера без нового baseline недопустимы.

## Вне объёма

Branding/collect redesign, новый project-create API, logout (маршрут в текущем коде не
найден), новая telemetry, изменение checkout, миграции, GitHub Actions и production.
Прямые login/SSO/email переходы на project URL остаются совместимыми.

## Применённая память и открытые gates

`dz recall ... --json` прочитан целиком: `teach:5295705dbb4719e8` — локальные gates без CI;
`teach:acc2c111a6ffaf26` — сохранение email notice/recovery. Эти уроки подтверждены
текущим кодом и прямым указанием владельца, не заменяют требования.
QCSD, независимый review, K1/K2, visual/E2E и product receipt ещё не завершены.

## Проверяемые уточнения QCSD

- QUALITY-1: total включает pending/approved/rejected/hidden независимо от возраста,
  подпись «Всего отзывов»; pending отдельно «На проверке». По одному каждого статуса,
  включая >30d, даёт 4 и 1; чужие/deactivated дети исключены.
- QUALITY-2: повторный config-запрос той же пары не увеличивает count; один домен
  двух проектов даёт 2; отсутствие зарегистрированного домена не добавляет пару.
- RISK-1: весь read model получается строго одним SQL statement, без multi-SELECT альтернативы.
- RISK-2/TEST-1: isolated PG отдельно доказывает current_user=app_authenticated,
  rolbypassrls=false, роль не владелец защищаемых таблиц, tenant GUC=A; unscoped SELECT
  projects/testimonials/analytics_events/widget_installs показывает A и скрывает B.
- TEST-2: после успешного login тест отзывает только SELECT analytics_events у
  app_authenticated в isolated PG, оставляя session read через withService рабочим;
  error не превращается в []/0, GRANT восстанавливается в finally, retry даёт данные.
  Отказ session store проверяется отдельно и не засчитывается как summary failure.
- TEST-3: fixture и live загружают одинаковые global/dashboard CSS и wrapper;
  body font/background и shell origin/width/padding сверяются реальным HTTP E2E.
- TEST-4: 360/390/1440 browser cases с длинным непрерывным Unicode, многострочным и
  HTML-подобным именем: нет overflow, доступное имя видимо, Tab/focus/Enter ведут на
  реальный project route. XSS и slug fallback остаются отдельными проверками.
