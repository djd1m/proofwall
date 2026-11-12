# Проектирование

Подробные proposed decisions, альтернативы, domain и SPARC-GOAP tasks находятся в
`features/proofo-ui/branding-collect/03_adr/`, `04_domain_model.md`, `05_architecture.md`
и `06_implementation_plan.md`. Это единый набор входов, не копия кода.

Основная граница: валидированный PATCH неглубоко объединяет только разрешённые ключи
существующего JSONB в owner transaction. Публичные читатели видят канонический Branding;
тарифы и provenance не являются его изменяемыми данными. Collect сохраняет имеющийся
серверный submit pipeline, а UI моделирует реальное состояние ответа.

Две разные проверки UI: точная исходная геометрия same-component offline fixture и
работающий production route с обычной сессией/синтетическими данными в отдельной БД.
Ни production seed endpoint, ни update goldens в этом проектировании нет.
Решение владельца 2026-11-12 «выбери контрастнее» задаёт live field border #8e806b.
Generic explicit palette props одного production component получают approved значения
из обычных containers, original #ddd3c2 — только из offline literal model. Поэтому
шесть zero-diff кадров доказывают component/layout с reference data; live рамки имеют
одобренное отличие и отдельный computed contrast oracle с отказной мутацией к original.

QCSD author delta уточняет шесть контрактов, пока без closure: existing trim/raw
validation для name/role/text; lock всех шести settings во время Save; отдельные
accentFill/onAccent/accentText с computed contrast; labels/errors/status/focus;
live long-string reflow 320/360/390; logging boundary только новых PATCH/UI и QA summaries.
Ни один из этих design oracles не объявляет выполненной implementation validation.
