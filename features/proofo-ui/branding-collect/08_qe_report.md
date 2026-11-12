# Независимое QE: оформление стены и форма сбора

## Primary QE pass

Результат текущей проверки: **closed для публикации тестовой копии**, native evaluate
exit0, revision `5a55e200c7807177bb7d1e8e39b5eb2b7db0d4d68b3d69d07d182b3403122657`.
Два засвидетельствованных цикла; история первого отказа и девять исходных условий
сохранены. Итоговый stdout/exit — [native evaluation](evidence/qe/native-cycle2-evaluation.json).
Авторская проверка не заменяла независимое ревью.

Авторы: два native Codex запуска `gpt-6.1-sol/high` с проектными hooks/MCP.
Архитектура Astra ранее независимо проверена шестью ролями Terra.
Код независимо проверяли четыре свежие сессии `gpt-6-astra/xhigh`, fork без истории автора:
[Primary/traceability](evidence/qe/qe-primary.md), [Risk](evidence/qe/qe-risk.md),
[Integration](evidence/qe/qe-integration.md), [Regression](evidence/qe/qe-regression.md).
Это наблюдённые параметры запуска, не аттестация провайдера.

| Замечание | Исправление и собственная origin verification |
|---|---|
| PRIMARY-01 / INTEGRATION-01 | Новый HTTPS logo с username/password отклоняется; validator, клиент, смешанный PATCH без записи проверены |
| PRIMARY-02 / INTEGRATION-02 | Текст и фото одобряются обычным owner HTTP API; pending/foreign/anonymous/expired и public readers проверены |
| PRIMARY-03 / RISK-02 | Live editor 320/360/390, URL2048 Home/End, отдельная геометрия документа/host/ShadowRoot; исправлен нулевой размер host |
| PRIMARY-04 | Исполнен настоящий reader из Git base на строке после записи текущим writer; общий JSON и старые поля сохранены |
| RISK-01 | Реальные redacted outcomes INFO/WARN/ERROR после результата commit; отсутствие секретов и отключение sink проверены невакуозно |
| INTEGRATION-03 | Constructed stylesheet внутри ShadowRoot; реальный bundle под CSP без unsafe-inline, hostile host CSS/JS, CORS и negative inline control |

Все исходные condition objects сохранены неизменно; каждый owner самостоятельно
записал текущую structural implementation verification и оценил actual author delta.
Координатор собрал entries и выполнил настоящий pinned native evaluate.

## Проверки

- Web: **960 passed**, три прежних live-provider tests skipped в изолированной QA.
- Widget: **43 passed**, typecheck и сборка прошли, gzip ниже 30 KB.
- Обычные браузерные маршруты: **14/14 passed**; настоящий SDK/local S3,
  ошибки и retry, ordinary moderation, влияние настроек, две вкладки, focus/contrast/reflow/CSP.
- Процесс: **63/63 passed**, vendor/config integrity passed.
- Production V8: **967/971 строк**, **480/520 ветвей**, все 18 полных TS/TSX targets;
  CSS и QA tools не объявляются покрытыми V8.
- Source mutants: **14/14 обнаружены**, исходники восстановлены побайтово.
- Offline: **6/6 zero-diff**, **18/18 visual mutations обнаружены**,
  29 файлов и девять случаев исходного эталона сохранены.

[Авторские source-bound результаты](evidence/repair-cycle2/author-verification.json),
[восемь текущих отчётов](evidence/checks/), [полное покрытие](evidence/coverage/final-production.json).
Независимые роли повторили собственные указанные в их отчётах прогоны;
их counts не выдаются за полный авторский suite.

## Precision QE pass

Отдельная precision-маршрутизация не настроена. Дополнительная независимость обеспечена
четырьмя фактически выполненными ролями; несуществующий precision run не заявляется.

Combined Step-8 grade: **READY FOR TEST-COPY REVIEW**, без незакрытых source conditions.

## Границы результата

Владелец 12.11.2026 выбрал более контрастные рамки `#8e806b`. Offline literal model
сохраняет исходную палитру тех же компонентов; нулевой diff не означает тождество
всех пикселей живого интерфейса с другими данными. Live границы проверены отдельно.
Ручной screen-reader и приёмка владельцем выполняются на опубликованной тестовой копии.
Универсальный WCAG pass, production-поставка, GitHub CI, DNS и merge в main не заявлены.
Реальный Cloud.ru SDK roundtrip проверен отдельно; он не подменяет три skipped теста.
Публикация и её фактическая проверка фиксируются отдельными операционными evidence.
