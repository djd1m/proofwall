# Тестовая копия для приёмки

Первоначально опубликован артефакт `e19RhYitYH_pbxzgNnPaA`.
Актуальная [коррекция default palette и новая сборка](../palette-default-fix/README.md). Владелец выбрал более контрастные
границы полей `#8e806b`; выбор применён к обоим экранам.

- [Кабинет](https://ui-proofwall.78.17.53.233.sslip.io/dashboard)
- [Оформление стены](https://ui-proofwall.78.17.53.233.sslip.io/dashboard/projects-aicoding-space/branding)
- [Форма сбора отзывов](https://ui-proofwall.78.17.53.233.sslip.io/f/projects-aicoding-space)
- [Публичная стена](https://ui-proofwall.78.17.53.233.sslip.io/w/projects-aicoding-space)

Для входа используется прежний приватный файл на VPS
`/home/proofwall/.secrets/ui-preview-access.env`. Значения в Git и отчёты не включены.

## Что проверить владельцу

1. Открыть оформление, изменить заголовок или цвет, сохранить и перезагрузить страницу.
2. Открыть форму сбора: проверить новый заголовок, цвет, читаемость полей и мобильный вид.
3. Отправить текстовый отзыв с фото; в кабинете одобрить его и открыть публичную стену.
4. Оценить соответствие согласованному макету и сообщить замечания по двум экранам.

Ручная приёмка и ручной screen reader пока не выполнены. OpenSpec остаётся активным.

## Подтверждённые операции

[HTTPS-проверка](evidence/operations/published-preview.json) подтверждает обычный вход,
сохранение и reload, шесть live кадров, выбранный computed border, отсутствие overflow,
реальную загрузку и побайтовое чтение PNG через Cloud.ru, обычное HTTP-одобрение,
стену и виджет. Проверочный проект и его новый S3-объект удалены после проверки;
две прежние стены и их данные сохранены.

[Изоляция](evidence/operations/published-isolation.json): фактический UID 20001/GID 988,
нулевые effective capabilities, семь проверок доступа в mount namespace сервиса,
совпадение 812 traced файлов и 47 внутренних symlink. Сервис читает S3-настройки из
закрытого EnvironmentFile; это не означает отсутствия доступа к ключам в памяти процесса.

Для foreign-host проверки использован hostname `widget.published.test` на loopback,
но JS, API и фото загружались с реального опубликованного HTTPS-стенда. CSP разрешала
внешние скрипты и стили без unsafe-inline; в positive case нарушений нет, возврат
inline-style injection обнаружен. CORS `*`, cookie/Authorization не отправлялись.

Существующий основной HTTPS-хост и static макеты проверены отдельно. Обновлён только
изолированный UI preview; новые SQL migrations не требовались. GitHub CI отложен.

## Исполнение плана

`openspec/changes/proofo-branding-collect/tasks.md` сохранён в той ревизии, которую
проверяли независимые ревьюеры; его unchecked пункты — исходный план допуска.
Актуальный статус исполнения приведён здесь и в QE-отчётах:

| Пункты исходного плана | Статус и доказательство |
|---|---|
| 1–3: delta, QCSD, hooks, K1/K2 | Выполнены: admission и qcsd evidence; решение владельца в design/owner-decision.json |
| 4–8: writer/readers, формы, navigation, QA runner | Выполнены: author-verification.json и независимые primary/integration отчёты |
| 9: same-component raster | Выполнен: шесть zero-diff кадров, исходный reference сохранён |
| 10–14: journey, validation, concurrency, contrast/reflow | Выполнены: 14 E2E; computed border; independent origin verification |
| 15: новые logs/redaction | Выполнен: actual sink checks и independently killed dead-sink mutant |
| 16: mutations, local gates, cross-model QE | Выполнен: 14 source/18 visual mutations; native cycle2 closed, unresolved=[] |
| 17: traceability и тестовый артефакт | Выполнен: primary traceability, настоящий HTTPS preview и этот документ |

Production-поставка и принятие интерфейса владельцем не объявляются выполненными.
