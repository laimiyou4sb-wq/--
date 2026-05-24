import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoardsSorted, saveBoard, deleteBoard } from '@/hooks/useDb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { useUIStore } from '@/stores/ui'
import { Kanban, Plus, Trash2, GripVertical } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Board } from '@/types'

function SortableBoardCard({
  board,
  onRename,
  onDelete,
  onClick,
}: {
  board: Board
  onRename: (id: string, title: string) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onClick: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(board.title)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSaveRename = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== board.title) {
      onRename(board.id, trimmed)
    } else {
      setEditTitle(board.title)
    }
    setEditing(false)
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <Card
        className="cursor-pointer hover:shadow-md transition-all group"
        onClick={() => !editing && onClick(board.id)}
      >
        <CardHeader className="flex-row items-start justify-between pb-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div
              className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground/70 flex-shrink-0"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </div>
            {editing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename()
                  if (e.key === 'Escape') {
                    setEditTitle(board.title)
                    setEditing(false)
                  }
                }}
                className="h-6 text-sm flex-1 min-w-0"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <CardTitle
                className="text-sm truncate hover:text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditTitle(board.title)
                  setEditing(true)
                }}
              >
                {board.title}
              </CardTitle>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1"
            onClick={(e) => onDelete(board.id, e)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            {board.columns.length} 列 · {board.columns.reduce((s, c) => s + c.inspirationIds.length, 0)} 张卡片
            <span className="ml-2">更新于 {formatDate(board.updatedAt, 'relative')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BoardsPage() {
  const boards = useBoardsSorted()
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    try {
      const maxOrder = boards.reduce((max, b) => Math.max(max, b.order ?? 0), 0)
      const board = await saveBoard({ title: newTitle.trim(), order: maxOrder + 1 })
      addToast('看板已创建', 'success')
      setShowCreate(false)
      setNewTitle('')
      navigate(`/boards/${board.id}`)
    } catch {
      addToast('创建看板失败，请重试', 'error')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定要删除这个看板吗？')) return
    try {
      await deleteBoard(id)
      addToast('看板已删除', 'success')
    } catch {
      addToast('删除看板失败，请重试', 'error')
    }
  }

  const handleRename = async (id: string, title: string) => {
    const board = boards.find((b) => b.id === id)
    if (!board) return
    try {
      await saveBoard({ ...board, title })
    } catch {
      addToast('重命名失败', 'error')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = boards.findIndex((b) => b.id === active.id)
    const newIndex = boards.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...boards]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    try {
      await Promise.all(
        reordered.map((b, i) => saveBoard({ ...b, order: i }))
      )
    } catch {
      addToast('排序失败', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">看板</h1>
          <p className="text-sm text-muted-foreground mt-1">{boards.length} 个看板</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          新建看板
        </Button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-16">
          <Kanban className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-4">还没有看板</p>
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            创建第一个看板
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={boards.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boards.map((board) => (
                <SortableBoardCard
                  key={board.id}
                  board={board}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onClick={(id) => navigate(`/boards/${id}`)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>新建看板</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="看板名称..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!newTitle.trim()}>
                创建
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
