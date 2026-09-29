import {
  BookOpen,
  Braces,
  Building2,
  CircleHelp,
  Clock3,
  Code2,
  Database,
  GitBranch,
  Globe2,
  Home,
  KeyRound,
  Layers3,
  LayoutDashboard,
  MessageSquareText,
  Network,
  Rocket,
  SearchCheck,
  ServerCog,
  Shield,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Users,
  Waypoints,
  Wrench,
} from 'lucide-react'
import type { PortalContent } from '../types/content'
import type { PageBlock } from '../types/blocks'
import type { NavigationItem, PageContent } from '../types/navigation'
import type { TeamPortalData } from '../types/portal'
export type AppRole = 'trainee' | 'trainer' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: AppRole
  team_id: string | null
  content_access: string[]
}

interface DevelopmentSession {
  access_token: string
  profile: Profile
}

// This Pages build has one content authority.  Keep the API address in source
// rather than allowing a build-time fallback, so no workspace data or server
// configuration needs to live in this repository.
const apiBase = 'https://bara-shaban.workers.dev'

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null
    throw new ApiError(response.status, body?.detail ?? 'The service could not complete that request.')
  }
  return response.json() as Promise<T>
}

export const getMe = (token?: string | null) => request<Profile>('/me', {}, token)

// Drive stores pure content; the client reattaches the locally bundled icon
// components after loading the JSON manifest.
const icons = {
  BookOpen, Braces, Building2, Clock3, Code2, Database, GitBranch, Globe2,
  Home, KeyRound, Layers3, LayoutDashboard, MessageSquareText, Network,
  Rocket, SearchCheck, ServerCog, Shield, ShieldCheck, Sparkles,
  TerminalSquare, Users, Waypoints, Wrench,
}
const iconFor = (name: string) => icons[name as keyof typeof icons] ?? CircleHelp

async function readAssetUrl(key: string, token: string): Promise<string> {
  const response = await fetch(`${apiBase}/content/assets/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null
    throw new ApiError(response.status, body?.detail ?? 'Unable to load a Drive content asset.')
  }
  return URL.createObjectURL(await response.blob())
}

async function hydrateContent(value: unknown, token: string, assets: Map<string, Promise<string>>): Promise<unknown> {
  if (typeof value === 'string' && value.startsWith('drive-asset://')) {
    const key = value.slice(14)
    if (!assets.has(key)) assets.set(key, readAssetUrl(key, token))
    return assets.get(key)
  }
  if (Array.isArray(value)) return Promise.all(value.map((entry) => hydrateContent(entry, token, assets)))
  if (value && typeof value === 'object') {
    const entry = value as Record<string, unknown>
    if (typeof entry.__icon === 'string') return iconFor(entry.__icon)
    const entries = await Promise.all(Object.entries(entry).map(async ([key, nested]) => [key, await hydrateContent(nested, token, assets)] as const))
    return Object.fromEntries(entries)
  }
  return value
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

function isPage(value: unknown): value is PageContent {
  if (!isRecord(value)) return false
  return isNonEmptyString(value.id)
    && typeof value.eyebrow === 'string'
    && isNonEmptyString(value.title)
    && typeof value.description === 'string'
    && isNonEmptyString(value.kind)
    && (value.renderMode === undefined || value.renderMode === 'template' || value.renderMode === 'blocks')
}

function isNavigationItem(value: unknown): value is NavigationItem {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.label)) return false
  if (value.pageId !== undefined && !isNonEmptyString(value.pageId)) return false
  return value.children === undefined
    || (Array.isArray(value.children) && value.children.every(isNavigationItem))
}

function isPageBlock(value: unknown): value is PageBlock {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.type)) return false
  return value.children === undefined
    || (Array.isArray(value.children) && value.children.every(isPageBlock))
}

function isPageBlockIndex(value: unknown, pageIds: Set<string>): value is Record<string, PageBlock[]> {
  if (!isRecord(value)) return false
  return Object.entries(value).every(([pageId, blocks]) =>
    pageIds.has(pageId) && Array.isArray(blocks) && blocks.every(isPageBlock),
  )
}

function isHearstTeam(value: unknown): value is PortalContent['teams'][number] {
  if (!isRecord(value)) return false
  return ['id', 'name', 'shortName', 'summary', 'focus', 'accent'].every((key) => isNonEmptyString(value[key]))
}

function isTeamPortal(value: unknown): value is TeamPortalData {
  if (!isRecord(value) || !isHearstTeam(value.identity)) return false
  return ['overview', 'communication', 'work', 'resources', 'journey'].every((key) => isRecord(value[key]))
}

function isLoadedPortalContent(value: unknown): value is PortalContent {
  if (!isRecord(value) || typeof value.version !== 'number' || !Number.isInteger(value.version) || value.version < 1) return false
  if (!Array.isArray(value.pages) || value.pages.length === 0 || !value.pages.every(isPage)) return false

  const pageIds = new Set(value.pages.map((page) => page.id))
  return isPageBlockIndex(value.pageBlocks, pageIds)
    && Array.isArray(value.navigation)
    && value.navigation.every(isNavigationItem)
    && Array.isArray(value.footerNavigation)
    && value.footerNavigation.every(isNavigationItem)
    && Array.isArray(value.teams)
    && value.teams.every(isHearstTeam)
    && Array.isArray(value.portals)
    && value.portals.every(isTeamPortal)
}

export const getPortalContent = async (token: string): Promise<PortalContent> => {
  const hydrated = await hydrateContent(await request<unknown>('/content', {}, token), token, new Map())
  if (!isLoadedPortalContent(hydrated)) {
    throw new ApiError(
      502,
      'The onboarding API returned an invalid canonical content document. Deploy the current backend revision and try again.',
    )
  }
  return hydrated
}

export interface ContentAccessOption {
  id: string
  label: string
  kind: 'workspace' | 'team'
}

export const getContentAccessCatalog = (token: string) =>
  request<ContentAccessOption[]>('/content/access-catalog', {}, token)

export const getAdminContent = (token: string) =>
  request<Record<string, unknown>>('/content/admin', {}, token)

export const replaceAdminContent = (token: string, content: Record<string, unknown>) =>
  request<Record<string, unknown>>('/content/admin', {
    method: 'PUT',
    body: JSON.stringify({ content }),
  }, token)

export const createDevelopmentSession = (userId: string, email: string) =>
  request<DevelopmentSession>('/auth/dev/session', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, email }),
  })

export const listPeople = (token: string) => request<Profile[]>('/people', {}, token)

export const updateRole = (token: string, userId: string, role: AppRole) =>
  request<Profile>(`/people/${encodeURIComponent(userId)}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }, token)

export const updateContentAccess = (token: string, userId: string, contentAccess: string[]) =>
  request<Profile>(`/people/${encodeURIComponent(userId)}/content-access`, {
    method: 'PUT',
    body: JSON.stringify({ content_access: contentAccess }),
  }, token)
