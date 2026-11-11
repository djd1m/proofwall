# Изменение: рабочий обзор стен

## Why
Текущий `/dashboard` перенаправляет единственный проект и не показывает согласованный обзор стен. Первый UI-инкремент должен соединить выбранный владельцем dashboard с реальными данными Proofwall.

## What Changes
- SSR-обзор собственных активных проектов под существующим RLS.
- Честные доступные метрики и действующий тариф каждого проекта.
- Перенос выбранной разметки/CSS и проверка нулевого pixel diff на frozen fixture.
- Изолированный visual harness и живой E2E без test-only production route.

## Impact
`apps/web` dashboard, локальные visual/E2E-инструменты и tests. Миграций, нового API, изменений оплаты и auth-flow не требуется. Branding, collect, GitHub CI и production-поставка вне этого изменения. Источник дельты — `specs/dashboard-overview/spec.md`.
