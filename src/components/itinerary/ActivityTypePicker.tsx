import type { ReactElement } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DialogShell } from '@/components/DialogShell'
import type { ActivityType } from '@/services/contracts'
import { ACTIVITY_TYPE_COLOR, ACTIVITY_TYPE_ICON } from './activity-presentation'
import styles from './ActivityTypePicker.module.css'

const ACTIVITY_TYPE_GROUPS = [
  {
    key: 'transport',
    types: ['flight', 'transfer', 'carRental'],
  },
  {
    key: 'stayAndPlaces',
    types: ['accommodation', 'poi'],
  },
  {
    key: 'activities',
    types: ['food', 'shopping', 'tour'],
  },
  {
    key: 'notesAndCustom',
    types: ['note', 'custom'],
  },
] as const satisfies ReadonlyArray<{
  key: 'transport' | 'stayAndPlaces' | 'activities' | 'notesAndCustom'
  types: readonly ActivityType[]
}>

type CreatableActivityType = (typeof ACTIVITY_TYPE_GROUPS)[number]['types'][number]

const ACTIVITY_TYPE_LABEL_KEY: Record<CreatableActivityType, string> = {
  note: 'note',
  flight: 'flight',
  transfer: 'transfer',
  poi: 'poi',
  custom: 'custom',
  carRental: 'carRental',
  food: 'food',
  shopping: 'shopping',
  tour: 'tour',
  accommodation: 'accommodation',
}

interface ActivityTypePickerProps {
  onSelect: (type: ActivityType, createOwnBlock: boolean, dividerTitle: string) => void
  onCancel: () => void
  disabled?: boolean
}

export function ActivityTypePicker({
  onSelect,
  onCancel,
  disabled,
}: ActivityTypePickerProps): ReactElement {
  const { t } = useTranslation(['common'])
  const [selectedType, setSelectedType] = useState<CreatableActivityType | null>(null)
  const [createOwnBlock, setCreateOwnBlock] = useState(false)
  const [dividerTitle, setDividerTitle] = useState('')

  const handleNext = (): void => {
    if (selectedType == null) return
    onSelect(selectedType, createOwnBlock, dividerTitle.trim())
  }

  return (
    <DialogShell
      title={t('common:itinerary.dayEditor.newActivity')}
      onClose={onCancel}
      className={styles.modal}
      footer={
        <button
          type="button"
          className="button-primary"
          onClick={handleNext}
          disabled={disabled || selectedType == null}
        >
          {t('common:next')}
        </button>
      }
    >
      <div className="activity-form-panel">
        <div className="activity-form-panel__field">
          <p className={styles.typePickerLead}>
            {t('common:itinerary.dayEditor.chooseActivityType')}
          </p>
          <div className={styles.typeGroups} role="radiogroup" aria-label={t('common:itinerary.dayEditor.activityType')}>
            {ACTIVITY_TYPE_GROUPS.map((group) => (
              <section key={group.key} className={styles.typeGroup} aria-label={t(`common:itinerary.dayEditor.activityTypeGroups.${group.key}`)}>
                <h3 className={styles.groupTitle}>
                  {t(`common:itinerary.dayEditor.activityTypeGroups.${group.key}`)}
                </h3>
                <div className="activity-form-panel__type-grid">
                  {group.types.map((activityType) => {
                    const typeColor = ACTIVITY_TYPE_COLOR[activityType] ?? ACTIVITY_TYPE_COLOR.note
                    const isSelected = selectedType === activityType

                    return (
                      <button
                        key={activityType}
                        type="button"
                        className={`activity-form-panel__type-option${isSelected ? ' activity-form-panel__type-option--selected' : ''}`}
                        style={{
                          background: typeColor.bg,
                          border: `2px solid ${typeColor.icon}26`,
                          color: typeColor.icon,
                        }}
                        onClick={() => setSelectedType(activityType)}
                        disabled={disabled}
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={t(`common:itinerary.dayEditor.activityTypeOptions.${ACTIVITY_TYPE_LABEL_KEY[activityType]}`)}
                        autoFocus={activityType === selectedType}
                      >
                        {isSelected ? (
                          <span
                            className="activity-form-panel__type-option-check"
                            aria-hidden="true"
                            style={{ backgroundColor: typeColor.icon }}
                          >
                            ✓
                          </span>
                        ) : null}
                        <span className="activity-form-panel__type-option-icon" aria-hidden="true">
                          {ACTIVITY_TYPE_ICON[activityType]}
                        </span>
                        <span className="activity-form-panel__type-option-label">
                          {t(`common:itinerary.dayEditor.activityTypeOptions.${ACTIVITY_TYPE_LABEL_KEY[activityType]}`)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="activity-form-panel__block-option">
          <label className="activity-form-panel__checkbox" htmlFor="picker-create-own-block">
            <input
              id="picker-create-own-block"
              type="checkbox"
              checked={createOwnBlock}
              onChange={(e) => setCreateOwnBlock(e.target.checked)}
              disabled={disabled}
            />
            <span className="activity-form-panel__checkbox-indicator" aria-hidden="true">
              <span className="activity-form-panel__checkbox-indicator-mark">✓</span>
            </span>
            <span>{t('common:itinerary.dayEditor.createOwnBlock')}</span>
          </label>
          <input
            id="picker-divider-title"
            className="activity-form-panel__block-option-input"
            type="text"
            value={dividerTitle}
            onChange={(e) => setDividerTitle(e.target.value)}
            placeholder={t('common:itinerary.dayEditor.blockTitlePlaceholder')}
            aria-label={t('common:itinerary.dayEditor.blockTitle')}
            disabled={disabled || !createOwnBlock}
          />
        </div>
      </div>
    </DialogShell>
  )
}
