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
        'p-3 rounded-xl border bg-card shadow-sm cursor-grab active:cursor-grabbing active:scale-[0.98] hover:shadow-md transition-all duration-200',
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
  isAddingCard: boolean
  newCardTitle: string
  onNewCardTitleChange: (v: string) => void
  onAddCard: () => void
  onStartAddCard: () => void
  onDeleteColumn: () => void
}

function Column({ column, inspirations, isAddingCard, newCardTitle, onNewCardTitleChange, onAddCard, onStartAddCard, onDeleteColumn }: ColumnProps) {
  return (
    <div className="flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-xl">
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{column.title}</h3>
          <Badge variant="secondary" className="text-[10px] py-0 h-4">
            {inspirations.length}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" onClick={onStartAddCard}>
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
        {inspirations.length === 0 && !isAddingCard && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">拖拽卡片到这里</p>
          </div>
        )}
        {isAddingCard && (
          <div className="flex gap-1.5 p-2 rounded-lg bg-background border">
            <Input
              value={newCardTitle}
              onChange={(e) => onNewCardTitleChange(e.target.value)}
              placeholder="卡片标题..."
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && onAddCard()}
            />
            <Button size="sm" onClick={onAddCard} className="h-7 text-xs">添加</Button>
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

  // Inline editing state — replaces prompt()
  const [showNewColumn, setShowNewColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [addingToColumnId, setAddingToColumnId] = useState<string | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')

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

    const sourceCol = board.columns.find((c) => c.inspirationIds.includes(activeId))
    if (!sourceCol) return

    const targetCol = board.columns.find((c) => c.inspirationIds.includes(overId))

    const newColumns = board.columns.map((col) => {
      if (sourceCol.id === col.id && targetCol && targetCol.id === col.id) {
        // Same column reorder
        const ids = [...col.inspirationIds]
        const fromIdx = ids.indexOf(activeId)
        const toIdx = ids.indexOf(overId)
        ids.splice(fromIdx, 1)
        ids.splice(toIdx, 0, activeId)
        return { ...col, inspirationIds: ids }
      }
      if (col.id === sourceCol.id) {
        return { ...col, inspirationIds: col.inspirationIds.filter((i) => i !== activeId) }
      }
      if (targetCol && col.id === targetCol.id) {
        const ids = [...col.inspirationIds]
        const toIdx = ids.indexOf(overId)
        ids.splice(toIdx, 0, activeId)
        return { ...col, inspirationIds: ids }
      }
      return col
    })

    try {
      await saveBoard({ ...board, columns: newColumns })
    } catch {
      addToast('移动失败，请重试', 'error')
    }
  }

  const handleAddColumn = async () => {
    const title = newColumnTitle.trim()
    if (!title) return
    try {
      const newCol = { id: generateId(), title, inspirationIds: [] }
      await saveBoard({ ...board, columns: [...board.columns, newCol] })
      addToast('列已添加', 'success')
      setNewColumnTitle('')
      setShowNewColumn(false)
    } catch {
      addToast('添加列失败', 'error')
    }
  }

  const handleAddCardToColumn = async (columnId: string) => {
    const title = newCardTitle.trim()
    if (!title) return
    try {
      const { saveInspiration } = await import('@/hooks/useDb')
      const insp = await saveInspiration({ title, type: 'seed', status: 'thinking' })
      const updatedColumns = board.columns.map((col) =>
        col.id === columnId ? { ...col, inspirationIds: [...col.inspirationIds, insp.id] } : col
      )
      await saveBoard({ ...board, columns: updatedColumns })
      addToast('卡片已添加', 'success')
      setNewCardTitle('')
      setAddingToColumnId(null)
    } catch {
      addToast('添加卡片失败', 'error')
    }
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
                isAddingCard={addingToColumnId === col.id}
                newCardTitle={addingToColumnId === col.id ? newCardTitle : ''}
                onNewCardTitleChange={(v) => setNewCardTitle(v)}
                onAddCard={() => handleAddCardToColumn(col.id)}
                onStartAddCard={() => {
                  setAddingToColumnId(col.id)
                  setNewCardTitle('')
                }}
                onDeleteColumn={async () => {
                  if (!confirm('删除此列？')) return
                  try {
                    await saveBoard({
                      ...board,
                      columns: board.columns.filter((c) => c.id !== col.id),
                    })
                  } catch {
                    addToast('删除列失败', 'error')
                  }
                }}
              />
            ))}
            {/* Add column inline */}
            {showNewColumn ? (
              <div className="flex-shrink-0 w-72 flex gap-1.5 p-3 bg-muted/30 rounded-xl">
                <Input
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="列名称..."
                  className="h-7 text-xs"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                />
                <Button size="sm" onClick={handleAddColumn} className="h-7 text-xs">添加</Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowNewColumn(false); setNewColumnTitle('') }} className="h-7 text-xs">取消</Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewColumn(true)}
                className="flex-shrink-0 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                添加列
              </Button>
            )}
          </div>
          <DragOverlay>
            {activeId && getInspiration(activeId) && (
              <div className="p-3 rounded-xl border bg-card shadow-lg w-72">
                <p className="text-xs font-medium">{getInspiration(activeId)!.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
