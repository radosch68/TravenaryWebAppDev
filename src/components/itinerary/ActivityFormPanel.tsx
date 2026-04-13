import type { ReactElement } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ActivityType, ItineraryActivity } from '@/services/contracts'
import { generateClientId } from '@/utils/client-id'
import { formatLocalTime, getLocalizedTimeInputPlaceholder } from '@/utils/date-format'
import { ACTIVITY_TYPE_COLOR, ACTIVITY_TYPE_ICON } from './activity-presentation'

const FULL_EDIT_TYPES: ReadonlySet<ActivityType> = new Set(['note', 'poi', 'custom', 'carRental', 'food', 'shopping', 'tour'])
const LIMITED_EDIT_FIELDS = ['title', 'text', 'time', 'timeEnd'] as const
const CREATABLE_TYPES = ['note', 'poi', 'carRental', 'food', 'custom', 'shopping', 'tour'] as const satisfies readonly ActivityType[]
type CreatableActivityType = (typeof CREATABLE_TYPES)[number]

const ACTIVITY_TYPE_LABEL_KEY: Record<CreatableActivityType, string> = {
  note: 'note',
  poi: 'poi',
  custom: 'custom',
  carRental: 'carRental',
  food: 'food',
  shopping: 'shopping',
  tour: 'tour',
}

function normalizeTimeValue(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const twentyFourHour = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
  if (twentyFourHour) {
    return `${twentyFourHour[1].padStart(2, '0')}:${twentyFourHour[2]}`
  }

  const twelveHour = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/)
  if (!twelveHour) return undefined

  let hours = Number(twelveHour[1])
  const minutes = twelveHour[2]
  const meridiem = twelveHour[3].toUpperCase()

  if (hours < 1 || hours > 12) return undefined
  if (meridiem === 'AM') {
    hours = hours === 12 ? 0 : hours
  } else {
    hours = hours === 12 ? 12 : hours + 12
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`
}

interface ActivityFormPanelProps {
  activity?: ItineraryActivity
  mode: 'create' | 'edit'
  onSave: (payload: ActivityFormSavePayload) => void
  onCancel: () => void
  disabled?: boolean
}

export interface ActivityFormSavePayload {
  activity: ItineraryActivity
  createOwnBlock: boolean
  dividerTitle: string
}

export function ActivityFormPanel({
  activity,
  mode,
  onSave,
  onCancel,
  disabled,
}: ActivityFormPanelProps): ReactElement {
  const { t, i18n } = useTranslation(['common'])
  const isCreate = mode === 'create'
  const isFullEdit = isCreate || (activity ? FULL_EDIT_TYPES.has(activity.type) : false)
  const timePlaceholder = getLocalizedTimeInputPlaceholder(i18n.language)
  const useNativeTimeInput = typeof window !== 'undefined'
    && window.matchMedia('(hover: none), (pointer: coarse)').matches
  const timeInputMode: 'text' | 'numeric' = useNativeTimeInput
    ? 'numeric'
    : i18n.language.startsWith('en') ? 'text' : 'numeric'
  const timeInputType = useNativeTimeInput ? 'time' : 'text'

  const [type, setType] = useState<ActivityType>(activity?.type ?? 'note')
  const [title, setTitle] = useState(activity?.title ?? '')
  const [text, setText] = useState(activity?.text ?? '')
  const [time, setTime] = useState(() => useNativeTimeInput ? (activity?.time ?? '') : formatLocalTime(activity?.time, i18n.language))
  const [timeEnd, setTimeEnd] = useState(() => useNativeTimeInput ? (activity?.timeEnd ?? '') : formatLocalTime(activity?.timeEnd, i18n.language))
  const [cuisine, setCuisine] = useState(activity?.details?.cuisine ?? '')
  const [guidanceMode, setGuidanceMode] = useState<'selfGuided' | 'guided'>(activity?.details?.guidanceMode ?? 'selfGuided')
  const [createOwnBlock, setCreateOwnBlock] = useState(false)
  const [dividerTitle, setDividerTitle] = useState('')
  const timeInputRef = useRef<HTMLInputElement | null>(null)
  const timeEndInputRef = useRef<HTMLInputElement | null>(null)

  const handleTimeInput = (value: string): void => {
    setTime(value)
  }

  const handleTimeEndInput = (value: string): void => {
    setTimeEnd(value)
  }

  const handleSubmit = (): void => {
    if (!title.trim()) return

    const liveTime = normalizeTimeValue(timeInputRef.current?.value ?? time)
    const liveTimeEnd = normalizeTimeValue(timeEndInputRef.current?.value ?? timeEnd)

    const activeType = isCreate ? type : activity!.type

    const result: ItineraryActivity = {
      id: activity?.id ?? generateClientId(),
      type: activeType,
      title: title.trim(),
      ...(text.trim() ? { text: text.trim() } : {}),
      ...(liveTime ? { time: liveTime } : {}),
      ...(liveTimeEnd ? { timeEnd: liveTimeEnd } : {}),
      ...(activity?.anchorDate ? { anchorDate: activity.anchorDate } : {}),
    }

    // Build type-specific details
    if (activeType === 'food') {
      result.details = cuisine.trim() ? { cuisine: cuisine.trim() } : {}
    } else if (activeType === 'tour') {
      result.details = { guidanceMode }
    } else if (activity?.details) {
      result.details = activity.details
    }

    // Preserve references and locations from edit
    if (activity?.references) result.references = activity.references
    if (activity?.locations) result.locations = activity.locations

    onSave({
      activity: result,
      createOwnBlock: isCreate ? createOwnBlock : false,
      dividerTitle: isCreate ? dividerTitle.trim() : '',
    })
  }

  const handleEscape = useCallback((e: KeyboardEvent): void => {
    if (e.key === 'Escape') onCancel()
  }, [onCancel])

  useEffect(() => {
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [handleEscape])

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onCancel()
  }, [onCancel])

  return (
    <div
      className="activity-form-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isCreate ? t('common:itinerary.dayEditor.newActivity') : t('common:itinerary.dayEditor.editActivity')}
      onClick={handleOverlayClick}
    >
    <div className="activity-form-panel">
      <h3 className="activity-form-panel__title">
        {isCreate ? t('common:itinerary.dayEditor.newActivity') : t('common:itinerary.dayEditor.editActivity')}
      </h3>

      {isCreate && (
        <div className="activity-form-panel__field">
          <div className="activity-form-panel__type-grid" role="radiogroup" aria-label={t('common:itinerary.dayEditor.activityType')}>
            {CREATABLE_TYPES.map((activityType) => {
              const typeColor = ACTIVITY_TYPE_COLOR[activityType] ?? ACTIVITY_TYPE_COLOR.note
              const isSelected = type === activityType

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
                  onClick={() => setType(activityType)}
                  disabled={disabled}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={t(`common:itinerary.dayEditor.activityTypeOptions.${ACTIVITY_TYPE_LABEL_KEY[activityType]}`)}
                  autoFocus={activityType === type}
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
        </div>
      )}

      {isCreate && (
        <div className="activity-form-panel__block-option">
          <label className="activity-form-panel__checkbox" htmlFor="activity-create-own-block">
            <input
              id="activity-create-own-block"
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
            id="activity-divider-title"
            className="activity-form-panel__block-option-input"
            type="text"
            value={dividerTitle}
            onChange={(e) => setDividerTitle(e.target.value)}
            placeholder={t('common:itinerary.dayEditor.blockTitlePlaceholder')}
            aria-label={t('common:itinerary.dayEditor.blockTitle')}
            disabled={disabled || !createOwnBlock}
          />
        </div>
      )}

      <div className="activity-form-panel__field">
        <label htmlFor="activity-title">{t('common:itinerary.dayEditor.fieldTitle')}</label>
        <input
          id="activity-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={disabled}
          autoFocus={!isCreate}
        />
      </div>

      {(isFullEdit || LIMITED_EDIT_FIELDS.includes('text' as never)) && (
        <div className="activity-form-panel__field">
          <label htmlFor="activity-text">{t('common:itinerary.dayEditor.fieldText')}</label>
          <textarea
            id="activity-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled}
            rows={2}
          />
        </div>
      )}

      <div className="activity-form-panel__field-row activity-form-panel__field-row--time">
        <div className="activity-form-panel__field">
          <label htmlFor="activity-time">{t('common:itinerary.dayEditor.fieldTime')}</label>
          <input
            id="activity-time"
            ref={timeInputRef}
            type={timeInputType}
            value={time}
            onChange={(e) => handleTimeInput(e.target.value)}
            inputMode={timeInputMode}
            placeholder={useNativeTimeInput ? undefined : timePlaceholder}
            autoComplete="off"
            disabled={disabled}
            step={useNativeTimeInput ? 60 : undefined}
          />
        </div>
        <div className="activity-form-panel__field">
          <label htmlFor="activity-time-end">{t('common:itinerary.dayEditor.fieldTimeEnd')}</label>
          <input
            id="activity-time-end"
            ref={timeEndInputRef}
            type={timeInputType}
            value={timeEnd}
            onChange={(e) => handleTimeEndInput(e.target.value)}
            inputMode={timeInputMode}
            placeholder={useNativeTimeInput ? undefined : timePlaceholder}
            autoComplete="off"
            disabled={disabled}
            step={useNativeTimeInput ? 60 : undefined}
          />
        </div>
      </div>

      {(type === 'food' || activity?.type === 'food') && (
        <div className="activity-form-panel__field">
          <label htmlFor="activity-cuisine">{t('common:itinerary.dayEditor.fieldCuisine')}</label>
          <input
            id="activity-cuisine"
            type="text"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            disabled={disabled}
          />
        </div>
      )}

      {(type === 'tour' || activity?.type === 'tour') && (
        <div className="activity-form-panel__field">
          <label htmlFor="activity-guidance-mode">{t('common:itinerary.dayEditor.fieldGuidanceMode')}</label>
          <select
            id="activity-guidance-mode"
            value={guidanceMode}
            onChange={(e) => setGuidanceMode(e.target.value as 'selfGuided' | 'guided')}
            disabled={disabled}
          >
            <option value="selfGuided">{t('common:itinerary.dayEditor.guidanceModeSelfGuided')}</option>
            <option value="guided">{t('common:itinerary.dayEditor.guidanceModeGuided')}</option>
          </select>
        </div>
      )}

      <div className="activity-form-panel__actions">
        <button
          type="button"
          className="button-primary"
          onClick={handleSubmit}
          disabled={disabled || !title.trim()}
        >
          {t('common:save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
        >
          {t('common:cancel')}
        </button>
      </div>
    </div>
    </div>
  )
}
