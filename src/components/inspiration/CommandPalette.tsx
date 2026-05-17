import { useUIStore } from '@/stores/ui'
import { useNavigate } from 'react-router-dom'
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command'
import { useInspirations } from '@/hooks/useDb'
import { saveInspiration } from '@/hooks/useDb'
import {
  Plus,
  Compass,
  Kanban,
  Search,
  Lightbulb,
  Home,
  BookOpen,
  Settings,
} from 'lucide-react'
import { useState, useCallback } from 'react'

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen)
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const addToast = useUIStore((s) => s.addToast)
  const setQuickCaptureOpen = useUIStore((s) => s.setQuickCaptureOpen)
  const navigate = useNavigate()
  const inspirations = useInspirations()
  const [query, setQuery] = useState('')

  const handleSelect = useCallback(
    (value: string) => {
      setOpen(false)
      if (value === 'quick-capture') {
        setQuickCaptureOpen(true)
      } else if (value.startsWith('nav:')) {
        navigate(value.replace('nav:', ''))
      } else if (value.startsWith('inspiration:')) {
        navigate(`/inspiration/${value.replace('inspiration:', '')}`)
      } else if (value === 'new-inspiration') {
        navigate('/capture')
      } else if (value.startsWith('fast:') && query.trim()) {
        const title = query.trim()
        saveInspiration({ title, type: 'seed', status: 'thinking' }).then(() => {
          addToast(`已保存灵感: ${title}`, 'success')
        })
        setQuery('')
      }
    },
    [setOpen, setQuickCaptureOpen, navigate, addToast, query]
  )

  const filteredInspirations = inspirations
    .filter((i) => i.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5)

  return (
    <Command open={open} onOpenChange={setOpen} onSelect={handleSelect}>
      <CommandInput
        placeholder="输入命令或搜索..."
        value={query}
        onChange={(e: any) => setQuery(e.target.value)}
      />
      <CommandList>
        {query && (
          <CommandGroup heading="快速操作">
            <CommandItem value={`fast:${query}`}>
              <Plus className="mr-2 h-4 w-4" />
              快速创建灵感: "{query}"
            </CommandItem>
          </CommandGroup>
        )}
        <CommandGroup heading="导航">
          <CommandItem value="nav:/">
            <Home className="mr-2 h-4 w-4" />
            仪表盘
          </CommandItem>
          <CommandItem value="nav:/browse">
            <Lightbulb className="mr-2 h-4 w-4" />
            灵感库
          </CommandItem>
          <CommandItem value="nav:/discovery">
            <Compass className="mr-2 h-4 w-4" />
            发现
          </CommandItem>
          <CommandItem value="nav:/boards">
            <Kanban className="mr-2 h-4 w-4" />
            看板
          </CommandItem>
          <CommandItem value="nav:/diary">
            <BookOpen className="mr-2 h-4 w-4" />
            灵感日记
          </CommandItem>
          <CommandItem value="nav:/search">
            <Search className="mr-2 h-4 w-4" />
            搜索
          </CommandItem>
          <CommandItem value="nav:/settings">
            <Settings className="mr-2 h-4 w-4" />
            设置
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="动作">
          <CommandItem value="quick-capture">
            <Plus className="mr-2 h-4 w-4" />
            快速捕捉灵感
          </CommandItem>
          <CommandItem value="new-inspiration">
            <Plus className="mr-2 h-4 w-4" />
            新建完整灵感
          </CommandItem>
        </CommandGroup>
        {filteredInspirations.length > 0 && (
          <CommandGroup heading="灵感">
            {filteredInspirations.map((insp) => (
              <CommandItem key={insp.id} value={`inspiration:${insp.id}`}>
                <Lightbulb className="mr-2 h-4 w-4" />
                {insp.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {query && filteredInspirations.length === 0 && (
          <CommandEmpty>无匹配结果</CommandEmpty>
        )}
      </CommandList>
    </Command>
  )
}
