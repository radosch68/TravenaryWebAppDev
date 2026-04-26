import type { ActivityType, ItineraryActivity, ItineraryDay } from '@/services/contracts'

export interface LocationMapPin {
  id: string
  longitude: number
  latitude: number
  activityType: ActivityType
  activityTitle: string
  activityTypeLabel: string
  time?: string
  locationLabel?: string
  address?: string
}

interface BuildLocationMapPinsOptions {
  getActivityTypeLabel: (activityType: ActivityType) => string
  idPrefix?: string
}

export function hasCoordinates(coordinates?: number[]): coordinates is [number, number] {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false
  }

  const [longitude, latitude] = coordinates
  return (
    Number.isFinite(longitude)
    && Number.isFinite(latitude)
    && longitude >= -180
    && longitude <= 180
    && latitude >= -90
    && latitude <= 90
  )
}

export function buildLocationMapPinsFromActivities(
  activities: ItineraryActivity[],
  options: BuildLocationMapPinsOptions,
): LocationMapPin[] {
  const pins: LocationMapPin[] = []
  const idPrefix = options.idPrefix ? `${options.idPrefix}-` : ''

  for (const activity of activities) {
    const activityTypeLabel = options.getActivityTypeLabel(activity.type)
    const locations = activity.locations ?? []

    locations.forEach((location, locationIndex) => {
      if (!location.showOnMap || !hasCoordinates(location.coordinates)) {
        return
      }

      const [longitude, latitude] = location.coordinates
      pins.push({
        id: `${idPrefix}${activity.id}-${locationIndex}`,
        longitude,
        latitude,
        activityType: activity.type,
        activityTitle: activity.title,
        activityTypeLabel,
        time: activity.time,
        locationLabel: location.caption?.trim(),
        address: location.address?.trim(),
      })
    })
  }

  return pins
}

export function buildLocationMapPinsFromDays(
  days: ItineraryDay[],
  options: BuildLocationMapPinsOptions,
): LocationMapPin[] {
  const pins: LocationMapPin[] = []

  for (const day of days) {
    pins.push(...buildLocationMapPinsFromActivities(day.activities, {
      ...options,
      idPrefix: `day${day.dayNumber}`,
    }))
  }

  return pins
}
