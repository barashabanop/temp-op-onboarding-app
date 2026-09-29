import type { CSSProperties } from 'react'
import type { PortalIntroContent } from '../../types/portal'

export function ProgressRing({ value }: { value: number }) {
  const progress = Math.min(Math.max(value, 0), 100)

  return (
    <div
      className="progress-ring"
      role="img"
      aria-label={`${progress}% complete`}
      style={{ '--progress': `${progress * 3.6}deg` } as CSSProperties}
    >
      <span>{progress}%</span>
    </div>
  )
}

export function PortalIntro({ eyebrow, title, summary }: PortalIntroContent) {
  return (
    <header className="portal-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{summary}</p>
    </header>
  )
}
