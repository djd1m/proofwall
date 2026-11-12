// AC FR-002 «Брендирование владельцем» — и граница, которую оно открывает:
// значения приходят из projects.branding и попадают в атрибуты разметки.

import { describe, expect, it, vi } from 'vitest';
import { readBranding, validateBrandingPatch, brandingForeground, type Branding } from '../src/lib/branding';

describe('readBranding — дефолты', () => {
  it('пустое/отсутствующее брендирование даёт рабочие значения', () => {
    for (const input of [{}, null, undefined, 'строка', 42]) {
      const b = readBranding(input);
      expect(b.heading).toBe('Оставьте отзыв');
      expect(b.accent_color).toBe('#6701ef');
      expect(b.logo_url).toBeNull();
    }
  });

  it('заданные значения проходят', () => {
    const b = readBranding({
      heading: 'Что вы думаете о нас?',
      accent_color: '#ff5500',
      logo_url: 'https://cdn.example.com/logo.png',
      theme: 'light', review_order: 'newest', show_platform_labels: true,
    });
    expect(b).toEqual({
      heading: 'Что вы думаете о нас?',
      accent_color: '#ff5500',
      logo_url: 'https://cdn.example.com/logo.png',
      theme: 'light', review_order: 'newest', show_platform_labels: true,
    });
  });
});

describe('canonical owner settings', () => {
  it('branding rejects credential-bearing HTTPS logos without changing draft', () => {
    for (const url of ['https://synthetic:synthetic@logo.example.test/image.png', 'https://synthetic@logo.example.test/image.png',
      'https://:synthetic@logo.example.test/image.png', 'https://%73ynthetic:%70ass@logo.example.test/image.png']) {
      const result = validateBrandingPatch({ theme: 'dark', logo_url: url });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.logo_url).toContain('без имени пользователя и пароля');
    }
    expect(validateBrandingPatch({ logo_url: 'https://logo.example.test/image.png' }).ok).toBe(true);
    expect(validateBrandingPatch({ theme: 'dark' }).ok).toBe(true);
  });
  it('retains compatible three-field Branding inputs and resolves additive defaults', () => {
    const legacy: Branding = { heading: 'Legacy', logo_url: 'http://old.example/logo', accent_color: '#123456' };
    expect(readBranding(legacy)).toMatchObject({ ...legacy, theme: 'light', review_order: 'newest', show_platform_labels: true });
    expect(readBranding({ theme: 'dark', review_order: 'oldest', show_platform_labels: false })).toMatchObject({ theme: 'dark', review_order: 'oldest', show_platform_labels: false });
    expect(readBranding({ theme: 'unknown', review_order: 'rating', show_platform_labels: 0 })).toMatchObject({ theme: 'light', review_order: 'newest', show_platform_labels: true });
  });
  it('branding patch rejects forbidden and malformed values', () => {
    for (const input of [null, [], '', {}, { name: 'forbidden' }, { tier: 'paid' },
      { heading: '' }, { heading: ' '.repeat(5) }, { heading: 'h'.repeat(121) },
      { heading: 'a\u0000b' }, { heading: '\ud800' }, { heading: '\udc00' },
      { theme: 'system' }, { review_order: 'rating' }, { show_platform_labels: 1 },
      { accent_color: '#fff' }, { accent_color: 'red;display:none' },
      { logo_url: 'http://old.example/logo' }, { logo_url: 42 },
      { logo_url: 'https://example.test/' + 'x'.repeat(2048) },
      { theme: 'dark', tier: 'paid' }]) {
      expect(validateBrandingPatch(input).ok, JSON.stringify(input)).toBe(false);
    }
    for (const input of [{ theme: 'dark' }, { heading: '🙂'.repeat(60) }, { logo_url: null },
      { logo_url: '' }, { accent_color: '#AbCdEf' }, { show_platform_labels: false },
      { review_order: 'oldest' }, { logo_url: 'https://example.test/logo' }]) {
      expect(validateBrandingPatch(input).ok).toBe(true);
    }
    expect(validateBrandingPatch({ logo_url: '' })).toEqual({ ok: true, patch: { logo_url: null } });
  });
  it('branding contrast covers accent text and accent fill', () => {
    const lum = (hex: string) => {
      const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
      return rgb[0]! * .2126 + rgb[1]! * .7152 + rgb[2]! * .0722;
    };
    const ratio = (a: string, b: string) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
    for (const fill of ['#FFFFFF', '#000000', '#F8F8F8', '#181818', '#777777', 'invalid']) {
      const resolved = fill === 'invalid' ? '#6701ef' : fill;
      expect(ratio(brandingForeground(fill), resolved)).toBeGreaterThanOrEqual(4.5);
      for (const surface of ['#fffdf8', '#181818']) {
        expect(ratio(brandingForeground(fill, surface), surface)).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(brandingForeground('#FFFFFF', '#fffdf8')).toBe('#000000');
    expect(brandingForeground('#000000', '#181818')).toBe('#ffffff');
  });
});

async function inFormDom(run: (container: HTMLDivElement) => Promise<void>) {
  const { JSDOM } = await import('jsdom' as string);
  const React = await import('react');
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://127.0.0.1:33187' });
  const globals: Record<string, unknown> = { window: dom.window, document: dom.window.document,
    navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, HTMLInputElement: dom.window.HTMLInputElement,
    HTMLTextAreaElement: dom.window.HTMLTextAreaElement, Event: dom.window.Event, File: dom.window.File,
    FormData: dom.window.FormData, React, IS_REACT_ACT_ENVIRONMENT: true };
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  try { await run(dom.window.document.getElementById('root') as HTMLDivElement); }
  finally {
    for (const key of Object.keys(globals)) {
      const descriptor = previous.get(key);
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
    dom.window.close(); vi.unstubAllGlobals();
  }
}

it('branding controller retains draft through pending failures and retry', async () => {
  await inFormDom(async container => {
    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { BrandingEditor } = await import('../src/app/dashboard/[slug]/branding/branding-editor.tsx' as string);
    const root = createRoot(container);
    const original = readBranding({ logo_url: 'http://old.example/logo' });
    let resume: (response: Response) => void = () => {};
    const fetcher = vi.fn(() => new Promise<Response>(ok => { resume = ok; })); vi.stubGlobal('fetch', fetcher);
    const input = (id: string) => container.querySelector<HTMLInputElement>('#' + id)!;
    const update = async (id: string, value: string) => React.act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input(id), value);
      input(id).dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    const submit = async () => React.act(async () => { container.querySelector('form')!.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); });
    try {
      await React.act(async () => root.render(React.createElement(BrandingEditor, { slug: 'test', branding: original })));
      expect(container.querySelector<HTMLElement>('.proofo-forms')!.style.getPropertyValue('--field-border')).toBe('#8e806b');
      await submit(); expect(fetcher).not.toHaveBeenCalled(); expect(document.activeElement?.getAttribute('role')).toBe('alert');
      await update('cab-logo', 'http://edited.example/logo'); await submit(); expect(input('cab-logo').getAttribute('aria-invalid')).toBe('true'); expect(fetcher).not.toHaveBeenCalled();
      for (const value of ['https://synthetic@logo.example.test/image.png', 'https://%73ynthetic:%70ass@logo.example.test/image.png']) {
        await update('cab-logo', value); await submit();
        expect(fetcher).not.toHaveBeenCalled(); expect(input('cab-logo').value).toBe(value);
        expect(input('cab-logo').getAttribute('aria-invalid')).toBe('true');
        expect(input('cab-logo').getAttribute('aria-describedby')).toContain('cab-logo-error');
        expect(container.querySelector('#cab-logo-error')?.textContent).toContain('без имени пользователя и пароля');
        expect(document.activeElement?.getAttribute('role')).toBe('alert');
      }
      await update('cab-logo', original.logo_url!); await update('cab-form-title', 'Retained draft'); await submit();
      expect(fetcher).toHaveBeenCalledTimes(1); expect(JSON.parse((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toEqual({ heading: 'Retained draft' });
      expect(container.querySelector('fieldset')!.disabled).toBe(true); expect(document.activeElement?.getAttribute('role')).toBe('status');
      await submit(); expect(fetcher).toHaveBeenCalledTimes(1);
      await React.act(async () => resume(new Response(JSON.stringify({ error: 'Synthetic failure' }), { status: 503 })));
      expect(input('cab-form-title').value).toBe('Retained draft'); expect(container.querySelector('fieldset')!.disabled).toBe(false); expect(document.activeElement?.getAttribute('role')).toBe('alert');
      await submit(); await React.act(async () => resume(new Response(JSON.stringify({ branding: { ...original, heading: 'Retained draft' } }), { status: 200 })));
      expect(container.textContent).toContain('Настройки сохранены.'); expect(document.activeElement?.getAttribute('role')).toBe('status');
      await update('cab-form-title', 'Network draft'); fetcher.mockImplementationOnce(() => Promise.reject(new Error('synthetic network'))); await submit(); expect(container.textContent).toContain('Сеть недоступна'); expect(input('cab-form-title').value).toBe('Network draft');
    } finally { await React.act(async () => root.unmount()); }
  });
});

it('collect controller validates raw boundaries and announces only 201 success', async () => {
  await inFormDom(async container => {
    const React = await import('react'), { createRoot } = await import('react-dom/client');
    const { SubmitForm } = await import('../src/app/f/[slug]/submit-form.tsx' as string);
    const root = createRoot(container), fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const update = async (id: string, value: string) => React.act(async () => {
      const element = container.querySelector<HTMLInputElement | HTMLTextAreaElement>('#' + id)!;
      const prototype = element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value);
      element.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    const submit = async () => React.act(async () => { container.querySelector('form')!.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); });
    try {
      await React.act(async () => root.render(React.createElement(SubmitForm, { slug: 'test', branding: readBranding({}) })));
      expect(container.querySelector<HTMLElement>('.proofo-forms')!.style.getPropertyValue('--field-border')).toBe('#8e806b');
      await submit(); expect(fetcher).not.toHaveBeenCalled(); expect(document.activeElement?.getAttribute('role')).toBe('alert');
      await update('cab-name', ' ' + 'я'.repeat(80) + ' '); await update('cab-role', ' '.repeat(121)); await update('cab-review', ' '.repeat(10)); await submit(); expect(fetcher).not.toHaveBeenCalled();
      await update('cab-role', ' '.repeat(120));
      for (const status of [200, 400, 429, 503]) {
        fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Synthetic rejection', errors: ['text: Synthetic invalid text'] }), { status }));
        await submit(); expect(container.querySelector('.cab-thanks')).toBeNull(); expect(document.activeElement?.getAttribute('role')).toBe('alert');
        expect(container.querySelector<HTMLInputElement>('#cab-name')!.value).toHaveLength(82);
        expect(container.querySelector('fieldset')!.disabled).toBe(false);
      }
      fetcher.mockRejectedValueOnce(new Error('synthetic network')); await submit(); expect(container.textContent).toContain('Сеть недоступна');
      let resume: (response: Response) => void = () => {};
      fetcher.mockImplementationOnce(() => new Promise<Response>(ok => { resume = ok; })); await submit();
      expect(container.querySelector('fieldset')!.disabled).toBe(true); expect(document.activeElement?.getAttribute('role')).toBe('status');
      await React.act(async () => resume(new Response('{}', { status: 201 })));
      expect(container.querySelector('.cab-thanks')).not.toBeNull(); expect(document.activeElement?.getAttribute('role')).toBe('status');
      const sent = JSON.parse(fetcher.mock.calls[0]![1].body); expect(sent.name).toHaveLength(82); expect(sent.text).toBe(' '.repeat(10));
    } finally { await React.act(async () => root.unmount()); }
  });
});

it('collect photo checks signatures handles read failures and releases each preview', async () => {
  await inFormDom(async container => {
    const React = await import('react'), { createRoot } = await import('react-dom/client');
    const { SubmitForm } = await import('../src/app/f/[slug]/submit-form.tsx' as string);
    const root = createRoot(container), fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const created = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:synthetic-preview');
    const revoked = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = (mime = 'image/png', body = bytes) => {
      const photo = new File([body], 'synthetic.png', { type: mime });
      Object.defineProperty(photo, 'arrayBuffer', { configurable: true, value: async () => body.buffer }); return photo;
    };
    const pick = async (photo: File | null) => React.act(async () => {
      const input = container.querySelector<HTMLInputElement>('#cab-photo')!;
      Object.defineProperty(input, 'files', { configurable: true, value: photo ? [photo] : [] });
      input.dispatchEvent(new window.Event('change', { bubbles: true }));
    });
    const update = async (id: string, value: string) => React.act(async () => {
      const element = container.querySelector<HTMLInputElement | HTMLTextAreaElement>('#' + id)!;
      const proto = element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(element, value); element.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    try {
      await React.act(async () => root.render(React.createElement(SubmitForm, { slug: 'test', branding: readBranding({}) })));
      for (const invalid of [file('image/svg+xml'), file('image/jpeg'), file('image/png', new Uint8Array()), file('image/png', new Uint8Array(5 * 1024 * 1024 + 1))]) {
        await pick(invalid); expect(container.querySelector('.cab-error-summary')).not.toBeNull(); expect(container.querySelector('.cab-photo-preview')).toBeNull();
      }
      const unreadable = file(); Object.defineProperty(unreadable, 'arrayBuffer', { configurable: true, value: () => Promise.reject(new Error('synthetic read fault')) });
      await pick(unreadable); expect(container.textContent).toContain('Не удалось прочитать фото.');
      await pick(file()); expect(container.querySelector('.cab-photo-preview')).not.toBeNull(); expect(created).toHaveBeenCalledTimes(1);
      await pick(file()); expect(revoked).toHaveBeenCalledTimes(1);
      await React.act(async () => { container.querySelector<HTMLButtonElement>('.cab-photo-preview button')!.click(); });
      expect(container.querySelector('.cab-photo-preview')).toBeNull(); expect(revoked).toHaveBeenCalledTimes(2);
      await update('cab-name', 'Автор'); await update('cab-review', 'Отзыв без изменений');
      const pending = file(); let finishRead: (value: ArrayBuffer) => void = () => {};
      Object.defineProperty(pending, 'arrayBuffer', { value: () => new Promise<ArrayBuffer>(ok => { finishRead = ok; }) });
      await pick(pending); expect(container.textContent).toContain('Проверка фото…');
      await pick(null); fetcher.mockResolvedValueOnce(new Response('{}', { status: 400 }));
      await React.act(async () => { container.querySelector('form')!.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); });
      expect(fetcher).toHaveBeenCalledTimes(1);
      await React.act(async () => finishRead(bytes.buffer)); expect(container.querySelector('.cab-photo-preview')).toBeNull();
      await pick(file());
      fetcher.mockResolvedValueOnce(new Response('{}', { status: 201 }));
      await React.act(async () => { container.querySelector('form')!.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); });
      const sent = fetcher.mock.calls.at(-1)![1].body as FormData;
      expect(sent.get('photo')).toBeInstanceOf(File); expect(sent.get('text')).toBe('Отзыв без изменений');
      expect(container.querySelector('.cab-thanks')).not.toBeNull(); expect(revoked).toHaveBeenCalledTimes(3);
    } finally { await React.act(async () => root.unmount()); created.mockRestore(); revoked.mockRestore(); }
  });
});

it('owner branding and collect pages enforce ordinary ownership and public lookup', async () => {
  await inFormDom(async container => {
    const React = await import('react'), { createRoot } = await import('react-dom/client');
    let account: string | null = 'synthetic-owner';
    let owned: { slug: string; branding: ReturnType<typeof readBranding> } | null = { slug: 'test', branding: readBranding({ heading: 'Public heading' }) };
    let publicProject: { slug: string; branding: unknown } | null = { slug: 'test', branding: { heading: 'Public heading' } };
    const lookup = vi.fn(async () => owned);
    vi.doMock('../src/lib/current-session', () => ({ currentAccountId: async () => account }));
    vi.doMock('../src/lib/project-branding', () => ({ readOwnedBranding: lookup }));
    vi.doMock('../src/lib/project', () => ({ findProjectBySlug: async () => publicProject }));
    const { default: BrandingPage } = await import('../src/app/dashboard/[slug]/branding/page.tsx' as string);
    const { default: FormPage, generateMetadata } = await import('../src/app/f/[slug]/page.tsx' as string);
    const root = createRoot(container), params = { params: Promise.resolve({ slug: 'test' }) };
    try {
      await React.act(async () => root.render(await BrandingPage(params)));
      expect(lookup).toHaveBeenCalledWith('synthetic-owner', 'test'); expect(container.querySelector('#cab-theme')).not.toBeNull();
      vi.doMock('@proofwall/db', () => ({ withAccount: async (_id: string, callback: (client: { query: (sql: string) => Promise<{ rows: unknown[] }> }) => unknown) => callback({ query: async sql => ({ rows: /from projects/i.test(sql) ? [{ id: 'synthetic-project', slug: 'test', tier: 'free', paid_until: null }] : [] }) }) }));
      const { default: DashboardPage } = await import('../src/app/dashboard/[slug]/page.tsx' as string);
      const dashboard = await DashboardPage(params);
      const links: Array<{ href: string; text: unknown }> = [];
      const visit = (node: unknown) => {
        if (Array.isArray(node)) { node.forEach(visit); return; }
        if (!node || typeof node !== 'object' || !('props' in node)) return;
        const element = node as { type: unknown; props: { href?: string; children?: unknown } };
        if (element.type === 'a' && element.props.href) links.push({ href: element.props.href, text: element.props.children });
        visit(element.props.children);
      };
      visit(dashboard); expect(links).toContainEqual({ href: '/dashboard/test/branding', text: 'Оформление стены →' });
      account = null; await expect(BrandingPage(params)).rejects.toThrow('NEXT_REDIRECT');
      account = 'synthetic-owner'; owned = null; await expect(BrandingPage(params)).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
      process.env.VIDEO_INTAKE_ENABLED = 'false';
      await React.act(async () => root.render(await FormPage(params)));
      expect(container.querySelector('h1')?.textContent).toBe('Public heading'); expect(container.textContent).not.toContain('Записать видео');
      const { IntakeTabs } = await import('../src/app/f/[slug]/intake-tabs.tsx' as string);
      await React.act(async () => root.render(React.createElement(IntakeTabs, { slug: 'test', branding: readBranding({}), videoEnabled: true })));
      const videoTab = [...container.querySelectorAll<HTMLButtonElement>('[role=tab]')].find(tab => tab.textContent?.includes('Записать видео'))!;
      await React.act(async () => videoTab.click()); expect(videoTab.getAttribute('aria-selected')).toBe('true');
      await React.act(async () => container.querySelector<HTMLButtonElement>('[role=tab]')!.click()); expect(container.querySelector('#cab-name')).not.toBeNull();
      expect(await generateMetadata(params)).toMatchObject({ robots: { index: false, follow: false } });
      publicProject = null; await expect(FormPage(params)).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    } finally {
      await React.act(async () => root.unmount());
      for (const module of ['../src/lib/current-session', '../src/lib/project-branding', '../src/lib/project']) vi.doUnmock(module);
      vi.doUnmock('@proofwall/db');
    }
  });
});

describe('accent_color — попадает в атрибут style, поэтому только hex', () => {
  it.each([
    'red',
    'red;background:url(javascript:alert(1))',
    '#fff',
    '#12345',
    'expression(alert(1))',
    '',
    '#gggggg',
  ])('отклоняет %j и падает на дефолт', (value) => {
    expect(readBranding({ accent_color: value }).accent_color).toBe('#6701ef');
  });

  it('принимает корректный hex в обоих регистрах', () => {
    expect(readBranding({ accent_color: '#AbCdEf' }).accent_color).toBe('#AbCdEf');
  });
});

describe('logo_url — попадает в src, поэтому только http(s)', () => {
  it.each([
    'javascript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'не url вовсе',
    '',
    '   ',
  ])('отклоняет %j', (value) => {
    expect(readBranding({ logo_url: value }).logo_url).toBeNull();
  });

  it('принимает http и https', () => {
    expect(readBranding({ logo_url: 'https://a.example/l.png' }).logo_url).toBe('https://a.example/l.png');
    expect(readBranding({ logo_url: 'http://a.example/l.png' }).logo_url).toBe('http://a.example/l.png');
  });
});

describe('heading', () => {
  it('обрезается по длине, но НЕ экранируется — экранирует React при рендере', () => {
    const evil = '<script>alert(1)</script>';
    // Побайтовое сохранение — то же правило, что на приёме отзыва (FR-NFR-SEC-002).
    expect(readBranding({ heading: evil }).heading).toBe(evil);
    expect(readBranding({ heading: 'д'.repeat(300) }).heading).toHaveLength(120);
  });

  it('пустой заголовок падает на дефолт, а не оставляет пустую страницу', () => {
    expect(readBranding({ heading: '   ' }).heading).toBe('Оставьте отзыв');
  });
});
