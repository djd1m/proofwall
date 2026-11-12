# План проверки и реализации

- [ ] Согласовать конкретную delta семантики prototype → production; frozen v3 не менять.
- [ ] Провести Direct QCSD, подтвердить native hooks и runtime, закрыть условия.
- [ ] Проверить K1 для каждого нового имени до создания модулей; K2 с `--tier=L --require-requirements`.
- [ ] Написать отказные тесты owner/PATCH/JSONB/permission и проверить legacy migration path.
- [ ] Реализовать branding writer и реальные wall/widget readers с server badge invariant.
- [ ] Реализовать branding и collect через production views, используя текущий photo pipeline.
- [ ] Добавить ordinary project→branding→back navigation и legacy HTTP logo browser Save case.
- [ ] Подготовить dedicated allowlist QA runner/synthetic loopback S3, не меняя stable dashboard.
- [ ] Сравнить same-component offline fixtures с frozen branding/collect во всех трёх размерах.
- [ ] Проверить UX, tenant, media, failure/retry и wall/widget на отдельном origin.
- [ ] Проверить raw82/trim80 name acceptance, raw role/text boundaries и HTTP bypass negatives.
- [ ] Проверить locked pending editor, delayed response и две вкладки по порядку commit.
- [ ] Проверить computed contrast, labels/errors/status/focus и live 320/360/390 long-string reflow.
- [ ] Передать owner-approved live border #8e806b через generic palette props; frozen literal palette оставить original, проверить live computed border и отказ мутации #ddd3c2.
- [ ] Проверить только новые PATCH/UI logs и QA summaries; legacy synthetic output обозначить отдельно.
- [ ] Провести mutation discrimination, локальные code/process gates и cross-model QE.
- [ ] Записать FR → spec → code → evidence, выдать test-артефакт для ручной приёмки.

Ни один пункт реализации/QE сейчас не выполнен этим scope. Deployment — отдельное действие.
