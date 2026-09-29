import { usePortalContent } from '../content/ContentContext'
import type { HearstTeam } from '../types/content'
import { HearstOverviewPage } from './portal/pages/HearstOverviewPage'
import { JourneyPage } from './portal/pages/JourneyPage'
import {
  CommunicationPageView,
  ResourcesPageView,
  WorkPageView,
} from './portal/pages/TeamSectionPages'
import { TeamOverviewPage } from './portal/pages/TeamOverviewPage'

const usePortalFor = (team: HearstTeam) => usePortalContent().portals.find((portal) => portal.identity.id === team.id)

export function HearstOverview() {
  return <HearstOverviewPage />
}

export function TeamOverview({ team }: { team: HearstTeam }) {
  const portal = usePortalFor(team)
  return portal ? <TeamOverviewPage portal={portal} /> : null
}

export function CommunicationPage({ team }: { team: HearstTeam }) {
  const portal = usePortalFor(team)
  return portal ? <CommunicationPageView portal={portal} /> : null
}

export function WorkManagementPage({ team }: { team: HearstTeam }) {
  const portal = usePortalFor(team)
  return portal ? <WorkPageView portal={portal} /> : null
}

export function ResourcesPage({ team }: { team: HearstTeam }) {
  const portal = usePortalFor(team)
  return portal ? <ResourcesPageView portal={portal} /> : null
}

export function RoadmapPage({ team }: { team: HearstTeam }) {
  const portal = usePortalFor(team)
  return portal ? <JourneyPage portal={portal} /> : null
}
