import React, { type ChangeEventHandler, type CSSProperties, type FormEventHandler, type Ref } from 'react';

export type CollectViewModel = {
  headingLines: string[];
  intro: string;
  homeHref: string;
  logoUrl?: string | null;
  tabs: { label: string; href: string; current?: boolean }[];
  notice?: string;
  photoHint: string;
  disclosure: string;
  palette: { fieldBorder: string; fieldFill: string; cardSurface: string; accentFill: string; onAccent: string; accentText: string };
  values: { name: string; role: string; text: string };
  photoName?: string;
  photoPreview?: string;
  busy?: boolean;
  errors?: Partial<Record<'name' | 'role' | 'text' | 'photo', string>>;
  error?: string;
  status?: string;
  success?: string;
};

type Props = {
  model: CollectViewModel;
  onChange?: (key: keyof CollectViewModel['values'], value: string) => void;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  onPhoto?: ChangeEventHandler<HTMLInputElement>;
  onRemovePhoto?: () => void;
  statusRef?: Ref<HTMLParagraphElement>;
  errorRef?: Ref<HTMLDivElement>;
  successRef?: Ref<HTMLDivElement>;
  photoRef?: Ref<HTMLInputElement>;
};

export function CollectView({ model: m, onChange, onSubmit, onPhoto, onRemovePhoto, statusRef, errorRef, successRef, photoRef }: Props) {
  const ids = { name: 'cab-name', role: 'cab-role', text: 'cab-review', photo: 'cab-photo' };
  const error = (key: keyof typeof ids) => m.errors?.[key] ? <small id={`${ids[key]}-error`} className="cab-error">{m.errors[key]}</small> : null;
  const relations = (key: keyof typeof ids, hint?: string) => ({ 'aria-invalid': m.errors?.[key] ? true as const : undefined, 'aria-describedby': [hint, m.errors?.[key] ? `${ids[key]}-error` : ''].filter(Boolean).join(' ') || undefined });
  const style = { '--field-border': m.palette.fieldBorder, '--field-fill': m.palette.fieldFill, '--card': m.palette.cardSurface, '--accent': m.palette.accentFill, '--on-accent': m.palette.onAccent, '--accent-text': m.palette.accentText } as CSSProperties;
  return <div className="proofo-forms" style={style}><main className="cab-shell cab-collection"><article className="cab-paper">
    {m.logoUrl && <img className="cab-logo" src={m.logoUrl} alt="Логотип проекта"/>}
    <h1>{m.headingLines.map((line, i) => <React.Fragment key={i}>{i > 0 && <br/>}{line}</React.Fragment>)}</h1>
    <p className="cab-collect-intro">{m.intro}</p>
    {m.tabs.length > 0 && <div className="cab-collect-tabs">{m.tabs.map(tab => <a key={tab.href} href={tab.href} aria-current={tab.current ? 'page' : undefined}>{tab.label}</a>)}</div>}
    {m.notice && <p className="cab-small">{m.notice}</p>}
    {m.success ? <div className="cab-thanks" role="status" aria-live="polite" tabIndex={-1} ref={successRef}>{m.success}</div> : <form data-cabinet="collect" noValidate onSubmit={onSubmit} aria-busy={m.busy || undefined}>
      {(m.error || Object.values(m.errors || {}).some(Boolean)) && <div className="cab-error-summary" role="alert" tabIndex={-1} ref={errorRef}>{m.error}<ul>{Object.entries(m.errors || {}).filter(([, value]) => value).map(([key, value]) => <li key={key}><a href={`#${ids[key as keyof typeof ids]}`}>{value}</a></li>)}</ul></div>}
      <fieldset disabled={m.busy}>
        <label className="cab-field" htmlFor="cab-name">Ваше имя<input id="cab-name" name="author_name" type="text" required value={m.values.name} onChange={e => onChange?.('name', e.target.value)} {...relations('name')}/>{error('name')}</label>
        <label className="cab-field" htmlFor="cab-role">Роль или компания (необязательно)<input id="cab-role" name="author_role" type="text" value={m.values.role} onChange={e => onChange?.('role', e.target.value)} {...relations('role')}/>{error('role')}</label>
        <label className="cab-field" htmlFor="cab-review">Ваш отзыв<textarea id="cab-review" name="text" rows={5} required value={m.values.text} onChange={e => onChange?.('text', e.target.value)} {...relations('text', 'cab-review-count')}/><small id="cab-review-count" className="cab-counter">{m.values.text.length} / 2000</small>{error('text')}</label>
        <label className="cab-field" htmlFor="cab-photo">Ваше фото (необязательно)<input id="cab-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} ref={photoRef} {...relations('photo', 'cab-photo-hint')}/><small id="cab-photo-hint">{m.photoHint}</small>{error('photo')}</label>
        {m.photoName && <div className="cab-photo-preview">{m.photoPreview && <img src={m.photoPreview} alt="Выбранное фото"/>}<span>{m.photoName}</span><button type="button" onClick={onRemovePhoto} className="cab-button">Убрать фото</button></div>}
        <p className="cab-consent">{m.disclosure}</p>
        <button className="cab-button cab-primary cab-wide" type="submit">{m.busy ? 'Отправка…' : 'Отправить отзыв'}</button>
      </fieldset>
      <p className="status" role="status" aria-live="polite" tabIndex={-1} ref={statusRef}>{m.status}</p>
    </form>}
  </article><p className="cab-attribution">Отзывы собирает <a href={m.homeHref}><b>Proofwall</b></a></p></main></div>;
}
