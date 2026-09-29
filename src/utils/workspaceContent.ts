/**
 * Helpers for reading the raw administrator content manifest.
 *
 * The manifest merges the Supabase workspace graph with the Drive-owned
 * Hearst branch, so both the block editor and the administrator panel need
 * the same rule for telling the two apart before they write anything back.
 */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const itemId = (value: unknown) => isRecord(value) && typeof value.id === 'string' ? value.id : undefined

export function referencedPageIds(items: unknown): Set<string> {
  const pageIds = new Set<string>()
  if (!Array.isArray(items)) return pageIds
  for (const item of items) {
    if (!isRecord(item)) continue
    if (typeof item.pageId === 'string' && item.pageId) pageIds.add(item.pageId)
    for (const pageId of referencedPageIds(item.children)) pageIds.add(pageId)
  }
  return pageIds
}

/** Page IDs reachable from the Drive-owned Hearst navigation branch. */
export function hearstPageIds(navigation: unknown): Set<string> {
  const hearstNavigation = Array.isArray(navigation)
    ? navigation.filter((entry) => itemId(entry) === 'hearst')
    : []
  return referencedPageIds(hearstNavigation)
}
