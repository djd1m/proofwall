## ADDED Requirements

### Requirement: Agreed default accent
При отсутствии валидного сохранённого accent_color система SHALL использовать
#c8492f в web readBranding, публичной стене и widget config, а также в widget
resolver и его CSS fallback. Эта дельта явно переопределяет только требование
missing/invalid accent #6701ef из
openspec/changes/proofo-branding-collect/specs/branding-collect/spec.md.
Frozen reference, background #f2ede3, card #fffdf8 и согласованные границы
#8e806b остаются прежними.

#### Scenario: Newly registered project
- **GIVEN** проект создан обычной регистрацией и не имеет сохранённого accent_color
- **WHEN** владелец открывает обычный branding route, а посетитель collect и wall
- **THEN** branding color input, кнопка, акцентный eyebrow и mark используют #c8492f;
  основной заголовок branding сохраняет frozen ink #17140f;
  collect заголовок и кнопка используют #c8492f; wall и widget config получают #c8492f
- **AND** computed CSS проверяется без fixture palette injection

#### Scenario: Invalid or missing widget branding
- **GIVEN** branding отсутствует либо accent_color отсутствует или невалиден
- **WHEN** widget разрешает оформление
- **THEN** fallback accent и CSS fallback равны #c8492f

### Requirement: Preserve explicit custom accents
Система SHALL сохранять и применять любой валидный явно сохранённый #RRGGBB,
включая намеренно сохранённый #6701ef. Read fallback SHALL NOT записывать
значение в projects.branding или переопределять валидную кастомизацию.

#### Scenario: Saved purple and other custom accents
- **GIVEN** владелец сохраняет #6701ef либо другой валидный custom accent
- **WHEN** страницы перезагружаются и запрашивается widget config
- **THEN** branding input/кнопка, collect кнопка, wall и widget config сохраняют этот цвет
- **AND** существующая доступная contrast policy для текста сохраняется
