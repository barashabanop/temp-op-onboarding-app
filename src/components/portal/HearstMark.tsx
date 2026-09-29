export function HearstMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`hearst-mark ${compact ? 'hearst-mark--compact' : ''}`}
      aria-label="Hearst"
    >
      <span>H</span>
      <strong>HEARST</strong>
    </div>
  )
}
