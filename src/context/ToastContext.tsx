import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Standalone global trigger (can be called from anywhere)
export const toast = {
  success: (message: string, duration = 3500) => {
    window.dispatchEvent(
      new CustomEvent('lisdt-toast-event', {
        detail: { message, type: 'success', duration },
      })
    )
  },
  error: (message: string, duration = 4000) => {
    window.dispatchEvent(
      new CustomEvent('lisdt-toast-event', {
        detail: { message, type: 'error', duration },
      })
    )
  },
  info: (message: string, duration = 3500) => {
    window.dispatchEvent(
      new CustomEvent('lisdt-toast-event', {
        detail: { message, type: 'info', duration },
      })
    )
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      const newToast: ToastItem = { id, message, type, duration }

      setToasts((prev) => {
        const updated = [...prev, newToast]
        return updated.slice(-3)
      })

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const success = useCallback(
    (message: string, duration = 3500) => showToast(message, 'success', duration),
    [showToast]
  )

  const error = useCallback(
    (message: string, duration = 4000) => showToast(message, 'error', duration),
    [showToast]
  )

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const custom = e as CustomEvent<{ message: string; type?: ToastType; duration?: number }>
      if (custom.detail) {
        showToast(custom.detail.message, custom.detail.type ?? 'info', custom.detail.duration)
      }
    }

    window.addEventListener('lisdt-toast-event', handleToastEvent)
    return () => {
      window.removeEventListener('lisdt-toast-event', handleToastEvent)
    }
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, removeToast }}>
      {children}

      {/* Top Middle Toast Notification Container */}
      <div
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2.5 pointer-events-none w-max max-w-[92vw] select-none"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="alert"
            onClick={() => removeToast(item.id)}
            title="Click to dismiss"
            className={`pointer-events-auto cursor-pointer px-3.5 py-2.5 font-mono text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md animate-toast-in transition-all duration-200 border ${
              item.type === 'error'
                ? 'bg-red-950/60 border-red-900/80 text-red-400'
                : item.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-900/80 text-emerald-400'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
            }`}
          >
            <span className="font-bold shrink-0 text-sm leading-none">
              {item.type === 'error' ? '!' : item.type === 'success' ? '✓' : 'i'}
            </span>
            <span className="font-mono tracking-wide leading-snug break-words">
              {item.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
