import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { FilePenLine, Plus, Save, X } from 'lucide-react'
import { ApiError, getAdminContent, getPortalContent, replaceAdminContent } from '../auth/api'
import { type BlockPatch, type PageEditing, PageEditingProvider } from '../content/PageEditingContext'
import type { PageBlock } from '../types/blocks'
import type { PortalContent } from '../types/content'
import type { PageContent as PageContentType } from '../types/navigation'
import { isRecord } from '../utils/workspaceContent'

interface PageEditorProps {
  page: PageContentType
  blocks: PageBlock[]
  token: string
  onContentUpdated: (content: PortalContent) => void
  /** Renders the page itself from whichever copy is currently authoritative. */
  children: (page: PageContentType, blocks: PageBlock[]) => ReactNode
}

interface Draft {
  /** The raw administrator manifest, kept unhydrated so it can be saved back. */
  manifest: Record<string, unknown>
  page: PageContentType
  blocks: PageBlock[]
}

/**
 * The draft is cloned from the rendered tree so the editor shows the real
 * page. Order travels with the array while editing, so a stored position is
 * dropped to stop the renderer from sorting a move straight back.
 */
function cloneBlocks(blocks: PageBlock[]): PageBlock[] {
  return blocks.map((block) => {
    const next: PageBlock = { ...block }
    delete next.position
    if (block.children) next.children = cloneBlocks(block.children)
    return next
  })
}

function patchBlocks(blocks: PageBlock[], blockId: string, patch: BlockPatch): PageBlock[] {
  return blocks.map((block) => {
    if (block.id !== blockId) {
      return block.children ? { ...block, children: patchBlocks(block.children, blockId, patch) } : block
    }
    const next: PageBlock = { ...block }
    if (patch.label !== undefined) next.label = patch.label
    if (patch.title !== undefined) next.title = patch.title
    if (patch.body !== undefined) next.text = { format: 'plain', ...block.text, body: patch.body }
    return next
  })
}

function withoutBlock(blocks: PageBlock[], blockId: string): PageBlock[] {
  return blocks
    .filter((block) => block.id !== blockId)
    .map((block) => block.children ? { ...block, children: withoutBlock(block.children, blockId) } : block)
}

function withMovedBlock(blocks: PageBlock[], blockId: string, offset: number): PageBlock[] {
  const index = blocks.findIndex((block) => block.id === blockId)
  if (index < 0) {
    return blocks.map((block) => block.children ? { ...block, children: withMovedBlock(block.children, blockId, offset) } : block)
  }
  const target = index + offset
  if (target < 0 || target >= blocks.length) return blocks
  const next = [...blocks]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  return next
}

function newSection(): PageBlock {
  const id = `block-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Date.now().toString(36)}`
  return { id, key: id, type: 'paragraph', title: '', text: { format: 'plain', body: '' } }
}

/** Every saved block keeps the properties the editor does not expose. */
function indexRawBlocks(value: unknown, into = new Map<string, Record<string, unknown>>()) {
  if (!Array.isArray(value)) return into
  for (const entry of value) {
    if (!isRecord(entry)) continue
    if (typeof entry.id === 'string') into.set(entry.id, entry)
    indexRawBlocks(entry.children, into)
  }
  return into
}

function applyBody(raw: Record<string, unknown>, body: string) {
  if (isRecord(raw.text)) raw.text = { ...raw.text, body }
  else if (typeof raw.body === 'string') raw.body = body
  else raw.text = { format: 'plain', body }
}

function serializeBlocks(draft: PageBlock[], index: Map<string, Record<string, unknown>>): Record<string, unknown>[] {
  return draft.map((block) => {
    const source = index.get(block.id)
    const raw: Record<string, unknown> = source ? { ...source } : { id: block.id, key: block.key ?? block.id, type: block.type }
    // The array carries the order, so a stored position would contradict it.
    delete raw.position
    if (block.label !== undefined) raw.label = block.label
    if (block.title !== undefined) raw.title = block.title
    if (block.text?.body !== undefined) applyBody(raw, block.text.body)
    const children = block.children?.length ? serializeBlocks(block.children, index) : []
    if (children.length) raw.children = children
    else delete raw.children
    return raw
  })
}

export function PageEditor({ page, blocks, token, onContentUpdated, children }: PageEditorProps) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState<'opening' | 'saving' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  const editing = useMemo<PageEditing>(() => {
    const revise = (change: (current: Draft) => Draft) => {
      setDraft((current) => current && change(current))
      setDirty(true)
    }
    return {
      updatePage: (patch) => revise((current) => ({ ...current, page: { ...current.page, ...patch } })),
      updateBlock: (blockId, patch) => revise((current) => ({ ...current, blocks: patchBlocks(current.blocks, blockId, patch) })),
      moveBlock: (blockId, offset) => revise((current) => ({ ...current, blocks: withMovedBlock(current.blocks, blockId, offset) })),
      removeBlock: (blockId) => revise((current) => ({ ...current, blocks: withoutBlock(current.blocks, blockId) })),
    }
  }, [])

  useEffect(() => {
    if (!dirty) return
    const confirmExit = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', confirmExit)
    return () => window.removeEventListener('beforeunload', confirmExit)
  }, [dirty])

  const openEditor = async () => {
    setBusy('opening')
    setMessage(null)
    try {
      setDraft({ manifest: await getAdminContent(token), page: { ...page }, blocks: cloneBlocks(blocks) })
      setDirty(false)
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Unable to open this page for editing.')
    } finally {
      setBusy(null)
    }
  }

  const closeEditor = () => {
    if (dirty && !window.confirm('Discard your unsaved changes to this page?')) return
    setDraft(null)
    setDirty(false)
    setMessage(null)
  }

  const addSection = () => {
    setDraft((current) => current && { ...current, blocks: [...current.blocks, newSection()] })
    setDirty(true)
  }

  const save = async () => {
    if (!draft) return
    setBusy('saving')
    setMessage(null)
    try {
      const rawPageBlocks = isRecord(draft.manifest.pageBlocks) ? draft.manifest.pageBlocks : {}
      const nextManifest: Record<string, unknown> = {
        ...draft.manifest,
        pages: Array.isArray(draft.manifest.pages)
          ? draft.manifest.pages.map((record) => isRecord(record) && record.id === page.id
            ? { ...record, eyebrow: draft.page.eyebrow, title: draft.page.title, description: draft.page.description }
            : record)
          : draft.manifest.pages,
        pageBlocks: {
          ...rawPageBlocks,
          [page.id]: serializeBlocks(draft.blocks, indexRawBlocks(rawPageBlocks[page.id])),
        },
      }
      await replaceAdminContent(token, nextManifest)
      const refreshed = await getPortalContent(token)
      setDraft(null)
      setDirty(false)
      onContentUpdated(refreshed)
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Unable to save this page.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={`page-editing ${draft ? 'page-editing--active' : ''}`.trim()}>
      <div className="page-editor-bar">
        {draft ? (
          <>
            <span className="page-editor-bar__state"><FilePenLine aria-hidden="true" /> Editing this page</span>
            <button type="button" className="button button--secondary" onClick={addSection}><Plus aria-hidden="true" /> Add section</button>
            <button type="button" className="button button--secondary" onClick={closeEditor} disabled={busy === 'saving'}><X aria-hidden="true" /> Cancel</button>
            <button type="button" className="button button--primary" onClick={save} disabled={busy === 'saving' || !dirty}>
              <Save aria-hidden="true" /> {busy === 'saving' ? 'Saving…' : 'Save changes'}
            </button>
          </>
        ) : (
          <button type="button" className="button button--secondary" onClick={openEditor} disabled={busy === 'opening'}>
            <FilePenLine aria-hidden="true" /> {busy === 'opening' ? 'Opening…' : 'Edit page'}
          </button>
        )}
      </div>
      {message && <p className="page-editor-bar__message" role="status">{message}</p>}
      {draft
        ? <PageEditingProvider value={editing}>{children(draft.page, draft.blocks)}</PageEditingProvider>
        : children(page, blocks)}
    </div>
  )
}
