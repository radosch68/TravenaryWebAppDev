import type { ReactElement } from 'react'
import brandBannerImage from '@/assets/travenary-header.png'

interface BrandBannerProps {
  compact?: boolean
}

export function BrandBanner({ compact = false }: BrandBannerProps): ReactElement {
  return (
    <div className={compact ? 'brand-banner brand-banner--compact' : 'brand-banner'}>
      <img
        className="brand-banner__image"
        src={brandBannerImage}
        alt="Travenary"
        decoding="async"
      />
    </div>
  )
}
