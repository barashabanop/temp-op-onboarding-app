import type { HearstTeam } from '../../types/content'
import type { TeamSection, TeamSectionId } from '../../types/portal'
import { teamPageHref } from '../../utils/routes'

const teamSections: TeamSection[] = [
  { id: '', label: 'Overview' },
  { id: 'communication', label: 'Teammates' },
  { id: 'work', label: 'Work' },
  { id: 'resources', label: 'Resources' },
  { id: 'roadmap', label: 'Journey' },
]

interface TeamSectionNavProps {
  team: HearstTeam
  active: TeamSectionId
}

export function TeamSectionNav({ team, active }: TeamSectionNavProps) {
  return (
    <nav className="team-section-nav" aria-label={`${team.name} sections`}>
      {teamSections.map((section) => (
        <a
          href={teamPageHref(team.id, section.id)}
          className={active === section.id ? 'is-active' : ''}
          aria-current={active === section.id ? 'page' : undefined}
          key={section.id || 'overview'}
        >
          <span>{section.label}</span>
          {active === section.id && (
            <small>
              <i /> You are here
            </small>
          )}
        </a>
      ))}
    </nav>
  )
}
