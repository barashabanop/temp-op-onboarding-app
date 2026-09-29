import { createContext, useContext } from 'react'
import type { PortalContent } from '../types/content'

const ContentContext = createContext<PortalContent | null>(null)

export const ContentProvider = ContentContext.Provider

export function usePortalContent(): PortalContent {
  const content = useContext(ContentContext)
  if (!content) throw new Error('Portal content has not been loaded.')
  return content
}
