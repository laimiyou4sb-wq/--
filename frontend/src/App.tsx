import { createHashRouter, Outlet } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { useUIStore } from '@/stores/ui'
import { TooltipProvider } from '@/components/ui/tooltip'
import { initSeedData } from '@/hooks/useDb'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { useSettings } from '@/hooks/useDb'

// Lazy load pages
const HomePage = lazy(() => import('@/pages/HomePage'))
const BrowsePage = lazy(() => import('@/pages/BrowsePage'))
const CapturePage = lazy(() => import('@/pages/CapturePage'))
const InspirationDetailPage = lazy(() => import('@/pages/InspirationDetailPage'))
const DiscoveryPage = lazy(() => import('@/pages/DiscoveryPage'))
const BoardsPage = lazy(() => import('@/pages/BoardsPage'))
const BoardDetailPage = lazy(() => import('@/pages/BoardDetailPage'))
const DiaryPage = lazy(() => import('@/pages/DiaryPage'))
const SearchPage = lazy(() => import('@/pages/SearchPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

// Layout components
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { QuickCapture } from '@/components/inspiration/QuickCapture'
import { CommandPalette } from '@/components/inspiration/CommandPalette'
import { ToastContainer } from '@/components/ui/toast'

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppShell() {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const setQuickCaptureOpen = useUIStore((s) => s.setQuickCaptureOpen)
  const theme = useUIStore((s) => s.theme)
  const setResolvedTheme = useUIStore((s) => s.setResolvedTheme)
  const settings = useSettings()

  // Initialize seed data on first load
  useEffect(() => {
    initSeedData()
  }, [])

  // Theme handling
  useEffect(() => {
    const root = document.documentElement
    let resolved: 'light' | 'dark' = 'light'

    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      const listener = (e: MediaQueryListEvent) => {
        const newResolved = e.matches ? 'dark' : 'light'
        setResolvedTheme(newResolved)
        root.classList.toggle('dark', newResolved === 'dark')
      }
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', listener)
      root.classList.toggle('dark', resolved === 'dark')
      setResolvedTheme(resolved)
      return () => mq.removeEventListener('change', listener)
    } else {
      resolved = theme
      root.classList.toggle('dark', resolved === 'dark')
      setResolvedTheme(resolved)
    }
  }, [theme, setResolvedTheme])

  // Resync theme from settings
  useEffect(() => {
    if (settings?.theme && settings.theme !== theme) {
      useUIStore.getState().setTheme(settings.theme)
    }
  }, [settings])

  // Global keyboard shortcuts
  useKeyboardShortcut('k', () => setCommandPaletteOpen(true))
  useKeyboardShortcut('n', () => setQuickCaptureOpen(true))

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
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

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'browse', element: <BrowsePage /> },
      { path: 'capture', element: <CapturePage /> },
      { path: 'capture/:id', element: <CapturePage /> },
      { path: 'inspiration/:id', element: <InspirationDetailPage /> },
      { path: 'discovery', element: <DiscoveryPage /> },
      { path: 'boards', element: <BoardsPage /> },
      { path: 'boards/:id', element: <BoardDetailPage /> },
      { path: 'diary', element: <DiaryPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
