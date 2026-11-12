# Требования

Нормативная дельта: openspec/changes/proofo-palette-default-fix/specs/palette-default/spec.md.
SHA-256: `5b5df5dbb74be895e39119f7dfc76ff28a0dd6b10857bea2d03771d1f84f6ac7`.

| FR | Requirement / scenario | Код и проверка |
|---|---|---|
| FR-301 | Agreed default accent / Newly registered project | readBranding, обычные branding/collect/wall/config routes; browser computed CSS до customization |
| FR-302 | Agreed default accent / Invalid or missing widget branding | applyWidgetBranding, styles.ts; существующая widget suite |
| FR-303 | Preserve explicit custom accents / Saved purple and other custom accents | существующая hex validation; browser save/reload, wall/config; unit readers |

Поручение владельца приведено в 00_complexity_assessment.md. Поправка к прежним
утверждениям валидации: same-component offline 6-frame zero-diff доказывает
разметку/CSS на явно заданной frozen палитре, но не default нового реального
проекта. Старые отчёты остаются историческими; новый runtime regression закрывает
именно этот пробел. Ручная AT и независимое ревью не выдаются за авторские проверки.
