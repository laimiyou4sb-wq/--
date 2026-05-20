import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useInspiration, useInspirations, viewInspiration, addConnection, deleteInspiration, saveInspiration } from '@/hooks/useDb'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useUIStore } from '@/stores/ui'
import {
  formatDate,
  STATUS_LABELS,
  STATUS_COLORS,
  TYPE_LABELS,
  RELATION_LABELS,
  cn,
} from '@/lib/utils'
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Pin,
  PinOff,
  Link2,
  ExternalLink,
  Lightbulb,
  Calendar,
  Clock,
  Eye,
  Tag,
  Plus,
  Network,
  ChevronRight,
  ListChecks,
} from 'lucide-react'
import type { InspirationConnection, Inspiration } from '@/types'

function ConnectionGraph({ inspiration, allInspirations }: { inspiration: Inspiration; allInspirations: Inspiration[] }) {
  // Simplified connection display - for full graph, see ConnectionGraph component
  const connectedInspirations = inspiration.connections
    .map((c) => allInspirations.find((i) => i.id === c.targetId))
    .filter(Boolean) as Inspiration[]

  if (connectedInspirations.length === 0) return null

  return (
    <div className="space-y-2">
      {inspiration.connections.map((conn) => {
        const target = allInspirations.find((i) => i.id === conn.targetId)
        if (!target) return null
        return (
          <Link
            key={conn.id}
            to={`/inspiration/${target.id}`}
            className="flex items-start gap-3 p-3 rounded-xl border hover:bg-accent hover:shadow-sm transition-all duration-200"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-200 hover:scale-110">
              <Network className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{target.title}</span>
                <Badge variant="outline" className="text-[10px] py-0 h-4">
                  {RELATION_LABELS[conn.relation]}
                </Badge>
              </div>
              {conn.note && (
                <p className="text-xs text-muted-foreground mt-0.5">{conn.note}</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        )
      })}
    </div>
  )
}

export default function InspirationDetailPage() {
  const { id } = useParams()
  const inspiration = useInspiration(id)
  const allInspirations = useInspirations()
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)

  const [showAddConnection, setShowAddConnection] = useState(false)
  const [connectionTarget, setConnectionTarget] = useState('')
  const [connectionRelation, setConnectionRelation] = useState<InspirationConnection['relation']>('related')
  const [connectionNote, setConnectionNote] = useState('')

  useEffect(() => {
    if (id) viewInspiration(id)
  }, [id])

  if (!inspiration) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  const unconnectedInspirations = allInspirations.filter(
    (i) =>
      i.id !== inspiration.id &&
      !inspiration.connections.some((c) => c.targetId === i.id)
  )

  const handleTogglePin = async () => {
    if (!inspiration) return
    try {
      await saveInspiration({ ...inspiration, isPinned: !inspiration.isPinned })
      addToast(inspiration.isPinned ? '已取消置顶' : '已置顶', 'success')
    } catch {
      addToast('操作失败，请重试', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这条灵感吗？')) return
    try {
      await deleteInspiration(inspiration.id)
      addToast('灵感已删除', 'success')
      navigate('/browse')
    } catch {
      addToast('删除失败，请重试', 'error')
    }
  }

  const handleAddConnection = async () => {
    if (!connectionTarget) return
    try {
      await addConnection(inspiration.id, connectionTarget, connectionRelation, connectionNote || undefined)
      addToast('关联已创建', 'success')
      setShowAddConnection(false)
      setConnectionTarget('')
      setConnectionNote('')
    } catch {
      addToast('添加关联失败', 'error')
    }
  }

  const handleToggleAction = async (itemId: string) => {
    if (!inspiration) return
    try {
      const updated = inspiration.actionItems.map((a) =>
        a.id === itemId ? { ...a, completed: !a.completed } : a
      )
      await saveInspiration({ ...inspiration, actionItems: updated })
    } catch {
      addToast('操作失败', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon-sm" onClick={handleTogglePin}>
          {inspiration.isPinned ? (
            <Pin className="h-4 w-4 text-primary" />
          ) : (
            <PinOff className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/capture/${inspiration.id}`)}>
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Title & Meta */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold leading-tight">{inspiration.title}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', STATUS_COLORS[inspiration.status])}>
            {STATUS_LABELS[inspiration.status]}
          </span>
          <Badge variant="outline" className="text-[10px] py-0 h-4">
            {TYPE_LABELS[inspiration.type]}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(inspiration.createdAt, 'long')}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            更新于 {formatDate(inspiration.updatedAt, 'relative')}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {inspiration.viewCount}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {inspiration.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">核心想法</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{inspiration.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Context */}
          {(inspiration.source || inspiration.context) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">上下文</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {inspiration.source && (
                  <div>
                    <span className="text-xs text-muted-foreground">来源：</span>
                    <span className="text-sm">{inspiration.source}</span>
                  </div>
                )}
                {inspiration.context && (
                  <div>
                    <span className="text-xs text-muted-foreground">背景：</span>
                    <span className="text-sm">{inspiration.context}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {inspiration.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">标签</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {inspiration.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Links */}
          {inspiration.links.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">相关资源</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {inspiration.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-all duration-200 text-sm text-primary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {link.title || link.url}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {inspiration.actionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">行动项</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {inspiration.actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 text-sm cursor-pointer select-none"
                    onClick={() => handleToggleAction(item.id)}
                  >
                    <div
                      className={cn(
                        'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                        item.completed ? 'bg-primary border-primary' : 'hover:border-primary/50'
                      )}
                    >
                      {item.completed && <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Connections */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm">关联灵感</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShowAddConnection(!showAddConnection)}
              >
                <Plus className="h-3 w-3 mr-1" />
                添加
              </Button>
            </CardHeader>
            <CardContent>
              {showAddConnection && (
                <div className="space-y-2 mb-3 p-3 rounded-xl bg-muted/50">
                  <Select value={connectionTarget} onValueChange={setConnectionTarget}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="选择关联灵感..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unconnectedInspirations.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={connectionRelation}
                    onValueChange={(v) => setConnectionRelation(v as any)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="related">相关</SelectItem>
                      <SelectItem value="inspired">启发</SelectItem>
                      <SelectItem value="derived">派生</SelectItem>
                      <SelectItem value="contradicts">矛盾</SelectItem>
                      <SelectItem value="supports">支撑</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="备注（可选）"
                    value={connectionNote}
                    onChange={(e) => setConnectionNote(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddConnection} className="text-xs h-7">
                      确认
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddConnection(false)}
                      className="text-xs h-7"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}
              <ConnectionGraph inspiration={inspiration} allInspirations={allInspirations} />
              {inspiration.connections.length === 0 && !showAddConnection && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  暂无关联灵感，点击"添加"建立关联
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
