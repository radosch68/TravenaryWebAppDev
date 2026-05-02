import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Star } from '@phosphor-icons/react'

import type { ItineraryActivity } from '@/services/contracts'
import { formatLocalTimeRange } from '@/utils/date-format'
import { ACTIVITY_TYPE_COLOR, ACTIVITY_TYPE_ICON } from './activity-presentation'
import { ActivityMetadataCompact } from './ActivityMetadataCompact'

interface ActivityCardContentProps {
  activity: ItineraryActivity
  headerLayout?: 'stacked' | 'inline'
  headerLeading?: ReactNode
  headerAction?: ReactNode
  typeDetails?: ReactNode
  anchoredMarker?: ReactNode
  referenceDisplayMode?: 'chips' | 'thumbnails'
  className?: string
  style?: CSSProperties
}

export function ActivityCardContent({
  activity,
  headerLayout = 'stacked',
  headerLeading,
  headerAction,
  typeDetails,
  anchoredMarker,
  referenceDisplayMode = 'chips',
  className = '',
  style,
}: ActivityCardContentProps): ReactElement {
  const { i18n } = useTranslation(['common'])
  const typeColor = ACTIVITY_TYPE_COLOR[activity.type] ?? ACTIVITY_TYPE_COLOR.note
  const rootClassName = `activity-card-content${className ? ` ${className}` : ''}`
  const typeIcon = (
    <span className="activity-card-content__type-icon" aria-label={activity.type} style={{ color: typeColor.icon }}>
      {ACTIVITY_TYPE_ICON[activity.type] ?? <Star size={18} />}
    </span>
  )
  const time = activity.time ? (
    <span className="activity-card-content__time">
      {formatLocalTimeRange(activity.time, activity.timeEnd, i18n.language)}
    </span>
  ) : null
  const contentStyle = {
    ...style,
    '--activity-card-header-bg': `${typeColor.icon}10`,
  } as CSSProperties

  return (
    <div className={rootClassName} style={contentStyle}>
      <header className="activity-card-content__header">
        {headerLayout === 'inline' ? (
          <>
            <div className="activity-card-content__header-line activity-card-content__header-line--inline">
              {typeIcon}
              <span className="activity-card-content__title">{activity.title}</span>
              {time}
            </div>
            {anchoredMarker ? (
              <div className="activity-card-content__header-note">
                {anchoredMarker}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="activity-card-content__header-line">
              <span className="activity-card-content__leading" aria-hidden={!headerLeading}>
                {headerLeading}
              </span>
              <span className="activity-card-content__title">{activity.title}</span>
              {time}
            </div>

            <div className="activity-card-content__tool-line">
              {typeIcon}
              <span className="activity-card-content__tool-spacer" />
              {anchoredMarker}
              {headerAction}
            </div>
          </>
        )}
      </header>

      {activity.text ? (
        <section className="activity-card-content__description">
          {activity.text}
        </section>
      ) : null}

      {typeDetails ? (
        <section className="activity-card-content__type-details">
          {typeDetails}
        </section>
      ) : null}

      <ActivityMetadataCompact
        activity={activity}
        className="activity-card-content__meta"
        referenceDisplayMode={referenceDisplayMode}
      />
    </div>
  )
}
