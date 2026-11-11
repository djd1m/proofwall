# QE рабочего обзора стен

Результат: dashboard готов к тестовой приёмке. Branding и collect — следующие экраны;
их черновик находится в `branding-collect/`, продуктовая реализация этим отчётом не заявляется.
Статусы до реализации в исходных плановых документах сохраняются как история inputs.

## Фактический процесс

Код: native Codex `gpt-6.1-sol`, high, project launcher с активными hooks/MCP.
Авторский thread: `01a1cc28-a862-7781-92a0-aa3440eb14e3`.
Независимые новые сессии: primary/integration/regression — `gpt-6-astra`, xhigh;
risk — `gpt-6.1-terra`, xhigh. Архитектура — отдельный Astra, QCSD — независимые роли.
Все роли принадлежат Codex family; cross-model здесь не означает cross-provider.

Native convergence: первый evaluate — два HIGH условия; исправление и отдельные
focused verifications всех четырёх ролей; второй evaluate — **closed, exit 0**, без
открытых условий. Ревизия `06f4dce82d3e419861bced5377c6c71ae2fc9a42d87f12c219fee9d2dc1c1840`.
Доказательство: `evidence/dashboard-final/qe-closed.json`; история не сбрасывалась.

## Проверки

| Проверка | Наблюдение | Доказательство относительно evidence/dashboard-final |
|---|---|---|
| Полный web после repair | 923 passed, 3 прежних S3-теста skipped | web-after-repair.log |
| Real PG | 7/7; actual summary role/GUC/BYPASS/ownership, tenant A/B | ../qe-risk.md; ../qe-integration.md |
| Browser | 7/7; обычный login, summary и session-store failure/retry, keyboard/long names | e2e.log |
| Exact visual | 3 размера, 0 changed pixels и DOM same; 9 CSS mutations обнаружены | visual/report.json; visual.log |
| Coverage четырёх product files | 91/91 lines/statements; 6/6 functions; 40/42 branches; summary 24/26 branches | coverage/REPORT.md, raw JSON/LCOV |
| Accessibility | axe empty/populated × 3 размера, 0 violations; gradient/декоративные incompletes разобраны; keyboard проверен | accessibility-results.json; accessibility-manual.json |
| Typecheck | exit 0 после изменения тестов | typecheck-repair.log |
| Production build | exit 0 после последнего изменения product source; последующий repair менял только tests/план | build.log |
| Process | config valid; 63/63 guard tests | process-check.log; process-test.log |
| Baseline tool | 7 отрицательных/absence probes; внешний reviewer проверил nofollow | ../qe-primary-visual-paths.log; 13_reference_manifest.md |
| Discrimination | measurementValid=true; 3 DISCRIMINATES_VIA_ERROR с green TIP | discrimination-repair.json; ../qe-primary-discrimination-focused.json |

Discrimination — ограниченный вывод по отсутствию нового модуля на настоящей базе
и успешному исполнению на текущем коде, не доказательство baseline assertion failure.
Старый onboarding — preservation test, его green baseline явно NON_DISCRIMINATING.
Classifier и базовая ревизия не подменялись; package/lock identity и отсутствие
workspace edges у внешнего dependency artifact проверены отдельно.

## Находки и исправления

- QE-RISK-1: прежняя подмена summary на withService переживала PG-тесты. Новый probe
  проверяет authority фактического statement на одном client/transaction до и после
  чтения. Независимый control 7/7; мутант теперь падает на role assertion. Текущая
  утечка не обнаружена, исправлена защита от регрессии.
- QE-PRIMARY-1: исходный discrimination gate не устанавливал baseline dependencies.
  Внешний artifact с идентичным baseline lock, единые pg identities и точные test
  imports дали распознаваемый результат. Исходные неуспешные attempts сохранены.
- В авторском browser цикле найден и исправлен настоящий retry: reset дополнен
  router.refresh. Восстановление после GRANT подтверждено новой production-сборкой.
- Повтор K2 обнаружил намеренные шрифтовые twins. Причины исключений для неизменяемых
  prototype/baseline fonts записаны явно; остальные байты плана и 18 targets прежние.
  K1 original pre-creation сохранён; rebind означает отсутствие новых имён, не новый FREE.
- Отдельный ops review обнаружил root-процесс и зависимость от временного каталога.
  Оба условия закрыты: dedicated UID 20001, hardening, stable artifact, enabled unit,
  negative filesystem checks. См. operations-review.md и operations-focused-review.md.

## Границы

Skipped S3 не является pass. Реальных писем, платежей, production миграций/DNS не было.
Semantic AQE index недоступен; persistent lexical KV/MCP smoke работал. Реальные review
роли запущены collaboration tools; fleet_init не выдаётся за запуск LLM reviewers.
WCAG/screen-reader certification и все браузеры не заявляются. В synthetic prototype
locked-card link имеет отдельный contrast issue; этот блок в live model отсутствует,
эталон ради прохождения тестов не редактировался.

Ручная приёмка владельцем и production-поставка остаются отдельными действиями.
Ledger writer result координатор добавляет после этого отчёта, без выдуманных token/cost.

Ledger writer (verbatim):

```json
{"ok":true,"kind":"ledger","stage":"qe","verdict":"written","exit":0,"reason":"appended and verified by re-reading the tail","blocking":false,"target":"/tmp/proofwall-ui-dashboard/.dz/feature-adr/run-cost-ledger.jsonl"}
```

Letter grade, token amount and cost не назначались/не измерялись. `crossFamily=false`: разные модели в одной Codex family. Первый refused attempt из-за отсутствовавшего payload.stage сохранён отдельно, успешная запись ровно одна.
