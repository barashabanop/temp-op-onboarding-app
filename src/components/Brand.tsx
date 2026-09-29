interface BrandProps {
  compact?: boolean
}

export function Brand({ compact = false }: BrandProps) {
  const assetBase = import.meta.env.BASE_URL

  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="Optimum Partners Onboarding">
      <img
        className={compact ? 'brand__image brand__image--mark' : 'brand__image'}
        src={`${assetBase}brand/${compact ? 'optimum-partners-mark.png' : 'optimum-system-wordmark.svg'}`}
        alt="Optimum Partners"
      />
      {!compact && <span className="brand__descriptor">Engineering onboarding</span>}
    </div>
  )
}
