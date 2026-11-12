# Branding + collect — исследование

Read-only code/schema исследование 11.11.2026; пересверено на новом baseline
`4da1c64b6dcc537a412646183344dcb53645ea02` в `/tmp/proofwall-branding-collect`.
Dashboard preview теперь отдельный stable artifact, не незавершённая работа. Ничего не запускалось в продукте,
env/credentials/объекты S3 не читались, production/почта не вызывались. Слова «контракт»
ниже означают код и описанное поведение, не live runtime pass.

## Проверенные codebase patterns

| Источник | Наблюдение | Reuse/следствие |
|---|---|---|
| `apps/web/src/lib/branding.ts:1` | Три поля, строгий HEX, HTTP(S) logo, heading reader truncate120 | Расширить VO и строгий writer; не выдавать reader за Save validation |
| `packages/db/migrations/003_core.sql`; `007_rls.sql` | branding JSONB уже есть; projects SELECT/UPDATE у app_authenticated; RLS account | Нет новой таблицы/SQL migration; нужна проверка фактических grants |
| `packages/db/src/tenant.ts` | withAccount session context, withService BYPASSRLS | Owner writer не использовать service для доступа к branding |
| `apps/web/src/lib/request-body.ts:1` | readBodyAtMost считает реальные bytes и отменяет stream | Reuse для нового PATCH, не писать свой body parser |
| `apps/web/src/app/api/auth/resend-verification/route.ts:19` | Same-origin/Fetch-Site guard существует | Аналогичный guard для cookie-auth PATCH, без email helper/import |
| `apps/web/src/app/dashboard/[slug]/page.tsx` | Tenant dashboard read и неразличимый 404 | Новый branding route применяет ту же политику доступа к project |
| `apps/web/src/lib/wall.ts`; `lib/widget-config.ts` | Approved/project filter, DESC; widget LIMIT50 | Явный tie-break и sort после selection; не tariff gating |
| `apps/widget/src/{types,render,index,styles}.ts` | Shadow DOM; branding DTO placeholder; textContent; server badge | Совместимый typed DTO + runtime-safe reader; не новая UI библиотека |
| `apps/web/src/app/f/[slug]/submit-form.tsx` | JSON/multipart, preview cleanup, поля/errors/sending/done | Перенести markup через production view, сохранить настоящий submit pipeline |
| `apps/web/src/lib/testimonial.ts` | name.trim length2–80, raw role≤120 до blank→null, raw text10–2000; raw values сохранены | UI explicit validators должны повторить эти формулы; native raw name maxlength80 несовместим с padded valid name |
| `apps/web/tests/dashboard-visual-fixture.test.ts` | Production view + literal model → static output вне routes | Reuse метода для branding/collect; fixture не E2E |
| `scripts/check-proofo-visual.mjs` | Screen branding/collect уже поддержан, strict zero diff/mutations | Новый baseline не нужен; только renderer и live UX E2E |
| `apps/web/src/app/dashboard/[slug]/page.tsx` | Сейчас ссылки collect/wall есть, branding нет | Добавить scoped nav link, проверить обычный переход и возврат |
| `scripts/run-dashboard-preview.mjs` | Child env сначала наследуется, затем удаляются все S3_* | Не подходит для full photo E2E; новый branding QA runner с env allowlist/synthetic local S3 |

Текущий `Branding` имеет три обязательных поля; новый required-six interface сломал бы
существующие typed literals form/video tests. Решение: сохранить базовый тип, вернуть
из reader расширенный ResolvedBranding и нормализовать optional widget DTO на границе.
Это не потребует массовой правки несвязанных tests/компонентов.

Повторный `dz recall --json` прочитан целиком: урок actual SQL role/GUC требует проверять
контекст именно SELECT/UPDATE writer, а не только helper withAccount. JSONB не сохраняет
NUL/непарные surrogate: новые branding values отклоняются как 400 до SQL, без silent rewrite.

## Photo route: уточнение старого audit

`00_reuse_audit.md` содержал формулировку «отдельный gap» про pending фото. Проверены
`docs/Specification.md` FR-INTAKE-001 (строки 794–802), Pseudocode §12.10,
`apps/web/src/app/api/photo/[...key]/route.ts`: route именно key→format→storage→sniff,
nosniff/CSP sandbox/public immutable, без session/DB lookup. Listing wall/widget
фильтрует approved. Нет основания объявлять обещанную approved-only media policy
нарушенной: такой контракт не найден. Старый audit не переписан; эта более точная
проверка заменяет его интерпретацию, сохраняя сам факт key-based доступа.

Следствие: private bucket не означает authenticated GET route. Не обещать pending media
confidentiality/revocation. Не исследовались entropy enumeration, реальные keys, сеть/S3.
Новая DB access guard/cache policy потребовала бы отдельного решения и тестов, не
включается скрытно в UI scope. multipart parser сначала читает formData; 5MiB file check
не доказывает ограничение размера всего transport body. Это ограничение доказательств,
не повод заявить проведённый security exploit или переписать storage pipeline.
Existing photo GET error logger включает synthetic objectKey в текущих tests. SECURITY-01
исправляется явной границей NFR-202: новые PATCH/UI diagnostics и собственные QA summaries
status/hash/count не содержат payload/secret/key. Raw legacy unit output может передаваться
runner и явно помечается synthetic, не считается новым logging доказательством. Real
credentials/данные в QA запрещены; photo route и его logging не меняются в этих 30 targets.

## Точный prototype

Frozen `features/proofo-ui/reference/dashboard-v3/resources/cabinet.js`, функции
branding/collect: checkbox checked, его label про platform names; order включает
unsupported rating, текст обещает selection latest до sort. Theme относится wall/widget;
heading относится collect. Freeze manifest source commit:
`e2e2f963b1a0199d597396cfba1aef369b7e969d`, tree `d9acba4e57aacbd35c2736523d08a8874f744b30`.

Исторический FR-PROOF-001 требует platform label. Новая нормативная дельта сохраняет
proof semantics, разрешая выключить platform-specific caption. Автоматическая подмена
источника, стирание metadata и badge hiding не следуют из checkbox.

## External patterns и библиотеки

Проверены официальные первичные источники (11.11.2026):

- PostgreSQL: `jsonb ||` объединяет верхний уровень, правая сторона заменяет одноимённые
  ключи; это подходит для flat VO. Вложенный payload отвергается writer.
  [JSON operators](https://www.postgresql.org/docs/current/functions-json.html).
- MDN: PATCH предназначен для частичного изменения ресурса. Это обосновывает dirty-key
  payload; atomic transaction остаётся нашим обязательством.
  [PATCH](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PATCH).
- React: renderToStaticMarkup не интерактивен и не гидратируется. Его evidence — только
  исходный render; submit/save проверяются отдельно в браузере.
  [renderToStaticMarkup](https://react.dev/reference/react-dom/server/renderToStaticMarkup).

Новые зависимости не нужны. Сравнены reuse flat JSONB, normalized settings table и
отдельный customization service: первый сохраняет workspaces/границы и требует меньше
миграций; второй полезен при relational constraints/истории версий, которых сейчас нет;
третий даёт изоляцию rollout, но несоразмерен шести настройкам. ADR содержит trade-offs.

## Ограничения и оставшаяся работа

Read-only источники не устанавливают актуальные runtime grants, hooks или QE pass.
Шесть Direct QCSD ролей уже дали actual reports; evaluate exit1 с шестью unresolved
conditions. Авторские design fixes требуют focused origin reviews и нового evaluation.
Нужно исполнить отрицательные permission/migration tests на отдельной БД;
проверить contrast на actual CSS и widget bundle после реализации. Legacy HTTP logo
поддерживается reader; новый writer HTTPS-only и dirty-key сохранение устраняют тихую потерю.
Нет внешних network calls к пользовательским URL при сохранении; logo загружает браузер.
По handoff координатора fresh PG33186 создан отдельно, все 21 existing migrations
применены, synthetic local S3 fields настроены в `.secrets/branding-collect-test.env`.
Это сообщение о provisioning, не проведённый автором runtime/permission/photo test;
env здесь не читался, values не выводились. New SQL migrations остаётся 0.
