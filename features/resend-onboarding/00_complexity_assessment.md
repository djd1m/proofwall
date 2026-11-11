# Оценка сложности: transactional email

Дата: 11.11.2026. Tier L: auth + project onboarding + БД, около 12 source/test targets.
Режим: feature-adr --full-qe с реальным AQE CLI runtime (MCP tools отсутствуют в текущей сессии); навыки читаются из /home/proofwall/.agents/skills/feature-adr, в worktree не установлены. Автор: унаследованная модель gpt-6.1-sol high по сообщению координатора; отдельный архитектор/планировщик ещё не запускался. Никакие неподтверждённые gates не считаются пройденными.

Recall: npm run dz -- recall "transactional email Resend verification register" --project /home/proofwall --limit 3 — exit 0, пусто; применённых уроков нет.

| Acid | Негативный сценарий | Ожидаемый отказ |
|---|---|---|
| A1 | Повторное/параллельное погашение | Ровно одно подтверждение |
| A2 | Истёкший/неверный token или сменённый email | Не подтверждать |
| A3 | HTML/control chars в названии | Экранирование HTML, subject без переводов строк |
| A4 | Resend отсутствует/не отвечает | Регистрация сохраняется; отсутствие доставки явно обозначено |
| A5 | Публичный origin отсутствует/невалиден | Не выдавать письмо с выдуманным адресом |
| A6 | GET сканера ссылок | Не менять verified; требуется явный POST |

Новые DNS, deployment, настоящие письма и персональные данные вне scope. AQE runtime agentic-qe 3.15.19 доступен через /home/proofwall/node_modules/.bin/aqe; полный upstream skills HEAD 98f241fc8b9d48d017cbdb63ab890104e30397d0. fleet init all domains под pinned Node22 успешен; первая попытка под системным Node20 упала native ABI, вторая с неполным domains — dependency error. memory search patterns/feature-adr/* namespace learning вернул entries:[]; применённых AQE lessons нет. Сам запуск runtime не доказывает агентное ревью или успешные продуктовые gates; они фиксируются отдельно. Независимое cross-model ревью отдельно после SHA.
