import type { CSSProperties } from 'react'
import { ArrowRight, GitBranch, LayoutDashboard, Network, Sparkles, Users } from 'lucide-react'
import { usePortalContent } from '../../../content/ContentContext'
import { progressFor } from '../../../utils/progress'
import { pageHref } from '../../../utils/routes'
import { HearstMark } from '../HearstMark'

export function HearstOverviewPage() {
  const { portals: teamPortals } = usePortalContent()
  const teamCount = teamPortals.length
  const knowledgeAreaCount = teamPortals.reduce(
    (total, portal) => total + portal.overview.areas.length,
    0,
  )
  const showTeams = () =>
    document.getElementById('teams')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })

  return (
    <article className="portal-page">
      <section className="client-hero">
        <div className="client-hero__main">
          <span className="status-badge status-badge--light">
            <Sparkles aria-hidden="true" /> Client workspace
          </span>
          <h1 className="sr-only">Hearst</h1>
          <HearstMark />
          <p>Navigate team knowledge, operating models, development resources, and your personal onboarding journey.</p>
          <div className="hero-chips">
            <button type="button" onClick={showTeams}>Explore teams</button>
          </div>
        </div>
        <div className="hero-stat"><Users aria-hidden="true" /><span><strong>{teamCount}</strong>Focused teams</span></div>
        <div className="hero-stat"><LayoutDashboard aria-hidden="true" /><span><strong>{knowledgeAreaCount}</strong>Knowledge areas</span></div>
      </section>
      <section className="portal-section" id="teams">
        <header>
          <div><p className="eyebrow">Choose your team</p><h2>Where will you contribute?</h2></div>
          <p>Each hub gives you only the context you need now, with deeper detail one click away.</p>
        </header>
        <div className="dashboard-teams">
          {teamPortals.map((portal, index) => {
            const team = portal.identity
            const progress = progressFor(portal)
            const rosterVerified = (portal.communication.rosterStatus ?? portal.communication.status) === 'verified'
            const rosterCount = portal.communication.groups.reduce((total, group) => total + group.members.length, 0)
            const resourcesVerified = portal.resources.status === 'verified'
            return (
              <a href={pageHref(team.id)} className="dashboard-team" key={team.id} style={{ '--team-accent': team.accent } as CSSProperties}>
                <header><span>0{index + 1}</span><strong>{team.shortName}</strong></header>
                <div className="dashboard-team__icon"><Network aria-hidden="true" /></div>
                <p>{team.focus}</p><h3>{team.name}</h3><small>{team.summary}</small>
                <div className="team-card-metrics"><span><Users aria-hidden="true" /> {rosterVerified ? `${rosterCount} teammates` : 'Roster pending'}</span><span><GitBranch aria-hidden="true" /> {resourcesVerified ? 'Resources verified' : 'Resources pending'}</span></div>
                <footer><div><span><i style={{ width: `${progress}%` }} /></span><small>{progress}% onboarded</small></div><ArrowRight aria-hidden="true" /></footer>
              </a>
            )
          })}
        </div>
      </section>
    </article>
  )
}
