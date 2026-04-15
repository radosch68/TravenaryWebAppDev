import type { ReactElement } from 'react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DialogShell } from '@/components/DialogShell'
import type { ActivityType, AccommodationPlatform, ItineraryActivity } from '@/services/contracts'
import { generateClientId } from '@/utils/client-id'
import { formatLocalDate, formatLocalTime, getLocalizedTimeInputPlaceholder } from '@/utils/date-format'
import { ACTIVITY_TYPE_COLOR, ACTIVITY_TYPE_ICON } from './activity-presentation'
import formStyles from './ActivityFormPanel.module.css'

const FULL_EDIT_TYPES: ReadonlySet<ActivityType> = new Set(['note', 'poi', 'custom', 'carRental', 'food', 'shopping', 'tour', 'accommodation'])
const LIMITED_EDIT_FIELDS = ['title', 'text', 'time', 'timeEnd'] as const

const ANCHOR_ELIGIBLE_TYPES: ReadonlySet<ActivityType> = new Set([
  'note', 'flight', 'accommodation', 'transfer', 'poi', 'carRental', 'custom', 'food', 'shopping', 'tour'
])

const ACTIVITY_TYPE_LABEL_KEY: Record<ActivityType, string> = {
  note: 'note',
  poi: 'poi',
  custom: 'custom',
  carRental: 'carRental',
  food: 'food',
  shopping: 'shopping',
  tour: 'tour',
  accommodation: 'accommodation',
  flight: 'flight',
  transfer: 'transfer',
  divider: 'divider',
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
  activityType: ActivityType
  owningDayDate?: string
  createOwnBlock?: boolean
  blockDividerTitle?: string
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
  activityType,
  owningDayDate,
  createOwnBlock = false,
  blockDividerTitle = '',
  onSave,
  onCancel,
  disabled,
}: ActivityFormPanelProps): ReactElement {
  const { t, i18n } = useTranslation(['common'])
  const isCreate = !activity
  const isFullEdit = isCreate || FULL_EDIT_TYPES.has(activity.type)
  const timePlaceholder = getLocalizedTimeInputPlaceholder(i18n.language)
  const useNativeTimeInput = typeof window !== 'undefined'
    && window.matchMedia('(hover: none), (pointer: coarse)').matches
  const timeInputMode: 'text' | 'numeric' = useNativeTimeInput
    ? 'numeric'
    : i18n.language.startsWith('en') ? 'text' : 'numeric'
  const timeInputType = useNativeTimeInput ? 'time' : 'text'

  const [title, setTitle] = useState(activity?.title ?? '')
  const [text, setText] = useState(activity?.text ?? '')
  const [time, setTime] = useState(() => useNativeTimeInput ? (activity?.time ?? '') : formatLocalTime(activity?.time, i18n.language))
  const [timeEnd, setTimeEnd] = useState(() => useNativeTimeInput ? (activity?.timeEnd ?? '') : formatLocalTime(activity?.timeEnd, i18n.language))
  const [cuisine, setCuisine] = useState(activity?.details?.cuisine ?? '')
  const [guidanceMode, setGuidanceMode] = useState<'selfGuided' | 'guided'>(activity?.details?.guidanceMode ?? 'selfGuided')
  const [anchorToDay, setAnchorToDay] = useState(() => {
    if (isCreate) return false
    return typeof activity?.anchorDate === 'string' && activity.anchorDate.length > 0
  })
  const [nightsInput, setNightsInput] = useState(() => (activity?.details?.nights ?? 1).toString())
  const [guestsInput, setGuestsInput] = useState(() => activity?.details?.guests?.toString() ?? '')
  const [checkInFrom, setCheckInFrom] = useState(() => useNativeTimeInput ? (activity?.details?.checkInFrom ?? '') : formatLocalTime(activity?.details?.checkInFrom, i18n.language))
  const [checkInUntil, setCheckInUntil] = useState(() => useNativeTimeInput ? (activity?.details?.checkInUntil ?? '') : formatLocalTime(activity?.details?.checkInUntil, i18n.language))
  const [checkOutUntil, setCheckOutUntil] = useState(() => useNativeTimeInput ? (activity?.details?.checkOutUntil ?? '') : formatLocalTime(activity?.details?.checkOutUntil, i18n.language))
  const [platform, setPlatform] = useState<AccommodationPlatform | ''>(activity?.details?.platform ?? '')
  const [contactPhone, setContactPhone] = useState(activity?.details?.contactPhone ?? '')
  const [contactEmail, setContactEmail] = useState(activity?.details?.contactEmail ?? '')
  const [bookingRef, setBookingRef] = useState(activity?.details?.bookingRef ?? '')
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

    // Preserve existing anchor state when this form cannot safely edit anchoring.
    const isAnchorEligible = ANCHOR_ELIGIBLE_TYPES.has(activityType)
    const canEditAnchoring = isAnchorEligible && Boolean(owningDayDate)
    let resolvedAnchorDate: string | null = activity?.anchorDate ?? null
    if (canEditAnchoring) {
      resolvedAnchorDate = anchorToDay ? owningDayDate ?? null : null
    }

    const result: ItineraryActivity = {
      id: activity?.id ?? generateClientId(),
      type: activityType,
      title: title.trim(),
      anchorDate: resolvedAnchorDate,
      ...(text.trim() ? { text: text.trim() } : {}),
      ...(liveTime ? { time: liveTime } : {}),
      ...(liveTimeEnd ? { timeEnd: liveTimeEnd } : {}),
    }

    // Build type-specific details
    if (activityType === 'food') {
      result.details = cuisine.trim() ? { cuisine: cuisine.trim() } : {}
    } else if (activityType === 'tour') {
      result.details = { guidanceMode }
    } else if (activityType === 'accommodation') {
      const parsedNights = parseInt(nightsInput, 10)
      const normalizedNights = Number.isFinite(parsedNights) && parsedNights >= 1 ? parsedNights : 1
      const accDetails: ItineraryActivity['details'] = { nights: normalizedNights }
      const parsedGuests = parseInt(guestsInput, 10)
      if (!isNaN(parsedGuests) && parsedGuests >= 1) accDetails!.guests = parsedGuests
      const normCheckInFrom = normalizeTimeValue(checkInFrom)
      if (normCheckInFrom) accDetails!.checkInFrom = normCheckInFrom
      const normCheckInUntil = normalizeTimeValue(checkInUntil)
      if (normCheckInUntil) accDetails!.checkInUntil = normCheckInUntil
      const normCheckOutUntil = normalizeTimeValue(checkOutUntil)
      if (normCheckOutUntil) accDetails!.checkOutUntil = normCheckOutUntil
      if (platform) accDetails!.platform = platform as AccommodationPlatform
      if (contactPhone.trim()) accDetails!.contactPhone = contactPhone.trim()
      if (contactEmail.trim()) accDetails!.contactEmail = contactEmail.trim()
      if (bookingRef.trim()) accDetails!.bookingRef = bookingRef.trim()
      result.details = accDetails
    } else if (activity?.details) {
      result.details = activity.details
    }

    // Preserve references and locations from edit
    if (activity?.references) result.references = activity.references
    if (activity?.locations) result.locations = activity.locations

    onSave({
      activity: result,
      createOwnBlock: isCreate ? createOwnBlock : false,
      dividerTitle: isCreate ? blockDividerTitle : '',
    })
  }

  const typeColor = ACTIVITY_TYPE_COLOR[activityType]

  const typeBadge = (
    <span
      className={formStyles.typeBadge}
      style={{ background: typeColor.bg, color: typeColor.icon, borderColor: `${typeColor.icon}26` }}
    >
      <span className={formStyles.typeBadgeIcon}>{ACTIVITY_TYPE_ICON[activityType]}</span>
      <span>{t(`common:itinerary.dayEditor.activityTypeOptions.${ACTIVITY_TYPE_LABEL_KEY[activityType]}`)}</span>
    </span>
  )

  return (
    <DialogShell
      title={typeBadge}
      onClose={onCancel}
      className={formStyles.modal}
      footer={
        <button
          type="button"
          className="button-primary"
          onClick={handleSubmit}
          disabled={disabled || !title.trim()}
        >
          {t('common:save')}
        </button>
      }
    >
    <div className="activity-form-panel">

      <div className="activity-form-panel__field">
        <label htmlFor="activity-title">{t('common:itinerary.dayEditor.fieldTitle')}</label>
        <input
          id="activity-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={disabled}
          autoFocus
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

      {activityType !== 'accommodation' && (
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
      )}

      {activityType === 'food' && (
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

      {activityType === 'tour' && (
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

      {/* Accommodation-specific fields */}
      {activityType === 'accommodation' && (
        <>
          <div className="activity-form-panel__field-row activity-form-panel__field-row--time">
            <div className="activity-form-panel__field">
              <label htmlFor="activity-nights">{t('common:itinerary.dayEditor.fieldNights')}</label>
              <input
                id="activity-nights"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={nightsInput}
                onChange={(e) => {
                  const raw = e.target.value
                  if (/^\d*$/.test(raw)) {
                    setNightsInput(raw)
                  }
                }}
                onBlur={() => {
                  const parsed = parseInt(nightsInput, 10)
                  if (!Number.isFinite(parsed) || parsed < 1) {
                    setNightsInput('1')
                    return
                  }

                  setNightsInput(String(parsed))
                }}
                disabled={disabled}
              />
            </div>
            <div className="activity-form-panel__field">
              <label htmlFor="activity-guests">{t('common:itinerary.dayEditor.fieldGuests')}</label>
              <input
                id="activity-guests"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={guestsInput}
                onChange={(e) => {
                  const raw = e.target.value
                  if (/^\d*$/.test(raw)) setGuestsInput(raw)
                }}
                onBlur={() => {
                  const parsed = parseInt(guestsInput, 10)
                  if (!Number.isFinite(parsed) || parsed < 1) {
                    setGuestsInput('')
                    return
                  }
                  setGuestsInput(String(parsed))
                }}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="activity-form-panel__field-row activity-form-panel__field-row--time">
            <div className="activity-form-panel__field">
              <label htmlFor="activity-checkin-from">{t('common:itinerary.dayEditor.fieldCheckInFrom')}</label>
              <input
                id="activity-checkin-from"
                type={timeInputType}
                value={checkInFrom}
                onChange={(e) => setCheckInFrom(e.target.value)}
                inputMode={timeInputMode}
                placeholder={useNativeTimeInput ? undefined : timePlaceholder}
                autoComplete="off"
                disabled={disabled}
                step={useNativeTimeInput ? 60 : undefined}
              />
            </div>
            <div className="activity-form-panel__field">
              <label htmlFor="activity-checkin-until">{t('common:itinerary.dayEditor.fieldCheckInUntil')}</label>
              <input
                id="activity-checkin-until"
                type={timeInputType}
                value={checkInUntil}
                onChange={(e) => setCheckInUntil(e.target.value)}
                inputMode={timeInputMode}
                placeholder={useNativeTimeInput ? undefined : timePlaceholder}
                autoComplete="off"
                disabled={disabled}
                step={useNativeTimeInput ? 60 : undefined}
              />
            </div>
          </div>

          <div className="activity-form-panel__field">
            <label htmlFor="activity-checkout-until">{t('common:itinerary.dayEditor.fieldCheckOutUntil')}</label>
            <input
              id="activity-checkout-until"
              type={timeInputType}
              value={checkOutUntil}
              onChange={(e) => setCheckOutUntil(e.target.value)}
              inputMode={timeInputMode}
              placeholder={useNativeTimeInput ? undefined : timePlaceholder}
              autoComplete="off"
              disabled={disabled}
              step={useNativeTimeInput ? 60 : undefined}
            />
          </div>

          <div className="activity-form-panel__field">
            <label htmlFor="activity-platform">{t('common:itinerary.dayEditor.fieldPlatform')}</label>
            <select
              id="activity-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as AccommodationPlatform | '')}
              disabled={disabled}
            >
              <option value="">—</option>
              <option value="booking">{t('common:itinerary.dayEditor.platformOptions.booking')}</option>
              <option value="airbnb">{t('common:itinerary.dayEditor.platformOptions.airbnb')}</option>
              <option value="agoda">{t('common:itinerary.dayEditor.platformOptions.agoda')}</option>
              <option value="direct">{t('common:itinerary.dayEditor.platformOptions.direct')}</option>
              <option value="other">{t('common:itinerary.dayEditor.platformOptions.other')}</option>
            </select>
          </div>

          <div className="activity-form-panel__field">
            <label htmlFor="activity-contact-phone">{t('common:itinerary.dayEditor.fieldContactPhone')}</label>
            <input
              id="activity-contact-phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="activity-form-panel__field">
            <label htmlFor="activity-contact-email">{t('common:itinerary.dayEditor.fieldContactEmail')}</label>
            <input
              id="activity-contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="activity-form-panel__field">
            <label htmlFor="activity-booking-ref">{t('common:itinerary.dayEditor.fieldBookingRef')}</label>
            <input
              id="activity-booking-ref"
              type="text"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value)}
              disabled={disabled}
            />
          </div>
        </>
      )}

      {/* Anchor control — common for all anchor-eligible types */}
      {ANCHOR_ELIGIBLE_TYPES.has(activityType) && owningDayDate && (
        <div className="activity-form-panel__block-option">
          <label className="activity-form-panel__checkbox" htmlFor="activity-anchor-to-day">
            <input
              id="activity-anchor-to-day"
              type="checkbox"
              checked={anchorToDay}
              onChange={(e) => setAnchorToDay(e.target.checked)}
              disabled={disabled}
            />
            <span className="activity-form-panel__checkbox-indicator" aria-hidden="true">
              <span className="activity-form-panel__checkbox-indicator-mark">✓</span>
            </span>
            <span>{t('common:itinerary.dayEditor.anchorToDay', { date: formatLocalDate(owningDayDate, i18n.language) })}</span>
          </label>
          <p className="activity-form-panel__help-text">{t('common:itinerary.dayEditor.anchorHelp')}</p>
        </div>
      )}

    </div>
    </DialogShell>
  )
}
