import type { LucideIcon } from 'lucide-react'
import type { HearstTeam } from './content'

export type VerificationStatus = 'verified' | 'pending' | 'not-applicable'

export type TeamSectionId =
    | ''
    | 'communication'
    | 'work'
    | 'resources'
    | 'roadmap'

export interface PortalIntroContent {
    eyebrow: string
    title: string
    summary: string
}

export interface TeamSection {
    id: TeamSectionId
    label: string
}

export interface MetricLinkItem {
    label: string
    value: string
    href: string
    icon: LucideIcon
}

export interface KnowledgeArea {
    id: string
    title: string
    summary: string
    meta: string
    href: string
    icon: LucideIcon
}

export interface Teammate {
    name: string
    role: string
}

export interface TeammateGroup {
    name: string
    members: Teammate[]
}

export interface TeamChannel {
    name: string
    purpose: string
}

export interface TeamMeeting {
    name: string
    schedule: string
}

export interface WorkflowStep {
    id: string
    title: string
    detail?: string
    state?: 'default' | 'current' | 'complete'
}

export interface RepositoryInfo {
    id: string
    name: string
    type: string
    purpose: string
    stack: string[]
    access: string
    owner?: string
    url?: string
}

export interface JourneyReference {
    label: string
    url: string
}

export interface JourneyTaskData {
    id: string
    title: string
    detail: string
    evidence: string
    commands?: readonly string[]
    reference: JourneyReference
}

export interface DeliveryPhase {
    title: string
    detail: string
}

export interface ServiceInfo {
    name: string
    type: string
    purpose: string
    stack: string
    access: string
}

export interface SystemInfo {
    name: string
    role: string
}

export interface CommandInfo {
    command: string
    purpose: string
}

export interface ResourceGuideItem {
    title: string
    detail: string
    meta?: string
    code?: string
    links?: ResourceLink[]
}

export interface ResourceGuideImage {
    src: string
    alt: string
    caption: string
}

export interface ResourceGuideSection {
    id: string
    eyebrow: string
    title: string
    summary?: string
    presentation?: 'cards' | 'list' | 'prose'
    items: ResourceGuideItem[]
    images?: ResourceGuideImage[]
    links?: ResourceLink[]
    image?: ResourceGuideImage & { url?: string }
}
export interface ResourceLink {
    label: string
    url: string
    description: string
}

export interface ResourceLinkGroup {
    title: string
    links: ResourceLink[]
}
export interface JourneyLevelData {
    id: string
    title: string
    body: string
    outcome: string
    icon: LucideIcon
    tasks?: readonly JourneyTaskData[]
}

export interface TeamOverviewData {
    variant: 'verified' | 'pending'
    eyebrow: string
    title: string
    summary: string
    tags: string[]
    journeyLabel: string
    journeyCompleteLabel: string
    journeyContinueLabel: string
    journeyActionLabel: string
    metrics: MetricLinkItem[]
    areas: KnowledgeArea[]
    areasEyebrow: string
    areasTitle: string
    areasSummary: string
    ecosystem?: {
        eyebrow: string
        title: string
        steps: string[]
        outcome: string
    }
}

export interface TeamCommunicationData {
    status: VerificationStatus
    rosterStatus?: VerificationStatus
    intro: PortalIntroContent
    groups: TeammateGroup[]
    channels: TeamChannel[]
    meetings?: TeamMeeting[]
    agreementsTitle: string
    agreements: string[]
}

export interface VerifiedWorkContent {
    ticketEyebrow: string
    ticketTitle: string
    ticketSummary: string
    branchPattern: string
    releaseCadence: string
    workflowEyebrow: string
    workflowTitle: string
    deliveryEyebrow: string
    deliveryTitle: string
    releaseEyebrow: string
    releaseTitle: string
    releaseSummary: string
}

export interface TeamWorkData {
    status: VerificationStatus
    intro: PortalIntroContent
    workflow: string[]
    delivery: DeliveryPhase[]
    pullRequestsUrl?: string
    workLinkLabel?: string
    guidanceTitle?: string
    guidanceStatus?: VerificationStatus
    ticketQuestions?: string[]
    verifiedContent?: VerifiedWorkContent
}

export interface AccessFlowStep {
    title: string
    detail: string
}

export interface VerifiedResourcesContent {
    primaryRepository?: RepositoryInfo
    servicesEyebrow: string
    servicesTitle: string
    servicesSummary: string
    systemEyebrow: string
    systemTitle: string
    systemFlow: string[]
    systemOutcome: string
    accessEyebrow: string
    accessTitle: string
    commandsEyebrow: string
    commandsTitle: string
    commandsFooter: string
    commandsFooterCommand: string
    accessFlowEyebrow: string
    accessFlowTitle: string
    accessFlow: AccessFlowStep[]
    secretSharing?: {
        guidance: string
        label: string
        url: string
    }
}

export interface TeamResourcesData {
    status: VerificationStatus
    intro: PortalIntroContent
    articleOnly?: boolean
    services: ServiceInfo[]
    systems: SystemInfo[]
    accessItems: string[]
    commands: CommandInfo[]
    guideSections?: ResourceGuideSection[]
    architectureVisual?: {
        src: string
        alt: string
        caption: string
        url?: string
    }
    safetyGuidance?: string
    linkGroups?: ResourceLinkGroup[]
    verifiedContent?: VerifiedResourcesContent
}

export interface TeamJourneyData {
    mode: 'tasks' | 'levels'
    eyebrow: string
    title: string
    summary: string
    levels: readonly JourneyLevelData[]
}

export interface TeamPortalData {
    identity: HearstTeam
    overview: TeamOverviewData
    communication: TeamCommunicationData
    work: TeamWorkData
    resources: TeamResourcesData
    journey: TeamJourneyData
}
