'use client';

import { useEffect, useRef, useState } from 'react';

export function EmailVerificationForm() {
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loginRequired, setLoginRequired] = useState(false);
  const fragmentRead = useRef(false);
  useEffect(() => {
    function readFragment() {
      // StrictMode повторяет effect; hashchange также позволяет открыть новую ссылку
      // в уже открытой вкладке, где маршрут остаётся тем же.
      if (fragmentRead.current && !window.location.hash) return;
      fragmentRead.current = true;
      const supplied = new URLSearchParams(window.location.hash.slice(1)).get('token');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setVerified(false); setMessage(''); setError('');
      if (supplied && /^[A-Za-z0-9_-]{43}$/.test(supplied)) setToken(supplied);
      else { setToken(null); setError('В ссылке нет действительного ключа. Откройте письмо целиком или запросите новое.'); }
      setLoaded(true);
    }
    readFragment();
    window.addEventListener('hashchange', readFragment);
    return () => window.removeEventListener('hashchange', readFragment);
  }, []);

  async function act(resend: boolean) {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(resend ? '/api/auth/resend-verification' : '/api/auth/verify-email', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(resend ? {} : { token }),
      });
      const body = await response.json().catch(() => null) as { error?: string; verified?: boolean } | null;
      if (!response.ok) {
        if (response.status === 401) setLoginRequired(true);
        setError(body?.error ?? 'Не удалось подтвердить адрес. Попробуйте позже.');
      } else if (body?.verified) {
        setVerified(true); setToken(null);
        setMessage(resend ? 'Email текущего аккаунта уже подтверждён. Для другой стены войдите в нужный аккаунт.' :
          'Адрес из письма подтверждён. Можно вернуться к вашей стене.');
      } else {
        setToken(null);
        setMessage('Новое письмо запланировано на email текущего аккаунта. Проверьте почту. Предыдущая ссылка этого аккаунта больше не действует; доставка может занять время.');
      }
    } catch { setError('Сеть недоступна. Попробуйте ещё раз.'); }
    finally { setBusy(false); }
  }

  return <div>
    {loaded && token && !verified ? <button type="button" className="btn" disabled={busy}
      onClick={() => act(false)} style={{ background: '#c8492f', color: '#fff' }}>
      {busy ? 'Проверяем…' : 'Подтвердить email'}
    </button> : null}
    {error ? <p role="alert" style={{ marginTop: 16 }}>{error}</p> : null}
    {message ? <p role="status" style={{ marginTop: 16 }}>{message}</p> : null}
    {loaded && !verified ? <div style={{ marginTop: 24 }}>
      <p className="small muted" style={{ marginBottom: 12 }}>Новое письмо придёт на email аккаунта, в который вы сейчас вошли. Если ссылка относится к другому аккаунту, сначала войдите в нужный.</p>
      {loginRequired ? <a href="/login?next=%2Fverify-email">Войти в аккаунт</a> :
        <button type="button" className="btn" disabled={busy} onClick={() => act(true)}>Новое письмо для текущего аккаунта</button>}
    </div> : null}
    <p style={{ marginTop: 24 }}><a href="/dashboard">Открыть кабинет</a></p>
  </div>;
}
