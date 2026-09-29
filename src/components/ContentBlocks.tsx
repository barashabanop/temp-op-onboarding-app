import { ChevronDown, ChevronUp, ExternalLink, Heading1, Link2, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import type { BlockContent, PageBlock, PageBlockLink, PageBlockPresentation, PageBlockType } from '../types/blocks'
import { type PageEditing, usePageEditing } from '../content/PageEditingContext'
import { EditableText } from './EditableText'

interface ContentBlocksProps {
  blocks: PageBlock[]
  depth?: number
  /** A parent-owned semantic layout for its immediate child blocks. */
  presentation?: PageBlockPresentation
  /**
   * The page's own heading, rendered inside a `hero` block so the opening
   * title shares a column with its lead copy instead of sitting above the
   * whole hero. Only a `hero` block receives it.
   */
  header?: ReactNode
}

const aliases: Record<string, PageBlockType> = {
  accordion: 'collapsible',
  columns: 'row',
  embed: 'iframe',
  grid: 'row',
  group: 'container',
  link: 'link-list',
  md: 'markdown',
  mmd: 'mermaid',
  'rich-text': 'paragraph',
  section: 'container',
  stack: 'container',
  text: 'paragraph',
  video: 'youtube',
}

/**
 * Presentation values remain deliberately small and data-driven. They let a
 * relational block tree express familiar editorial patterns without teaching
 * this renderer about a particular page, team, or legacy collection.
 */
const presentationAliases: Record<string, PageBlockPresentation> = {
  'action-card': 'action-card',
  'action-grid': 'action-grid',
  'card-grid': 'card-grid',
  cards: 'card-grid',
  'feature-grid': 'card-grid',
  'icon-card-grid': 'card-grid',
  'compact-card': 'compact-card',
  compact: 'compact-card',
  definition: 'definition',
  'definition-list': 'definition-list',
  definitions: 'definition-list',
  glossary: 'definition-list',
  hero: 'hero',
  'hero-grid': 'hero',
  'home-hero': 'hero',
  'hero-action': 'hero-action',
  'hero-lead': 'hero-lead',
  'hero-intro': 'hero-lead',
  'hero-panel': 'hero-panel',
  'signal-panel': 'hero-panel',
  'hero-panel-action': 'hero-panel-action',
  'icon-card': 'icon-card',
  iconcard: 'icon-card',
  'resource-card': 'resource-card',
  'resource-grid': 'resource-grid',
  resources: 'resource-grid',
  'section-split': 'section-split',
  split: 'section-split',
  'split-flow': 'section-split',
  'split-grid': 'section-split',
  step: 'step',
  'ordered-step': 'step',
  'step-list': 'step-list',
  steps: 'step-list',
  flow: 'step-list',
  'numbered-list': 'step-list',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const settingsValue = (block: PageBlock, key: string): unknown => {
  const presentation = isRecord(block.presentation) ? block.presentation : undefined
  if (key === 'variant' && typeof block.presentation === 'string') return block.presentation
  if (key === 'icon' && block.icon !== undefined) return block.icon
  return block.settings?.[key] ?? block.config?.[key] ?? presentation?.[key]
}

export const blockPresentation = (block: PageBlock): PageBlockPresentation | undefined => {
  const candidate = settingsValue(block, 'variant') ?? settingsValue(block, 'presentation')
  if (typeof candidate !== 'string') return undefined
  const key = candidate.trim().toLowerCase().replace(/[\s_]+/g, '-')
  return presentationAliases[key]
}

const normaliseType = (type: string | undefined): PageBlockType | 'unknown' => {
  const value = type?.trim().toLowerCase() ?? ''
  return aliases[value] ?? (
    ['callout', 'code', 'collapsible', 'container', 'divider', 'google-drive', 'iframe', 'image', 'link-list', 'markdown', 'mermaid', 'paragraph', 'row', 'youtube']
      .includes(value)
      ? value as PageBlockType
      : 'unknown'
  )
}

function typeFor(block: PageBlock): PageBlockType | 'unknown' {
  if (block.layout) return block.layout.layout === 'row' || block.layout.layout === 'grid' ? 'row' : 'container'
  const direct = normaliseType(block.type)
  if (direct !== 'unknown') return direct
  if (block.embed) return block.embed.provider
  if (block.media) return 'image'
  if (block.text?.format === 'markdown') return 'markdown'
  if (block.text?.format === 'mermaid') return 'mermaid'
  if (block.text?.format === 'code') return 'code'
  if (block.text) return 'paragraph'
  return 'unknown'
}

const configString = (block: PageBlock, key: string): string | undefined => {
  const value = settingsValue(block, key)
  return typeof value === 'string' ? value : undefined
}

const contentValue = (content: BlockContent, key: string): string | undefined => {
  const value = content.metadata?.[key]
  return typeof value === 'string' ? value : undefined
}

const contentAtoms = (block: PageBlock): BlockContent[] => Array.isArray(block.content)
  ? block.content.filter((entry): entry is BlockContent => Boolean(entry) && typeof entry === 'object' && typeof entry.type === 'string')
  : []

const bodyFor = (block: PageBlock): string => block.text?.body ?? block.body ?? (typeof block.content === 'string' ? block.content : block.code ?? '')

const mediaUrlFor = (block: PageBlock): string | undefined => {
  if (block.embed?.url ?? block.media?.url ?? block.mediaUrl ?? block.href ?? block.url ?? configString(block, 'src')) {
    return block.embed?.url ?? block.media?.url ?? block.mediaUrl ?? block.href ?? block.url ?? configString(block, 'src')
  }
  const fileId = block.fileId ?? configString(block, 'fileId')
  if (fileId) return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`
  const atom = contentAtoms(block).find((entry) => ['iframe', 'embed', 'google-drive', 'image', 'video', 'youtube'].includes(entry.type.toLowerCase()))
  return atom?.url ?? contentValue(atom ?? { id: '', type: '' }, 'src')
}

const safeUrl = (value: string | undefined): string | undefined => {
  if (!value?.trim()) return undefined
  const candidate = value.trim()
  if (candidate.startsWith('#/') || candidate.startsWith('/')) return candidate
  try {
    const parsed = new URL(candidate)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'blob:' ? parsed.href : undefined
  } catch {
    return undefined
  }
}

const externalUrl = (href: string) => href.startsWith('http://') || href.startsWith('https://')

function embedUrl(block: PageBlock, type: PageBlockType | 'unknown'): string | undefined {
  const href = safeUrl(mediaUrlFor(block))
  if (!href) return undefined

  if (type === 'google-drive') {
    try {
      const parsed = new URL(href)
      if (parsed.hostname.replace(/^www\./, '') === 'drive.google.com') {
        const fileId = parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? parsed.searchParams.get('id')
        if (fileId) return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`
      }
    } catch {
      return undefined
    }
    return href
  }
  if (type !== 'youtube') return href

  try {
    const parsed = new URL(href)
    const hostname = parsed.hostname.replace(/^www\./, '')
    if (hostname === 'youtu.be') {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0]
      return videoId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` : undefined
    }
    if (hostname.endsWith('youtube.com')) {
      const videoId = parsed.searchParams.get('v')
      if (videoId) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
    }
  } catch {
    return undefined
  }
  return href
}

const columnCount = (block: PageBlock) => {
  const configured = block.layout?.columnCount ?? block.columnCount ?? block.columns ?? settingsValue(block, 'columnCount') ?? settingsValue(block, 'columns')
  return typeof configured === 'number' && Number.isInteger(configured)
    ? Math.min(Math.max(configured, 1), 4)
    : undefined
}

function linksFor(block: PageBlock): PageBlockLink[] {
  const configured = settingsValue(block, 'links')
  const atomLinks = contentAtoms(block).filter((entry) => ['link', 'link-list'].includes(entry.type.toLowerCase())).map((entry) => ({
    id: entry.id,
    label: entry.label ?? entry.value ?? '',
    href: entry.url ?? contentValue(entry, 'href') ?? '',
    description: contentValue(entry, 'description'),
  })) ?? []
  const presentation = blockPresentation(block)
  const resourceHref = presentation === 'resource-card' || presentation === 'action-card'
    ? safeUrl(block.href ?? configString(block, 'href'))
    : undefined
  const fallbackLink = resourceHref ? [{
    id: `${block.id}-primary-link`,
    label: configString(block, 'actionLabel') ?? (presentation === 'action-card' ? 'Continue' : 'Open resource'),
    href: resourceHref,
  }] : atomLinks
  const entries = Array.isArray(block.links) ? block.links : Array.isArray(configured) ? configured : fallbackLink
  return entries.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return []
    const candidate = entry as Record<string, unknown>
    const label = typeof candidate.label === 'string' ? candidate.label : undefined
    const href = typeof candidate.href === 'string' ? safeUrl(candidate.href) : undefined
    if (!label || !href) return []
    return [{
      id: typeof candidate.id === 'string' ? candidate.id : `${block.id}-link-${index}`,
      label,
      href,
      description: typeof candidate.description === 'string' ? candidate.description : undefined,
    }]
  })
}

function Copy({ body, markdown = false }: { body: string, markdown?: boolean }) {
  const paragraphs = body.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
  if (!paragraphs.length) return null

  return (
    <div className={`authored-block__copy ${markdown ? 'authored-block__copy--markdown' : ''}`}>
      {paragraphs.map((paragraph, index) => {
        const lines = paragraph.split('\n').map((line) => line.trim()).filter(Boolean)
        const bullets = lines.every((line) => /^[-*+]\s+/.test(line))
        const numbered = lines.every((line) => /^\d+[.)]\s+/.test(line))
        if (bullets) return <ul key={`${index}-${paragraph.slice(0, 24)}`}>{lines.map((line) => <li key={line}>{line.replace(/^[-*+]\s+/, '')}</li>)}</ul>
        if (numbered) return <ol key={`${index}-${paragraph.slice(0, 24)}`}>{lines.map((line) => <li key={line}>{line.replace(/^\d+[.)]\s+/, '')}</li>)}</ol>
        return <p key={`${index}-${paragraph.slice(0, 24)}`}>{lines.map((line, lineIndex) => <span key={`${lineIndex}-${line}`}>{line}{lineIndex < lines.length - 1 && <br />}</span>)}</p>
      })}
    </div>
  )
}

const describeBlock = (block: PageBlock) => block.title ?? block.label ?? `${block.type} block`

/** Types whose body copy an author can write even when it is currently empty. */
const textualTypes = new Set<string>(['callout', 'code', 'markdown', 'mermaid', 'paragraph'])

const holdsText = (block: PageBlock, type: PageBlockType | 'unknown') =>
  textualTypes.has(type) || block.text !== undefined || block.body !== undefined

function BodyEditor({ block, body, editing }: { block: PageBlock, body: string, editing: PageEditing }) {
  const format = block.text?.format
  const monospaced = format === 'code' || format === 'mermaid'
  return (
    <div className={`authored-block__copy ${monospaced ? 'authored-block__copy--monospaced' : ''}`.trim()}>
      <EditableText
        value={body}
        label={`Body text for ${describeBlock(block)}`}
        placeholder="Add body text"
        onChange={(next) => editing.updateBlock(block.id, { body: next })}
      />
    </div>
  )
}

function BlockTools({ block, editing }: { block: PageBlock, editing: PageEditing }) {
  const name = describeBlock(block)
  return (
    <div className="block-tools">
      {block.title === undefined && (
        <button type="button" onClick={() => editing.updateBlock(block.id, { title: '' })} aria-label={`Add a heading to ${name}`}><Heading1 aria-hidden="true" /></button>
      )}
      <button type="button" onClick={() => editing.moveBlock(block.id, -1)} aria-label={`Move ${name} earlier`}><ChevronUp aria-hidden="true" /></button>
      <button type="button" onClick={() => editing.moveBlock(block.id, 1)} aria-label={`Move ${name} later`}><ChevronDown aria-hidden="true" /></button>
      <button type="button" className="block-tools__remove" onClick={() => editing.removeBlock(block.id)} aria-label={`Delete ${name}`}><Trash2 aria-hidden="true" /></button>
    </div>
  )
}

/**
 * Authored JSON cannot invoke components. The API hydrates only known Lucide
 * records, so retain the same narrow guard used by navigation before render.
 */
function isRenderableIcon(value: unknown): value is LucideIcon {
  if (typeof value === 'function') return true
  if (!value || typeof value !== 'object') return false
  return (value as { $$typeof?: unknown }).$$typeof === Symbol.for('react.forward_ref')
}

function BlockIcon({ block }: { block: PageBlock }) {
  const icon = settingsValue(block, 'icon')
  const Icon = isRenderableIcon(icon) ? icon : undefined
  if (!Icon) return null
  return <span className="authored-block__icon"><Icon aria-hidden="true" /></span>
}

function Heading({ block, depth, inDisclosure = false, suppressLabel = false }: { block: PageBlock, depth: number, inDisclosure?: boolean, suppressLabel?: boolean }) {
  const editing = usePageEditing()
  const label = suppressLabel ? undefined : block.label
  // Offering a heading on every block would bury the page in empty fields, so
  // the editor follows the copy that exists. The block tools add one on request.
  const headed = block.title !== undefined || label !== undefined
  if (editing && !inDisclosure && headed) {
    const EditableHeadingTag = depth > 1 ? 'h3' : 'h2'
    return (
      <header className="authored-block__header">
        {label !== undefined && (
          <p className="authored-block__label">
            <EditableText
              value={label}
              label={`Eyebrow for ${describeBlock(block)}`}
              placeholder="Eyebrow"
              onChange={(next) => editing.updateBlock(block.id, { label: next })}
            />
          </p>
        )}
        <EditableHeadingTag>
          <EditableText
            value={block.title ?? ''}
            label={`Heading for ${describeBlock(block)}`}
            placeholder="Add a heading"
            onChange={(next) => editing.updateBlock(block.id, { title: next })}
          />
        </EditableHeadingTag>
      </header>
    )
  }
  if (inDisclosure && !label) return null
  const title = inDisclosure ? label : block.title
  if (!title) return label && !inDisclosure ? <p className="authored-block__label">{label}</p> : null
  const HeadingTag = depth > 1 ? 'h3' : 'h2'
  return (
    <header className="authored-block__header">
      {label && !inDisclosure && <p className="authored-block__label">{label}</p>}
      <HeadingTag>{title}</HeadingTag>
    </header>
  )
}

function LinkList({ block }: { block: PageBlock }) {
  const links = linksFor(block)
  if (!links.length) return null
  return (
    <ul className="authored-block__links">
      {links.map((link) => <li key={link.id}>
        <a href={link.href} target={externalUrl(link.href) ? '_blank' : undefined} rel={externalUrl(link.href) ? 'noreferrer' : undefined}>
          <span><strong>{link.label}</strong>{link.description && <small>{link.description}</small>}</span>
          {externalUrl(link.href) ? <ExternalLink aria-hidden="true" /> : <Link2 aria-hidden="true" />}
        </a>
      </li>)}
    </ul>
  )
}

function Media({ block, type }: { block: PageBlock, type: PageBlockType | 'unknown' }) {
  const src = embedUrl(block, type)
  if (!src) return null
  if (type === 'image') {
    return <figure className="authored-block__image"><img src={src} alt={block.media?.alt ?? configString(block, 'alt') ?? block.title ?? block.label ?? ''} loading="lazy" />{(block.media?.caption ?? bodyFor(block)) && <figcaption>{block.media?.caption ?? bodyFor(block)}</figcaption>}</figure>
  }
  return (
    <div className="authored-block__embed">
      <iframe
        src={src}
        title={block.embed?.title ?? block.title ?? block.label ?? 'Embedded onboarding content'}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen={block.embed?.allowFullscreen ?? true}
      />
    </div>
  )
}

function BlockAtoms({ block, depth }: { block: PageBlock, depth: number }) {
  const atoms = contentAtoms(block)
  if (!atoms.length) return null
  return (
    <div className="authored-block__atoms">
      {atoms.map((atom, index) => {
        const atomType = normaliseType(atom.type)
        const links = atomType === 'link-list' ? [{
          id: atom.id,
          label: atom.label ?? atom.value ?? '',
          href: atom.url ?? contentValue(atom, 'href') ?? '',
          description: contentValue(atom, 'description'),
        }] : undefined
        const atomBlock: PageBlock = {
          id: `${block.id}-${atom.id || index}`,
          type: atom.type,
          key: atom.key,
          label: atom.label,
          body: atom.value,
          mediaUrl: atom.url,
          links,
          settings: atom.metadata,
        }
        return <div className="authored-block__atom" key={atom.id || `${atom.type}-${index}`}><BlockBody block={atomBlock} depth={depth + 1} /></div>
      })}
    </div>
  )
}

function BlockBody({ block, depth, omitTitle = false, header }: { block: PageBlock, depth: number, omitTitle?: boolean, header?: ReactNode }) {
  const editing = usePageEditing()
  const type = typeFor(block)
  const presentation = blockPresentation(block)
  const childPresentation = presentation === 'definition-list' || presentation === 'step-list' || presentation === 'hero'
    ? presentation
    : undefined
  const children = block.children?.length ? <ContentBlocks blocks={block.children} depth={depth + 1} presentation={childPresentation} /> : null
  const body = bodyFor(block)
  const intro = omitTitle ? null : <Heading block={block} depth={depth} suppressLabel={presentation === 'icon-card'} />
  const icon = presentation === 'icon-card' ? <BlockIcon block={block} /> : null
  const textFormat = block.text?.format
  const textContent = editing && holdsText(block, type)
    ? <BodyEditor block={block} body={body} editing={editing} />
    : !body ? null : type === 'mermaid' || textFormat === 'mermaid'
      ? <pre className="authored-block__diagram"><code>{body}</code></pre>
      : type === 'code' || textFormat === 'code'
        ? <pre className="authored-block__code"><code>{body}</code></pre>
        : <Copy body={body} markdown={type === 'markdown' || textFormat === 'markdown'} />
  const atoms = ['image', 'iframe', 'google-drive', 'link-list', 'mermaid', 'youtube'].includes(type)
    ? null
    : <BlockAtoms block={block} depth={depth} />
  const links = type === 'link-list' ? null : <LinkList block={block} />

  if (type === 'row' || type === 'container' || type === 'collapsible') {
    return <>{icon}{intro}{header}{textContent}{atoms}{links}{children}</>
  }
  if (type === 'link-list') {
    return <>{icon}{intro}{textContent}{<LinkList block={block} />}{children}</>
  }
  if (type === 'image' || type === 'iframe' || type === 'embed' || type === 'google-drive' || type === 'youtube') {
    return <>{icon}{intro}{<Media block={block} type={type} />}{type !== 'image' && textContent}{links}{children}</>
  }
  if (type === 'divider') {
    return <>{icon}{intro}<hr className="authored-block__divider" />{atoms}{links}{children}</>
  }
  if (type === 'mermaid') {
    return <>{icon}{intro}{textContent}{links}{children}</>
  }
  if (type === 'code') {
    return <>{icon}{intro}{textContent}{links}{children}</>
  }
  return <>{icon}{intro}{textContent}{atoms}{links}{children}</>
}

function Block({ block, depth, header }: { block: PageBlock, depth: number, header?: ReactNode }) {
  const editing = usePageEditing()
  const type = typeFor(block)
  const presentation = blockPresentation(block)
  const columns = columnCount(block)
  const style = columns ? { '--authored-columns': columns } as CSSProperties : undefined
  const classNames = [
    'authored-block',
    `authored-block--${type}`,
    presentation ? `authored-block--${presentation}` : '',
    block.children?.length ? 'authored-block--has-children' : '',
  ].filter(Boolean).join(' ')
  // A closed disclosure would hide its own fields, so while editing the block
  // is laid open as an ordinary section and folds again once changes are saved.
  const disclosure = (block.collapsible || type === 'collapsible') && !editing
  const content: ReactNode = <BlockBody block={block} depth={depth} omitTitle={disclosure} header={header} />

  if (disclosure) {
    const summary = block.title ?? block.label ?? 'Show details'
    return (
      <details id={block.anchor ?? block.id} className={`${classNames} authored-block--disclosure`} open={!(block.collapsed ?? block.collapse)} style={style}>
        <summary><span>{block.label && block.title ? <small>{block.label}</small> : null}{summary}</span><ChevronDown aria-hidden="true" /></summary>
        <div className="authored-block__disclosure-content">{content}</div>
      </details>
    )
  }

  return (
    <section id={block.anchor ?? block.id} className={classNames} style={style}>
      {editing && <BlockTools block={block} editing={editing} />}
      {content}
    </section>
  )
}

function DefinitionEntry({ block, depth }: { block: PageBlock, depth: number }) {
  const editing = usePageEditing()
  const term = block.title ?? block.label ?? 'Definition'
  return (
    <div id={block.anchor ?? block.id} className="authored-block__definition">
      {editing && <BlockTools block={block} editing={editing} />}
      <dt>{editing
        ? <EditableText
            value={block.title ?? block.label ?? ''}
            label={`Term for ${describeBlock(block)}`}
            placeholder="Term"
            onChange={(next) => editing.updateBlock(block.id, { title: next })}
          />
        : term}</dt>
      <dd><BlockBody block={block} depth={depth} omitTitle /></dd>
    </div>
  )
}

/** Render an ordered, recursive workspace block tree without executable data. */
export function ContentBlocks({ blocks, depth = 0, presentation, header }: ContentBlocksProps) {
  if (!blocks.length) return null
  const orderedBlocks = blocks
    .map((block, index) => ({ block, index }))
    .sort((left, right) => (left.block.position ?? left.index) - (right.block.position ?? right.index))
  const className = [
    'authored-blocks',
    `authored-blocks--depth-${Math.min(depth, 3)}`,
    presentation ? `authored-blocks--${presentation}` : '',
  ].filter(Boolean).join(' ')

  if (presentation === 'step-list') {
    return <ol className={className}>{orderedBlocks.map(({ block }) => <li key={block.id}><Block block={block} depth={depth} /></li>)}</ol>
  }
  if (presentation === 'definition-list') {
    return <dl className={className}>{orderedBlocks.map(({ block }) => <DefinitionEntry key={block.id} block={block} depth={depth} />)}</dl>
  }
  // A hero owns its own two-column grid, so its columns stay direct children
  // and can be placed against the page heading rendered beside them.
  if (presentation === 'hero') {
    return <>{orderedBlocks.map(({ block }) => <Block key={block.id} block={block} depth={depth} />)}</>
  }
  return (
    <div className={className}>
      {orderedBlocks.map(({ block }) => (
        <Block
          key={block.id}
          block={block}
          depth={depth}
          header={blockPresentation(block) === 'hero' ? header : undefined}
        />
      ))}
    </div>
  )
}
