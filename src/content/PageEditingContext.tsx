import { createContext, useContext } from 'react'
import type { PageContent } from '../types/navigation'

/** The visible copy an author can change without opening the JSON editor. */
export interface BlockPatch {
  label?: string
  title?: string
  body?: string
}

export type PagePatch = Partial<Pick<PageContent, 'eyebrow' | 'title' | 'description'>>

export interface PageEditing {
  updatePage: (patch: PagePatch) => void
  updateBlock: (blockId: string, patch: BlockPatch) => void
  moveBlock: (blockId: string, offset: number) => void
  removeBlock: (blockId: string) => void
}

const PageEditingContext = createContext<PageEditing | null>(null)

export const PageEditingProvider = PageEditingContext.Provider

/** `null` whenever the page is being read rather than authored. */
export const usePageEditing = () => useContext(PageEditingContext)
