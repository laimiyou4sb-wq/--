import { useParams, useNavigate } from 'react-router-dom'
import { useBoard, useInspirations, saveBoard } from '@/hooks/useDb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useUIStore } from '@/stores/ui'
import { ArrowLeft, Plus, GripVertical, Trash2, MoreHorizontal } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { cn, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { generateId } from '@/lib/utils'
import type { Inspiration } from '@/types'

function SortableCard({ inspiration }: { inspiration: Inspiration }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: inspiration.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-3 rounded-md border bg-card shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
        isDragging && 'opacity-50 shadow-lg'
      )}
      {...attributes}
      {...listeners}
    >
      <p className="text-xs font-medium leading-tight line-clamp-2">{inspiration.title}</p>
      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
        <span className={cn('text-[9px] px-1 py-0.5 rounded-full font-medium', STATUS_COLORS[inspiration.status])}>
          {STATUS_LABELS[inspiration.status]}
        </span>
        {inspiration.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[9px] py-0 h-3.5">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}

interface ColumnProps {
  column: { id: string; title: string; inspirationIds: string[] }
  inspirations: Inspiration[]
  onAddCard: () => void
  onDeleteColumn: () => void
}

function Column({ column, inspirations, onAddCard, onDeleteColumn }: ColumnProps) {
  return (
    <div className="flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{column.title}</h3>
          <Badge variant="secondary" className="text-[10px] py-0 h-4">
            {inspirations.length}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" onClick={onAddCard}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDeleteColumn}>
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[100px]">
        <SortableContext items={column.inspirationIds} strategy={verticalListSortingStrategy}>
          {inspirations.map((insp) => (
            <SortableCard key={insp.id} inspiration={insp} />
          ))}
        </SortableContext>
        {inspirations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">拖拽卡片到这里</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BoardDetailPage() {
  const { id } = useParams()
  const board = useBoard(id)
  const allInspirations = useInspirations()
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  const getInspiration = (inspId: string) => allInspirations.find((i) => i.id === inspId)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    const updatedColumns = board.columns.map((col) => {
      const activeIndex = col.inspirationIds.indexOf(activeId)
      const overIndex = col.inspirationIds.indexOf(overId)

      if (activeIndex !== -1 && overIndex !== -1) {
        // Same column reorder
        const newIds = [...col.inspirationIds]
        newIds.splice(activeIndex, 1)
        newIds.splice(overIndex, 0, activeId)
        return { ...col, inspirationIds: newIds }
      } else if (activeIndex !== -1) {
        // Remove from this column
        return { ...col, inspirationIds: col.inspirationIds.filter((i) => i !== activeId) }
      } else if (overIndex !== -1) {
        // Add to this column
        const newIds = [...col.inspirationIds]
        newIds.splice(overIndex, 0, activeId)
        return { ...col, inspirationIds: newIds }
      }
      return col
    })

    // If moving to a different column (card dropped on a column directly)
    const overCol = board.columns.find((c) => c.id === overId)
    if (overCol && !overCol.inspirationIds.includes(activeId)) {
      const finalColumns = updatedColumns.map((col) => {
        if (col.id === overId) return { ...col, inspirationIds: [...col.inspirationIds, activeId] }
        return col
      })
      await saveBoard({ ...board, columns: finalColumns })
    } else {
      await saveBoard({ ...board, columns: updatedColumns })
    }
  }

  const handleAddColumn = async () => {
    const title = prompt('输入列名称:')
    if (!title) return
    const newCol = { id: generateId(), title, inspirationIds: [] }
    await saveBoard({ ...board, columns: [...board.columns, newCol] })
    addToast('列已添加', 'success')
  }

  const handleAddCardToColumn = async (columnId: string) => {
    // Show quick add dialog or select existing inspiration
    const title = prompt('输入卡片标题（新建灵感）:')
    if (!title) return
    const { saveInspiration } = await import('@/hooks/useDb')
    const insp = await saveInspiration({ title, type: 'seed', status: 'thinking' })
    const updatedColumns = board.columns.map((col) =>
      col.id === columnId ? { ...col, inspirationIds: [...col.inspirationIds, insp.id] } : col
    )
    await saveBoard({ ...board, columns: updatedColumns })
    addToast('卡片已添加', 'success')
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center gap-3 p-4 pb-0">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/boards')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{board.title}</h1>
          {board.description && (
            <p className="text-xs text-muted-foreground">{board.description}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleAddColumn} className="text-xs gap-1">
          <Plus className="h-3 w-3" />
          添加列
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 items-start min-h-full">
            {board.columns.map((col) => (
              <Column
                key={col.id}
                column={col}
                inspirations={col.inspirationIds.map(getInspiration).filter(Boolean) as Inspiration[]}
                onAddCard={() => handleAddCardToColumn(col.id)}
                onDeleteColumn={async () => {
                  if (!confirm('删除此列？')) return
                  await saveBoard({
                    ...board,
                    columns: board.columns.filter((c) => c.id !== col.id),
                  })
                }}
              />
            ))}
          </div>
          <DragOverlay>
            {activeId && getInspiration(activeId) && (
              <div className="p-3 rounded-md border bg-card shadow-lg w-72">
                <p className="text-xs font-medium">{getInspiration(activeId)!.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
