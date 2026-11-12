# Оформление стены и форма сбора отзывов

[Тестовая копия опубликована — ссылки и инструкция](10_preview_acceptance.md).

Автоматизированная проверка завершена; независимый native QE закрыт во втором цикле
без оставшихся условий. Это инкремент для тестовой копии и ручной приёмки владельцем,
а не объявление production-поставки всего Proofo UI.

Ветка `feature/proofo-branding-collect`, base dashboard `4da1c64b6dcc537a412646183344dcb53645ea02`.
30 изменённых code/test/tool targets, четыре ADR, 13 FR/NFR, новых SQL migrations нет.
GitHub CI по решению владельца отложен; проверки выполнены локально на VPS.

## Реализовано

Редактор сохраняет шесть настроек атомарным dirty-key PATCH, сохраняет старые и
неизвестные данные, проверяет owner/session/origin и не объявляет сохранённым
неподтверждённый запрос. Настройки реально применяются к форме, стене и виджету;
скрытие имени площадки сохраняет provenance, доказательство и server badge.

Форма принимает текст и фото через существующий SDK pipeline, сохраняет ввод при
ошибках, обрабатывает retry и публикует отзыв только после обычной owner HTTP
модерации. Виджет сохраняет Shadow DOM и работает на проверенном foreign host под
CSP без unsafe-inline. Новый HTTPS logo с userinfo отклоняется. Новые технические
события не содержат payload или секретов.

Владелец 12.11.2026 выбрал контрастные границы `#8e806b`.
[Решение](evidence/design/owner-decision.json) и [сравнение](https://proofwall.78.17.53.233.sslip.io/__design/proofo/contrast-fields.html).
Исходный frozen reference неизменён: offline literal palette тех же production views
отдельно проверяет первоначальный вид; live рамки и состояния имеют собственные oracles.

## Проверки и доказательства

- Web: 960 passed, три прежних live-provider tests skipped; widget: 43 passed.
- Обычный browser E2E: 14/14; process: 63/63.
- 14 source mutants и 18 visual mutations обнаружены, source восстановлен.
- Два экрана × три размера: шесть zero-diff кадров с эталонными данными.
- Production V8: 967/971 строк, 480/520 ветвей, 18 полных TS/TSX файлов.
- Четыре независимые Astra/xhigh роли проверили Sol/high код и собственные исправления.

[QE](08_qe_report.md), [Fleet](09_fleet_qe_assessment.md),
[каноническая конвергенция](evidence/qe/native-cycle2-evaluation.json),
[декларация встраивания](../../../docs/embed-contract.md),
[операционные доказательства](evidence/operations/).
Полные source/log hashes и scope каждого результата сохранены в evidence;
private QA env и raw logs не публикуются.

## Локальное воспроизведение

Нужны выделенная PostgreSQL QA database и приватный mode600
`.secrets/branding-collect-test.env`; реальные provider ключи в этот файл не помещать.
Проверенный runner ограничивает окружение, localhost resources и synthetic S3.

```sh
node_modules/node/bin/node scripts/run-branding-collect-preview.mjs check-env
node_modules/node/bin/node scripts/run-branding-collect-preview.mjs test --maxWorkers=1 --minWorkers=1
node_modules/node/bin/node scripts/run-branding-collect-preview.mjs typecheck
node_modules/node/bin/node scripts/run-branding-collect-preview.mjs build
flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node scripts/run-branding-collect-preview.mjs e2e
```

Ресурсы и permission tests нельзя запускать конкурентно без общего lock.
Функциональные Cloud.ru операции проверяются отдельно и не выдаются за skipped suite.
Ручной screen-reader и приёмка владельцем выполняются на опубликованной тестовой копии.
OpenSpec остаётся активным до приёмки. Production, DNS и main merge — отдельное решение.
