import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { DraftItinerary, DraftBlockActivity, DraftActivityObject } from '@/services/ai-generation.service'
import { formatDateRange } from '@/utils/date-format'
import { unsplashUrl } from '@/utils/unsplash-url'

interface DraftReviewCarouselProps {
  drafts: DraftItinerary[]
  generationRequestId: string
  isSaving: boolean
  currentIndex: number
  onIndexChange: (index: number) => void
  selectedPhotoIndexes: Record<string, number>
  onPhotoIndexChange: (key: string, index: number) => void
}

export function DraftReviewCarousel({
  drafts,
  generationRequestId,
  isSaving,
  currentIndex,
  onIndexChange,
  selectedPhotoIndexes,
  onPhotoIndexChange,
}: DraftReviewCarouselProps): ReactElement {
  const { t, i18n } = useTranslation(['ai-generation'])

  useEffect(() => {
    const handleArrowNavigation = (event: KeyboardEvent): void => {
      if (isSaving) {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onIndexChange(Math.max(0, currentIndex - 1))
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        onIndexChange(Math.min(drafts.length - 1, currentIndex + 1))
      }
    }

    window.addEventListener('keydown', handleArrowNavigation)
    return () => window.removeEventListener('keydown', handleArrowNavigation)
  }, [drafts.length, isSaving, currentIndex, onIndexChange])

  const draft = drafts[currentIndex]
  if (!draft) {
    return <p>{t('ai-generation:carousel.draftOf', { current: 1, total: drafts.length })}</p>
  }

  const dateLabel = formatDateRange(draft.startDate, draft.endDate, i18n.language)
  const activityLabels = draft.activities
  const benchActivities = draft.activityBench ?? []
  const preview = activityLabels.slice(0, 4)
  const hasDayPlan = draft.days != null && draft.days.length > 0
  const legacyCoverPhoto = (draft as DraftItinerary & { coverPhoto?: { url: string; caption?: string | null } | null }).coverPhoto
  const photoOptions = draft.coverPhotoOptions ?? []
  const photoSelectionKey = `${generationRequestId}:${draft._id}`
  const selectedPhotoIndex = selectedPhotoIndexes[photoSelectionKey] ?? 0
  const selectedPhoto = photoOptions[selectedPhotoIndex] ?? photoOptions[0] ?? legacyCoverPhoto ?? null

  return (
    <div className="draft-carousel">
      <div className="draft-carousel__card">
        <h3 className="draft-carousel__title">{draft.title}</h3>

        {selectedPhoto?.url ? (
          <figure className="draft-carousel__media">
            <div className="draft-carousel__media-layout">
              {photoOptions.length > 0 ? (
                <div className="draft-photo-strip" role="group" aria-label={t('ai-generation:carousel.photoOptionsAriaLabel')}>
                  {photoOptions.map((photo, index) => (
                    <button
                      key={`${photo.url}-${index}`}
                      type="button"
                      className={`draft-photo-thumb${selectedPhotoIndex === index ? ' draft-photo-thumb--selected' : ''}`}
                      onClick={() => onPhotoIndexChange(photoSelectionKey, index)}
                      disabled={isSaving}
                      aria-label={photo.caption ?? draft.title}
                    >
                      <img src={unsplashUrl(photo.url, 120)} alt="" aria-hidden="true" loading="lazy" />
                    </button>
                  ))}
                </div>
              ) : null}

              <img
                className="draft-carousel__image"
                src={unsplashUrl(selectedPhoto.url, 600)}
                alt={selectedPhoto.caption ?? draft.title}
                title={selectedPhoto.caption ?? draft.title}
                loading="lazy"
              />
            </div>
            {selectedPhoto.caption ? (
              <figcaption className="draft-carousel__caption">{selectedPhoto.caption}</figcaption>
            ) : null}
          </figure>
        ) : null}

        {dateLabel ? (
          <p className="draft-carousel__dates">{dateLabel}</p>
        ) : null}

        {draft.description ? (
          <p className="draft-carousel__description">{draft.description}</p>
        ) : null}

        {preview.length > 0 ? (
          <div className="draft-carousel__activities">
            <p className="draft-carousel__section-label">
              {t('ai-generation:carousel.activityHighlights')}
            </p>
            <ul>
              {preview.map((label, index) => (
                <li key={`${label}-${index}`}>{label}</li>
              ))}
            </ul>
            {activityLabels.length > 4 ? (
              <details className="draft-carousel__more-activities">
                <summary>
                  +{activityLabels.length - 4}{' '}
                  {t('ai-generation:carousel.moreActivities', {
                    count: activityLabels.length - 4,
                  })}
                </summary>
                <ul>
                  {activityLabels.slice(4).map((label, index) => (
                    <li key={`${label}-${index}`}>{label}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}

        {hasDayPlan && draft.days ? (
          <div className="draft-carousel__day-plan">
            <p className="draft-carousel__section-label">
              {t('ai-generation:carousel.dayPlan')}
            </p>
            {draft.days.map((day, dayIndex) => (
              <details key={day.date} className="draft-carousel__day-block">
                <summary>
                  {t('ai-generation:carousel.dayLabel', { n: dayIndex + 1 })} — {new Date(day.date + 'T00:00:00').toLocaleDateString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric' })}
                </summary>
                {day.blocks && day.blocks.length > 0 ? (
                  <div className="draft-carousel__blocks">
                    {day.blocks.map((block, blockIndex) => (
                      <div key={`${block.label}-${blockIndex}`} className="draft-carousel__block">
                        {block.label ? (
                          <span className="draft-carousel__block-label">{block.label}</span>
                        ) : null}
                        <ul>
                          {block.activities.map((activity, actIndex) => (
                            <li key={`act-${actIndex}`}>
                              <ActivityItem activity={activity} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}
              </details>
            ))}
          </div>
        ) : null}

        {benchActivities.length > 0 ? (
          <div className="draft-carousel__bench">
            <p className="draft-carousel__section-label">
              {t('ai-generation:carousel.activityBench')}
            </p>
            <details className="draft-carousel__bench-details">
              <summary>
                {t('ai-generation:carousel.activityBenchToggle', { count: benchActivities.length })}
              </summary>
              <ul>
                {benchActivities.map((activity, index) => (
                  <li key={`bench-${index}`}>
                    <ActivityItem activity={activity} />
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : null}

        {draft.tags.length > 0 ? (
          <div className="draft-carousel__tags" aria-label={t('ai-generation:carousel.tags')}>
            {draft.tags.map((tag) => (
              <span key={tag} className="draft-carousel__tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

      </div>
    </div>
  )
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isActivityObject(activity: DraftBlockActivity): activity is DraftActivityObject {
  if (typeof activity !== 'object' || activity === null) {
    return false
  }

  const candidate = activity as Partial<DraftActivityObject> & { time?: unknown; timeEnd?: unknown }

  return (
    hasNonEmptyString(candidate.title) &&
    hasNonEmptyString(candidate.type) &&
    (candidate.time === undefined || typeof candidate.time === 'string') &&
    (candidate.timeEnd === undefined || typeof candidate.timeEnd === 'string')
  )
}

function ActivityItem({ activity }: { activity: DraftBlockActivity }): ReactElement {
  if (!isActivityObject(activity)) {
    return <>{activity}</>
  }

  const timeLabel = activity.time
    ? activity.timeEnd
      ? `${activity.time}–${activity.timeEnd}`
      : activity.time
    : null

  return (
    <span className="draft-activity-item">
      <span className="draft-activity-item__type">{activity.type}</span>
      {timeLabel ? <span className="draft-activity-item__time">{timeLabel}</span> : null}
      <span className="draft-activity-item__title">{activity.title}</span>
      {activity.description ? (
        <span className="draft-activity-item__desc">{activity.description}</span>
      ) : null}
    </span>
  )
}
