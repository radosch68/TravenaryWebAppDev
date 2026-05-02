import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useDraggable } from '@dnd-kit/core'
import { Trash } from '@phosphor-icons/react'

import type { ItineraryActivity } from '@/services/contracts'
import { formatLocalTime } from '@/utils/date-format'
import { ACTIVITY_TYPE_COLOR } from './activity-presentation'
import { ActivityCardContent } from './ActivityCardContent'

interface ActivityEditorRowProps {
  activity: ItineraryActivity
  isAnchored: boolean
  blockKey: string
  onEdit: () => void
  onDelete: () => void
  disabled?: boolean
  dragDisabled?: boolean
}

export function ActivityEditorRow({
  activity,
  isAnchored,
  blockKey,
  onEdit,
  onDelete,
  disabled,
  dragDisabled,
}: ActivityEditorRowProps): ReactElement {
  const { t } = useTranslation(['common'])

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLLIElement>): void => {
    if (e.key === 'Enter') {
      onEdit()
      return
    }

    if (e.key === ' ') {
      e.preventDefault()
      onEdit()
    }
  }

  const { setNodeRef, transform, isDragging, listeners, attributes } = useDraggable({
    id: `activity-${activity.id}`,
    data: { activityId: activity.id, sourceBlockKey: blockKey, sourceSurface: 'day' as const },
    disabled: dragDisabled || disabled,
  })

  const typeColor = ACTIVITY_TYPE_COLOR[activity.type] ?? ACTIVITY_TYPE_COLOR.note
  const accommodationDetails = hasAccommodationDetails(activity) ? <AccommodationDetails activity={activity} /> : undefined

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    background: typeColor.bg,
    border: `2px solid ${typeColor.icon}26`,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`activity-editor-row${isAnchored ? ' activity-editor-row--anchored' : ''}${isDragging ? ' activity-editor-row--dragging' : ''}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onEdit()
        }
      }}
      onKeyDown={handleEditKeyDown}
    >
      <ActivityCardContent
        activity={activity}
        referenceDisplayMode="thumbnails"
        typeDetails={accommodationDetails}
        headerLeading={(
          <span
            className="activity-editor-row__drag-handle"
            onClick={(event) => event.stopPropagation()}
            {...listeners}
            {...attributes}
          >
            <GripIcon />
          </span>
        )}
        headerAction={(
          <button
            type="button"
            className="activity-editor-row__delete-btn"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
            disabled={disabled}
            aria-label={t('common:itinerary.dayEditor.deleteActivity')}
          >
            <Trash size={16} />
          </button>
        )}
      />
    </li>
  )
}

function hasAccommodationDetails(activity: ItineraryActivity): boolean {
  if (activity.type !== 'accommodation' || !activity.details) {
    return false
  }

  const details = activity.details
  return [
    details.nights,
    details.guests,
    details.checkInFrom,
    details.checkInUntil,
    details.checkOutUntil,
    details.platform,
    details.contactPhone,
    details.contactEmail,
    details.bookingRef,
  ].some((value) => value !== undefined && String(value).trim() !== '')
}

function AccommodationDetails({ activity }: { activity: ItineraryActivity }): ReactElement | null {
  const { t, i18n } = useTranslation(['common'])

  if (activity.type !== 'accommodation' || !activity.details) {
    return null
  }

  const details = activity.details
  const rows = [
    numberDetail(t('common:itinerary.dayEditor.fieldNights'), details.nights),
    numberDetail(t('common:itinerary.dayEditor.fieldGuests'), details.guests),
    timeDetail(t('common:itinerary.dayEditor.fieldCheckInFrom'), details.checkInFrom, i18n.language),
    timeDetail(t('common:itinerary.dayEditor.fieldCheckInUntil'), details.checkInUntil, i18n.language),
    timeDetail(t('common:itinerary.dayEditor.fieldCheckOutUntil'), details.checkOutUntil, i18n.language),
    textDetail(
      t('common:itinerary.dayEditor.fieldPlatform'),
      details.platform ? t(`common:itinerary.dayEditor.platformOptions.${details.platform}`) : undefined,
    ),
    textDetail(t('common:itinerary.dayEditor.fieldContactPhone'), details.contactPhone),
    textDetail(t('common:itinerary.dayEditor.fieldContactEmail'), details.contactEmail),
    textDetail(t('common:itinerary.dayEditor.fieldBookingRef'), details.bookingRef),
  ].filter((row): row is AccommodationDetailRow => row !== null)

  if (rows.length === 0) {
    return null
  }

  return (
    <details
      className="activity-accommodation-details"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <summary className="activity-accommodation-details__summary">
        {t('common:itinerary.dayEditor.accommodationDetailsTitle')}
      </summary>
      <dl className="activity-accommodation-details__grid">
        {rows.map((row) => (
          <div key={row.label} className="activity-accommodation-details__row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

interface AccommodationDetailRow {
  label: string
  value: string
}

function numberDetail(label: string, value: number | undefined): AccommodationDetailRow | null {
  if (value === undefined || !Number.isFinite(value)) {
    return null
  }

  return { label, value: String(value) }
}

function textDetail(label: string, value: string | undefined): AccommodationDetailRow | null {
  const normalized = value?.trim()
  return normalized ? { label, value: normalized } : null
}

function timeDetail(label: string, value: string | undefined, locale: string): AccommodationDetailRow | null {
  const formatted = formatLocalTime(value, locale)
  return formatted ? { label, value: formatted } : null
}

function GripIcon(): ReactElement {
  return (
    <svg
      width="16"
      height="14"
      viewBox="0 0 16 14"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="2" cy="2" r="1.2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="6" cy="2" r="1.2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="10" cy="2" r="1.2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="14" cy="2" r="1.2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="2" cy="7" r="1.2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="6" cy="7" r="1.2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="10" cy="7" r="1.2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="14" cy="7" r="1.2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="2" cy="12" r="1.2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="6" cy="12" r="1.2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="10" cy="12" r="1.2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="14" cy="12" r="1.2" fill="currentColor" fillOpacity="0.5" />
    </svg>
  )
}
