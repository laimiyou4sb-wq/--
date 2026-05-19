import { useEffect } from 'react'

type ShortcutHandler = (e: KeyboardEvent) => void

export function useKeyboardShortcut(
  key: string,
  handler: ShortcutHandler,
  options?: { ctrl?: boolean; meta?: boolean; shift?: boolean; enabled?: boolean }
) {
  const { ctrl = true, meta = true, shift = false, enabled = true } = options || {}

  useEffect(() => {
    if (!enabled) return

    const listener = (e: KeyboardEvent) => {
      const isModifierPressed = (meta && e.metaKey) || (ctrl && e.ctrlKey)
      const isShiftCorrect = (shift === e.shiftKey)

      if (isModifierPressed && isShiftCorrect && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault()
        handler(e)
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [key, handler, ctrl, meta, shift, enabled])
}
