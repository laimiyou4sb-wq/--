import { useUIStore } from '@/stores/ui'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)
  const removeToast = useUIStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg animate-in slide-in-from-right fade-in duration-200',
            'min-w-[300px] max-w-[400px]'
          )}
        >
          {toast.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
          {toast.type === 'info' && <Info className="h-4 w-4 text-blue-500 shrink-0" />}
          <p className="text-sm flex-1">{toast.message}</p>
          <button onClick={() => removeToast(toast.id)} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
