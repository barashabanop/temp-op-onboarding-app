import type { LucideIcon } from 'lucide-react'
import type { PageBlock } from './blocks'
import type { NavigationItem, PageContent } from './navigation'
import type { TeamPortalData } from './portal'

export interface HearstTeam {
  id: string
  name: string
  shortName: string
  summary: string
  focus: string
  accent: string
}

/**
 * The one canonical content document consumed by the browser.
 *
 * Shared workspace pages are intentionally represented only by `pages`,
 * their recursive `pageBlocks`, and their navigation placements. Hearst team
 * facts remain a specialised Drive-owned payload because they feed the shared
 * team portal components.
 */
export interface PortalContent {
  version: number
  /** Canonical page records, independent from their sidebar placement. */
  pages: PageContent[]
  /** Authored block trees keyed by their owning page record. */
  pageBlocks: Record<string, PageBlock[]>
  navigation: NavigationItem[]
  footerNavigation: NavigationItem[]
  teams: HearstTeam[]
  portals: TeamPortalData[]
}

export interface SerializedIcon {
  __icon: string
}

export type IconValue = LucideIcon | SerializedIcon
