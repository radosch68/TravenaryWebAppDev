import type { ReactElement, ReactNode } from 'react'

import { DialogShell } from './DialogShell'
import styles from './YesNoDialog.module.css'

interface YesNoDialogProps {
  title: ReactNode
  message: ReactNode
  onConfirm: () => void
  onCancel: () => void
  confirmLabel: string
  cancelLabel: string
  confirmVariant?: 'primary' | 'danger'
}

export function YesNoDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'primary',
}: YesNoDialogProps): ReactElement {
  return (
    <DialogShell
      title={title}
      onClose={onCancel}
      className={styles.modal}
      footer={(
        <>
          <button type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmVariant === 'danger' ? 'button-danger' : 'button-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      )}
    >
      <div className={styles.body}>
        <p className={styles.message}>{message}</p>
      </div>
    </DialogShell>
  )
}
