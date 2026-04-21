import type { ActivityType, ItineraryActivity } from '@/services/contracts'

type BenchActivityType = Exclude<ActivityType, 'divider'>

export const ACTIVITY_BENCH_TYPE_ORDER: BenchActivityType[] = [
  'tour',
  'poi',
  'food',
  'shopping',
  'accommodation',
  'flight',
  'transfer',
  'carRental',
  'custom',
  'note',
]

export interface ActivityBenchGroup {
  type: BenchActivityType
  activities: ItineraryActivity[]
}

export function groupActivityBenchByType(activityBench: ItineraryActivity[]): ActivityBenchGroup[] {
  const groups = new Map<BenchActivityType, ItineraryActivity[]>()

  for (const activity of activityBench) {
    if (activity.type === 'divider') {
      continue
    }
    const activityType = activity.type as BenchActivityType
    const existing = groups.get(activityType)
    if (existing) {
      existing.push(activity)
    } else {
      groups.set(activityType, [activity])
    }
  }

  return ACTIVITY_BENCH_TYPE_ORDER
    .map((type) => {
      const activities = groups.get(type) ?? []
      return { type, activities }
    })
    .filter((group) => group.activities.length > 0)
}
