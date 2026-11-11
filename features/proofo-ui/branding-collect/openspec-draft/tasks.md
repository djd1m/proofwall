# План проверки и реализации

- [ ] Согласовать конкретную delta семантики prototype → production; frozen v3 не менять.
- [ ] Провести Direct QCSD, подтвердить native hooks и runtime, закрыть условия.
- [ ] Проверить K1 для каждого нового имени до создания модулей; K2 с `--tier=L --require-requirements`.
- [ ] Написать отказные тесты owner/PATCH/JSONB/permission и проверить legacy migration path.
- [ ] Реализовать branding writer и реальные wall/widget readers с server badge invariant.
- [ ] Реализовать branding и collect через production views, используя текущий photo pipeline.
- [ ] Сравнить same-component offline fixtures с frozen branding/collect во всех трёх размерах.
- [ ] Проверить UX, tenant, media, failure/retry и wall/widget на отдельном origin.
- [ ] Провести mutation discrimination, локальные code/process gates и cross-model QE.
- [ ] Записать FR → spec → code → evidence, выдать test-артефакт для ручной приёмки.

Ни один пункт реализации/QE сейчас не выполнен этим scope. Deployment — отдельное действие.
