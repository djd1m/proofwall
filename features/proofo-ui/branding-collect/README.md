# Branding + collect — план следующего инкремента

Статус: **planning draft, не поставка и не допуск к реализации**. Bounded L,
dashboard → branding → collect; full-QE/hooks/cross-model, локально без GitHub CI.

Подготовлены complexity/acid corpus, FR mapping, research с уточнением photo contract,
три proposed ADR с альтернативами/Confirmation, domain, architecture и SPARC-GOAP plan.
План заканчивается точным списком **28** code/test/tool targets; эти файлы не создавались.
Существующий `00_reuse_audit.md` сохранён; его интерпретация privacy уточнена в research.

Основные решения: atomic dirty-key PATCH существующего JSONB; реальный theme/order/
accent/heading/logo effect; работающий checkbox скрывает название площадки, сохраняя
нейтральный provenance и server badge; collect сохраняет существующий text/photo pipeline.
SQL migrations новые не нужны, но existing migration/legacy/permission negative tests обязательны.

OpenSpec draft временно находится в `openspec-draft/`: четыре файла были созданы в
`openspec/changes/proofo-branding-collect/`, затем **явно перемещены** по поручению
координатора, чтобы не менять snapshot dashboard review. Содержимое сохранено.
После dashboard closure координатор переносит их на нормативный путь и сверяет SHA
из `01_requirements.md`; до этого это draft, не active OpenSpec authority.

Незакрыто: Direct QCSD и его conditional findings; native-hook/runtime evidence;
K1 всех новых имён **до создания app modules**; K2 `--tier=L --require-requirements`;
отдельные sequence diagrams; independent review, implementation, visual/E2E/mutation,
локальные product/process gates и ручная приёмка. Ничего из этого не объявлено PASS.
Требования SHA проверены локально; OpenSpec strict validation ещё не выполнялась.

Не тронуты dashboard/main plan/state, app code, frozen goldens, env/секреты/production.
Не вызывались продуктовые endpoints, реальная почта, STT, payments или S3 media.
