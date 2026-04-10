import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import type { PlanningSection } from '@/utils/activity-classification'
import { sectionKey } from '@/utils/day-edit-transforms'
import { DayBlockEditor } from './DayBlockEditor'

interface DayEditorShellProps {
  sections: PlanningSection[]
  onActivityEdit: (activityId: string) => void
  onActivityDelete: (activityId: string) => void
  onActivityAdd: (blockKey: string) => void
  onBreakBlock: (blockKey: string) => void
  onDividerEdit: (blockKey: string, newLabel: string) => void
  children?: React.ReactNode
}

export function DayEditorShell({
  sections,
  onActivityEdit,
  onActivityDelete,
  onActivityAdd,
  onBreakBlock,
  onDividerEdit,
  children,
}: DayEditorShellProps): ReactElement {
  const { t } = useTranslation(['common'])

  return (
    <div className="day-editor-shell">
      <div className="day-editor-shell__blocks">
        {sections.length === 0 ? (
          <p className="day-editor-shell__empty">{t('common:itinerary.days.noActivities')}</p>
        ) : (
          sections.map((section) => {
            const key = sectionKey(section)

            return (
              <DayBlockEditor
                key={key}
                blockKey={key}
                section={section}
                onActivityEdit={onActivityEdit}
                onActivityDelete={onActivityDelete}
                onActivityAdd={onActivityAdd}
                onBreakBlock={onBreakBlock}
                onDividerEdit={onDividerEdit}
              />
            )
          })
        )}
      </div>

      {children}
    </div>
  )
}
