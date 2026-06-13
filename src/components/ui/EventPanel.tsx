import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { EventConfig } from '@/types'

interface EventPanelProps {
  event: EventConfig
  onResolve: (correct: boolean) => void
}

function getEventDescription(event: EventConfig): string {
  const p = event.params
  switch (event.type) {
    case 'consumable-expired':
      return `耗材过期！${p.itemId ?? '未知物品'} 已过期，请立即更换`
    case 'inventory-shortage':
      return `库存不足！${p.category ?? '未知分类'} 缺少 ${p.shortageAmount ?? 0} 件`
    case 'model-error':
      return `型号错误！${p.errorMessage ?? '未知错误'}`
    default:
      return '未知突发事件'
  }
}

const COUNTDOWN_SECONDS = 15

export function EventPanel({ event, onResolve }: EventPanelProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [resolved, setResolved] = useState(false)

  const resolve = useCallback(
    (correct: boolean) => {
      if (resolved) return
      setResolved(true)
      onResolve(correct)
    },
    [onResolve, resolved]
  )

  useEffect(() => {
    if (resolved) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          resolve(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [resolved, resolve])

  return (
    <motion.div
      className="fixed right-0 top-1/2 -translate-y-1/2 w-80 z-50"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className="border-2 border-red-500/70 rounded-l-xl bg-[#1a0f0a]/95 backdrop-blur-sm p-5 shadow-lg shadow-red-500/20">
        <h3 className="text-base font-bold text-red-400 mb-3">
          ⚠️ 突发事件
        </h3>

        <p className="text-sm text-[#FFFFF0]/85 mb-4 leading-relaxed">
          {getEventDescription(event)}
        </p>

        <div className="mb-4">
          <div className="h-1.5 rounded-full bg-[#3E2723]/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / COUNTDOWN_SECONDS) * 100}%` }}
            />
          </div>
          <span className="text-xs text-[#FFFFF0]/50 mt-1 block text-right">
            {countdown}s
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => resolve(true)}
            className="flex-1 py-2 rounded-lg bg-[#50C878]/20 border border-[#50C878]/60 text-[#50C878] text-sm font-medium hover:bg-[#50C878]/30 active:scale-95 transition-all"
          >
            正确处理
          </button>
          <button
            onClick={() => resolve(false)}
            className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/60 text-red-400 text-sm font-medium hover:bg-red-500/30 active:scale-95 transition-all"
          >
            忽略
          </button>
        </div>
      </div>
    </motion.div>
  )
}
