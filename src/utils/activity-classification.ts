import type { ItineraryActivity } from '@/services/contracts'
import { generateClientId } from '@/utils/client-id'

export function isActivityAnchored(activity: ItineraryActivity): boolean {
  return typeof activity.anchorDate === 'string' && activity.anchorDate.length > 0
}

export function getEffectiveAnchored(activity: ItineraryActivity): boolean {
  return isActivityAnchored(activity)
}

/* ---- Section-based grouping for Planning view ---- */

export interface PlanningSection {
  blockIndex: number
  dividerId?: string
  dividerLabel?: string
  activities: ItineraryActivity[]
}

export interface PlanningDayGroups {
  sections: PlanningSection[]
  blockCount: number
}

/**
 * Groups activities into interleaved sections preserving the original array order.
 *
 * Rules:
 * - Consecutive non-divider activities form a block.
 * - A `divider` activity starts a new flexible block, taking the divider's title as the label.
 *   The divider itself is NOT included in the activity list — it's metadata.
 * - A leading divider labels the first flexible block of a day; otherwise the first flexible block
 *   is the implicit default block with no divider metadata.
 */
export function groupActivitiesForPlanning(activities: ItineraryActivity[]): PlanningDayGroups {
  const sections: PlanningSection[] = []
  let blockCount = 0

  let currentActivities: ItineraryActivity[] = []
  let currentDividerId: string | undefined
  let currentDividerLabel: string | undefined

  function flushBlock(): void {
    if (currentActivities.length > 0) {
      sections.push({
        blockIndex: blockCount,
        dividerId: currentDividerId,
        dividerLabel: currentDividerLabel,
        activities: currentActivities,
      })
      blockCount++
      currentActivities = []
      currentDividerId = undefined
      currentDividerLabel = undefined
    }
  }

  for (const activity of activities) {
    if (activity.type === 'divider') {
      // Divider starts a new block — flush any in-progress block first.
      flushBlock()
      currentDividerId = activity.id
      currentDividerLabel = activity.title || undefined
      continue
    }

    currentActivities.push(activity)
  }

  flushBlock()

  return { sections, blockCount }
}

export function sortActivitiesForTimeline(activities: ItineraryActivity[]): ItineraryActivity[] {
  const timed: ItineraryActivity[] = []
  const untimed: ItineraryActivity[] = []

  for (const activity of activities) {
    if (activity.type === 'divider') {
      continue
    }

    if (activity.time) {
      timed.push(activity)
    } else {
      untimed.push(activity)
    }
  }

  timed.sort((a, b) => a.time!.localeCompare(b.time!))

  return [...timed, ...untimed]
}

/**
 * Converts sections back to a flat activity array, re-inserting divider activities
 * before each flexible block.
 */
export function flattenSectionsToActivities(sections: PlanningSection[]): ItineraryActivity[] {
  const result: ItineraryActivity[] = []
  let prevWasFlexible = false

  for (const section of sections) {
    if (section.dividerId !== undefined || section.dividerLabel !== undefined) {
      result.push({
        id: section.dividerId ?? generateClientId(),
        type: 'divider',
        title: section.dividerLabel ?? '',
      })
    } else if (prevWasFlexible) {
      // Insert empty divider to preserve block boundary
      result.push({
        id: generateClientId(),
        type: 'divider',
        title: '',
      })
    }
    result.push(...section.activities)
    prevWasFlexible = true
  }
  return result
}
