import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { DialogShell } from '@/components/DialogShell'
import type { DeleteItineraryDayMode, ItineraryDay } from '@/services/contracts'
import { formatLocalDate } from '@/utils/date-format'

import styles from './ItineraryDayDialogs.module.css'

interface InsertDayDialogProps {
  dayDateLabel: string
  summary: string
  busy: boolean
  errorMessage?: string | null
  onSummaryChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export function InsertDayDialog({
  dayDateLabel,
  summary,
  busy,
  errorMessage,
  onSummaryChange,
  onCancel,
  onConfirm,
}: InsertDayDialogProps): ReactElement {
  const { t } = useTranslation(['common'])

  return (
    <DialogShell
      title={t('common:itinerary.days.insertDialogTitle')}
      onClose={onCancel}
      className={styles.modal}
      footer={<button type="button" className="button-primary" onClick={onConfirm} disabled={busy}>{busy ? t('common:pending') : t('common:itinerary.days.insertConfirm')}</button>}
    >
      <div className={styles.body}>
        <p className={styles.message}>
          {t('common:itinerary.days.insertDateMessage', { date: dayDateLabel })}
        </p>

        <label className={styles.field}>
          <span>{t('common:itinerary.days.insertSummaryLabel')}</span>
          <input
            type="text"
            className={styles.input}
            value={summary}
            onChange={(event) => onSummaryChange(event.target.value)}
            placeholder={t('common:itinerary.days.insertSummaryPlaceholder')}
            maxLength={300}
            disabled={busy}
          />
        </label>

        {errorMessage ? <p className="error">{errorMessage}</p> : null}
      </div>
    </DialogShell>
  )
}

interface DeleteDayDialogProps {
  day: ItineraryDay
  days: ItineraryDay[]
  mode: DeleteItineraryDayMode
  targetDayNumber?: number
  busy: boolean
  errorMessage?: string | null
  onModeChange: (mode: DeleteItineraryDayMode) => void
  onTargetDayNumberChange: (targetDayNumber: number | undefined) => void
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteDayDialog({
  day,
  days,
  mode,
  targetDayNumber,
  busy,
  errorMessage,
  onModeChange,
  onTargetDayNumberChange,
  onCancel,
  onConfirm,
}: DeleteDayDialogProps): ReactElement {
  const { t, i18n } = useTranslation(['common'])
  const hasAnyActivities = day.activities.length > 0
  const movableActivities = useMemo(() => day.activities.filter((activity) => activity.type !== 'divider'), [day.activities])
  const targetDays = useMemo(
    () => days.filter((candidate) => candidate.dayNumber !== day.dayNumber),
    [day.dayNumber, days],
  )
  const dayLabel = t('common:itinerary.dayNumber', { dayNumber: day.dayNumber })
  const sourceDateLabel = day.date ? formatLocalDate(day.date, i18n.language) : dayLabel
  const titleDateLabel = day.date ? formatLocalDate(day.date, i18n.language) : dayLabel
  const moveDisabled = targetDays.length === 0 || movableActivities.length === 0
  const benchDisabled = movableActivities.length === 0
  const confirmDisabled = busy || (mode === 'move' && targetDayNumber === undefined) || (mode === 'bench' && benchDisabled)
  const confirmLabel = mode === 'delete'
    ? t('common:itinerary.days.deleteConfirmAction')
    : mode === 'bench'
      ? t('common:itinerary.days.benchConfirmAction')
      : t('common:itinerary.days.moveConfirmAction')

  return (
    <DialogShell
      title={t('common:itinerary.days.deleteDialogTitleWithDate', { date: titleDateLabel })}
      onClose={onCancel}
      className={styles.modal}
      footer={(
        <>
          <button
            type="button"
            className={mode === 'delete' ? 'button-danger' : 'button-primary'}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {busy ? t('common:pending') : confirmLabel}
          </button>
        </>
      )}
    >
      <div className={styles.body}>
        {hasAnyActivities ? (
          <div className={styles.choiceList}>
            <label className={styles.choice}>
              <input
                type="radio"
                name="delete-day-mode"
                value="delete"
                checked={mode === 'delete'}
                onChange={() => onModeChange('delete')}
                disabled={busy}
              />
              <span>{t('common:itinerary.days.deleteWithActivities')}</span>
            </label>

            <label className={styles.choice}>
              <input
                type="radio"
                name="delete-day-mode"
                value="bench"
                checked={mode === 'bench'}
                onChange={() => onModeChange('bench')}
                disabled={busy || benchDisabled}
              />
              <span>{t('common:itinerary.days.benchActivities')}</span>
            </label>

            {mode === 'bench' ? (
              <p className={styles.benchHint}>
                {t('common:itinerary.days.moveBenchHint', { count: movableActivities.length })}
              </p>
            ) : null}

            <label className={styles.choice}>
              <input
                type="radio"
                name="delete-day-mode"
                value="move"
                checked={mode === 'move'}
                onChange={() => onModeChange('move')}
                disabled={busy || moveDisabled}
              />
              <span>{t('common:itinerary.days.moveActivities')}</span>
            </label>
          </div>
        ) : null}

        {hasAnyActivities && mode === 'move' ? (
          <label className={styles.field}>
            <span>{t('common:itinerary.days.moveTargetLabel')}</span>
            <select
              className={styles.input}
              value={targetDayNumber ?? ''}
              onChange={(event) => {
                const parsed = Number(event.target.value)
                onTargetDayNumberChange(Number.isFinite(parsed) && parsed > 0 ? parsed : undefined)
              }}
              disabled={busy || moveDisabled}
            >
              <option value="">{t('common:itinerary.days.selectTargetDay')}</option>
              {targetDays.map((targetDay) => (
                <option key={targetDay.dayNumber} value={targetDay.dayNumber}>
                  {targetDay.date
                    ? `${t('common:itinerary.dayNumber', { dayNumber: targetDay.dayNumber })} — ${formatLocalDate(targetDay.date, i18n.language)}`
                    : t('common:itinerary.dayNumber', { dayNumber: targetDay.dayNumber })}
                </option>
              ))}
            </select>
            <span className={styles.note}>
              {t('common:itinerary.days.moveBlockHint', { sourceDate: sourceDateLabel })}
            </span>
          </label>
        ) : null}

        <div className={styles.activities}>
          <p className={styles.activitiesLabel}>{t('common:itinerary.days.activitiesInDay')}</p>
          {movableActivities.length === 0 ? (
            <p className={styles.activitiesEmpty}>{t('common:itinerary.days.noActivitiesInDeleteDialog')}</p>
          ) : (
            <ul className={styles.activitiesList}>
              {movableActivities.map((activity) => (
                <li key={activity.id}>{activity.title}</li>
              ))}
            </ul>
          )}
        </div>

        {errorMessage ? <p className="error">{errorMessage}</p> : null}
      </div>
    </DialogShell>
  )
}

interface AnchoredShiftConflictDialogItem {
  activityId: string
  activityTitle: string
  anchorDateLabel: string
}

interface AnchoredShiftConflictDialogProps {
  title: string
  message: string
  conflicts: AnchoredShiftConflictDialogItem[]
  onClose: () => void
}

export function AnchoredShiftConflictDialog({
  title,
  message,
  conflicts,
  onClose,
}: AnchoredShiftConflictDialogProps): ReactElement {
  return (
    <DialogShell
      title={title}
      onClose={onClose}
      className={styles.modal}
    >
      <div className={styles.body}>
        <p className={styles.message}>{message}</p>
        <ul className={styles.activitiesList}>
          {conflicts.map((conflict) => (
            <li key={`${conflict.activityId}-${conflict.anchorDateLabel}`}>
              {`${conflict.activityTitle} - ${conflict.anchorDateLabel}`}
            </li>
          ))}
        </ul>
      </div>
    </DialogShell>
  )
}
