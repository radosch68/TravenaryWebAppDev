import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from '@phosphor-icons/react'
import { useDroppable } from '@dnd-kit/core'

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
          <ActivityEmptyDropTarget label={t('common:itinerary.days.noActivities')} />
        ) : (
          <>
            {sections.map((section, sectionIndex) => {
              const key = sectionKey(section)

              return (
                <div key={key} className="day-editor-shell__block-with-slot">
                  <BlockInsertSlot targetBlockIndex={sectionIndex} />
                  <DayBlockEditor
                    blockKey={key}
                    section={section}
                    onActivityEdit={onActivityEdit}
                    onActivityDelete={onActivityDelete}
                    onActivityAdd={onActivityAdd}
                    onBreakBlock={onBreakBlock}
                    onDividerEdit={onDividerEdit}
                  />
                </div>
              )
            })}
            <BlockInsertSlot targetBlockIndex={sections.length} />
          </>
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

function ActivityEmptyDropTarget({ label }: { label: string }): ReactElement {
  const { setNodeRef, isOver } = useDroppable({
    id: 'act-slot-flex-0-0',
    data: { targetSurface: 'day' as const, targetBlockKey: 'flex-0', targetPosition: 0 },
  })

  return (
    <p
      ref={setNodeRef}
      className={`day-editor-shell__empty${isOver ? ' day-editor-shell__empty--drop-active' : ''}`}
    >
      {label}
    </p>
  )
}

function BlockInsertSlot({ targetBlockIndex }: { targetBlockIndex: number }): ReactElement {
  const { setNodeRef, isOver } = useDroppable({
    id: `act-new-block-slot-${targetBlockIndex}`,
    data: { targetSurface: 'day' as const, targetNewBlockIndex: targetBlockIndex },
  })

  return (
    <div
      ref={setNodeRef}
      className={`day-editor-shell__block-insert-slot${isOver ? ' day-editor-shell__block-insert-slot--active' : ''}`}
      aria-hidden="true"
    />
  )
}
