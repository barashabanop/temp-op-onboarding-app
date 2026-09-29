import type { LucideIcon } from 'lucide-react'

/**
 * JSON-only page blocks authored in the workspace database.
 *
 * A block may carry its own content, contain an ordered list of child blocks,
 * or do both.  Keeping the relationship recursive lets a page use a simple
 * paragraph, a collapsible section, or a multi-column composition without
 * adding a new page component for every combination.
 */
export type PageBlockType =
  | 'accordion'
  | 'callout'
  | 'code'
  | 'collapsible'
  | 'columns'
  | 'container'
  | 'divider'
  | 'embed'
  | 'google-drive'
  | 'grid'
  | 'iframe'
  | 'image'
  | 'link-list'
  | 'markdown'
  | 'mermaid'
  | 'paragraph'
  | 'rich-text'
  | 'section'
  | 'row'
  | 'stack'
  | 'text'
  | 'youtube'

/** Leaf content stored below a reusable block. */
export interface BlockContent {
  id: string
  type: string
  key?: string
  label?: string
  value?: string
  url?: string
  alt?: string
  metadata?: Record<string, unknown>
}

export interface BlockText {
  format: 'plain' | 'markdown' | 'mermaid' | 'code'
  body: string
  language?: string
}

export interface BlockEmbed {
  provider: 'youtube' | 'google-drive' | 'iframe'
  url: string
  title?: string
  allowFullscreen?: boolean
}

export interface BlockMedia {
  url: string
  alt?: string
  caption?: string
}

export interface BlockLayout {
  layout: 'row' | 'stack' | 'grid' | 'section'
  columnCount?: number
}

export interface PageBlockLink {
  id?: string
  label: string
  href: string
  description?: string
}

/**
 * A small, data-selected presentation treatment for a generic authored
 * block.  These variants only affect structure and visual hierarchy; page
 * copy, links, and block relationships remain ordinary relational content.
 */
export type PageBlockPresentation =
  | 'action-card'
  | 'action-grid'
  | 'card-grid'
  | 'compact-card'
  | 'definition'
  | 'definition-list'
  | 'hero'
  | 'hero-action'
  | 'hero-lead'
  | 'hero-panel'
  | 'hero-panel-action'
  | 'icon-card'
  | 'resource-card'
  | 'resource-grid'
  | 'section-split'
  | 'step'
  | 'step-list'

/** JSON icon values are hydrated to a local Lucide component before render. */
export type PageBlockIcon = LucideIcon | { __icon: string }

export interface PageBlockPresentationSettings {
  variant?: PageBlockPresentation | string
  icon?: PageBlockIcon
}

export interface PageBlock {
  /** Stable key within a page. It is also safe to use as a deep-link target. */
  id: string
  key?: string
  position?: number
  /** Renderer selected by authored data rather than a page-specific component. */
  type: PageBlockType | string
  label?: string
  title?: string
  /** Optional stable deep-link ID, separate from the database row ID. */
  anchor?: string
  body?: string
  /** PR #6-compatible aliases retained while authored documents migrate. */
  code?: string
  url?: string
  fileId?: string
  /** A URL for embeds, images, and video. */
  mediaUrl?: string
  /** A URL for a primary action or a backwards-compatible media source. */
  href?: string
  /** Canonical typed properties emitted by the block API. */
  text?: BlockText
  embed?: BlockEmbed
  media?: BlockMedia
  layout?: BlockLayout
  /** Ordered links used by the `link-list` block. */
  links?: PageBlockLink[]
  /** Number of tracks for a `row` or `container` block. */
  columnCount?: number
  /** A portable alias used by older authored documents. */
  columns?: number
  /** Any block can be shown as a native collapsible disclosure. */
  collapsible?: boolean
  collapsed?: boolean
  collapse?: boolean
  /** Type-specific JSON settings kept separate from visible copy. */
  config?: Record<string, unknown>
  /** Preferred API name for type-specific JSON settings. */
  settings?: Record<string, unknown>
  /**
   * Compatibility alias for presentation metadata while older authored
   * documents migrate to `settings.variant`.
   */
  presentation?: PageBlockPresentation | string | PageBlockPresentationSettings
  /** Compatibility alias for `settings.icon`. */
  icon?: PageBlockIcon
  /** Leaf content rows owned by this block. */
  content?: BlockContent[] | string
  /** Child blocks make the content model recursive. */
  children?: PageBlock[]
}
