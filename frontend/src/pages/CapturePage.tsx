import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useInspiration, saveInspiration, deleteInspiration } from '@/hooks/useDb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@radix-ui/react-label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TagSelect } from '@/components/inspiration/TagSelect'
import { useUIStore } from '@/stores/ui'
import { generateId } from '@/lib/utils'
import type { InspirationType, InspirationStatus, InspirationLink, ActionItem, InspirationConnection } from '@/types'
import { Plus, Trash2, ArrowLeft, Link2, ListChecks, Save } from 'lucide-react'
import { RELATION_LABELS } from '@/lib/utils'

export default function CapturePage() {
  const { id } = useParams()
  const existing = useInspiration(id)
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<InspirationType>('seed')
  const [status, setStatus] = useState<InspirationStatus>('thinking')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('')
  const [context, setContext] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [links, setLinks] = useState<InspirationLink[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newActionItem, setNewActionItem] = useState('')

  useEffect(() => {
    if (existing) {
      setTitle(existing.title)
      setType(existing.type)
      setStatus(existing.status)
      setDescription(existing.description || '')
      setSource(existing.source || '')
      setContext(existing.context || '')
      setTags(existing.tags)
      setLinks(existing.links)
      setActionItems(existing.actionItems)
    }
  }, [existing])

  const handleSave = async () => {
    if (!title.trim()) return
    try {
      await saveInspiration({
        id: existing?.id,
        title: title.trim(),
        type,
        status,
        description: description.trim() || undefined,
        source: source.trim() || undefined,
        context: context.trim() || undefined,
        tags,
        links,
        actionItems,
        connections: existing?.connections,
        createdAt: existing?.createdAt,
        isPinned: existing?.isPinned,
      })
      addToast(existing ? '灵感已更新' : '灵感已创建', 'success')
      navigate(-1)
    } catch {
      addToast('保存失败，请重试', 'error')
    }
  }

  const handleDelete = async () => {
    if (!existing?.id) return
    if (!confirm('确定要删除这条灵感吗？')) return
    try {
      await deleteInspiration(existing.id)
      addToast('灵感已删除', 'success')
      navigate('/browse')
    } catch {
      addToast('删除失败，请重试', 'error')
    }
  }

  const addLink = () => {
    if (!newLinkUrl.trim()) return
    setLinks([...links, { url: newLinkUrl.trim(), title: newLinkTitle.trim() || undefined }])
    setNewLinkUrl('')
    setNewLinkTitle('')
  }

  const addAction = () => {
    if (!newActionItem.trim()) return
    setActionItems([...actionItems, { id: generateId(), text: newActionItem.trim(), completed: false }])
    setNewActionItem('')
  }

  const toggleAction = (id: string) => {
    setActionItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">{existing ? '编辑灵感' : '新建灵感'}</h1>
      </div>

      {/* Core fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">核心信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">标题 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="这个灵感的标题..."
              className="text-sm"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">类型</Label>
              <Select value={type} onValueChange={(v) => setType(v as InspirationType)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seed">种子（一句话想法）</SelectItem>
                  <SelectItem value="mature">成熟（详细展开）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">状态</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as InspirationStatus)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thinking">待思考</SelectItem>
                  <SelectItem value="developing">正在发展</SelectItem>
                  <SelectItem value="applied">已应用</SelectItem>
                  <SelectItem value="archived">已归档</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">描述</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="展开描述这个灵感..."
              rows={4}
              className="text-sm resize-none"
            />
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">标签</Label>
            <TagSelect tags={tags} onChange={setTags} />
          </div>
        </CardContent>
      </Card>

      {/* Context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">上下文</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">来源</Label>
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="这个想法来自哪里？"
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">背景</Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="什么情境下产生的这个想法？"
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">相关链接</CardTitle>
          <Link2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
              <span className="flex-1 truncate">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {link.title || link.url}
                </a>
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              placeholder="URL"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              className="h-7 text-xs flex-1"
            />
            <Input
              placeholder="标题（可选）"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              className="h-7 text-xs w-28"
            />
            <Button variant="outline" size="sm" onClick={addLink} className="text-xs h-7">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">行动项</CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {actionItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => toggleAction(item.id)}
                className="h-4 w-4 rounded border-input"
              />
              <span className={item.completed ? 'line-through text-muted-foreground flex-1' : 'flex-1'}>
                {item.text}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setActionItems((prev) => prev.filter((a) => a.id !== item.id))}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              placeholder="添加行动项..."
              value={newActionItem}
              onChange={(e) => setNewActionItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAction()}
              className="h-8 text-sm"
            />
            <Button variant="outline" size="sm" onClick={addAction} className="text-xs">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-between">
        <div>
          {existing && (
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive text-xs">
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              删除灵感
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="text-xs">
            取消
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!title.trim()} className="text-xs gap-1">
            <Save className="h-3.5 w-3.5" />
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}
