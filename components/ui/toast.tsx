'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  const getTypeStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500/10 border-green-500/40',
          text: 'text-green-300',
          icon: '✅',
          glow: 'shadow-green-500/20',
        }
      case 'error':
        return {
          bg: 'bg-red-500/10 border-red-500/40',
          text: 'text-red-300',
          icon: '❌',
          glow: 'shadow-red-500/20',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/40',
          text: 'text-yellow-300',
          icon: '⚠️',
          glow: 'shadow-yellow-500/20',
        }
      default:
        return {
          bg: 'bg-purple-500/10 border-purple-500/40',
          text: 'text-purple-300',
          icon: '💡',
          glow: 'shadow-purple-500/20',
        }
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => {
        const styles = getTypeStyles(toast.type)
        return (
          <div
            key={toast.id}
            className={`toast-enter px-5 py-4 rounded-2xl border backdrop-blur-xl ${styles.bg} ${styles.text} flex items-center gap-4 min-w-[320px] max-w-md shadow-xl ${styles.glow}`}
          >
            <span className="text-xl">{styles.icon}</span>
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
