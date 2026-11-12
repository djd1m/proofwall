# Исправление палитры на рабочем стенде

Восстановлен согласованный терракотовый default `#c8492f` для стены без собственного
цвета. Усиленные границы `#8e806b` сохранены. Явно сохранённые цвета, включая
фиолетовый `#6701ef`, не заменяются. Изменены три production fallback; миграций нет.

Опубликован build `xl_3mKgt4IwcnieD7U4fy`:

- [Оформление](https://ui-proofwall.78.17.53.233.sslip.io/dashboard/projects-aicoding-space/branding)
- [Форма отзывов](https://ui-proofwall.78.17.53.233.sslip.io/f/projects-aicoding-space)

## Проверка исправления

Исторический zero-diff на view с заданной literal palette не доказывал default
обычного проекта. Теперь regression начинается с обычной регистрации, проверяет
отсутствие сохранённого accent и computed CSS редактора/формы/стены, API виджета,
отсутствие записи default в БД, затем обычный Save/reload пользовательских цветов.

[Public red](evidence/operations/published-red.json) воспроизвёл старую фиолетовую
кнопку. [Фактическая палитра макета](evidence/operations/reference-palette.json)
снята браузером с согласованных публичных страниц. После публикации отдельный
[HTTPS green](evidence/operations/published-preview.json) сравнил с ней фон, card,
input fill, heading и кнопки на двух экранах при 1440/390/360 px. Для границ
использован отдельный согласованный `#8e806b`. Проверены обычный вход, новая стена
без цвета, сохранение и reload, реальный Cloud.ru photo pipeline, HTTP-одобрение
и чужой host со строгой CSP. Одноразовые synthetic проект и фото удалены.

Автор Sol/high: web960 passed/3 прежних provider skipped, widget43, E2E16,
typecheck/build, 6 offline zero-diff и 18 visual controls, process63.
[Авторский отчёт](08_author_report.md) и [команды/хеши](evidence/coordinator-checks.json).
Независимый Astra/xhigh: web52/widget8/E2E16; [собственный отчёт](evidence/independent-review.md).
[Native QE](evidence/native-qe-evaluated.json): cycle1 closed, unresolved=[].

Проверены 5507 NFT references, 812 физических traced файлов и 47 внутренних
symlink; фактический namespace сервиса прошёл семь проверок доступа.
[Артефакт](evidence/operations/staged-artifact.json),
[изоляция опубликованного сервиса](evidence/operations/published-isolation.json).

Изменён изолированный UI preview. EnvironmentFile, production, DNS и GitHub CI
не менялись. Ручная приёмка и screen reader остаются владельцу; новый coverage
или полный source mutation fleet для этой коррекции не заявляются. Старые QE
отчёты относятся к прежней ревизии, новая normative delta явно уточняет default.
