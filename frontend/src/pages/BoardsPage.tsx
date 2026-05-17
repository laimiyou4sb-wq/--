import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoards, saveBoard, deleteBoard } from '@/hooks/useDb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { useUIStore } from '@/stores/ui'
import { Kanban, Plus, Trash2, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export default function BoardsPage() {
  const boards = useBoards()
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    const board = await saveBoard({ title: newTitle.trim() })
    addToast('看板已创建', 'success')
    setShowCreate(false)
    setNewTitle('')
    navigate(`/boards/${board.id}`)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定要删除这个看板吗？')) return
    await deleteBoard(id)
    addToast('看板已删除', 'success')
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boards.map((board) => (
            <Card
              key={board.id}
              className="cursor-pointer hover:shadow-md transition-all group"
              onClick={() => navigate(`/boards/${board.id}`)}
            >
              <CardHeader className="flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-sm">{board.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {board.columns.length} 列 · {board.columns.reduce((s, c) => s + c.inspirationIds.length, 0)} 张卡片
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDelete(board.id, e)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>更新于 {formatDate(board.updatedAt, 'relative')}</span>
                  <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
