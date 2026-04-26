import type { ReactElement } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { BrandLanguageHeader } from '@/components/BrandLanguageHeader'
import { LocationsMap } from '@/components/itinerary/LocationsMap'
import { buildLocationMapPinsFromDays } from '@/components/itinerary/location-map-pins'
import { ApiError } from '@/services/contracts'
import type { ItineraryDetail } from '@/services/contracts'
import { getItinerary } from '@/services/itinerary-service'

interface ItineraryMapPageProps {
  itineraryIdOverride?: string
  dayNumberOverride?: string
}

function MapPageHeader(): ReactElement {
  return (
    <header className="topbar">
      <BrandLanguageHeader brandLinkTo="/" variant="topbar" />
    </header>
  )
}

export function ItineraryMapPage({ itineraryIdOverride, dayNumberOverride }: ItineraryMapPageProps): ReactElement {
  const { itineraryId } = useParams<{ itineraryId: string }>()
  const resolvedItineraryId = itineraryIdOverride ?? itineraryId
  const parsedDayNumber = dayNumberOverride ? Number.parseInt(dayNumberOverride, 10) : null
  const hasDayFilter = parsedDayNumber !== null && Number.isFinite(parsedDayNumber)
  const { t } = useTranslation(['common'])
  const [itinerary, setItinerary] = useState<ItineraryDetail | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'not-found'>('loading')

  const loadDetail = useCallback(async (): Promise<void> => {
    if (!resolvedItineraryId) {
      setState('not-found')
      return
    }

    setState('loading')

    try {
      const payload = await getItinerary(resolvedItineraryId)
      setItinerary(payload)
      setState('ready')
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setState('not-found')
        return
      }

      setState('error')
    }
  }, [resolvedItineraryId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDetail()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadDetail])

  const mapPins = useMemo(() => {
    if (!itinerary) {
      return []
    }

    const daySource = hasDayFilter
      ? itinerary.days.filter((day) => day.dayNumber === parsedDayNumber)
      : itinerary.days

    return buildLocationMapPinsFromDays(daySource, {
      getActivityTypeLabel: (activityType) => t(`common:itinerary.dayEditor.activityTypeOptions.${activityType}`),
    })
  }, [hasDayFilter, itinerary, parsedDayNumber, t])

  const mapTitle = hasDayFilter
    ? t('common:itinerary.dayEditor.dailyMapTitle')
    : t('common:itinerary.dayEditor.itineraryMapTitle')

  if (state === 'loading') {
    return (
      <main className="app-shell itinerary-map-page">
        <MapPageHeader />
        <section className="panel">
          <p>{t('common:itinerary.detailLoading')}</p>
        </section>
      </main>
    )
  }

  if (state === 'not-found') {
    return (
      <main className="app-shell itinerary-map-page">
        <MapPageHeader />
        <section className="panel">
          <h1>{t('common:itinerary.notFoundTitle')}</h1>
          <p>{t('common:itinerary.notFoundMessage')}</p>
          <Link to="/">{t('common:itinerary.backToDashboard')}</Link>
        </section>
      </main>
    )
  }

  if (state === 'error' || !itinerary) {
    return (
      <main className="app-shell itinerary-map-page">
        <MapPageHeader />
        <section className="panel">
          <h1>{t('common:itinerary.detailLoadErrorTitle')}</h1>
          <p>{t('common:itinerary.detailLoadErrorMessage')}</p>
          <div className="button-row">
            <button type="button" className="button-primary" onClick={() => void loadDetail()}>
              {t('common:itinerary.retry')}
            </button>
            <Link to="/">{t('common:itinerary.backToDashboard')}</Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell itinerary-map-page">
      <MapPageHeader />
      <section className="panel itinerary-map-page__panel" aria-label={mapTitle}>
        <div className="itinerary-map-page__header">
          <div>
            <h1>{mapTitle}</h1>
            <p>{t('common:itinerary.dayEditor.mapPinsCount', { count: mapPins.length })}</p>
          </div>
        </div>

        {mapPins.length > 0 ? (
          <LocationsMap pins={mapPins} variant="page" />
        ) : (
          <p className="text-muted">{t('common:itinerary.dayEditor.mapNoLocations')}</p>
        )}
      </section>
    </main>
  )
}
