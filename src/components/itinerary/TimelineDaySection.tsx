import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import type { ItineraryActivity } from '@/services/contracts'
import { getEffectiveAnchored, sortActivitiesForTimeline } from '@/utils/activity-classification'

interface TimelineDaySectionProps {
  activities: ItineraryActivity[]
}

export function TimelineDaySection({ activities }: TimelineDaySectionProps): ReactElement {
  const { t } = useTranslation(['common'])

  if (activities.length === 0) {
    return (
      <div className="timeline-day-section">
        <p className="itinerary-day-activities__empty">{t('common:itinerary.days.noActivities')}</p>
      </div>
    )
  }

  return (
    <div className="timeline-day-section">
      <ul className="planning-section__list">
        {sortActivitiesForTimeline(activities).map((activity) => (
          <TimelineActivityRow key={activity.id} activity={activity} t={t} />
        ))}
      </ul>
    </div>
  )
}

function TimelineActivityRow({ activity, t }: { activity: ItineraryActivity; t: (key: string) => string }): ReactElement {
  return (
    <li className="timeline-activity">
      <span className="timeline-activity__time">
        {activity.time
          ? `${activity.time}${activity.timeEnd ? ` – ${activity.timeEnd}` : ''}`
          : ''}
      </span>
      <span className="timeline-activity__type">{activity.type}</span>
      <span className="timeline-activity__title">{activity.title}</span>
      {getEffectiveAnchored(activity) ? (
        <span className="timeline-activity__anchored-marker">
          {t('common:itinerary.presentation.anchoredMarker')}
        </span>
      ) : null}
    </li>
  )
}
