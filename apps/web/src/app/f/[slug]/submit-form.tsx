'use client';

import { useEffect, useRef, useState } from 'react';
import { brandingForeground, type Branding } from '@/lib/branding';
import { MAX_PHOTO_BYTES, validatePhoto } from '@/lib/photo';
import { CollectView, type CollectViewModel } from './collect-view';

export function SubmitForm({ slug, branding }: { slug: string; branding: Branding }) {
  const [values, setValues] = useState({ name: '', role: '', text: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();
  const [errors, setErrors] = useState<CollectViewModel['errors']>({});
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const inFlight = useRef(false);
  const checkingPhoto = useRef(false);
  const photoRevision = useRef(0);
  const photoRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!photo) { setPreview(undefined); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => () => { photoRevision.current++; }, []);
  useEffect(() => {
    if (done) successRef.current?.focus();
    else if (error || Object.values(errors ?? {}).some(Boolean)) errorRef.current?.focus();
    else if (busy || status === 'Проверка фото…') statusRef.current?.focus();
  }, [done, busy, error, errors, status]);

  async function pickPhoto(file: File | null) {
    if (inFlight.current) return;
    const revision = ++photoRevision.current;
    setPhoto(null); setError(''); setErrors({}); setStatus(file ? 'Проверка фото…' : '');
    checkingPhoto.current = false;
    if (!file) return;
    checkingPhoto.current = true;
    try {
      const verdict = file.size > MAX_PHOTO_BYTES
        ? { ok: false, error: 'Фото больше 5 МБ — выберите файл поменьше.' }
        : validatePhoto(new Uint8Array(await file.arrayBuffer()), file.type);
      if (revision !== photoRevision.current) return;
      if (!verdict.ok) {
        setErrors({ photo: verdict.error }); setError('Выберите другое фото.'); setStatus('');
        if (photoRef.current) photoRef.current.value = '';
      } else { setPhoto(file); setStatus('Фото готово к отправке.'); }
    } catch {
      if (revision === photoRevision.current) { setErrors({ photo: 'Не удалось прочитать фото.' }); setError('Выберите другое фото.'); setStatus(''); }
    } finally { if (revision === photoRevision.current) checkingPhoto.current = false; }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || checkingPhoto.current) return;
    const invalid: NonNullable<CollectViewModel['errors']> = {};
    if (values.name.trim().length < 2 || values.name.trim().length > 80) invalid.name = 'Имя: от 2 до 80 символов без крайних пробелов.';
    if (values.role.length > 120) invalid.role = 'Роль: не длиннее 120 символов.';
    if (values.text.length < 10 || values.text.length > 2000) invalid.text = 'Отзыв: от 10 до 2000 символов.';
    setErrors(invalid); setError(''); setStatus('');
    if (Object.keys(invalid).length) { setError('Проверьте указанные поля.'); return; }
    inFlight.current = true; setBusy(true); setStatus('Отправка отзыва…');
    try {
      let response: Response;
      if (photo) {
        const body = new FormData();
        body.set('slug', slug); body.set('type', 'text');
        body.set('name', values.name); body.set('role', values.role); body.set('text', values.text);
        body.set('photo', photo, photo.name);
        response = await fetch('/api/testimonials', { method: 'POST', body });
      } else response = await fetch('/api/testimonials', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, type: 'text', ...values }),
      });
      if (response.status === 201) { setDone(true); setPhoto(null); return; }
      const body = await response.json().catch(() => ({})) as { error?: string; errors?: string[] };
      const fieldErrors: NonNullable<CollectViewModel['errors']> = {};
      for (const message of Array.isArray(body.errors) ? body.errors : []) {
        const key = message.split(':')[0];
        if (key === 'name' || key === 'role' || key === 'text' || key === 'photo') fieldErrors[key] = message;
      }
      setErrors(fieldErrors);
      setError(response.status === 429 ? 'Слишком много отправок с этого адреса. Попробуйте позже.'
        : body.error ?? body.errors?.join(' ') ?? `Не удалось отправить отзыв. Ошибка ${response.status}.`);
    } catch { setError('Сеть недоступна — попробуйте ещё раз.'); }
    finally { inFlight.current = false; setBusy(false); setStatus(''); }
  }

  const model: CollectViewModel = {
    headingLines: [branding.heading], intro: 'Займёт минуту. Регистрироваться не нужно.',
    homeHref: '/', logoUrl: branding.logo_url, tabs: [],
    photoHint: 'JPEG, PNG или WebP, до 5 МБ.',
    disclosure: 'Текст публикуется без изменений после проверки владельцем.',
    palette: { fieldBorder: '#8e806b', fieldFill: '#f7f4eb', cardSurface: '#fffdf8',
      accentFill: branding.accent_color, onAccent: brandingForeground(branding.accent_color),
      accentText: brandingForeground(branding.accent_color, '#fffdf8') },
    values, photoName: photo?.name, photoPreview: preview, errors, error, status, busy,
    success: done ? 'Спасибо! Отзыв отправлен. Он появится после проверки владельцем.' : undefined,
  };
  return <CollectView model={model} onSubmit={submit}
    onChange={(key, value) => { if (!inFlight.current) setValues(previous => ({ ...previous, [key]: value })); }}
    onPhoto={event => { void pickPhoto(event.target.files?.[0] ?? null); }}
    onRemovePhoto={() => {
      if (inFlight.current) return;
      photoRevision.current++; checkingPhoto.current = false; setPhoto(null);
      if (photoRef.current) photoRef.current.value = '';
    }} statusRef={statusRef} errorRef={errorRef} successRef={successRef} photoRef={photoRef} />;
}
