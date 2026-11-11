export type DashboardOverviewModel = {
  wallCount: string;
  billing: { label: string; title: string; description: string; detail: string; href: string; action: string };
  metrics: ReadonlyArray<{ label: string; value: number | null }>;
  metricsNote: string;
  projects: ReadonlyArray<{
    slug: string; name: string; href: string; description?: string;
    reviewSummary: string; activitySummary: string; tier?: 'free' | 'paid';
  }>;
  secondaryCard?: { title: string; description: string; href: string; action: string; note: string };
};

/** Общий чистый view для SSR и замороженной визуальной fixture. */
export function DashboardOverview({ model }: { model: DashboardOverviewModel }) {
  return <div className="proofo-dashboard">
    <main className="cab-shell">
      <div className="cab-top">
        <a className="brand" href="/"><span className="mark">◆</span>proofwall</a>
        <a className="cab-back" href="/dashboard">← кабинет</a>
      </div>
      <article className="cab-paper">
        <div className="cab-title"><div><p className="cab-eyebrow">Стена отзывов</p><h1>Кабинет</h1></div></div>
        <div className="cab-summary"><span>{model.wallCount}</span><a className="cab-pill" href={model.billing.href}>{model.billing.label}</a></div>
        <section className="cab-subscription"><div><h2>{model.billing.title}</h2><p>{model.billing.description}</p><p>{model.billing.detail}</p></div><a className="cab-back" href={model.billing.href}>{model.billing.action}</a></section>
        <section className="cab-section"><h2>За последние 30 дней</h2>
          <div className="cab-metrics">{model.metrics.map(metric => <div key={metric.label}>
            <b>{metric.value === null ? '—' : metric.value}</b><span>{metric.label}</span>
            {metric.value === null && <small className="cab-unavailable">Нет данных</small>}
          </div>)}</div><p className="cab-small">{model.metricsNote}</p>
        </section>
        <section className="cab-section"><h2>Ваши стены</h2>
          {model.projects.length === 0 && <div className="cab-empty"><p>У вас нет активных стен.</p><a className="cab-back" href="/">На главную →</a></div>}
          <div className="cab-walls">{model.projects.map(project => <a className="cab-wall-card" href={project.href} key={project.slug}>
            <h3>{project.name} <span aria-hidden="true">→</span></h3><p>{project.description ?? project.slug}</p>
            {project.tier && <p>{{ paid: 'Платный тариф', free: 'Бесплатный тариф' }[project.tier]}</p>}
            <div className="cab-card-bottom"><span>{project.reviewSummary}</span><span>{project.activitySummary}</span></div>
          </a>)}
          {model.secondaryCard && <div className="cab-wall-card cab-locked"><h3>{model.secondaryCard.title}</h3><p>{model.secondaryCard.description}</p><a href={model.secondaryCard.href}>{model.secondaryCard.action}</a><small>{model.secondaryCard.note}</small></div>}
          </div>
        </section>
      </article>
    </main>
  </div>;
}
