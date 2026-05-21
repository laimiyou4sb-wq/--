import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useUIStore } from '@/stores/ui'

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      theme: 'system',
      resolvedTheme: 'light',
      sidebarOpen: true,
      commandPaletteOpen: false,
      quickCaptureOpen: false,
      toasts: [],
      searchQuery: '',
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('主题', () => {
    it('默认 theme 为 system', () => {
      expect(useUIStore.getState().theme).toBe('system')
    })

    it('setTheme 切换主题', () => {
      useUIStore.getState().setTheme('dark')
      expect(useUIStore.getState().theme).toBe('dark')
    })

    it('setResolvedTheme 设置实际主题', () => {
      useUIStore.getState().setResolvedTheme('dark')
      expect(useUIStore.getState().resolvedTheme).toBe('dark')
    })
  })

  describe('侧边栏', () => {
    it('默认展开', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true)
    })

    it('toggleSidebar 切换', () => {
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().sidebarOpen).toBe(false)
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().sidebarOpen).toBe(true)
    })

    it('setSidebarOpen 设置', () => {
      useUIStore.getState().setSidebarOpen(false)
      expect(useUIStore.getState().sidebarOpen).toBe(false)
    })
  })

  describe('命令面板', () => {
    it('默认关闭', () => {
      expect(useUIStore.getState().commandPaletteOpen).toBe(false)
    })

    it('setCommandPaletteOpen 打开', () => {
      useUIStore.getState().setCommandPaletteOpen(true)
      expect(useUIStore.getState().commandPaletteOpen).toBe(true)
    })
  })

  describe('快速捕捉', () => {
    it('默认关闭', () => {
      expect(useUIStore.getState().quickCaptureOpen).toBe(false)
    })

    it('setQuickCaptureOpen 打开', () => {
      useUIStore.getState().setQuickCaptureOpen(true)
      expect(useUIStore.getState().quickCaptureOpen).toBe(true)
    })
  })

  describe('Toast', () => {
    it('addToast 添加消息', () => {
      useUIStore.getState().addToast('操作成功', 'success')
      const toasts = useUIStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('操作成功')
      expect(toasts[0].type).toBe('success')
    })

    it('addToast 默认 type 为 info', () => {
      useUIStore.getState().addToast('提示信息')
      expect(useUIStore.getState().toasts[0].type).toBe('info')
    })

    it('removeToast 移除指定消息', () => {
      useUIStore.getState().addToast('消息1')
      useUIStore.getState().addToast('消息2')
      const id = useUIStore.getState().toasts[0].id
      useUIStore.getState().removeToast(id)
      expect(useUIStore.getState().toasts).toHaveLength(1)
    })

    it('Toast 4.5 秒后自动移除', () => {
      useUIStore.getState().addToast('自动消失')
      expect(useUIStore.getState().toasts).toHaveLength(1)

      vi.advanceTimersByTime(4500)

      expect(useUIStore.getState().toasts).toHaveLength(0)
    })
  })

  describe('搜索', () => {
    it('默认 searchQuery 为空', () => {
      expect(useUIStore.getState().searchQuery).toBe('')
    })

    it('setSearchQuery 设置搜索词', () => {
      useUIStore.getState().setSearchQuery('灵感')
      expect(useUIStore.getState().searchQuery).toBe('灵感')
    })
  })
})
