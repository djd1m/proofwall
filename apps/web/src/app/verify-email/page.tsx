import type { Metadata } from 'next';
import { EmailVerificationForm } from './verification-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Подтверждение email — Proofwall',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function VerifyEmailPage() {
  return <main className="stage stage--narrow" style={{ background: '#f2ede3', minHeight: '100vh' }}>
    <div className="card" style={{ maxWidth: 520, width: '100%', padding: 32, fontFamily: 'Arial, sans-serif' }}>
      <p style={{ color: '#c8492f', fontWeight: 700, marginBottom: 24 }}>Proofwall</p>
      <h1>Подтвердите email</h1>
      <p style={{ margin: '16px 0', lineHeight: 1.6 }}>
        Нажмите кнопку, чтобы подтвердить адрес. Ссылка действует 24 часа и используется один раз.
      </p>
      <EmailVerificationForm />
    </div>
  </main>;
}
