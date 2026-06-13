import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/stores/useUIStore'

const BORDER_COLORS: Record<string, string> = {
  success: '#50C878',
  error: '#ef4444',
  warning: '#FFBF00',
  info: '#3b82f6',
}

function ToastItem({ id, message, type }: { id: string; message: string; type: string }) {
  const removeToast = useUIStore((s) => s.removeToast)

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), 3000)
    return () => clearTimeout(timer)
  }, [id, removeToast])

  return (
    <motion.div
      layout
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1a0f0a]/90 backdrop-blur-sm shadow-lg min-w-[240px] max-w-[320px]"
      style={{ borderLeft: `3px solid ${BORDER_COLORS[type] ?? '#3E2723'}` }}
    >
      <span className="text-sm text-[#FFFFF0]/90 leading-snug">
        {message}
      </span>
    </motion.div>
  )
}

export function Toast() {
  const toasts = useUIStore((s) => s.toasts)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} id={toast.id} message={toast.message} type={toast.type} />
        ))}
      </AnimatePresence>
    </div>
  )
}
