import { ArrowRight } from 'lucide-react'
import type { KnowledgeArea, MetricLinkItem } from '../../types/portal'

export function MetricLinks({ items }: { items: MetricLinkItem[] }) {
  return (
    <section className="hub-metric-row">
      {items.map(({ href, icon: Icon, label, value }) => (
        <a href={href} key={`${href}-${label}`}>
          <Icon aria-hidden="true" />
          <span>
            <small>{label}</small>
            <strong>{value}</strong>
          </span>
          <ArrowRight aria-hidden="true" />
        </a>
      ))}
    </section>
  )
}

interface KnowledgeAreaGridProps {
  eyebrow: string
  title: string
  summary: string
  areas: KnowledgeArea[]
}

export function KnowledgeAreaGrid({
  eyebrow,
  title,
  summary,
  areas,
}: KnowledgeAreaGridProps) {
  return (
    <section className="portal-section">
      <header>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <p>{summary}</p>
      </header>
      <div className="hub-area-grid">
        {areas.map(({ id, href, title: areaTitle, summary: areaSummary, meta, icon: Icon }, index) => (
          <a href={href} key={id}>
            <header>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <Icon aria-hidden="true" />
            </header>
            <h3>{areaTitle}</h3>
            <p>{areaSummary}</p>
            <footer>
              <span>{meta}</span>
              <strong>View details <ArrowRight aria-hidden="true" /></strong>
            </footer>
          </a>
        ))}
      </div>
    </section>
  )
}
