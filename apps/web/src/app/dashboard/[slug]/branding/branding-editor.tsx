'use client';
import { useEffect, useRef, useState } from 'react';
import { brandingForeground, readBranding, validateBrandingPatch, type ResolvedBranding } from '@/lib/branding';
import { BrandingView, type BrandingViewModel } from './branding-view';

export function BrandingEditor({ slug, branding }: { slug: string; branding: ResolvedBranding }) {
  const values = { ...branding, logo_url: branding.logo_url ?? '' };
  const [saved, setSaved] = useState<BrandingViewModel['values']>(values);
  const [draft, setDraft] = useState<BrandingViewModel['values']>(values);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<BrandingViewModel['errors']>({});
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const inFlight = useRef(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error || Object.values(errors ?? {}).some(Boolean)) errorRef.current?.focus();
    else if (busy || status === 'Настройки сохранены.') statusRef.current?.focus();
  }, [busy, error, errors, status]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const patch = Object.fromEntries(Object.entries(draft).filter(([key, value]) => value !== saved[key as keyof typeof saved]));
    const validation = validateBrandingPatch(patch);
    setError(''); setErrors({});
    if (!validation.ok) {
      const { form, ...fields } = validation.errors;
      setError(form ?? 'Проверьте указанные настройки.'); setErrors(fields); setStatus(''); return;
    }
    inFlight.current = true; setBusy(true); setStatus('Сохранение настроек…');
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(slug)}/branding`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validation.patch),
      });
      const body = await response.json() as { branding?: unknown; error?: string; errors?: Record<string, string> };
      if (response.status !== 200 || !body.branding || typeof body.branding !== 'object') {
        const { form, ...fields } = body.errors ?? {};
        setErrors(fields); setError(body.error ?? form ?? 'Не удалось сохранить настройки. Попробуйте ещё раз.'); setStatus('');
        return;
      }
      const canonical = readBranding(body.branding);
      const next = { ...canonical, logo_url: canonical.logo_url ?? '' };
      setSaved(next); setDraft(next); setStatus('Настройки сохранены.');
    } catch { setError('Сеть недоступна — попробуйте ещё раз.'); setStatus(''); }
    finally { inFlight.current = false; setBusy(false); }
  }
  const accentFill = readBranding({ accent_color: draft.accent_color }).accent_color;
  const model: BrandingViewModel = {
    projectName: slug, homeHref: '/dashboard', backHref: `/dashboard/${encodeURIComponent(slug)}`,
    wallHref: `/w/${encodeURIComponent(slug)}`, wallLinkLabel: 'публичной стене →', values: draft,
    palette: { fieldBorder: '#8e806b', fieldFill: '#f7f4eb', cardSurface: '#fffdf8',
      accentFill, onAccent: brandingForeground(accentFill), accentText: brandingForeground(accentFill, '#fffdf8') },
    orderOptions: [{ value: 'newest', label: 'Сначала новые' }, { value: 'oldest', label: 'Сначала старые' }],
    orderHint: 'На стене — все одобренные отзывы; в виджете — последние 50 в выбранном порядке.',
    logoHint: 'Новая ссылка должна использовать HTTPS. Пустое поле убирает логотип.',
    busy, errors, error, status,
  };
  return <BrandingView model={model} onSubmit={submit} statusRef={statusRef} errorRef={errorRef}
    onChange={(key, value) => {
      if (inFlight.current) return;
      setDraft(previous => ({ ...previous, [key]: value })); setStatus('Есть несохранённые изменения.');
    }} />;
}
