import type { CSSProperties, ReactNode } from 'react'
import type { HearstTeam } from '../../types/content'
import type { TeamSectionId } from '../../types/portal'
import { TeamSectionNav } from '../navigation/TeamSectionNav'

interface TeamPageShellProps {
  team: HearstTeam
  active: TeamSectionId
  children: ReactNode
}

export function TeamPageShell({ team, active, children }: TeamPageShellProps) {
  return (
    <article
      className="portal-page"
      style={{ '--team-accent': team.accent } as CSSProperties}
    >
      <TeamSectionNav team={team} active={active} />
      <div className="portal-page__content">{children}</div>
    </article>
  )
}
