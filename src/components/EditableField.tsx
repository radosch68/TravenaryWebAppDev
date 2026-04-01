import type { ReactElement } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface EditableFieldProps {
  value: string
  onSave: (value: string) => Promise<void>
  renderDisplay: (value: string, onEdit: () => void) => ReactElement
  renderEditor: (
    value: string,
    onChange: (value: string) => void,
    onSave: () => void,
    onCancel: () => void,
    saving: boolean,
  ) => ReactElement
  validate?: (value: string) => string | undefined
}

export function EditableField({
  value,
  onSave,
  renderDisplay,
  renderEditor,
  validate,
}: EditableFieldProps): ReactElement {
  const { t } = useTranslation(['common'])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editing) {
      setDraft(value)
    }
  }, [value, editing])

  const handleEdit = useCallback(() => {
    setDraft(value)
    setError(undefined)
    setEditing(true)
  }, [value])

  const handleCancel = useCallback(() => {
    setDraft(value)
    setError(undefined)
    setEditing(false)
  }, [value])

  useEffect(() => {
    if (!editing) return
    const onMouseDown = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleCancel()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [editing, handleCancel])

  const handleSave = useCallback(async () => {
    const trimmed = draft.trim()
    if (trimmed === value) {
      setEditing(false)
      return
    }

    if (validate) {
      const validationError = validate(trimmed)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setSaving(true)
    setError(undefined)
    try {
      await onSave(trimmed)
      setEditing(false)
    } catch {
      setError(t('common:itinerary.edit.saveFailed'))
    } finally {
      setSaving(false)
    }
  }, [draft, value, onSave, validate, t])

  if (!editing) {
    return renderDisplay(value, handleEdit)
  }

  return (
    <div ref={containerRef}>
      {renderEditor(draft, setDraft, () => void handleSave(), handleCancel, saving)}
      {error ? <p className="editable-field__error">{error}</p> : null}
    </div>
  )
}
