import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Home, Lightbulb, Compass, Kanban, BookOpen } from 'lucide-react'

const mobileItems = [
  { to: '/', icon: Home, label: '首页', exact: true },
  { to: '/browse', icon: Lightbulb, label: '灵感' },
  { to: '/discovery', icon: Compass, label: '发现' },
  { to: '/boards', icon: Kanban, label: '看板' },
  { to: '/diary', icon: BookOpen, label: '日记' },
]

export function MobileNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card/90 backdrop-blur-sm safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {mobileItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-0 px-3 py-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
