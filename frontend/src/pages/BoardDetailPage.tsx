import { useParams, useNavigate } from 'react-router-dom'
import { useBoard, useInspirations, saveBoard, saveInspiration } from '@/hooks/useDb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useUIStore } from '@/stores/ui'
import { ArrowLeft, Plus } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useDroppable,
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
import { cn, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import type { Inspiration, InspirationStatus } from '@/types'

const FIXED_COLUMNS: InspirationStatus[] = ['developing', 'thinking', 'applied', 'archived']

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

function Column({
  status,
  inspirations,
  isAddingCard,
  newCardTitle,
  onNewCardTitleChange,
  onAddCard,
  onStartAddCard,
}: {
  status: InspirationStatus
  inspirations: Inspiration[]
  isAddingCard: boolean
  newCardTitle: string
  onNewCardTitleChange: (v: string) => void
  onAddCard: () => void
  onStartAddCard: () => void
}) {
  const { setNodeRef } = useDroppable({ id: `col-${status}` })

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-xl">
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{STATUS_LABELS[status]}</h3>
          <Badge variant="secondary" className="text-[10px] py-0 h-4">
            {inspirations.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onStartAddCard}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[100px]">
        <SortableContext items={inspirations.map((i) => i.id)} strategy={verticalListSortingStrategy}>
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
  const [addingToStatus, setAddingToStatus] = useState<InspirationStatus | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  const boardInspirationIds = new Set<string>()
  board.columns.forEach((col) => col.inspirationIds.forEach((id) => boardInspirationIds.add(id)))

  const getInspiration = (inspId: string) => allInspirations.find((i) => i.id === inspId)

  const getTargetStatus = (overId: string): InspirationStatus | null => {
    const colMatch = overId.match(/^col-(.+)$/)
    if (colMatch) return colMatch[1] as InspirationStatus
    const overInsp = getInspiration(overId)
    return overInsp?.status || null
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const targetStatus = getTargetStatus(over.id as string)
    if (!targetStatus) return

    const activeInsp = getInspiration(active.id as string)
    if (!activeInsp || activeInsp.status === targetStatus) return

    try {
      await saveInspiration({ ...activeInsp, status: targetStatus })
    } catch {
      addToast('移动失败，请重试', 'error')
    }
  }

  const handleAddCard = async (status: InspirationStatus) => {
    const title = newCardTitle.trim()
    if (!title) return
    try {
      const insp = await saveInspiration({ title, type: 'seed', status })
      const colId = `col-${status}`
      const newColumns = board.columns.map((col) =>
        col.id === colId
          ? { ...col, inspirationIds: [...col.inspirationIds, insp.id] }
          : col
      )
      if (!newColumns.some((col) => col.id === colId)) {
        newColumns.push({ id: colId, title: STATUS_LABELS[status], inspirationIds: [insp.id] })
      }
      await saveBoard({ ...board, columns: newColumns })
      addToast('卡片已添加', 'success')
      setNewCardTitle('')
      setAddingToStatus(null)
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
            {FIXED_COLUMNS.map((status) => {
              const colInspirations = allInspirations.filter(
                (i) => boardInspirationIds.has(i.id) && i.status === status
              )
              return (
                <Column
                  key={status}
                  status={status}
                  inspirations={colInspirations}
                  isAddingCard={addingToStatus === status}
                  newCardTitle={addingToStatus === status ? newCardTitle : ''}
                  onNewCardTitleChange={(v) => setNewCardTitle(v)}
                  onAddCard={() => handleAddCard(status)}
                  onStartAddCard={() => {
                    setAddingToStatus(status)
                    setNewCardTitle('')
                  }}
                />
              )
            })}
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
