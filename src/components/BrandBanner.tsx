import type { ReactElement } from 'react'

interface BrandBannerProps {
  compact?: boolean
}

export function BrandBanner({ compact = false }: BrandBannerProps): ReactElement {
  return (
    <div className={compact ? 'brand-banner brand-banner--compact' : 'brand-banner'}>
      <div className="brand-banner__text">Travenary</div>
    </div>
  )
}
