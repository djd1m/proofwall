import React, { type CSSProperties, type FormEventHandler, type Ref } from 'react';

export type BrandingViewModel = {
  projectName: string;
  wallHref: string;
  wallLinkLabel?: string;
  backHref: string;
  homeHref: string;
  palette: { fieldBorder: string; fieldFill: string; cardSurface: string; accentFill: string; onAccent: string; accentText: string };
  values: { theme: string; review_order: string; show_platform_labels: boolean; accent_color: string; logo_url: string; heading: string };
  orderOptions: { value: string; label: string }[];
  themeOptions?: { value: string; label: string }[];
  orderHint: string;
  logoHint: string;
  busy?: boolean;
  errors?: Partial<Record<keyof BrandingViewModel['values'], string>>;
  error?: string;
  status?: string;
};

type Props = {
  model: BrandingViewModel;
  onChange?: <K extends keyof BrandingViewModel['values']>(key: K, value: BrandingViewModel['values'][K]) => void;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  statusRef?: Ref<HTMLParagraphElement>;
  errorRef?: Ref<HTMLDivElement>;
};

/** Stateless production markup, also rendered by the offline visual tool. */
export function BrandingView({ model: m, onChange, onSubmit, statusRef, errorRef }: Props) {
  const ids = { theme: 'cab-theme', review_order: 'cab-order', show_platform_labels: 'cab-labels', accent_color: 'cab-color-text', logo_url: 'cab-logo', heading: 'cab-form-title' };
  const error = (key: keyof typeof ids) => m.errors?.[key] ? <small id={`${ids[key]}-error`} className="cab-error">{m.errors[key]}</small> : null;
  const relations = (key: keyof typeof ids, hint?: string) => ({ 'aria-invalid': m.errors?.[key] ? true as const : undefined, 'aria-describedby': [hint, m.errors?.[key] ? `${ids[key]}-error` : ''].filter(Boolean).join(' ') || undefined });
  const style = { '--field-border': m.palette.fieldBorder, '--field-fill': m.palette.fieldFill, '--card': m.palette.cardSurface, '--accent': m.palette.accentFill, '--on-accent': m.palette.onAccent, '--accent-text': m.palette.accentText } as CSSProperties;
  return <div className="proofo-forms" style={style}><main className="cab-shell cab-narrow">
    <div className="cab-top"><a className="brand" href={m.homeHref}><span className="mark">◆</span>proofwall</a><a className="cab-back" href={m.backHref}>← кабинет</a></div>
    <article className="cab-paper"><div className="cab-title"><div><p className="cab-eyebrow">Стена отзывов</p><h1>Оформление</h1></div></div>
      <p>Стена «{m.projectName}» на <a className="cab-accent" href={m.wallHref}>{m.wallLinkLabel || 'публичной стене →'}</a>. Логотип и цвет применяются и к форме сбора, тема и порядок — к стене и виджету на вашем сайте.</p>
      <form data-cabinet="branding" noValidate onSubmit={onSubmit} aria-busy={m.busy || undefined}>
        {(m.error || Object.values(m.errors || {}).some(Boolean)) && <div className="cab-error-summary" role="alert" tabIndex={-1} ref={errorRef}>{m.error}<ul>{Object.entries(m.errors || {}).filter(([, value]) => value).map(([key, value]) => <li key={key}><a href={`#${ids[key as keyof typeof ids]}`}>{value}</a></li>)}</ul></div>}
        <fieldset disabled={m.busy}>
          <label className="cab-field" htmlFor="cab-theme">Тема стены<select id="cab-theme" value={m.values.theme} onChange={e => onChange?.('theme', e.target.value)} {...relations('theme')}>{(m.themeOptions || [{ value: 'light', label: 'Светлая — бумага' }, { value: 'dark', label: 'Тёмная' }]).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{error('theme')}</label>
          <label className="cab-field" htmlFor="cab-order">Порядок отзывов<select id="cab-order" value={m.values.review_order} onChange={e => onChange?.('review_order', e.target.value)} {...relations('review_order', 'cab-order-hint')}>{m.orderOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select><small id="cab-order-hint">{m.orderHint}</small>{error('review_order')}</label>
          <label className="cab-check" htmlFor="cab-labels"><input id="cab-labels" type="checkbox" checked={m.values.show_platform_labels} onChange={e => onChange?.('show_platform_labels', e.target.checked)} {...relations('show_platform_labels')}/>Показывать метки площадок («Avito», «Проверить на Яндекс.Картах»)</label>{error('show_platform_labels')}
          <div className="cab-field"><label htmlFor="cab-color">Цвет акцента</label><div className="cab-color"><input id="cab-color" type="color" value={/^#[0-9a-f]{6}$/i.test(m.values.accent_color) ? m.values.accent_color : '#000000'} aria-label="Выбрать цвет акцента" onChange={e => onChange?.('accent_color', e.target.value)} {...relations('accent_color', 'cab-color-hint')}/><input id="cab-color-text" type="text" value={m.values.accent_color} aria-label="Цвет в формате HEX" onChange={e => onChange?.('accent_color', e.target.value)} {...relations('accent_color', 'cab-color-hint')}/></div><small id="cab-color-hint">Аватары без фото и подсветки на стене, заголовок формы сбора.</small>{error('accent_color')}</div>
          <label className="cab-field" htmlFor="cab-logo">Логотип — ссылка на картинку<input id="cab-logo" type="url" placeholder="https://ваш-сайт.ru/logo.png" value={m.values.logo_url} onChange={e => onChange?.('logo_url', e.target.value)} {...relations('logo_url', 'cab-logo-hint')}/>{error('logo_url')}</label>
          <p className="cab-small" id="cab-logo-hint">{m.logoHint}</p>
          <label className="cab-field" htmlFor="cab-form-title">Заголовок формы сбора<input id="cab-form-title" type="text" value={m.values.heading} onChange={e => onChange?.('heading', e.target.value)} {...relations('heading')}/>{error('heading')}</label>
          <button className="cab-button cab-primary" type="submit">{m.busy ? 'Сохранение…' : 'Сохранить'}</button>
        </fieldset>
        <p className="status" role="status" aria-live="polite" tabIndex={-1} ref={statusRef}>{m.status}</p>
      </form>
    </article>
  </main></div>;
}
