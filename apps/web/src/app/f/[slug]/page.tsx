// GET /f/<slug> — форма сбора отзыва (FR-002).
//
// Текст (FR-002) и видео (FR-003). Загрузка ФОТО к текстовому отзыву из AC FR-002
// ещё не реализована — колонка photo_url в схеме есть, интерфейса загрузки нет.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findProjectBySlug } from '@/lib/project';
import { readBranding } from '@/lib/branding';
import { IntakeTabs } from './intake-tabs';
import { videoIntakeEnabled } from '@/lib/video';
import '../../proofo-forms.css';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  // Страница сбора не для поиска — она приходит по прямой ссылке от владельца.
  return { title: `Оставить отзыв — ${slug}`, robots: { index: false, follow: false } };
}

export default async function FormPage({ params }: Params) {
  const { slug } = await params;
  const project = await findProjectBySlug(slug);
  if (!project) notFound();

  const branding = readBranding(project.branding);

  return <IntakeTabs slug={project.slug} branding={branding} videoEnabled={videoIntakeEnabled()} />;
}
