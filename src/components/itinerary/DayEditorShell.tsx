import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from '@phosphor-icons/react'

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
  const tailBlockKey = sections.length > 0 ? sectionKey(sections[sections.length - 1]) : 'flex-0'

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

      <button
        type="button"
        className="day-editor-shell__tail-add"
        onClick={() => onActivityAdd(tailBlockKey)}
        aria-label={t('common:itinerary.dayEditor.addActivity')}
        title={t('common:itinerary.dayEditor.addActivity')}
      >
        <Plus size={19} weight="bold" />
      </button>

      {children}
    </div>
  )
}
