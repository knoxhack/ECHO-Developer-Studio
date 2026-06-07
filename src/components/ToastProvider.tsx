import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
}

interface ToastContextType {
  addToast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-echo-success" />,
    warning: <AlertTriangle className="w-4 h-4 text-echo-warning" />,
    error: <X className="w-4 h-4 text-echo-danger" />,
    info: <Info className="w-4 h-4 text-echo-accent" />,
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[70] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[280px] animate-in slide-in-from-right ${
              toast.type === 'success' ? 'bg-echo-surface border-echo-success/30' :
              toast.type === 'warning' ? 'bg-echo-surface border-echo-warning/30' :
              toast.type === 'error' ? 'bg-echo-surface border-echo-danger/30' :
              'bg-echo-surface border-echo-accent/30'
            }`}
          >
            {icons[toast.type]}
            <span className="text-sm text-echo-text flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-echo-elevated rounded">
              <X className="w-3.5 h-3.5 text-echo-muted" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
