import { NavLink, useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/ui'
import { cn } from '@/lib/utils'
import {
  Lightbulb,
  Compass,
  Kanban,
  BookOpen,
  Search,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Home,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
  { to: '/', icon: Home, label: '仪表盘', exact: true },
  { to: '/browse', icon: Lightbulb, label: '灵感库' },
  { to: '/discovery', icon: Compass, label: '发现' },
  { to: '/boards', icon: Kanban, label: '看板' },
  { to: '/diary', icon: BookOpen, label: '日记' },
]

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setQuickCaptureOpen = useUIStore((s) => s.setQuickCaptureOpen)
  const location = useLocation()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-card/50 backdrop-blur-sm transition-all duration-200',
        sidebarOpen ? 'w-56' : 'w-16'
      )}
    >
      <div className="flex h-14 items-center justify-between px-3 border-b">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center transition-transform duration-200 hover:scale-110">
              <Lightbulb className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight">灵感知识库</span>
          </div>
        )}
        {!sidebarOpen && (
          <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center transition-transform duration-200 hover:scale-110 mx-auto">
            <Lightbulb className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
        {sidebarOpen && (
          <Button variant="ghost" size="icon-sm" onClick={toggleSidebar}>
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!sidebarOpen && (
        <Button variant="ghost" size="icon" className="mx-auto mt-3" onClick={toggleSidebar}>
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      )}

      <div className="flex-1 flex flex-col gap-1 p-2">
        {sidebarOpen && (
          <Button
            className="mx-2 mb-2 gap-2 justify-start"
            size="sm"
            onClick={() => setQuickCaptureOpen(true)}
          >
            <Plus className="h-4 w-4" />
            快速捕捉
          </Button>
        )}
        {!sidebarOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="mx-auto mb-2"
                size="icon"
                variant="default"
                onClick={() => setQuickCaptureOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">快速捕捉 Cmd+K</TooltipContent>
          </Tooltip>
        )}

        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)

          const link = (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                !sidebarOpen && 'justify-center px-0'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          )

          if (!sidebarOpen) {
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }
          return link
        })}
      </div>

      <div className="p-2 border-t">
        <NavLink
          to="/search"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
            location.pathname === '/search' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
            !sidebarOpen && 'justify-center px-0'
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          {sidebarOpen && <span>搜索</span>}
        </NavLink>
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
            location.pathname === '/settings' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
            !sidebarOpen && 'justify-center px-0'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {sidebarOpen && <span>设置</span>}
        </NavLink>
      </div>
    </aside>
  )
}
