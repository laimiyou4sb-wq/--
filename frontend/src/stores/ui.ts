import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark'
  setResolvedTheme: (theme: 'light' | 'dark') => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  quickCaptureOpen: boolean
  setQuickCaptureOpen: (open: boolean) => void
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
  resolvedTheme: 'light',
  setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  quickCaptureOpen: false,
  setQuickCaptureOpen: (quickCaptureOpen) => set({ quickCaptureOpen }),
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4500)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}))
