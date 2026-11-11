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
