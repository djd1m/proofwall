import { describe, expect, it, vi } from 'vitest';
import { applyWidgetBranding, buildSkeleton, renderTestimonials } from '../src/render';
import { renderBadge } from '../src/badge';
import { injectScopedStyles } from '../src/styles';
import type { WidgetTestimonial } from '../src/types';

function mount() {
  const host = document.createElement('div'); document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' }); injectScopedStyles(root); buildSkeleton(root);
  return root;
}
const item: WidgetTestimonial = {
  id: 'one', author_name: 'Автор', author_role: 'Роль', text: '<img src=x onerror=alert(1)>',
  source_label: 'Avito', source_url: 'https://source.example/review',
  screenshot_url: '/api/photo/project-id/shot-id.png',
  transcript: 'Без изменений', transcript_source: 'machine',
};
describe('widget branding', () => {
  it('adopts constructed styles without inline nodes and preserves existing sheets', () => {
    const host = document.createElement('div'); document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const replaceSync = vi.fn();
    class ConstructedSheet { replaceSync(css: string) { replaceSync(css); } }
    const existing = new CSSStyleSheet();
    Object.defineProperty(root, 'adoptedStyleSheets', { configurable: true, writable: true, value: [existing] });
    vi.stubGlobal('CSSStyleSheet', ConstructedSheet);
    try {
      injectScopedStyles(root);
      expect(root.querySelector('style')).toBeNull();
      expect(root.adoptedStyleSheets).toHaveLength(2);
      expect(root.adoptedStyleSheets[0]).toBe(existing);
      expect(root.adoptedStyleSheets[1]).toBeInstanceOf(ConstructedSheet);
      expect(replaceSync).toHaveBeenCalledTimes(1);
      const css = replaceSync.mock.calls[0]![0] as string;
      expect(css).toContain(':host {');
      expect(css).toContain('all: initial');
      expect(css).toContain('.pw-badge');
      expect(css).toContain('var(--pw-surface, #ffffff)');
      expect(document.querySelector('style')?.textContent || '').not.toContain('.pw-widget');
    } finally { vi.unstubAllGlobals(); host.remove(); }
  });

  it('constructs the sheet in the shadow ownerDocument realm', () => {
    const frame = document.createElement('iframe'); document.body.append(frame);
    const owner = frame.contentDocument!;
    const host = owner.createElement('div'); owner.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const replaceSync = vi.fn();
    class OwnerSheet { replaceSync(css: string) { replaceSync(css); } }
    const foreignConstructor = vi.fn(() => { throw new Error('wrong document realm'); });
    Object.defineProperty(frame.contentWindow!, 'CSSStyleSheet', { configurable: true, value: OwnerSheet });
    Object.defineProperty(root, 'adoptedStyleSheets', { configurable: true, writable: true, value: [] });
    vi.stubGlobal('CSSStyleSheet', foreignConstructor);
    try {
      injectScopedStyles(root);
      expect(foreignConstructor).not.toHaveBeenCalled();
      expect(root.adoptedStyleSheets[0]).toBeInstanceOf(OwnerSheet);
      expect(replaceSync).toHaveBeenCalledTimes(1);
      expect(root.querySelector('style')).toBeNull();
    } finally { vi.unstubAllGlobals(); frame.remove(); }
  });

  it('keeps the same CSS in the legacy unsupported-capability fallback', () => {
    const host = document.createElement('div'); document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const replaceSync = vi.fn();
    class ConstructedSheet { replaceSync(css: string) { replaceSync(css); } }
    vi.stubGlobal('CSSStyleSheet', ConstructedSheet);
    // This root deliberately lacks adoptedStyleSheets even though replaceSync exists.
    try {
      expect('adoptedStyleSheets' in root).toBe(false);
      injectScopedStyles(root);
      expect(replaceSync).not.toHaveBeenCalled();
      const style = root.querySelector('style')!;
      expect(style.ownerDocument).toBe(root.ownerDocument);
      expect(style.textContent).toContain('all: initial');
      expect(style.textContent).toContain('.pw-badge');
      expect(document.head.contains(style)).toBe(false);
    } finally { vi.unstubAllGlobals(); host.remove(); }
  });

  it('does not hide a supported adoption failure behind CSP-blocked inline styles', () => {
    const host = document.createElement('div'); document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const failure = new DOMException('adoption rejected', 'NotAllowedError');
    class ConstructedSheet { replaceSync() {} }
    Object.defineProperty(root, 'adoptedStyleSheets', { configurable: true, get: () => [], set: () => { throw failure; } });
    vi.stubGlobal('CSSStyleSheet', ConstructedSheet);
    try {
      expect(() => injectScopedStyles(root)).toThrow('adoption rejected');
      expect(root.querySelector('style')).toBeNull();
    } finally { vi.unstubAllGlobals(); host.remove(); }
  });

  it('platform labels hide names but preserve provenance', () => {
    const root = mount();
    const branding = applyWidgetBranding(root, { show_platform_labels: false });
    renderTestimonials(root, [item], 'https://proofwall.example', branding);
    renderBadge(root, true, () => {}, 'https://proofwall.example');
    expect(root.textContent).toContain('Перенесённый отзыв');
    expect(root.querySelector('.pw-origin')?.textContent).not.toContain('Avito');
    expect(root.querySelector('.pw-origin a')?.getAttribute('href')).toBe(item.source_url);
    expect(root.querySelector('.pw-origin a')?.textContent).toContain('Первоисточник');
    expect(root.querySelector('.pw-shot')?.getAttribute('src')).toBe('https://proofwall.example' + item.screenshot_url);
    expect(root.querySelector('.pw-text')?.textContent).toBe(item.text);
    expect(root.querySelector('.pw-text img')).toBeNull();
    expect(root.querySelector('.pw-badge')).not.toBeNull();
    expect(root.textContent).toContain('Машинная расшифровка видео');
    renderTestimonials(root, [{ ...item, source_url: null }], '', branding);
    expect(root.querySelector('.pw-origin')?.textContent).toBe('Перенесённый отзыв');
    renderTestimonials(root, [item]);
    expect(root.querySelector('.pw-origin')?.textContent).toContain('Avito');
  });
  it('normalizes absent and malformed network branding without CSS injection', () => {
    const root = mount();
    for (const raw of [undefined, null, [], 'bad', { theme: 'system', accent_color: 'red;display:none', show_platform_labels: 0 }]) {
      expect(applyWidgetBranding(root, raw)).toEqual({ theme: 'light', accent_color: '#c8492f', show_platform_labels: true });
    }
    expect(applyWidgetBranding(root, { accent_color: '#6701ef' }).accent_color).toBe('#6701ef');
    expect(applyWidgetBranding(root, { theme: 'dark', accent_color: '#ABCDEF', show_platform_labels: false })).toEqual({ theme: 'dark', accent_color: '#ABCDEF', show_platform_labels: false });
    expect(root.querySelector<HTMLElement>('.pw-widget')?.style.getPropertyValue('--pw-surface')).toBe('#181818');
    expect(applyWidgetBranding(document.createElement('div').attachShadow({ mode: 'open' }), {}).theme).toBe('light');
  });
  it('branding contrast covers accent text and accent fill', () => {
    const lum = (hex: string) => {
      const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
      return rgb[0]! * .2126 + rgb[1]! * .7152 + rgb[2]! * .0722;
    };
    const ratio = (a: string, b: string) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
    for (const theme of ['light', 'dark']) for (const accent_color of ['#FFFFFF', '#000000', '#F8F8F8', '#181818', '#777777']) {
      const root = mount(); applyWidgetBranding(root, { theme, accent_color });
      const style = root.querySelector<HTMLElement>('.pw-widget')!.style;
      expect(ratio(style.getPropertyValue('--pw-on-accent'), accent_color)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(style.getPropertyValue('--pw-accent-text'), style.getPropertyValue('--pw-surface'))).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('bootstrap applies server branding while keeping the required server badge', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      testimonials: [item], badge_required: true, badge_url: 'https://proofwall.example/', project_slug: 'synthetic',
      branding: { theme: 'dark', accent_color: '#FFFFFF', show_platform_labels: false },
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    document.body.replaceChildren();
    const script = document.createElement('script'); script.src = 'https://proofwall.example/widget.js'; script.dataset.slug = 'synthetic'; document.body.appendChild(script);
    try {
      const { widgetBootstrap } = await import('../src/index');
      const root = script.nextElementSibling!.shadowRoot!;
      await vi.waitFor(() => expect(root.querySelector('.pw-origin')?.textContent).toContain('Перенесённый отзыв'));
      expect(root.querySelector<HTMLElement>('.pw-widget')?.dataset.theme).toBe('dark');
      expect(root.querySelector('.pw-badge')).not.toBeNull(); expect(fetcher.mock.calls[0]![0]).toContain('/api/widget/config?slug=synthetic');
      root.querySelector<HTMLAnchorElement>('.pw-badge')!.click();
      fetcher.mockResolvedValueOnce(new Response('{}', { status: 503 })); await widgetBootstrap();
      expect(script.nextElementSibling!.shadowRoot!.querySelector('.pw-widget')!.childNodes.length).toBe(0);
      document.body.replaceChildren(); await widgetBootstrap(); expect(warn).toHaveBeenCalled();
      const empty = document.createElement('script'); empty.dataset.slug = ''; document.body.appendChild(empty); await widgetBootstrap();
    } finally { document.body.replaceChildren(); vi.clearAllTimers(); vi.useRealTimers(); warn.mockRestore(); vi.unstubAllGlobals(); }
  });
});
