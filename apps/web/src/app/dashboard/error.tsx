'use client';

import { startTransition } from 'react';
import { useRouter } from 'next/navigation';
import './dashboard.css';

export default function DashboardOverviewError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  return <div className="proofo-dashboard"><main className="cab-shell"><article className="cab-paper" role="alert">
    <h1>Не удалось загрузить кабинет</h1>
    <p>Данные сейчас недоступны. Попробуйте ещё раз.</p>
    <button type="button" className="cab-button" onClick={() => startTransition(() => {
      // Server Component должен заново прочитать БД, а boundary — сбросить ошибку.
      router.refresh();
      reset();
    })}>Повторить</button>
  </article></main></div>;
}
