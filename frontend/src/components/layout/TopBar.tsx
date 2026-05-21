import { useUIStore } from '@/stores/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Menu,
  Search,
  Moon,
  Sun,
  Command,
  Plus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const setQuickCaptureOpen = useUIStore((s) => s.setQuickCaptureOpen)
  const resolvedTheme = useUIStore((s) => s.resolvedTheme)
  const setTheme = useUIStore((s) => s.setTheme)
  const searchQuery = useUIStore((s) => s.searchQuery)
  const setSearchQuery = useUIStore((s) => s.setSearchQuery)
  const navigate = useNavigate()
  const [showSearch, setShowSearch] = useState(false)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
    }
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 gap-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={toggleSidebar}>
          <Menu className="h-4 w-4" />
        </Button>
        <div className="md:hidden flex items-center gap-2">
          <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center transition-transform duration-200 hover:scale-110">
            <svg className="h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-sm">灵感知识库</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto hidden sm:block">
        {showSearch ? (
          <form onSubmit={handleSearchSubmit}>
            <Input
              autoFocus
              placeholder="搜索灵感..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => !searchQuery && setShowSearch(false)}
              className="h-8 text-sm"
            />
          </form>
        ) : (
          <div
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 h-8 rounded-md border border-input bg-transparent px-3 text-sm text-muted-foreground cursor-pointer hover:bg-accent transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1">搜索或快捷操作...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => { setSearchQuery(''); setShowSearch(!showSearch); }} className="sm:hidden">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button size="sm" className="gap-1 ml-1 hidden sm:inline-flex" onClick={() => setQuickCaptureOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          快速捕捉
        </Button>
      </div>
    </header>
  )
}
