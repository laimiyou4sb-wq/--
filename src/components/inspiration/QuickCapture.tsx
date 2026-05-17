import { useState, useRef, useEffect } from 'react'
import { useUIStore } from '@/stores/ui'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { saveInspiration } from '@/hooks/useDb'
import { Lightbulb, Tag, Sparkles } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils'

export function QuickCapture() {
  const open = useUIStore((s) => s.quickCaptureOpen)
  const setOpen = useUIStore((s) => s.setQuickCaptureOpen)
  const addToast = useUIStore((s) => s.addToast)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setTitle('')
      setDescription('')
      setTags('')
      setExpanded(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const tagList = tags
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
    await saveInspiration({
      title: title.trim(),
      description: description.trim() || undefined,
      tags: tagList,
      type: description.trim() ? 'mature' : 'seed',
      status: 'thinking',
    })
    addToast('灵感已捕捉', 'success')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0">
        <VisuallyHidden>
          <DialogTitle>快速捕捉灵感</DialogTitle>
        </VisuallyHidden>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 px-4 pt-4 pb-2 border-b">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <Input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="一闪而过的想法..."
              className="border-0 shadow-none text-base px-0 h-auto py-1 focus-visible:ring-0"
            />
          </div>

          {expanded && (
            <div className="px-4 py-3 space-y-3 animate-fade-in">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="展开说说..."
                rows={3}
                className="resize-none text-sm"
              />
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="标签，用逗号分隔"
                  className="h-7 text-xs border-0 shadow-none px-0 focus-visible:ring-0"
                />
              </div>
            </div>
          )}

          <div
            className={cn(
              'flex items-center gap-2 px-4 py-3',
              expanded ? 'border-t' : ''
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '收起' : '展开详情'}
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              取消
            </Button>
            <Button type="submit" size="sm" disabled={!title.trim()} className="text-xs">
              保存
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
