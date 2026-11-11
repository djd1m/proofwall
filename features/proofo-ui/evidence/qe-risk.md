# Независимое QE: риск dashboard

11.11.2026. Роль `qe-risk`, семейство `codex`, отдельная сессия Terra xhigh; код предоставлен Sol, дизайн Astra. Объём — только первый dashboard, без будущих branding/collect. Проверенная native QE revision `4fb5f45771da845cfb31b82638322ed64f90d265402c5ac42f99e9125c77a72c`, nonce `c31c4bbe-bef2-49ee-9d89-863decf9f99b`: SHA всех 30 файлов manifest совпали на завершении проверки. Вердикт **conditional**: одно HIGH условие `QE-RISK-1` о недоказанной защите от подмены DB authority. Текущая реализация при чтении исходника использует правильный `withAccount`; существующая утечка не установлена.

## Условие QE-RISK-1 — фактическая роль проекции

`apps/web/tests/dashboard-overview-db.test.ts` отдельно вызывает `withAccount(A)` и надёжно проверяет `current_user`, tenant GUC, `rolbypassrls`, ownership и прямые unscoped SELECT четырёх таблиц. Однако отдельный вызов не доказывает, что сам `getDashboardSummary` использует именно эту роль. При намеренной замене в **временной копии** `withAccount(accountId, callback)` на `withService(callback)` и сохранении явного `WHERE account_id=$1` все шесть настоящих isolated-PG тестов прошли: mutant survived. Явная выборка пока скрывает нарушение RLS boundary, поэтому A/B результат не выявляет отказ независимого защитного слоя. Тест с mock `withAccount` не подтверждает authority настоящего соединения.

Требуется проверять `current_user=app_authenticated`, GUC именно account A, отсутствие BYPASSRLS и table ownership непосредственно на соединении/транзакции, выполняющих data statement реального summary; сохранить негативные unscoped RLS и A/B агрегаты. Повторить mutant с `withService`: он должен быть отклонён осмысленной assertion в PG, а не ошибкой неполного mock. После правок необходима повторная независимая проверка исходного условия на новом snapshot.

## Проверено независимо

Прочитаны нормативная OpenSpec-дельта и FR mapping, ADR-001/002, архитектура, план, исходные QCSD risk/quality/testability условия и `ideation-closed.json`. Исторические RISK-1/2 закрыты тогда на уровне дизайна, а не выполнения: в текущем коде проекция строится одним параметризованным SQL statement с независимыми CTE, а PG-тест считает data statements и отдельно доказывает реальную RLS-политику. Оговорка выше относится к связи этого доказательства с конкретным summary, не отменяет реальность unscoped RLS проверки.

Самостоятельно запущены `dashboard-overview.test.ts` в оригинальной рабочей копии: 7/7. На отдельной временной копии повторены unit baseline 7/7 и `dashboard-overview-db.test.ts` baseline 6/6 в специально проверенной локальной БД `proofwall_ui_test`; отдельный service seed и удаление тестовых UUID выполняет сам тест. Секрет DB прочитан программно, значение не выводилось. Никакие права БД reviewer не изменял. Для безопасности отдельные роли координировали PG run после browser fault injection. Мутанты создавались в отдельной временной копии, без правок кода или baseline; первоначальные неудачные прогоны с отсутствующими файлами fixture были setup errors и не считаются результатами мутаций.

| Направленная мутация | Результат независимого прогона |
|---|---|
| Unknown wall opens → 0 | Убита unit assertion `[null,null,0,0]`. |
| Paid определяется только `tier`, без проверки expiry | Убита unit assertion срока включая ровно now и invalid. |
| Ошибка summary превращается в пустой результат | Убита unit assertion: обещался rejection, mutant вернул успешный DTO. |
| Включены deactivated проекты | Убита пятью PG assertions. |
| Badge clicks: `created_at < now` заменено на `<=` | Убита PG: 6 вместо 4. |
| Badge clicks: `created_at >= start` заменено на `>` | Убита PG: 2 вместо 4. |
| Domains: `last_seen_at < now` заменено на `<=` | Убита PG: 4 вместо 2. |
| Вместо пар project/domain — `count(DISTINCT domain)` | Убита PG: 1 вместо 2. |
| Размножение отзывов через join к событиям | Убита PG: 24/6 вместо 4/1. |
| Добавлен второй data statement `SELECT 1` | Убита PG query-count assertion: 2 вместо 1. |
| Summary через `withService` при сохранённом account filter | **Выжила**: 6/6 PG tests. Условие QE-RISK-1. |

Это направленные ручные мутации, не исчерпывающий mutation score и не процент покрытия. Нет измеренного statement/branch coverage и данных о покрытии всех путей; количественные пороги утверждать нельзя. Для `last_seen_at` у нижней границы в тестовой фикстуре есть start и start−1ms; upper boundary проверена отдельной мутацией. Дополнительные будущие даты и внутренние точки не были в данном наборе направленных domain mutations. Одно SQL statement исключает межкомандный разрыв снимка, но отдельного стресс-теста производительности или конкурентной нагрузки здесь нет; SLA не задан.

Код использует единый now и `isPaid`, ограничивает active owned projects до aggregate, считает все четыре статуса отзывов без окна, исключает чужие данные и разделяет null от известного нуля. Текущая нормализация счётчиков отвергает небезопасные целые. `widget_installs` имеет unique `(project_id,domain)`, а метрика описывается как наблюдённая активность, не как подтверждённая установка. Проверка SQL сравнивает временные значения полуоткрытым интервалом `[now−30d,now)`; в test fixture присутствуют start−1ms/start/now−1ms/now для событий, старые/чужие/inactive записи, один domain в двух проектах и несколько дочерних строк.

Координатор выполнил отдельные проверки на этой revision: `dashboard-final/web.log` фиксирует 922 passed, 3 ранее существовавших storage/S3 tests skipped; `dashboard-final/e2e.log` фиксирует 7/7, в том числе обычный вход, отказ и восстановление summary через retry после восстановления SELECT, отдельный отказ session store, визуальные сравнения и три визуальные мутации. Это evidence координатора, а не самостоятельный запуск reviewer; skipped S3 не относится к dashboard, но не засчитывается как pass. Первый запуск browser без SESSION_SECRET был неуспешной настройкой и не используется как доказательство продукта. Данные из итогового E2E не доказывают authority mutant.

## Приоритизация остаточных рисков

Шкала вероятности и ущерба 1–5 — качественная; `P×I`, без статистического прогнозирования. До защиты от регрессии tenant authority — 4×5=20 critical: двойная граница существенна для безопасности; текущий SQL явно фильтрует аккаунт, а отдельный тест RLS проходит, но mutant показывает пропуск между слоями. Несогласованный snapshot/умножение children — 4×4=16 high: один statement и два убитых mutants снижают остаток. Unknown против нуля и ошибка/retry — 4×4=16 high: unit mutation и browser outage/recovery поддерживают защиту. Временные границы и domain пары — 3×4=12 high: набор boundary/dedup mutants убит, при указанном ограничении набора. Истечение тарифа — 3×4=12 high: общая функция `isPaid`, fixed now и убитый mutant; отдельная функция не заменяется авторской формулой. Нагрузочная деградация запросов — 3×3=9 medium: явного SLA и измерений нагрузки нет, поэтому производственная ёмкость не установлена. Потенциальные новые требования к будущим branding/collect не рассматривались.

## Focused verification после repair — QE-RISK-1 закрыто

Новая ревизия `06f4dce82d3e419861bced5377c6c71ae2fc9a42d87f12c219fee9d2dc1c1840`, nonce `690f6976-08de-4023-9747-5782b9c1c20f`; в host manifest повторно совпали 30/30 хешей. Исходное условие, его severity и evidence сохранены в JSON неизменными; новый вердикт риск-роли **clean**, а не утверждение об отсутствии всех проектных или эксплуатационных рисков.

Новая настоящая PG проверка перехватывает один `WITH owned` вызов и для A и B исполняет observational SQL перед ним и после него тем же `Client`. Она проверяет роль, tenant GUC, `rolbypassrls`, владельцев всех четырёх таблиц, неизменность backend PID и transaction ID; SQL summary, bind-значения и результат не подменяются. Отдельные unscoped RLS, A/B aggregate и one-data-statement проверки сохранены. Тестовые наблюдения добавляют диагностические SELECT только в тесте, production запрос не меняют.

Независимый контроль: оригинальная рабочая копия 7/7 PG tests; отдельная временная копия 7/7. В той же временной копии повторена конкретная прежняя мутация `withAccount(accountId, callback)` → `withService(callback)` с сохранённым explicit `account_id` WHERE: 6 passed, 1 failed, named test `proves actual summary statement authority on its own client and transaction` выдаёт `expected 'app_service' to be 'app_authenticated'`. Это actual assertion failure, не отсутствие импорта, ошибка mock или setup. Первый временный baseline по ошибке резолвил два экземпляра `pg`: spy не видел обращения и 2/7 проверок падали. Этот невалидный прогон исключён; после выравнивания физического `pg` baseline 7/7, затем выполнен mutant выше. Настройки доступа и права роли не менялись; секреты не выводились.

Авторская delta прочитана и сопоставлена с изменённым тестом; SHA production summary и view совпадают с исходной ревизией. Динамические literal imports и дополнение плана видны в текущих файлах. Координаторский `discrimination-repair.json` сообщает `measurementValid=true` и три `DISCRIMINATES_VIA_ERROR`: это вывод по ошибке загрузки отсутствующего baseline модуля при green tip, а не доказательство работы assertions на baseline. Измерения coverage в отдельном coordinator artifact не переименовываются в собственный прогон. Новых самостоятельных серьёзных risk-условий не выявлено; остаточные ограничения о ненагрузочном тестировании и конечном наборе мутаций остаются.
