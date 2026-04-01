import type { ReactElement } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { BrandBanner } from '@/components/BrandBanner'
import { ApiError } from '@/services/contracts'
import { getSharedItinerary } from '@/services/itinerary-service'
import type { SharedItineraryDetail } from '@/services/contracts'
import { formatLocalDate, formatWeekday } from '@/utils/date-format'
import { unsplashUrl } from '@/utils/unsplash-url'

function computeDateSpan(days: SharedItineraryDetail['days'], locale: string): string | undefined {
  const dated = days.map((day) => day.date).filter((value): value is string => Boolean(value))
  if (dated.length === 0) return undefined
  const sorted = [...dated].sort((left, right) => left.localeCompare(right))
  const start = sorted[0]
  const end = sorted[sorted.length - 1]
  return start === end
    ? formatLocalDate(start, locale)
    : `${formatLocalDate(start, locale)} – ${formatLocalDate(end, locale)}`
}

export function SharedItineraryPage(): ReactElement {
  const { shareToken } = useParams<{ shareToken: string }>()
  const { t, i18n } = useTranslation(['common'])

  const [itinerary, setItinerary] = useState<SharedItineraryDetail | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'not-found'>('loading')

  const loadShared = useCallback(async (): Promise<void> => {
    if (!shareToken) {
      setState('not-found')
      return
    }
    setState('loading')
    try {
      const payload = await getSharedItinerary(shareToken)
      setItinerary(payload)
      setState('ready')
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setState('not-found')
        return
      }
      setState('error')
    }
  }, [shareToken])

  useEffect(() => {
    void loadShared()
  }, [loadShared])

  const dateSpan = useMemo(() => {
    if (!itinerary) return ''
    return computeDateSpan(itinerary.days, i18n.language) || t('common:itinerary.missingDate')
  }, [itinerary, t, i18n.language])

  if (state === 'loading') {
    return (
      <main className="app-shell shared-page">
        <header className="shared-page__header"><BrandBanner /></header>
        <section className="panel">
          <p>{t('common:itinerary.detailLoading')}</p>
        </section>
      </main>
    )
  }

  if (state === 'not-found') {
    return (
      <main className="app-shell shared-page">
        <header className="shared-page__header"><BrandBanner /></header>
        <section className="panel">
          <h1>{t('common:itinerary.share.sharedNotFound')}</h1>
          <p>{t('common:itinerary.share.sharedNotFoundMessage')}</p>
        </section>
      </main>
    )
  }

  if (state === 'error' || !itinerary) {
    return (
      <main className="app-shell shared-page">
        <header className="shared-page__header"><BrandBanner /></header>
        <section className="panel">
          <h1>{t('common:itinerary.share.sharedLoadError')}</h1>
          <button type="button" onClick={() => void loadShared()}>
            {t('common:itinerary.retry')}
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell shared-page">
      <header className="shared-page__header"><BrandBanner /></header>

      <section className="panel itinerary-detail-panel">
        {itinerary.coverPhoto?.url ? (
          <div className="itinerary-detail-cover">
            <img
              src={unsplashUrl(itinerary.coverPhoto.url, 1200, 85)}
              alt={itinerary.coverPhoto.caption ?? itinerary.title}
              title={itinerary.coverPhoto.caption ?? itinerary.title}
            />
            {itinerary.coverPhoto.caption ? (
              <p className="itinerary-detail-cover__caption">{itinerary.coverPhoto.caption}</p>
            ) : null}
          </div>
        ) : null}

        <h1>{itinerary.title}</h1>
        {itinerary.description ? <p>{itinerary.description}</p> : null}

        {itinerary.tags.length > 0 ? (
          <div className="itinerary-tags itinerary-tags--detail" aria-label={t('common:itinerary.tagsAriaLabel')}>
            <svg className="itinerary-tags__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M20 10L13 3H6L3 6V13L10 20L20 10Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="7.8" cy="7.8" r="1.6" fill="currentColor" />
            </svg>
            <div className="itinerary-tags__list">
              {itinerary.tags.map((tag) => (
                <span key={tag} className="itinerary-tag-chip">{tag}</span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="itinerary-detail-meta">
          <p>{dateSpan}</p>
          <p>{t('common:itinerary.dayCount', { count: itinerary.days.length })}</p>
        </div>

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

              {day.activities.length > 0 ? (
                <details className="itinerary-day-activities">
                  <summary>
                    {t('common:itinerary.days.activityCount', { count: day.activities.length })}
                  </summary>
                  <ul className="itinerary-day-activities__list">
                    {day.activities.map((activity) => (
                      <li key={activity.id} className="itinerary-day-activity">
                        <span className="itinerary-day-activity__type">{activity.type}</span>
                        <span className="itinerary-day-activity__title">{activity.title}</span>
                        {activity.time ? (
                          <span className="itinerary-day-activity__time">
                            {activity.time}{activity.timeEnd ? ` – ${activity.timeEnd}` : ''}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </li>
          ))}
        </ul>

        <p className="shared-page__footer">{t('common:itinerary.share.poweredBy')}</p>
      </section>
    </main>
  )
}
