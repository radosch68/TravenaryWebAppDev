import type { ReactElement } from 'react'
import { frontendLogger } from '@/services/frontend-logger'
import styles from './DevLogPanel.module.css'

export function DevLogPanel(): ReactElement | null {
  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <div className={styles.panel} role="region" aria-label="Development log controls">
      <span className={styles.label}>Dev Logs</span>
      <button
        type="button"
        className={`${styles.button} ${styles.warn}`}
        onClick={() => frontendLogger.warn('Manual warn probe', { probeAt: new Date().toISOString() })}
      >
        Warn
      </button>
      <button
        type="button"
        className={`${styles.button} ${styles.error}`}
        onClick={() => frontendLogger.error('Manual error probe', new Error(`Probe @ ${new Date().toISOString()}`))}
      >
        Error
      </button>
    </div>
  )
}
