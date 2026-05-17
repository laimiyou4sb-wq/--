import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'
import { QuickCapture } from '@/components/inspiration/QuickCapture'
import { CommandPalette } from '@/components/inspiration/CommandPalette'
import { ToastContainer } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppShell() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <Outlet />
          </main>
        </div>
        <MobileNav />
        <QuickCapture />
        <CommandPalette />
        <ToastContainer />
      </div>
    </TooltipProvider>
  )
}
