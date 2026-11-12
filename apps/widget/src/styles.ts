// src/styles.ts
//
// Источник истины: docs/ADR.md ADR-001 (Shadow DOM), docs/Architecture.md §4.1,
// .claude/rules/embeddable-widget.md: стили изолированы в ShadowRoot; современная
// ветка использует constructed stylesheet без inline <style> для restrictive CSP.
//
// `:host { all: initial }` — сброс наследуемых от хоста CSS-свойств, которые Shadow DOM
// пропускает по спецификации (font-family, color и т.п. наследуются даже через границу shadow-
// root, если явно не сброшены). Без этого агрессивный глобальный CSS хоста (`* { all: unset }`,
// см. testing.md §2) мог бы всё равно "просочиться" внутрь через наследование, а не через
// каскад — это не баг Shadow DOM, а его сознательно ограниченная гарантия (ADR-001 упоминает
// только каскад/селекторы, наследование — отдельная категория, которую здесь закрываем явно).
const CSS = `
:host {
  all: initial;
  display: block;
  box-sizing: border-box;
  contain: content;
}
.pw-widget, .pw-widget *, .pw-widget *::before, .pw-widget *::after {
  box-sizing: inherit;
}
.pw-widget {
  min-width: 0;
  overflow-wrap: anywhere;
  background: var(--pw-surface, #ffffff);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--pw-ink, #000000);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pw-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pw-card {
  min-width: 0;
  border: 1px solid var(--pw-edge, #767676);
  border-radius: 8px;
  padding: 16px;
  background: var(--pw-surface, #ffffff);
}
.pw-text {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.pw-author {
  min-width: 0;
  flex-wrap: wrap;
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--pw-ink, #000000);
}
.pw-author-role {
  font-weight: 400;
  color: var(--pw-ink, #000000);
}
.pw-transcript-label {
  margin: 8px 0 0;
  font-size: 12px;
  font-style: italic;
  color: var(--pw-ink, #000000);
}
.pw-shot { display:block; width:100%; height:auto; max-height:320px; object-fit:contain;
  margin:10px 0; border-radius:8px; border:1px solid #e4e6ee; background:#fff; }
.pw-origin { margin:6px 0 0; font-size:12px; color:var(--pw-ink, #000000); }
.pw-origin a { color:var(--pw-accent-text, #c8492f); text-decoration:underline; }
.pw-widget a:focus-visible { outline:2px solid var(--pw-ink, #000000); outline-offset:3px; box-shadow:0 0 0 2px var(--pw-surface, #fff); }
.pw-origin a:hover { text-decoration:underline; }
.pw-photo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
  flex: none;
  background: #eee;
}
.pw-badge-slot {
  display: flex;
}
.pw-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--pw-ink, #000000);
  text-decoration: none;
  padding: 4px 0;
}
.pw-badge:hover {
  color: var(--pw-ink, #000000);
  text-decoration: underline;
}
`;

/** Pseudocode.md §3 `injectScopedStyles(host)` — вызывается сразу после attachShadow. */
export function injectScopedStyles(root: ShadowRoot): void {
  // Adoption разрешён только для stylesheet из того же Document, включая iframe.
  const Sheet = root.ownerDocument.defaultView?.CSSStyleSheet;
  if (Sheet && typeof Sheet.prototype.replaceSync === 'function' && 'adoptedStyleSheets' in root) {
    const sheet = new Sheet();
    sheet.replaceSync(CSS);
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    return;
  }
  // Legacy capability fallback. Без этих API strict CSP не поддерживается;
  // docs/embed-contract.md явно ограничивает контракт современными браузерами.
  // Ошибку поддерживаемой adoption не скрываем переходом к inline стилям.
  const style = root.ownerDocument.createElement('style');
  style.textContent = CSS;
  root.appendChild(style);
}
