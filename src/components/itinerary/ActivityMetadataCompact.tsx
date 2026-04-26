import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, FilmStrip, LinkSimple, MapPinSimple, MapTrifold } from '@phosphor-icons/react'

import type { ItineraryActivity, WebReference } from '@/services/contracts'
import { toGoogleMapsUrl } from '@/utils/location-links'
import { toDisplayLabel } from '@/utils/display-label'
import { unsplashUrl } from '@/utils/unsplash-url'

interface ActivityMetadataCompactProps {
  activity: ItineraryActivity
  maxVisibleItems?: number
  className?: string
  referenceDisplayMode?: 'chips' | 'thumbnails'
}

interface VisibleSlice<T> {
  visible: T[]
  hiddenCount: number
}

type ReferenceChipType = 'photo' | 'video' | 'webpage' | 'no-type'

function toVisibleSlice<T>(items: T[], maxVisibleItems: number): VisibleSlice<T> {
  const safeMax = Math.max(1, maxVisibleItems)
  if (items.length <= safeMax) {
    return { visible: items, hiddenCount: 0 }
  }

  return {
    visible: items.slice(0, safeMax),
    hiddenCount: items.length - safeMax,
  }
}

function toReferenceLabel(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname === '/' ? '' : parsed.pathname
    return `${parsed.hostname}${path}`
  } catch {
    return url
  }
}

function toCoordinatesLabel(longitude: number, latitude: number): string {
  return `${longitude.toFixed(5)}, ${latitude.toFixed(5)}`
}

function toReferenceChipType(type?: string): ReferenceChipType {
  if (type === 'photo') return 'photo'
  if (type === 'video') return 'video'
  if (type === 'webpage') return 'webpage'
  return 'no-type'
}

function toReferenceChipTypeOrder(chipType: ReferenceChipType): number {
  if (chipType === 'photo') return 0
  if (chipType === 'video') return 1
  if (chipType === 'webpage') return 2
  return 3
}

function toOrderedReferenceChips(references: WebReference[]): WebReference[] {
  return references
    .map((reference, index) => ({
      reference,
      index,
      chipType: toReferenceChipType(reference.type),
    }))
    .sort((left, right) => {
      const orderDiff = toReferenceChipTypeOrder(left.chipType) - toReferenceChipTypeOrder(right.chipType)
      if (orderDiff !== 0) {
        return orderDiff
      }

      return left.index - right.index
    })
    .map((item) => item.reference)
}

export function ActivityMetadataCompact({
  activity,
  maxVisibleItems = 3,
  className,
  referenceDisplayMode = 'chips',
}: ActivityMetadataCompactProps): ReactElement | null {
  const { t } = useTranslation(['common'])
  const references = activity.references ?? []
  const locations = activity.locations ?? []

  if (references.length === 0 && locations.length === 0) {
    return null
  }

  const indexedReferences = references.map((reference, index) => ({ reference, index }))
  const indexedPhotoReferences = indexedReferences.filter(({ reference }) => reference.type === 'photo')
  const visiblePhotoThumbnails = referenceDisplayMode === 'thumbnails'
    ? indexedPhotoReferences.slice(0, 2)
    : []
  const thumbnailIndexes = new Set(visiblePhotoThumbnails.map(({ index }) => index))
  const chipReferences = indexedReferences
    .filter(({ index }) => !thumbnailIndexes.has(index))
    .map(({ reference }) => reference)
  const orderedChipReferences = toOrderedReferenceChips(chipReferences)
  const referenceSlice = toVisibleSlice(orderedChipReferences, maxVisibleItems)
  const locationSlice = toVisibleSlice(locations, maxVisibleItems)

  return (
    <div className={`activity-meta-compact${className ? ` ${className}` : ''}`}>
      {referenceSlice.visible.length > 0 || visiblePhotoThumbnails.length > 0 ? (
        <div className="activity-meta-compact__section">
          <div className="activity-meta-compact__list">
            {visiblePhotoThumbnails.length > 0 ? (
              <span className="activity-meta-compact__thumbnails">
                {visiblePhotoThumbnails.map(({ reference, index }, thumbnailIndex) => {
                  const fullLinkLabel = reference.caption?.trim() || toReferenceLabel(reference.url)
                  const displayLinkLabel = toDisplayLabel(fullLinkLabel)
                  const thumbnailUrl = unsplashUrl(reference.url, 160, 70)

                  return (
                    <a
                      key={`thumb-${reference.url}-${index}`}
                      href={reference.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="activity-meta-compact__thumbnail-link"
                      aria-label={t('common:itinerary.activityMeta.openReference', { label: fullLinkLabel })}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <img
                        src={thumbnailUrl}
                        alt={displayLinkLabel || t('common:itinerary.dayEditor.photoSearchResultFallback', { index: thumbnailIndex + 1 })}
                        loading="lazy"
                        decoding="async"
                        className="activity-meta-compact__thumbnail-image"
                      />
                    </a>
                  )
                })}
              </span>
            ) : null}

            {referenceSlice.visible.map((reference, index) => {
              const fullLinkLabel = reference.caption?.trim() || toReferenceLabel(reference.url)
              const displayLinkLabel = toDisplayLabel(fullLinkLabel)
              const referenceChipType = toReferenceChipType(reference.type)
              const chipClassName = `activity-meta-compact__link activity-meta-compact__chip--${referenceChipType}`

              return (
                <a
                  key={`${reference.url}-${index}`}
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={chipClassName}
                  aria-label={t('common:itinerary.activityMeta.openReference', { label: fullLinkLabel })}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="activity-meta-compact__chip-icon" aria-hidden="true">
                    {referenceChipType === 'photo' ? <Camera size={14} /> : null}
                    {referenceChipType === 'video' ? <FilmStrip size={14} /> : null}
                    {referenceChipType === 'webpage' ? <LinkSimple size={14} /> : null}
                    {referenceChipType === 'no-type' ? <LinkSimple size={14} /> : null}
                  </span>
                  <span className="activity-meta-compact__chip-text">{displayLinkLabel}</span>
                </a>
              )
            })}

            {referenceSlice.hiddenCount > 0 ? (
              <span className="activity-meta-compact__more">{`+${referenceSlice.hiddenCount}`}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {locationSlice.visible.length > 0 ? (
        <div className="activity-meta-compact__section activity-meta-compact__section--locations">
          <div className="activity-meta-compact__list activity-meta-compact__list--locations">
            {locationSlice.visible.map((location, index) => {
              const hasCoordinates = Array.isArray(location.coordinates) && location.coordinates.length === 2
              const coordinates = hasCoordinates ? location.coordinates as [number, number] : undefined
              const coordinatesLabel = coordinates
                ? toCoordinatesLabel(coordinates[0], coordinates[1])
                : ''
              const fullLocationLabel = location.caption?.trim()
                || location.address?.trim()
                || coordinatesLabel
                || t('common:itinerary.activityMeta.locations')
              const displayLocationLabel = toDisplayLabel(fullLocationLabel)
              const mapsUrl = toGoogleMapsUrl({
                coordinates,
                address: location.address,
              })

              return (
                mapsUrl ? (
                  <a
                    key={`${fullLocationLabel}-${index}`}
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`activity-meta-compact__link activity-meta-compact__chip--location${location.showOnMap ? ' activity-meta-compact__chip--mapped-location' : ''}`}
                    aria-label={t('common:itinerary.activityMeta.openMap', { label: fullLocationLabel })}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span className="activity-meta-compact__chip-icon" aria-hidden="true">
                      {location.showOnMap ? <MapTrifold size={14} weight="regular" /> : <MapPinSimple size={14} />}
                    </span>
                    <span className="activity-meta-compact__chip-text">{displayLocationLabel}</span>
                  </a>
                ) : (
                  <span
                    key={`${fullLocationLabel}-${index}`}
                    className={`activity-meta-compact__chip activity-meta-compact__chip--location${location.showOnMap ? ' activity-meta-compact__chip--mapped-location' : ''}`}
                  >
                    <span className="activity-meta-compact__chip-icon" aria-hidden="true">
                      {location.showOnMap ? <MapTrifold size={14} weight="regular" /> : <MapPinSimple size={14} />}
                    </span>
                    <span className="activity-meta-compact__chip-text">{displayLocationLabel}</span>
                  </span>
                )
              )
            })}

            {locationSlice.hiddenCount > 0 ? (
              <span className="activity-meta-compact__more">{`+${locationSlice.hiddenCount}`}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
