import type { LucideIcon } from 'lucide-react'

export type PageKind =
  | 'overview'
  | 'resources'
  | 'team'
  | 'guide'
  | 'blocks'

export interface PageContent {
  id: string
  eyebrow: string
  title: string
  description: string
  kind: PageKind
  /** Renderer selection. Shared workspace pages use the generic block mode. */
  renderMode?: 'template' | 'blocks'
  category?: string
  level?: 'Beginner' | 'Intermediate' | 'Advanced'
}

export interface NavigationItem {
  id: string
  label: string
  icon?: LucideIcon
  /** Canonical page relationship. A node can also be a label-only group. */
  pageId?: string
  children?: NavigationItem[]
  hideChildren?: boolean
}
