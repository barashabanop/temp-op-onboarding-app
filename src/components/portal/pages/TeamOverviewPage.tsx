import { Fragment } from 'react'
import { ArrowRight } from 'lucide-react'
import type { TeamPortalData } from '../../../types/portal'
import { progressFor } from '../../../utils/progress'
import { teamPageHref } from '../../../utils/routes'
import { KnowledgeAreaGrid, MetricLinks } from '../OverviewCollections'
import { TeamPageShell } from '../TeamPageShell'
import { ProgressRing } from '../../ui/PortalPrimitives'

export function TeamOverviewPage({ portal }: { portal: TeamPortalData }) {
  const { identity: team, overview } = portal
  const progress = progressFor(portal)

  return (
    <TeamPageShell team={team} active="">
      <section className={`team-dashboard-hero ${overview.variant === 'verified' ? 'moapt-hero' : ''}`}>
        <div>
          <span className="team-code">{team.shortName}</span>
          <p className="eyebrow">{overview.eyebrow}</p>
          <h1>{overview.title}</h1>
          <p>{overview.summary}</p>
          {overview.tags.length > 0 && <div className="moapt-tags">{overview.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        </div>
        <div className="team-dashboard-hero__status">
          <ProgressRing value={progress} />
          <span><strong>{overview.journeyLabel}</strong><small>{progress === 100 ? overview.journeyCompleteLabel : overview.journeyContinueLabel}</small></span>
          <a href={teamPageHref(team.id, 'roadmap')}>{overview.journeyActionLabel} <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>
      <MetricLinks items={overview.metrics} />
      <KnowledgeAreaGrid eyebrow={overview.areasEyebrow} title={overview.areasTitle} summary={overview.areasSummary} areas={overview.areas} />
      {overview.ecosystem && (
        <section className="ecosystem-strip"><header><p className="eyebrow">{overview.ecosystem.eyebrow}</p><h2>{overview.ecosystem.title}</h2></header><div>{overview.ecosystem.steps.map((step) => <Fragment key={step}><span>{step}</span><ArrowRight /></Fragment>)}<strong>{overview.ecosystem.outcome}</strong></div></section>
      )}
    </TeamPageShell>
  )
}
