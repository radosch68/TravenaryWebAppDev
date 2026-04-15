import type { ReactElement, ReactNode } from 'react'
import { useCallback, useEffect, useId } from 'react'
import { X } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import styles from './DialogShell.module.css'

interface DialogShellProps {
  title: ReactNode
  onClose: () => void
  footer?: ReactNode | null
  headerExtra?: ReactNode | null
  headerLeft?: ReactNode | null
  children: ReactNode
  className?: string
  ariaLabel?: string
  closeLabel?: string
  closeOnOverlayClick?: boolean
}

export function DialogShell({
  title,
  onClose,
  footer,
  headerExtra,
  headerLeft,
  children,
  className,
  ariaLabel,
  closeLabel,
  closeOnOverlayClick = true,
}: DialogShellProps): ReactElement {
  const { t } = useTranslation(['common'])
  const titleId = useId()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (closeOnOverlayClick && e.target === e.currentTarget) onClose()
    },
    [closeOnOverlayClick, onClose],
  )

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : titleId}
      onClick={handleOverlayClick}
    >
      <div className={`${styles.modal}${className ? ` ${className}` : ''}`}>
        <div className={styles.header}>
          <div className={`${styles.headerTitleRow}${headerLeft != null ? ` ${styles.headerTitleRowCentered}` : ''}`}>
            {headerLeft != null && (
              <div className={styles.headerLeft}>{headerLeft}</div>
            )}
            <h2 id={titleId}>{title}</h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label={closeLabel ?? t('common:close')}
            >
              <X size={18} />
            </button>
          </div>
          {headerExtra != null && (
            <div className={styles.headerExtra}>{headerExtra}</div>
          )}
        </div>

        <div className={styles.body}>
          {children}
        </div>

        {footer != null && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
