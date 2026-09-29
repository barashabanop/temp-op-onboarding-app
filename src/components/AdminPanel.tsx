import { useEffect, useState } from 'react'
import { Blocks, Check, FilePenLine, Pencil, Plus, Save, Shield, Users } from 'lucide-react'
import {
  ApiError,
  getAdminContent,
  getContentAccessCatalog,
  getPortalContent,
  listPeople,
  replaceAdminContent,
  type AppRole,
  type ContentAccessOption,
  type Profile,
  updateContentAccess,
  updateRole,
} from '../auth/api'
import type { PortalContent } from '../types/content'
import type { NavigationItem, PageContent } from '../types/navigation'
import { hearstPageIds, isRecord, itemId, referencedPageIds } from '../utils/workspaceContent'

interface AdminPanelProps {
  token: string
  profile: Profile
  onContentUpdated: (content: PortalContent) => void
}

type WorkspaceTab = 'people' | 'content'
type ContentBlock = 'pages' | 'navigation' | 'teams' | 'manifest'

const roles: AppRole[] = ['trainee', 'trainer', 'admin']
const blocks: { id: ContentBlock, title: string, description: string, source: string }[] = [
  { id: 'pages', title: 'Workspace pages', description: 'Canonical page records and their recursive content blocks.', source: 'Supabase' },
  { id: 'navigation', title: 'Navigation', description: 'Sidebar labels, nested routes, and page relationships.', source: 'Supabase + Drive' },
  { id: 'teams', title: 'Teams', description: 'Hearst teams, their portal data, and team navigation.', source: 'Google Drive' },
  { id: 'manifest', title: 'Everything', description: 'The combined Supabase workspace and Hearst Drive content.', source: 'Both sources' },
]
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const pageId = (value: unknown) => isRecord(value) && typeof value.id === 'string' ? value.id : undefined

function pageRecordsForIds(pages: unknown, ids: Set<string>, include: boolean): unknown[] {
  if (!Array.isArray(pages)) return []
  return pages.filter((page) => {
    const id = pageId(page)
    if (!id) return false
    return include ? ids.has(id) : !ids.has(id)
  })
}

function blockTreesForIds(pageBlocks: unknown, ids: Set<string>, include: boolean): Record<string, unknown> {
  if (!isRecord(pageBlocks)) return {}
  return Object.fromEntries(Object.entries(pageBlocks).filter(([id]) => include ? ids.has(id) : !ids.has(id)))
}

function blockValue(manifest: Record<string, unknown>, block: ContentBlock): unknown {
  const navigation = Array.isArray(manifest.navigation) ? manifest.navigation : []
  const teamPageIds = hearstPageIds(navigation)
  if (block === 'pages') return {
    pages: pageRecordsForIds(manifest.pages, teamPageIds, false),
    pageBlocks: blockTreesForIds(manifest.pageBlocks, teamPageIds, false),
  }
  if (block === 'navigation') return {
    navigation: navigation.filter((entry) => itemId(entry) !== 'hearst'),
    footerNavigation: manifest.footerNavigation,
  }
  if (block === 'teams') {
    const teamNavigation = navigation.filter((entry) => itemId(entry) === 'hearst')
    return {
      teams: manifest.teams,
      portals: manifest.portals,
      navigation: teamNavigation,
      pages: pageRecordsForIds(manifest.pages, teamPageIds, true),
    }
  }
  return manifest
}

function mergeBlock(manifest: Record<string, unknown>, block: ContentBlock, nextBlock: Record<string, unknown>): Record<string, unknown> {
  if (block === 'manifest') return nextBlock
  if (block === 'pages') {
    const teamPageIds = hearstPageIds(manifest.navigation)
    const nextManifest = { ...manifest }
    if (Object.hasOwn(nextBlock, 'pages')) {
      nextManifest.pages = [
        ...pageRecordsForIds(nextBlock.pages, teamPageIds, false),
        ...pageRecordsForIds(manifest.pages, teamPageIds, true),
      ]
    }
    if (Object.hasOwn(nextBlock, 'pageBlocks')) {
      nextManifest.pageBlocks = {
        ...blockTreesForIds(nextBlock.pageBlocks, teamPageIds, false),
        ...blockTreesForIds(manifest.pageBlocks, teamPageIds, true),
      }
    }
    return nextManifest
  }
  const oldNavigation = Array.isArray(manifest.navigation) ? manifest.navigation : []
  if (block === 'navigation') {
    // The focused editor owns workspace navigation only. Keep Drive-owned
    // Hearst data in its existing slot even if an editor pastes a full tree.
    const hearst = oldNavigation.filter((entry) => itemId(entry) === 'hearst')
    const nextNavigation = Array.isArray(nextBlock.navigation) ? nextBlock.navigation.filter((entry) => itemId(entry) !== 'hearst') : oldNavigation.filter((entry) => itemId(entry) !== 'hearst')
    const hearstIndex = oldNavigation.findIndex((entry) => itemId(entry) === 'hearst')
    const insertAt = hearstIndex < 0 ? nextNavigation.length : Math.min(hearstIndex, nextNavigation.length)
    const merged: Record<string, unknown> = {
      ...manifest,
      navigation: [...nextNavigation.slice(0, insertAt), ...hearst, ...nextNavigation.slice(insertAt)],
    }
    for (const key of ['footerNavigation'] as const) {
      if (Object.hasOwn(nextBlock, key)) merged[key] = nextBlock[key]
    }
    return merged
  }
  const nextNavigation = Array.isArray(nextBlock.navigation) ? nextBlock.navigation : []
  const hearstIndex = oldNavigation.findIndex((entry) => itemId(entry) === 'hearst')
  const workspaceNavigation = oldNavigation.filter((entry) => itemId(entry) !== 'hearst')
  const nextHearstNavigation = nextNavigation.filter((entry) => itemId(entry) === 'hearst')
  const insertAt = hearstIndex < 0 ? workspaceNavigation.length : Math.min(hearstIndex, workspaceNavigation.length)
  const { navigation: _navigation, pages: nextTeamPages, ...nextTeamContent } = nextBlock
  const merged: Record<string, unknown> = {
    ...manifest,
    ...nextTeamContent,
    navigation: [
      ...workspaceNavigation.slice(0, insertAt),
      ...nextHearstNavigation,
      ...workspaceNavigation.slice(insertAt),
    ],
  }
  if (Object.hasOwn(nextBlock, 'pages')) {
    const originalTeamPageIds = hearstPageIds(oldNavigation)
    merged.pages = [
      ...pageRecordsForIds(manifest.pages, originalTeamPageIds, false),
      ...pageRecordsForIds(nextTeamPages, new Set([...originalTeamPageIds, ...referencedPageIds(nextHearstNavigation)]), true),
    ]
  }
  return merged
}

function pendingPortal(team: Record<string, string>) {
  const intro = (title: string, summary: string) => ({ eyebrow: team.shortName, title, summary })
  return {
    identity: team,
    overview: { variant: 'pending', eyebrow: `${team.shortName} team hub`, title: team.name, summary: team.summary, tags: [], journeyLabel: 'Your onboarding journey', journeyCompleteLabel: 'All levels complete', journeyContinueLabel: 'Ready when you are', journeyActionLabel: 'Open roadmap', metrics: [], areas: [], areasEyebrow: 'Knowledge areas', areasTitle: 'Team context is being prepared.', areasSummary: 'Use the section tabs while the team adds its operating details.' },
    communication: { status: 'pending', intro: intro('People and communication', 'Team contacts and channels are being confirmed.'), groups: [], channels: [], agreementsTitle: 'Working agreements', agreements: ['Ask the team lead to confirm the preferred channel and cadence.'] },
    work: { status: 'pending', intro: intro('How work moves', 'The team workflow is being documented.'), workflow: [], delivery: [], guidanceTitle: 'Team workflow' },
    resources: { status: 'pending', intro: intro('Tools and access', 'Repositories, services, and access steps are being confirmed.'), services: [], systems: [], accessItems: [], commands: [] },
    journey: { mode: 'levels', eyebrow: 'Onboarding roadmap', title: `Getting started with ${team.shortName}`, summary: 'Your team will add milestones here.', levels: [] },
  }
}

function teamPages(team: Record<string, string>): PageContent[] {
  const page = (suffix: string, title: string, description: string, kind: PageContent['kind']): PageContent => ({
    id: `${team.id}-${suffix}`,
    eyebrow: `${team.shortName} · Team hub`,
    title,
    description,
    kind,
    renderMode: 'template',
    category: team.name,
  })
  return [
    {
      id: team.id,
      eyebrow: 'Hearst · Team hub',
      title: team.name,
      description: team.summary,
      kind: 'team',
      renderMode: 'template',
      category: team.name,
    },
    page('communication', 'People & communication', 'Team contacts, channels, and working agreements.', 'overview'),
    page('work', 'Work management', 'How the team plans, builds, and delivers.', 'overview'),
    page('resources', 'Resources & tooling', 'Repositories, services, and access guidance.', 'resources'),
    page('roadmap', 'Onboarding roadmap', 'Your team onboarding milestones.', 'guide'),
  ]
}

function teamNavigation(team: Record<string, string>): NavigationItem {
  return {
    id: team.id, label: team.name, pageId: team.id, hideChildren: true,
    children: [
      { id: `${team.id}-communication`, label: 'People & communication', pageId: `${team.id}-communication` },
      { id: `${team.id}-work`, label: 'Work management', pageId: `${team.id}-work` },
      { id: `${team.id}-resources`, label: 'Resources & tooling', pageId: `${team.id}-resources` },
      { id: `${team.id}-roadmap`, label: 'Onboarding roadmap', pageId: `${team.id}-roadmap` },
    ],
  }
}

export function AdminPanel({ token, profile, onContentUpdated }: AdminPanelProps) {
  const [tab, setTab] = useState<WorkspaceTab>('people')
  const [people, setPeople] = useState<Profile[]>([])
  const [catalog, setCatalog] = useState<ContentAccessOption[]>([])
  const [manifest, setManifest] = useState<Record<string, unknown> | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [grantingId, setGrantingId] = useState<string | null>(null)
  const [draftRole, setDraftRole] = useState<AppRole>('trainee')
  const [draftGrants, setDraftGrants] = useState<string[]>([])
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null)
  const [editorText, setEditorText] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [newTeam, setNewTeam] = useState({ id: '', name: '', shortName: '', summary: '', focus: '', accent: '#83eebe' })

  useEffect(() => {
    let active = true
    Promise.all([listPeople(token), getContentAccessCatalog(token), getAdminContent(token)]).then(([nextPeople, nextCatalog, nextManifest]) => {
      if (!active) return
      setPeople(nextPeople); setCatalog(nextCatalog); setManifest(nextManifest)
    }).catch((error) => { if (active) setMessage(error instanceof ApiError ? error.message : 'Unable to load the administrator workspace.') })
    return () => { active = false }
  }, [token])

  const beginRoleEdit = (person: Profile) => { setEditingId(person.id); setDraftRole(person.role); setMessage(null) }
  const saveRole = async (person: Profile) => {
    try { const updated = await updateRole(token, person.id, draftRole); setPeople((current) => current.map((entry) => entry.id === updated.id ? updated : entry)); setEditingId(null); setMessage(`${updated.email} is now a ${updated.role}.`) }
    catch (error) { setMessage(error instanceof ApiError ? error.message : 'Unable to update this role.') }
  }
  const beginGrants = (person: Profile) => { setGrantingId(person.id); setDraftGrants(person.content_access); setMessage(null) }
  const saveGrants = async (person: Profile) => {
    try { const updated = await updateContentAccess(token, person.id, draftGrants); setPeople((current) => current.map((entry) => entry.id === updated.id ? updated : entry)); setGrantingId(null); setMessage(`${updated.email} can now open ${updated.content_access.length} content block${updated.content_access.length === 1 ? '' : 's'}.`) }
    catch (error) { setMessage(error instanceof ApiError ? error.message : 'Unable to save content access.') }
  }
  const openBlock = (block: ContentBlock) => { if (manifest) { setEditingBlock(block); setEditorText(JSON.stringify(blockValue(manifest, block), null, 2)); setMessage(null) } }
  const saveManifest = async (nextManifest: Record<string, unknown>, successMessage: string) => {
    try { const saved = await replaceAdminContent(token, nextManifest); setManifest(saved); setCatalog(await getContentAccessCatalog(token)); onContentUpdated(await getPortalContent(token) as PortalContent); setEditingBlock(null); setMessage(successMessage) }
    catch (error) { setMessage(error instanceof ApiError ? error.message : 'Unable to save workspace content.') }
  }
  const saveBlock = async () => {
    if (!manifest || !editingBlock) return
    try { await saveManifest(mergeBlock(manifest, editingBlock, JSON.parse(editorText) as Record<string, unknown>), `${blocks.find((block) => block.id === editingBlock)?.title} was saved.`) }
    catch (error) { setMessage(error instanceof SyntaxError ? 'The block must be valid JSON before it can be saved.' : 'Unable to save this content block.') }
  }
  const addTeam = async () => {
    if (!manifest) return
    const team = Object.fromEntries(Object.entries(newTeam).map(([key, value]) => [key, value.trim()])) as Record<string, string>
    if (!/^[a-z0-9-]+$/.test(team.id) || !team.name || !team.shortName || !team.summary || !team.focus) { setMessage('Give the team a lowercase ID (letters, numbers, hyphens), name, short name, summary, and focus.'); return }
    const teams = Array.isArray(manifest.teams) ? manifest.teams : []
    if (teams.some((entry) => itemId(entry) === team.id)) { setMessage('That team ID is already in use.'); return }
    const portals = Array.isArray(manifest.portals) ? manifest.portals : []
    const pages = Array.isArray(manifest.pages) ? manifest.pages : []
    const nextTeamPages = teamPages(team)
    const occupiedPageIds = new Set(pages.flatMap((page) => isRecord(page) && typeof page.id === 'string' ? [page.id] : []))
    if (nextTeamPages.some((page) => occupiedPageIds.has(page.id))) { setMessage('One of that team’s route IDs is already in use. Choose another team ID.'); return }
    const navigation = Array.isArray(manifest.navigation) ? copy(manifest.navigation) as Record<string, unknown>[] : []
    const hearst = navigation.find((entry) => entry.id === 'hearst')
    if (!hearst) { setMessage('The Hearst navigation block is missing. Edit Teams JSON to restore it before adding a team.'); return }
    const children = Array.isArray(hearst.children) ? hearst.children : []
    hearst.children = [...children, teamNavigation(team)]
    await saveManifest({ ...manifest, teams: [...teams, team], portals: [...portals, pendingPortal(team)], pages: [...pages, ...nextTeamPages], navigation }, `${team.name} was created with a ready-to-edit team portal.`)
    setNewTeam({ id: '', name: '', shortName: '', summary: '', focus: '', accent: '#83eebe' })
  }

  return <article className="admin-page">
    <header className="admin-hero"><div><p className="eyebrow">Administrator workspace</p><h1>Keep the hub<br />ready for people.</h1><p>Edit shared onboarding blocks in Supabase, Hearst team content in Google Drive, and grant only the areas each person needs.</p></div><div className="admin-hero__identity"><Shield /><span>Signed in as</span><strong>{profile.email}</strong><em>Administrator</em></div></header>
    <div className="admin-mode-tabs" role="tablist" aria-label="Administrator tools"><button type="button" className={tab === 'people' ? 'is-active' : ''} onClick={() => setTab('people')} role="tab" aria-selected={tab === 'people'}><Users /> People & access</button><button type="button" className={tab === 'content' ? 'is-active' : ''} onClick={() => setTab('content')} role="tab" aria-selected={tab === 'content'}><Blocks /> Content blocks</button></div>
    {message && <p className="admin-message" role="status">{message}</p>}
    {tab === 'people' ? <section className="admin-section" aria-labelledby="members-heading">
      <header><div><p className="eyebrow">Workspace directory</p><h2 id="members-heading">People and access</h2></div><span className="status-badge"><Users /> {people.length} people</span></header><p className="admin-section__intro">A trainee has no content until you grant individual blocks below. Administrators always retain full access.</p>
      <div className="admin-table" role="region" aria-label="People and roles" tabIndex={0}>{people.map((person) => {
        const isEditing = editingId === person.id; const isGranting = grantingId === person.id
        return <article key={person.id} className="admin-member"><div className="admin-row"><div><strong>{person.email || person.id}</strong><span>{person.id}</span></div><div><span className={`role-badge role-badge--${person.role}`}>{person.role}</span><small>{person.content_access.length} grant{person.content_access.length === 1 ? '' : 's'}</small></div><div className="admin-row__action">{isEditing ? <><select value={draftRole} onChange={(event) => setDraftRole(event.target.value as AppRole)} aria-label={`Role for ${person.email}`}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select><button className="button admin-save" type="button" onClick={() => saveRole(person)}><Check /> Save</button></> : <button className="button button--secondary admin-edit" type="button" onClick={() => beginRoleEdit(person)} disabled={person.id === profile.id}><Pencil /> Role</button>}<button className="button button--secondary admin-edit" type="button" onClick={() => beginGrants(person)}><Shield /> Access</button></div></div>
          {isGranting && <div className="admin-grants"><header><div><p className="eyebrow">Granular content access</p><h3>Choose what {person.email || person.id} can open</h3></div><span>{draftGrants.length} selected</span></header><div>{catalog.map((option) => <label key={option.id}><input type="checkbox" checked={draftGrants.includes(option.id)} onChange={(event) => setDraftGrants((current) => event.target.checked ? [...new Set([...current, option.id])] : current.filter((id) => id !== option.id))} /><span><strong>{option.label}</strong><small>{option.kind === 'team' ? 'Team portal' : 'Workspace block'}</small></span></label>)}</div><footer><button className="button button--secondary" type="button" onClick={() => setGrantingId(null)}>Cancel</button><button className="button admin-save" type="button" onClick={() => saveGrants(person)}><Check /> Save access</button></footer></div>}
        </article>
      })}</div>
    </section> : <section className="admin-section" aria-labelledby="content-heading">
      <header><div><p className="eyebrow">Content studio</p><h2 id="content-heading">Edit content as blocks</h2></div><span className="status-badge"><FilePenLine /> Supabase + Drive</span></header><p className="admin-section__intro">Shared workspace blocks are stored in Supabase. Hearst teams remain in Google Drive. Focused edits use the right source automatically; Everything updates both.</p>
      <div className="content-block-grid">{blocks.map((block) => <article key={block.id}><Blocks /><span className="content-block-grid__source">{block.source}</span><h3>{block.title}</h3><p>{block.description}</p><button type="button" className="button button--secondary admin-edit" onClick={() => openBlock(block.id)} disabled={!manifest}><Pencil /> Edit block</button></article>)}</div>
      <section className="admin-team-create"><header><div><p className="eyebrow">New team</p><h3>Create a team portal</h3></div><Plus /></header><p>A new team starts with editable placeholder sections and appears immediately in the Hearst navigation.</p><div className="admin-team-form"><label>Team ID<input value={newTeam.id} placeholder="growth-platform" onChange={(event) => setNewTeam({ ...newTeam, id: event.target.value })} /></label><label>Team name<input value={newTeam.name} placeholder="Growth Platform" onChange={(event) => setNewTeam({ ...newTeam, name: event.target.value })} /></label><label>Short name<input value={newTeam.shortName} placeholder="GP" onChange={(event) => setNewTeam({ ...newTeam, shortName: event.target.value })} /></label><label>Accent<input value={newTeam.accent} placeholder="#83eebe" onChange={(event) => setNewTeam({ ...newTeam, accent: event.target.value })} /></label><label className="admin-team-form__wide">Summary<input value={newTeam.summary} placeholder="What this team owns." onChange={(event) => setNewTeam({ ...newTeam, summary: event.target.value })} /></label><label className="admin-team-form__wide">Focus<input value={newTeam.focus} placeholder="The team’s primary focus." onChange={(event) => setNewTeam({ ...newTeam, focus: event.target.value })} /></label></div><button type="button" className="button admin-save" onClick={addTeam} disabled={!manifest}><Plus /> Add team portal</button></section>
      {editingBlock && <section className="admin-editor"><header><div><p className="eyebrow">Editing block</p><h3>{blocks.find((block) => block.id === editingBlock)?.title}</h3></div><button className="button button--secondary admin-edit" type="button" onClick={() => setEditingBlock(null)}>Cancel</button></header>{editingBlock === 'pages' ? <p>Use <code>pages</code> for canonical page records and <code>pageBlocks[pageId]</code> for each page’s ordered recursive block tree. Shared pages use <code>kind</code> and <code>renderMode</code> set to <code>"blocks"</code>. A block can use <code>text</code>, <code>embed</code>, <code>media</code>, <code>links</code>, <code>layout</code>, reusable <code>settings</code>, and recursive <code>children</code>. For example, <code>{'{"settings":{"variant":"icon-card","icon":{"__icon":"Wrench"}}}'}</code> selects a reusable icon-card treatment.</p> : editingBlock === 'navigation' ? <p>Use <code>navigation</code> and <code>footerNavigation</code> for ordered labels and nested <code>children</code>. Connect a navigable item to a canonical record with <code>pageId</code>; label-only items can omit it. The Drive-owned Hearst branch is preserved automatically.</p> : <p>JSON is stored as authored. Keep icon values as <code>{'{"__icon":"IconName"}'}</code> and Drive assets as <code>drive-asset://asset-key</code>.</p>}<textarea value={editorText} onChange={(event) => setEditorText(event.target.value)} spellCheck={false} aria-label="Content block JSON" /><footer><button className="button admin-save" type="button" onClick={saveBlock}><Save /> Save changes</button></footer></section>}
    </section>}
  </article>
}
