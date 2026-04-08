import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import type { ItineraryDetail, SharedItineraryDetail } from '@/services/contracts'
import { formatLocalDate, formatWeekday } from '@/utils/date-format'
import { TimelineDaySection } from './TimelineDaySection'

interface ItineraryTimelineViewProps {
  itinerary: ItineraryDetail | SharedItineraryDetail
}

export function ItineraryTimelineView({ itinerary }: ItineraryTimelineViewProps): ReactElement {
  const { t, i18n } = useTranslation(['common'])

  return (
    <ul className="itinerary-day-list">
      {itinerary.days.map((day, index) => (
        <li
          key={day.dayNumber}
          className={`itinerary-day-list__item itinerary-day-list__item--${index % 2 === 0 ? 'odd' : 'even'}`}
        >
          <div className="itinerary-day-header">
            <span className="itinerary-day-header__weekday">
              {day.date ? formatWeekday(day.date, i18n.language) : '—'}
            </span>
            <span className="itinerary-day-header__date">
              {day.date ? formatLocalDate(day.date, i18n.language) : t('common:itinerary.missingDate')}
            </span>
            <span className="itinerary-day-header__index">
              {t('common:itinerary.dayNumber', { dayNumber: day.dayNumber })}
            </span>
          </div>
          {day.summary ? <p>{day.summary}</p> : null}

          <TimelineDaySection activities={day.activities} />
        </li>
      ))}
    </ul>
  )
}
