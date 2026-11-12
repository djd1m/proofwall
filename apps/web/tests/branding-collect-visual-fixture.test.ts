// @vitest-environment jsdom
import React, { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL as NodeURL } from 'node:url';
import type { BrandingViewModel } from '../src/app/dashboard/[slug]/branding/branding-view';
import type { CollectViewModel } from '../src/app/f/[slug]/collect-view';
const { BrandingView } = await import('../src/app/dashboard/[slug]/branding/branding-view.tsx' as string) as typeof import('../src/app/dashboard/[slug]/branding/branding-view');
const { CollectView } = await import('../src/app/f/[slug]/collect-view.tsx' as string) as typeof import('../src/app/f/[slug]/collect-view');

const root = fileURLToPath(new NodeURL('../../../', import.meta.url));
const palette = { fieldBorder: '#ddd3c2', fieldFill: '#f7f4eb', cardSurface: '#fffdf8', accentFill: '#c8492f', onAccent: '#ffffff', accentText: '#c8492f' };

const brandingModel = (): BrandingViewModel => ({
  projectName: 'Тестовая стена', wallHref: '/w/test', backHref: '/dashboard/test', homeHref: '/', palette,
  values: { theme: 'light', review_order: 'newest', show_platform_labels: true, accent_color: '#c8492f', logo_url: '', heading: 'Оставьте отзыв' },
  orderOptions: [{ value: 'newest', label: 'Сначала свежие' }, { value: 'oldest', label: 'Сначала старые' }],
  orderHint: 'Порядок на стене', logoHint: 'Только HTTPS.',
});
const collectModel = (): CollectViewModel => ({
  headingLines: ['Оставьте', 'отзыв'], intro: 'Без регистрации', homeHref: '/', palette,
  tabs: [], values: { name: '', role: '', text: '' }, photoHint: 'JPEG, PNG или WebP, до 5 МБ', disclosure: 'После проверки владельцем',
});

async function withDom(test: (render: (node: React.ReactElement) => Promise<void>, host: HTMLDivElement) => Promise<void>) {
  const host = document.createElement('div');
  document.body.append(host);
  const domRoot = createRoot(host);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  try { await test(node => act(async () => { domRoot.render(node); }), host); }
  finally {
    try { await act(async () => { domRoot.unmount(); }); }
    finally { host.remove(); vi.unstubAllGlobals(); }
  }
}

function element<T extends HTMLElement>(host: HTMLElement, selector: string): T {
  const node = host.querySelector<T>(selector);
  expect(node, selector).not.toBeNull();
  return node!;
}

async function changeValue(node: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'value')!.set!;
  await act(async () => {
    setter.call(node, value);
    node.dispatchEvent(new Event(node instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  });
}

function expectFieldError(host: HTMLElement, id: string, message: string, hint?: string) {
  const field = element<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(host, `#${id}`);
  expect(field.getAttribute('aria-invalid')).toBe('true');
  const errorId = `${id}-error`;
  const relations = field.getAttribute('aria-describedby')?.split(' ') || [];
  expect(relations).toContain(errorId);
  expect(element(host, `#${errorId}`).textContent).toBe(message);
  expect(element(host, `[role="alert"] a[href="#${id}"]`).textContent).toBe(message);
  if (hint) { expect(relations).toContain(hint); expect(element(host, `#${hint}`).textContent).not.toBe(''); }
  if (id === 'cab-color-text') expect(field.getAttribute('aria-label')).toBe('Цвет в формате HEX');
  else expect([...field.labels || []].some(label => label.control === field)).toBe(true);
}

describe('offline production views', () => {
  it('production views render frozen models offline', () => {
    const temporary = mkdtempSync(path.join(root, '.secrets/branding-fixture-test-'));
    const output = path.join(temporary, 'render');
    try {
      execFileSync(process.execPath, [path.join(root, 'scripts/render-branding-collect-fixture.mjs'), '--output', output], { cwd: root, env: { PATH: path.dirname(process.execPath), LANG: 'C.UTF-8', TZ: 'UTC', NODE_ENV: 'test' }, stdio: 'pipe' });
      const branding = readFileSync(path.join(output, 'branding.html'), 'utf8');
      const collect = readFileSync(path.join(output, 'collect.html'), 'utf8');
      const identity = JSON.parse(readFileSync(path.join(output, 'identity.json'), 'utf8'));
      expect(identity.inputs.map((input: { path: string }) => input.path).sort()).toEqual([
        'apps/web/src/app/dashboard/[slug]/branding/branding-view.tsx',
        'apps/web/src/app/f/[slug]/collect-view.tsx',
      ]);
      expect(identity.hydrated).toBe(false);
      expect(branding).toContain('Тихий берег · демо');
      expect(branding).toContain('Сначала с высокой оценкой');
      expect(branding).toContain('--field-border:#ddd3c2');
      expect(collect).toContain('Оставьте<br/>отзыв');
      expect(collect).toContain('Демонстрационная форма:');
      expect(collect).toContain('cab-photo-hint');
      for (const html of [branding, collect]) {
        expect(html).not.toMatch(/<script|\/api\/|isFixture|__fixture/);
        expect(html).toMatch(/novalidate=""/i);
      }
      const routes = (dir: string): string[] => readdirSync(dir).flatMap(name => {
        const p = path.join(dir, name);
        return statSync(p).isDirectory() ? routes(p) : [p];
      });
      expect(routes(path.join(root, 'apps/web/src/app')).filter(p => /fixture/i.test(p))).toEqual([]);
      expect(existsSync(path.join(output, 'proofo/body.woff2'))).toBe(true);
    } finally { rmSync(temporary, { recursive: true, force: true }); }
  });

  it('renders explicit live state through the same views', () => {
    const model: BrandingViewModel = { projectName: '<script>unsafe</script>', wallHref: '/w/test', backHref: '/dashboard/test', homeHref: '/', palette: { ...palette, fieldBorder: '#8e806b' }, values: { theme: 'light', review_order: 'newest', show_platform_labels: true, accent_color: '#c8492f', logo_url: 'http://legacy.test/logo', heading: 'Отзыв' }, orderOptions: [{ value: 'newest', label: 'Сначала свежие' }], orderHint: 'Порядок на стене', logoHint: 'Только HTTPS.', busy: true, status: 'Сохранение…' };
    const html = renderToStaticMarkup(React.createElement(BrandingView, { model }));
    expect(html).toContain('&lt;script&gt;unsafe&lt;/script&gt;');
    expect(html).toContain('<fieldset disabled="">');
    expect(html).toContain('--field-border:#8e806b');
    expect(html).not.toContain('Сначала с высокой оценкой');
    expect(html.indexOf('</fieldset>')).toBeLessThan(html.indexOf('role="status"'));
    const collect: CollectViewModel = { headingLines: ['Отзыв'], intro: 'Без регистрации', homeHref: '/', palette, tabs: [], values: { name: ` ${'я'.repeat(80)} `, role: 'роль', text: ' '.repeat(10) }, photoHint: 'До 5 МБ', disclosure: 'После проверки владельцем', errors: { name: 'Проверьте имя' } };
    const form = renderToStaticMarkup(React.createElement(CollectView, { model: collect }));
    expect(form).toContain(`value=" ${'я'.repeat(80)} "`);
    expect(form).not.toMatch(/maxLength|maxlength/);
    expect(form).toContain('aria-invalid="true"');
    expect(form).toContain('aria-describedby="cab-name-error"');
    expect(form).toContain('id="cab-name-error"');
    expect(form).toContain('href="#cab-name"');
    expect(form).not.toContain('Записать видео');
  });
});

describe('production view DOM contracts', () => {
  it('binds every branding control and submits the actual form', async () => {
    await withDom(async (render, host) => {
      const onChange = vi.fn();
      const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
      await render(React.createElement(BrandingView, { model: brandingModel(), onChange, onSubmit }));
      const changes = [
        ['cab-theme', 'dark', 'theme'], ['cab-order', 'oldest', 'review_order'],
        ['cab-color', '#123456', 'accent_color'], ['cab-color-text', '#abcdef', 'accent_color'],
        ['cab-logo', 'https://example.test/logo.png', 'logo_url'], ['cab-form-title', 'Новый заголовок', 'heading'],
      ] as const;
      for (const [id, value, key] of changes) {
        await changeValue(element(host, `#${id}`), value);
        expect(onChange).toHaveBeenLastCalledWith(key, value);
      }
      await act(async () => { element<HTMLInputElement>(host, '#cab-labels').click(); });
      expect(onChange).toHaveBeenLastCalledWith('show_platform_labels', false);
      expect(onChange).toHaveBeenCalledTimes(7);
      const form = element<HTMLFormElement>(host, 'form');
      expect(form.noValidate).toBe(true);
      const submit = new Event('submit', { bubbles: true, cancelable: true });
      await act(async () => { form.dispatchEvent(submit); });
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(submit.defaultPrevented).toBe(true);
      expect(element(host, '#cab-color').getAttribute('aria-label')).not.toBe(element(host, '#cab-color-text').getAttribute('aria-label'));
    });
  });

  it('locks all branding settings while busy and exposes focusable status outside fieldset', async () => {
    await withDom(async (render, host) => {
      const statusRef = createRef<HTMLParagraphElement>();
      const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
      const model = brandingModel();
      await render(React.createElement(BrandingView, { model: { ...model, busy: true, status: 'Сохранение…' }, statusRef, onSubmit }));
      const controls = host.querySelectorAll('input,select,button');
      expect(controls).toHaveLength(8);
      for (const node of controls) expect(node.matches(':disabled'), node.id || node.textContent).toBe(true);
      expect(element(host, 'form').getAttribute('aria-busy')).toBe('true');
      expect(element(host, 'button[type="submit"]').textContent).toBe('Сохранение…');
      expect(statusRef.current).toBe(host.querySelector('[role="status"]'));
      expect(statusRef.current?.closest('fieldset')).toBeNull();
      expect(statusRef.current?.getAttribute('aria-live')).toBe('polite');
      expect(statusRef.current?.textContent).toBe('Сохранение…');
      statusRef.current?.focus();
      expect(document.activeElement).toBe(statusRef.current);
      await act(async () => { element<HTMLButtonElement>(host, 'button[type="submit"]').click(); });
      expect(onSubmit).not.toHaveBeenCalled();
      await render(React.createElement(BrandingView, { model: { ...model, status: 'Сохранено' }, statusRef, onSubmit }));
      for (const node of host.querySelectorAll('input,select,button')) expect(node.matches(':disabled')).toBe(false);
      expect(element(host, 'form').hasAttribute('aria-busy')).toBe(false);
      expect(statusRef.current?.textContent).toBe('Сохранено');
      expect(element(host, 'button[type="submit"]').textContent).toBe('Сохранить');
    });
  });

  it('connects every branding error to its field and focusable summary, then clears errors', async () => {
    await withDom(async (render, host) => {
      const errorRef = createRef<HTMLDivElement>();
      const model = brandingModel();
      const errors = { theme: 'Тема неверна', review_order: 'Порядок неверен', show_platform_labels: 'Метки неверны', accent_color: 'HEX неверен', logo_url: 'Нужен HTTPS', heading: 'Нужен заголовок' };
      await render(React.createElement(BrandingView, { model: { ...model, values: { ...model.values, accent_color: 'invalid' }, errors, error: 'Сохранение отклонено' }, errorRef }));
      expect(errorRef.current).toBe(host.querySelector('[role="alert"]'));
      expect(errorRef.current?.textContent).toContain('Сохранение отклонено');
      expect(errorRef.current?.querySelectorAll('a')).toHaveLength(6);
      errorRef.current?.focus();
      expect(document.activeElement).toBe(errorRef.current);
      expectFieldError(host, 'cab-theme', errors.theme);
      expectFieldError(host, 'cab-order', errors.review_order, 'cab-order-hint');
      expectFieldError(host, 'cab-labels', errors.show_platform_labels);
      expectFieldError(host, 'cab-color-text', errors.accent_color, 'cab-color-hint');
      const color = element<HTMLInputElement>(host, '#cab-color');
      expect(color.value).toBe('#000000');
      expect(color.getAttribute('aria-invalid')).toBe('true');
      expect(color.getAttribute('aria-describedby')).toBe('cab-color-hint cab-color-text-error');
      expectFieldError(host, 'cab-logo', errors.logo_url, 'cab-logo-hint');
      expectFieldError(host, 'cab-form-title', errors.heading);
      await render(React.createElement(BrandingView, { model, errorRef }));
      expect(errorRef.current).toBeNull();
      expect(host.querySelector('[aria-invalid]')).toBeNull();
      expect(host.querySelector('[role="alert"]')).toBeNull();
      expect(element(host, '#cab-logo').getAttribute('aria-describedby')).toBe('cab-logo-hint');
      expect(element<HTMLInputElement>(host, '#cab-color').value).toBe('#c8492f');
    });
  });

  it('binds raw collect values, submit, selected photo and remove through real DOM events', async () => {
    await withDom(async (render, host) => {
      const model = collectModel();
      const onChange = vi.fn();
      const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
      const receivedPhotos: File[][] = [];
      const onPhoto: React.ChangeEventHandler<HTMLInputElement> = event => { receivedPhotos.push(Array.from(event.currentTarget.files || [])); };
      const onRemovePhoto = vi.fn();
      const photoRef = createRef<HTMLInputElement>();
      const props = { onChange, onSubmit, onPhoto, onRemovePhoto, photoRef };
      await render(React.createElement(CollectView, { model, ...props }));
      const changes = [['cab-name', 'name', ` ${'я'.repeat(80)} `], ['cab-role', 'role', ' роль '], ['cab-review', 'text', ' '.repeat(10)]] as const;
      for (const [id, key, value] of changes) {
        await changeValue(element(host, `#${id}`), value);
        expect(onChange).toHaveBeenLastCalledWith(key, value);
      }
      expect(onChange).toHaveBeenCalledTimes(3);
      for (const [id, name] of [['cab-name', 'author_name'], ['cab-role', 'author_role'], ['cab-review', 'text']]) {
        const field = element<HTMLInputElement>(host, `#${id}`);
        expect(field.name).toBe(name);
        expect(field.hasAttribute('maxlength')).toBe(false);
        expect([...field.labels || []].some(label => label.control === field)).toBe(true);
      }
      expect(element<HTMLInputElement>(host, '#cab-name').required).toBe(true);
      expect(element<HTMLTextAreaElement>(host, '#cab-review').required).toBe(true);
      expect(element<HTMLInputElement>(host, '#cab-role').required).toBe(false);
      expect(photoRef.current).toBe(host.querySelector('#cab-photo'));
      expect(photoRef.current?.accept).toBe('image/jpeg,image/png,image/webp');
      const photo = new File(['synthetic-image'], 'synthetic.png', { type: 'image/png' });
      Object.defineProperty(photoRef.current!, 'files', { configurable: true, value: [photo] });
      await act(async () => { photoRef.current!.dispatchEvent(new Event('change', { bubbles: true })); });
      expect(receivedPhotos).toEqual([[photo]]);
      const submit = new Event('submit', { bubbles: true, cancelable: true });
      const form = element<HTMLFormElement>(host, 'form');
      expect(form.noValidate).toBe(true);
      await act(async () => { form.dispatchEvent(submit); });
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(submit.defaultPrevented).toBe(true);
      await render(React.createElement(CollectView, { model: { ...model, values: { name: changes[0][2], role: changes[1][2], text: changes[2][2] }, photoName: photo.name, photoPreview: 'data:image/png;base64,c3ludGhldGlj' }, ...props }));
      expect(element(host, '.cab-photo-preview span').textContent).toBe(photo.name);
      expect(element<HTMLImageElement>(host, '.cab-photo-preview img').getAttribute('src')).toBe('data:image/png;base64,c3ludGhldGlj');
      expect(element(host, '.cab-counter').textContent).toBe('10 / 2000');
      expect(element<HTMLInputElement>(host, '#cab-name').value).toBe(changes[0][2]);
      await act(async () => { element<HTMLButtonElement>(host, '.cab-photo-preview button').click(); });
      expect(onRemovePhoto).toHaveBeenCalledTimes(1);
      await render(React.createElement(CollectView, { model, ...props }));
      expect(host.querySelector('.cab-photo-preview')).toBeNull();
    });
  });

  it('links collect errors, locks pending controls, and replaces the form with focusable success', async () => {
    await withDom(async (render, host) => {
      const model = collectModel();
      const errorRef = createRef<HTMLDivElement>();
      const statusRef = createRef<HTMLParagraphElement>();
      const successRef = createRef<HTMLDivElement>();
      const photoRef = createRef<HTMLInputElement>();
      const refs = { errorRef, statusRef, successRef, photoRef };
      const errors = { name: 'Проверьте имя', role: 'Роль слишком длинная', text: 'Проверьте текст', photo: 'Фото не принято' };
      await render(React.createElement(CollectView, { model: { ...model, errors }, ...refs }));
      expect(errorRef.current).toBe(host.querySelector('[role="alert"]'));
      expect(errorRef.current?.querySelectorAll('a')).toHaveLength(4);
      expectFieldError(host, 'cab-name', errors.name);
      expectFieldError(host, 'cab-role', errors.role);
      expectFieldError(host, 'cab-review', errors.text, 'cab-review-count');
      expectFieldError(host, 'cab-photo', errors.photo, 'cab-photo-hint');
      errorRef.current?.focus();
      expect(document.activeElement).toBe(errorRef.current);
      await render(React.createElement(CollectView, { model: { ...model, busy: true, status: 'Отправка…', photoName: 'synthetic.png' }, ...refs }));
      expect(host.querySelector('.cab-photo-preview img')).toBeNull();
      expect(errorRef.current).toBeNull();
      expect(host.querySelector('[aria-invalid]')).toBeNull();
      const controls = host.querySelectorAll('input,textarea,button');
      expect(controls).toHaveLength(6);
      for (const node of controls) expect(node.matches(':disabled')).toBe(true);
      expect(element(host, 'form').getAttribute('aria-busy')).toBe('true');
      expect(element(host, 'button[type="submit"]').textContent).toBe('Отправка…');
      expect(statusRef.current).toBe(host.querySelector('[role="status"]'));
      expect(statusRef.current?.closest('fieldset')).toBeNull();
      expect(statusRef.current?.textContent).toBe('Отправка…');
      expect(statusRef.current?.getAttribute('aria-live')).toBe('polite');
      statusRef.current?.focus();
      expect(document.activeElement).toBe(statusRef.current);
      await render(React.createElement(CollectView, { model: { ...model, error: 'Сеть недоступна' }, ...refs }));
      expect(errorRef.current?.textContent).toBe('Сеть недоступна');
      expect(element(host, 'input').matches(':disabled')).toBe(false);
      await render(React.createElement(CollectView, { model: { ...model, success: 'Спасибо! Отзыв ожидает проверки.', logoUrl: '/synthetic-logo.png', notice: 'Синтетический тест', tabs: [{ href: '/text', label: 'Текст', current: true }, { href: '/video', label: 'Видео' }] }, ...refs }));
      expect(host.querySelector('form')).toBeNull();
      expect(errorRef.current).toBeNull();
      expect(statusRef.current).toBeNull();
      expect(photoRef.current).toBeNull();
      expect(successRef.current).toBe(host.querySelector('.cab-thanks'));
      expect(successRef.current?.getAttribute('role')).toBe('status');
      expect(successRef.current?.getAttribute('aria-live')).toBe('polite');
      expect(successRef.current?.textContent).toBe('Спасибо! Отзыв ожидает проверки.');
      successRef.current?.focus();
      expect(document.activeElement).toBe(successRef.current);
      expect(element<HTMLImageElement>(host, '.cab-logo').alt).toBe('Логотип проекта');
      expect(element(host, '.cab-collect-tabs a[href="/text"]').getAttribute('aria-current')).toBe('page');
      expect(element(host, '.cab-collect-tabs a[href="/video"]').hasAttribute('aria-current')).toBe(false);
      expect(element(host, '.cab-small').textContent).toBe('Синтетический тест');
      expect(host.querySelectorAll('h1 br')).toHaveLength(1);
    });
  });
});
