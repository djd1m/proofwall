# Фактическое покрытие dashboard

Измерено: 2026-11-11T20:44:49.910Z — 2026-11-11T20:44:55.054Z. Exit Vitest: 0. Исходники и тесты стабильны во время запуска: true.

Реальный provider: @vitest/coverage-v8@2.1.9; Vitest 2.1.9; Node v22.23.4; V8 12.4.254.21-node.57.

Область: ровно четыре новых/изменённых product-файла dashboard целиком, all:true. Это scoped coverage целых файлов, а не вычисленное diff coverage и не процент пройденных test cases. CSS, существующие тарифные/DB/session helpers, браузерный E2E и другие файлы в знаменатель не входят.

Запущены unit/SSR, isolated PostgreSQL integration и frozen fixture tests. JSX runtime настроен automatic; fixture output unset, эталоны не создавались/не обновлялись. Только DATABASE_URL/TEST_DATABASE_URL переданы из безопасного env после проверки loopback и proofwall_ui_test. REVOKE, production, S3 и mail не использовались.

| Файл | Lines | Branches | Functions | Statements |
| --- | --- | --- | --- | --- |
| **Итого** | 91/91 (100%) | 40/42 (95.23%) | 6/6 (100%) | 91/91 (100%) |
| apps/web/src/app/dashboard/dashboard-overview.tsx | 32/32 (100%) | 9/9 (100%) | 1/1 (100%) | 32/32 (100%) |
| apps/web/src/app/dashboard/error.tsx | 12/12 (100%) | 3/3 (100%) | 2/2 (100%) | 12/12 (100%) |
| apps/web/src/app/dashboard/page.tsx | 8/8 (100%) | 4/4 (100%) | 1/1 (100%) | 8/8 (100%) |
| apps/web/src/lib/dashboard-summary.ts | 39/39 (100%) | 24/26 (92.3%) | 2/2 (100%) | 39/39 (100%) |

Gate для новых файлов: ≥80% для каждой метрики по общей области. Критические read-model/auth/error файлы summary/page/error: ≥90% для каждой метрики отдельно. Итог coverage gate: **PASS**.

## Реальные пробелы

### apps/web/src/app/dashboard/dashboard-overview.tsx

Непокрытые строки (LCOV DA=0): нет.
Непокрытые функции: нет.
Непокрытые ветви: нет.

### apps/web/src/app/dashboard/error.tsx

Непокрытые строки (LCOV DA=0): нет.
Непокрытые функции: нет.
Непокрытые ветви: нет.

### apps/web/src/app/dashboard/page.tsx

Непокрытые строки (LCOV DA=0): нет.
Непокрытые функции: нет.
Непокрытые ветви: нет.

### apps/web/src/lib/dashboard-summary.ts

Непокрытые строки (LCOV DA=0): нет.
Непокрытые функции: нет.
Непокрытые ветви: #1[0] branch L12:51–L12:101; #10[0] branch L53:96–L53:112.

Приоритет пробелов: (1) защитный отказ count() при нецелом/отрицательном/небезопасном счётчике — синтетический mocked DB row должен отвергаться, а не давать ложную успешную сводку; (2) аккаунт только с активными paid-стенами — ожидается label «Платный». Это рекомендации следующего тестового инкремента; в этом измерении тесты не добавлялись и пороги не снижались.

## Воспроизведение и ограничения

Working directory: `/tmp/proofwall-ui-dashboard/apps/web`.

```text
/tmp/proofwall-ui-dashboard/node_modules/node/bin/node /tmp/proofwall-ui-dashboard/apps/web/node_modules/vitest/vitest.mjs run --config /tmp/proofwall-dashboard-coverage-tools/dashboard.vitest.config.mjs
```

Конфигурация и runner сохранены рядом с отчётом. Внешние инструменты установлены в /tmp/proofwall-dashboard-coverage-tools; репозиторные package.json/package-lock не менялись. Vitest web ссылается на общий baseline-external artifact той же закреплённой версии; только provider добавлен ссылкой из игнорируемого node_modules. Фактические команды, exit, версии и SHA-256 до/после находятся в run-metadata.json.

Сырые данные: raw/coverage-final.json, raw/coverage-summary.json, raw/lcov.info, raw/index.html. Полный output без секретов: vitest-run.log. Machine-readable gaps/gates: coverage-analysis.json.

Это измерение исполнения, а не независимое code review и не доказательство силы assertions. Качество негативных сценариев, mutation evidence, browser/visual/E2E и итоговая приёмка проверяются отдельными QE-ролями. История навыка пуста; тренд не вычислен. По явному ограничению координатора run-history/state/receipts не изменялись.
