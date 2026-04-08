import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

interface AnchoredStatusToggleProps {
  isAnchored: boolean
  onToggle: (newValue: boolean) => void
  disabled?: boolean
}

export function AnchoredStatusToggle({ isAnchored, onToggle, disabled }: AnchoredStatusToggleProps): ReactElement {
  const { t } = useTranslation(['common'])

  return (
    <button
      type="button"
      className={`anchored-toggle${isAnchored ? ' anchored-toggle--anchored' : ' anchored-toggle--flexible'}`}
      onClick={() => onToggle(!isAnchored)}
      disabled={disabled}
      aria-label={isAnchored ? t('common:itinerary.presentation.markFlexible') : t('common:itinerary.presentation.markAnchored')}
      title={isAnchored ? t('common:itinerary.presentation.markFlexible') : t('common:itinerary.presentation.markAnchored')}
    >
      {isAnchored ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2L12 22" />
          <path d="M5 12H2" />
          <path d="M22 12H19" />
          <path d="M12 2a5 5 0 015 5c0 3-5 7-5 7s-5-4-5-7a5 5 0 015-5z" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      )}
      <span className="anchored-toggle__label">
        {isAnchored ? t('common:itinerary.presentation.anchored') : t('common:itinerary.presentation.flexible')}
      </span>
    </button>
  )
}
