import type { ReactElement } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { BrandBanner } from '@/components/BrandBanner'
import { ItineraryTimelineView } from '@/components/itinerary/ItineraryTimelineView'
import { ApiError } from '@/services/contracts'
import { getSharedItinerary } from '@/services/itinerary-service'
import type { SharedItineraryDetail } from '@/services/contracts'
import { formatLocalDate } from '@/utils/date-format'
import { unsplashUrl } from '@/utils/unsplash-url'

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
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) {
        setState('not-found')
        return
      }
      setState('error')
    }
  }, [shareToken])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadShared()
    }, 0)

    return () => window.clearTimeout(handle)
  }, [loadShared])

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

        <div className="itinerary-detail-meta-grid">
          <span className="itinerary-detail-meta-grid__left">
            {itinerary.startDate ? formatLocalDate(itinerary.startDate, i18n.language) : t('common:itinerary.missingDate')}
          </span>
          <span className="itinerary-detail-meta-grid__right itinerary-detail-day-count">
            {t('common:itinerary.dayCount', { count: itinerary.days.length })}
          </span>
          <span className="itinerary-detail-meta-grid__left">
            {itinerary.endDate ? formatLocalDate(itinerary.endDate, i18n.language) : t('common:itinerary.missingDate')}
          </span>
        </div>

        <ItineraryTimelineView itinerary={itinerary} />

        <p className="shared-page__footer">{t('common:itinerary.share.poweredBy')}</p>
      </section>
    </main>
  )
}
