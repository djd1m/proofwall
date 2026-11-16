# Предварительная сводка Direct QCSD

Вердикт: **CONDITIONAL**, не разрешение на код или поставку. Все шесть ролей реально выполнены независимыми Terra/xhigh против архитектуры Astra/xhigh; fork none.

12 quality criteria, HTSM10/10; 9 экспертных риск-сценариев (8 HIGH,1 MEDIUM,0 CRITICAL); testability34/40=85% по явной статической рубрике. Нет продуктовых/AT измерений. Требования пока conditional, поэтому все условия GO не исполнены; оснований NO-GO по указанным порогам не выявлено.

| Роль | Вердикт | Условия |
|---|---|---|
| qcsd-quality | conditional | 1 |
| qcsd-risk | conditional | 2 |
| qcsd-testability | conditional | 3 |
| qcsd-accessibility | conditional | 2 |
| qcsd-security | conditional | 2 |
| qcsd-ux | conditional | 3 |

## Наблюдаемые условия до реализации

- **QCSQ-01 (HIGH)**: Привязать к FR-303 сохранение существующего screenshot paste и задать в плане отдельный ordinary UI oracle: synthetic clipboard image -> видимое вложение -> переключение intake с сохранением файла -> существующий endpoint -> pending с provenance после reload; screenshot-only без обязательных имени/текста; при 503 до записи нет insert; при сетевой ошибке нет ложного success, исход может быть неизвестен, снимок доступен для retry. Сохранить отдельные сценарии выбора файла и URL+text.
- **QCRISK-01-egress-boundary (HIGH)**: До допуска QA определить принудительную deny-by-default сетевую границу для browser, app и дочерних процессов с разрешением только названных синтетических loopback endpoints, безопасный локальный отрицательный probe, проверяемый журнал отказа и fail-closed при недоступности границы; связать механизм и тестовые оракулы с NFR-303 и задачами плана. Не считать один browser fixture или урезанное окружение доказательством блокировки server egress.
- **QCRISK-02-project-runner (HIGH)**: До source admission определить безопасную orchestration, которая до spawn проверяет именно PG33186/app33187/S3synthetic33188/foreignhost33189, удерживает общий flock весь lifecycle и фактически запускает project-cabinet.e2e.test.mjs и project-cabinet-mutation.mjs с фиксацией target и exit status; зафиксировать fail-closed проверки неверного порта, занятого lock и неверного target, затем согласованно отразить в плане/target inventory.
- **TST-01 (HIGH)**: Определить наблюдаемую границу синхронизации persisted testimonial/install данных, локального initial/items, badge и onboarding после успешных intake/moderation/install и изменения props; определить сохранение drafts, реакцию на failed/conflicting mutations и named live oracle для проверки до и после выбранной границы. Допустим честно описанный ручной reload, если он выбран.
- **TST-02 (HIGH)**: Для каждого сбоя чтения project/testimonials/widget_installs определить тестируемый SSR error outcome и named loader/ordinary HTTP oracle: ошибка не превращается в 404, пустой или частично успешный кабинет; настоящий пустой проект успешно отображается. Указать повторный запрос и отрицательную мутацию catch-to-null/empty без раскрытия секретов.
- **TST-03 (HIGH)**: Привязать A13 к именованному oracle с явным охватом изоляции browser/server процессов для email/payment/STT/storage и synthetic отрицательной проверкой обнаружения запрещённого исходящего вызова без обращения к реальному провайдеру; ненаблюдаемые области явно ограничить или обеспечить другую проверяемую гарантию. Сохранить отдельный config guard.
- **A11Y-01 (HIGH)**: Привязать к FR-303/304 и NFR-301 конкретный keyboard/focus oracle в именованных live tests tools/visual/project-cabinet.e2e.test.mjs: для выбранных tabs — Tab в выбранную вкладку, Left/Right с wrap, Home/End, aria-selected/tabindex и aria-controls/aria-labelledby согласованы, только активная панель доступна, черновики обоих методов сохраняются; если выбраны disclosures, проверить их фактическую button/expanded/controls-семантику без ложных tab roles. Для успешной и неуспешной модерации существующего item, а также cancel смены пароля определить и проверить видимое разумное место фокуса после исчезновения/перерисовки элемента, доступность дальнейших действий и отсутствие сброса фокуса на body; проверить с клавиатуры без programmatic focus как замены навигации.
- **A11Y-02 (HIGH)**: Привязать к FR-303/304/307 и NFR-301 наблюдаемый oracle для полей и асинхронных состояний в tools/visual/project-cabinet.e2e.test.mjs: у screenshot/URL/text, CSV и password есть доступные имена и условия обязательности; проверяемая field-specific ошибка связана с соответствующим полем и объявляется без потери исправляемого ввода, общая сетевая/409 — доступный явный статус без ложного успеха; при pending, ответе успех/ошибка и retry статус/занятость доступны без опоры только на цвет и не требуют просмотра экрана. Определить способ проверки accessibility tree/DOM-связей и отдельный ручной keyboard + реальный screen reader сценарий для доступного будущего test-copy; отсутствие AT отметить как непроверенное, не pass. Проверить на manual, CSV preview/commit, moderation и password mismatch; не требовать вставки настоящих секретов.
- **QCSEC-01-http-denial (HIGH)**: До допуска исходного кода связать FR-301/PC-01 с именованной ordinary HTTP проверкой: анонимный запрос получает login redirect с encoded next; owner A к foreign, отсутствующему и собственному deactivated проекту получает 404 без project name, отзывов, ссылок и сниппета; active owner получает только свои данные. Указать persisted синтетические accounts, маршрут, assertions и файл в плане; сохранить отдельный SQL current_user/GUC oracle и mutation проверки. Не подменять проверку ответа страницы одним unit-тестом loader.
- **QCSEC-02-password-cancel-inflight (WARNING)**: До source admission определить наблюдаемый lifecycle нового cancel на PC-07: до отправки очистить значения и ошибки без POST; после начала отправки не обещать отмену серверной операции (например, блокировать cancel до разрешения запроса и сообщать busy), отобразить фактические success/error и не терять reissued session. Связать с именованной synthetic UI проверкой: cancel до submit, задержанный POST при попытке cancel, success/error и старые/новая session; фактический rollback при abort не предполагать.
- **UX-01 (HIGH)**: Зафиксировать связь CSV preview с точными csv и mapping: изменение любого из них делает предыдущий preview недействительным и блокирует commit до нового успешного preview, без потери черновика; при сетевой ошибке не показывать успех. Дополнить план именованным ordinary UI oracle: preview → смена mapping → commit недоступен → повторный preview → commit именно показанных данных; проверять также смену CSV и отказ. Уточнить разрешённое изменение client state machine при неизменном API.
- **UX-02 (HIGH)**: Определить наблюдаемый контракт сохранения каждого незавершённого черновика при переключениях и recoverable error/retry: pasted или выбранный screenshot/File, URL, text, дополнительные поля, CSV и mapping, валидность preview; успешная отправка может очищать только соответствующий успешно отправленный черновик. Привязать named ordinary UI oracle к round-trip обоих методов, paste и file, 400/429/503/network и проверке фактического retry payload; без обещания сохранения после reload.
- **UX-03 (HIGH)**: До product writes связать решение владельца с точными bytes/hash proposal и явными утверждёнными областями адаптации, включая previously unobserved filled/controls. Планом назначить проверяемые selectors/координаты, viewport и критерий сравнения с этими областями, named oracle и честную фиксацию несопоставимых состояний; приложить отдельные полные ordinary live empty/filled/error/mobile screenshots. Не выдавать original-only offline fixture за доказательство согласованной адаптации и не вводить незапрошенное полное pixel identity.

## Машинная проверка и ограничения

Первое evaluate отказало из-за severity MEDIUM в security entry; originating reviewer исправил только кодировку на WARNING, сохранил исходник и экспертный MEDIUM. Повторный evaluate потребовал author delta после частично сохранённых origins. Actual persisted host содержит13conditions; origin lineage и отказы сохранены. Ни not-established, ни conditional не объявлены passed. Автор сейчас выполняет design-only rework.

Конкретное согласование нового preview/filled states ещё ожидается. Оно требуется AGENTS до product writes; текущая state planned/receipt null/admission null. Original9case reference сохранён, original project3case observation отдельно; новая адаптация не объявлена pixel-identical полному Proofo. Статический preview показывает реальные границы capabilities, не работу API.

## Следующие действия

Исправить все наблюдаемые design gaps, проверить их исходными ролями, явно связать owner decision с proposal hashes и visual selectors. Затем реальные K1/K2/source admission, отдельный Sol author под native hooks, tests/QE и isolated preview. Код продукта не изменён.

## Follow-up по видео

HAS_VIDEO применён к сохранению existing video/transcript indicators; нового player/recording нет. Рекомендован отдельный аудит captions/media при расширении video UI; /a11y-ally не установлен/не запускался и продуктовая доступность им не объявляется.

## Полные собственные отчёты

- [qcsd-quality.md](qcsd-quality.md)
- [qcsd-risk.md](qcsd-risk.md)
- [qcsd-testability.md](qcsd-testability.md)
- [qcsd-accessibility.md](qcsd-accessibility.md)
- [qcsd-security.md](qcsd-security.md)
- [qcsd-ux.md](qcsd-ux.md)
