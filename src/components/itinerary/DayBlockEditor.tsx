import { Fragment, useState } from 'react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useDroppable } from '@dnd-kit/core'
import { AnchorSimple, Plus, Axe, PencilSimple } from '@phosphor-icons/react'

import type { PlanningSection } from '@/utils/activity-classification'
import { isActivityAnchored } from '@/utils/activity-classification'
import { ActivityEditorRow } from './ActivityEditorRow'

interface DayBlockEditorProps {
  blockKey: string
  section: PlanningSection
  onActivityEdit: (activityId: string) => void
  onActivityDelete: (activityId: string) => void
  onActivityAdd: (blockKey: string) => void
  onBreakBlock?: (blockKey: string) => void
  onDividerEdit: (blockKey: string, newLabel: string) => void
  disabled?: boolean
}

function ActivityDropSlot({ blockKey, position }: { blockKey: string; position: number }): ReactElement {
  const { setNodeRef, isOver } = useDroppable({
    id: `act-slot-${blockKey}-${position}`,
    data: { targetBlockKey: blockKey, targetPosition: position },
  })
  return (
    <div
      ref={setNodeRef}
      className={`activity-drop-slot${isOver ? ' activity-drop-slot--active' : ''}`}
    />
  )
}

export function DayBlockEditor({
  blockKey,
  section,
  onActivityEdit,
  onActivityDelete,
  onActivityAdd,
  onBreakBlock,
  onDividerEdit,
  disabled,
}: DayBlockEditorProps): ReactElement {
  const { t } = useTranslation(['common'])
  const dividerLabel = section.dividerLabel
  const hasAnchoredActivities = section.activities.some((activity) => isActivityAnchored(activity))
  const hasDividerMarker = section.dividerId !== undefined || section.dividerLabel !== undefined
  const canBreak = section.activities.length > 1 && onBreakBlock
  const visibleLabel = dividerLabel

  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')

  const startLabelEdit = (): void => {
    setLabelDraft(dividerLabel ?? '')
    setEditingLabel(true)
  }

  const confirmLabelEdit = (): void => {
    onDividerEdit(blockKey, labelDraft.trim())
    setEditingLabel(false)
  }

  const cancelLabelEdit = (): void => {
    setEditingLabel(false)
  }

  return (
    <div className={`day-block-editor${hasAnchoredActivities ? ' day-block-editor--anchored' : ' day-block-editor--flexible'}`}>
      {hasAnchoredActivities && (
        <span
          className="day-block-editor__anchor-marker"
          aria-label={t('common:itinerary.presentation.anchored')}
          title={t('common:itinerary.presentation.anchored')}
        >
          <AnchorSimple size={12} weight="bold" />
        </span>
      )}
      {hasDividerMarker && (
        <div className="day-block-editor__label">
          {editingLabel ? (
            <input
              className="day-block-editor__label-input"
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              style={{ width: `${Math.max(labelDraft.length + 8, 12)}ch`, minWidth: 'calc(6rem + 50px)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmLabelEdit()
                if (e.key === 'Escape') cancelLabelEdit()
              }}
              onBlur={confirmLabelEdit}
              autoFocus
            />
          ) : (
            <>
              <span className="day-block-editor__label-text">{visibleLabel}</span>
              <button
                type="button"
                className="day-block-editor__icon-btn"
                onClick={startLabelEdit}
                disabled={disabled}
                aria-label={t('common:edit')}
                title={t('common:edit')}
              >
                <PencilSimple size={15} />
              </button>
            </>
          )}
          <span className="day-block-editor__label-line" />
          <button
            type="button"
            className="day-block-editor__icon-btn"
            onClick={() => onActivityAdd(blockKey)}
            disabled={disabled}
            aria-label={t('common:itinerary.dayEditor.addActivity')}
            title={t('common:itinerary.dayEditor.addActivity')}
          >
            <Plus size={17} weight="bold" />
          </button>
          {canBreak && (
            <button
              type="button"
              className="day-block-editor__icon-btn"
              onClick={() => onBreakBlock(blockKey)}
              disabled={disabled}
              aria-label={t('common:itinerary.dayEditor.breakBlock')}
              title={t('common:itinerary.dayEditor.breakBlock')}
            >
              <Axe size={17} />
            </button>
          )}
        </div>
      )}

      {!hasDividerMarker && (
        <div className="day-block-editor__label">
          {editingLabel ? (
            <input
              className="day-block-editor__label-input"
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              style={{ width: `${Math.max(labelDraft.length + 8, 12)}ch`, minWidth: 'calc(6rem + 50px)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmLabelEdit()
                if (e.key === 'Escape') cancelLabelEdit()
              }}
              onBlur={confirmLabelEdit}
              autoFocus
            />
          ) : (
            <>
              {visibleLabel ? <span className="day-block-editor__label-text">{visibleLabel}</span> : null}
              <button
                type="button"
                className="day-block-editor__icon-btn"
                onClick={startLabelEdit}
                disabled={disabled}
                aria-label={t('common:edit')}
                title={t('common:edit')}
              >
                <PencilSimple size={15} />
              </button>
            </>
          )}
          <span className="day-block-editor__label-line" />
          <button
            type="button"
            className="day-block-editor__icon-btn"
            onClick={() => onActivityAdd(blockKey)}
            disabled={disabled}
            aria-label={t('common:itinerary.dayEditor.addActivity')}
            title={t('common:itinerary.dayEditor.addActivity')}
          >
            <Plus size={17} weight="bold" />
          </button>
          {canBreak && (
            <button
              type="button"
              className="day-block-editor__icon-btn"
              onClick={() => onBreakBlock(blockKey)}
              disabled={disabled}
              aria-label={t('common:itinerary.dayEditor.breakBlock')}
              title={t('common:itinerary.dayEditor.breakBlock')}
            >
              <Axe size={17} />
            </button>
          )}
        </div>
      )}

      <ul className="day-block-editor__list">
        <ActivityDropSlot blockKey={blockKey} position={0} />
        {section.activities.map((activity, index) => (
          <Fragment key={activity.id}>
            <ActivityEditorRow
              activity={activity}
              isAnchored={isActivityAnchored(activity)}
              blockKey={blockKey}
              onEdit={() => onActivityEdit(activity.id)}
              onDelete={() => onActivityDelete(activity.id)}
              disabled={disabled}
            />
            <ActivityDropSlot blockKey={blockKey} position={index + 1} />
          </Fragment>
        ))}
      </ul>
    </div>
  )
}


