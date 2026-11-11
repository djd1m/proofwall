# Proofwall: рабочий обзор стен

Первый рабочий экран доступен:
https://ui-proofwall.78.17.53.233.sslip.io/dashboard

Данные входа находятся только на VPS:
`/home/proofwall/.secrets/ui-preview-access.env`. Они не публикуются в репозитории.
В стенде отдельная база, синтетический аккаунт и две демонстрационные стены.

Проверить: вход → обзор → карточка стены → возврат; desktop/mobile; понятные
неизвестные показатели; действующие тарифы и названия. Project page пока прежняя.
Оформление стены и форма сбора — следующий инкремент, черновик в `branding-collect/`.
Настоящие письма/S3/платежи на этой отдельной review-копии не включены.

Результаты: 923 web tests passed, три прежних live S3 skipped; browser 7/7; свежий
exact fixture 0 changed pixels на 1440/390/360 и девять detected mutations.
Measured coverage четырёх production files: 91/91 lines, 40/42 branches.
Четыре независимые QE роли закрыли оба исходных HIGH условия; native convergence closed.

Доказательства: [QE](08_qe_report.md), [fleet](09_fleet_qe_assessment.md),
[фактическая HTTPS-проверка](evidence/dashboard-final/publication.json),
[живой desktop](evidence/dashboard-final/published-dashboard-1440.png),
[mobile](evidence/dashboard-final/published-dashboard-390.png).
Сравнение с эталоном — при одинаковых fixture data в закреплённом Chromium; live
screenshots показывают реальные значения отдельной демонстрационной базы.

Существующий сайт и static prototype сохранены. Production DNS, production database
и ручная приёмка владельцем этим результатом не подменяются. Проверки локальные,
GitHub CI отложен по решению владельца.
