import { usePageEditing } from '../content/PageEditingContext'
import type { PageBlock } from '../types/blocks'
import type { PageContent as PageContentType } from '../types/navigation'
import type { PortalContent } from '../types/content'
import type { Profile } from '../auth/api'
import { CommunicationPage, HearstOverview, ResourcesPage, RoadmapPage, TeamOverview, WorkManagementPage } from './ProductPortal'
import { ContentBlocks, blockPresentation } from './ContentBlocks'
import { EditableText } from './EditableText'
import { PageEditor } from './PageEditor'
import { hearstPageIds } from '../utils/workspaceContent'

interface PageContentProps {
  page: PageContentType
  content: PortalContent
  token: string
  profile: Profile
  onContentUpdated: (content: PortalContent) => void
}

function PageHeader({ page, showDescription }: { page: PageContentType, showDescription: boolean }) {
  const editing = usePageEditing()
  if (!editing) {
    return (
      <header className="page-header">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        {showDescription && page.description && <p className="page-header__description">{page.description}</p>}
      </header>
    )
  }
  return (
    <header className="page-header">
      <p className="eyebrow">
        <EditableText value={page.eyebrow} label="Page eyebrow" placeholder="Eyebrow" onChange={(eyebrow) => editing.updatePage({ eyebrow })} />
      </p>
      <h1>
        <EditableText value={page.title} label="Page title" placeholder="Page title" onChange={(title) => editing.updatePage({ title })} />
      </h1>
      {showDescription && (
        <p className="page-header__description">
          <EditableText value={page.description} label="Page description" placeholder="Add an introduction" onChange={(description) => editing.updatePage({ description })} />
        </p>
      )}
    </header>
  )
}

function AuthoredPage({ page, blocks }: { page: PageContentType, blocks: PageBlock[] }) {
  // A hero opens the page with its heading beside an accent panel, so the
  // heading moves inside it rather than sitting above the whole arrangement.
  const hero = blocks.find((block) => blockPresentation(block) === 'hero')
  // A hero's lead column already holds the page's opening copy, which the
  // legacy conversion also left on the page record. Keep the description in
  // the heading only when no lead column restates it.
  const heroRestatesDescription = hero?.children?.some(
    (child) => blockPresentation(child) === 'hero-lead',
  )
  const header = <PageHeader page={page} showDescription={!heroRestatesDescription} />

  return (
    <article className={`authored-page ${hero ? 'authored-page--hero' : ''}`.trim()}>
      {!hero && header}
      {blocks.length
        ? <ContentBlocks blocks={blocks} header={hero ? header : undefined} />
        : <p className="authored-page__empty">This page is ready for its first content block.</p>}
    </article>
  )
}

export function PageContent({ page, content, token, profile, onContentUpdated }: PageContentProps) {
  const team = content.teams.find((candidate) => page.id === candidate.id || page.id.startsWith(`${candidate.id}-`))
  const hasTeamPortal = Boolean(team && content.portals.some((portal) => portal.identity.id === team.id))

  if (page.id === 'hearst') return <HearstOverview />
  if (team && hasTeamPortal && page.id === team.id) return <TeamOverview team={team} />
  if (team && hasTeamPortal && page.id.endsWith('-communication')) return <CommunicationPage team={team} />
  if (team && hasTeamPortal && page.id.endsWith('-work')) return <WorkManagementPage team={team} />
  if (team && hasTeamPortal && page.id.endsWith('-resources')) return <ResourcesPage team={team} />
  if (team && hasTeamPortal && page.id.endsWith('-roadmap')) return <RoadmapPage team={team} />

  // Every non-Hearst page is built from the same canonical page/block graph.
  // This also gives a readable fallback if a Drive team route is present
  // before its specialised portal record has been configured.
  const blocks = content.pageBlocks[page.id] ?? []
  // Hearst pages live in the Drive manifest, which the block editor does not
  // author. They stay read-only here and remain editable in the admin panel.
  const editable = profile.role === 'admin' && !hearstPageIds(content.navigation).has(page.id)
  if (!editable) return <AuthoredPage page={page} blocks={blocks} />

  return (
    <PageEditor page={page} blocks={blocks} token={token} onContentUpdated={onContentUpdated}>
      {(draftPage, draftBlocks) => <AuthoredPage page={draftPage} blocks={draftBlocks} />}
    </PageEditor>
  )
}
