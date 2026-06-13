import { useState, useEffect, useCallback } from 'react'
import type { ItemConfig, ItemEffect } from '@/types'
import { useGameStore } from '@/stores/useGameStore'
import { useConfigStore } from '@/stores/useConfigStore'

interface UseItemResult {
  canUse: boolean
  remainingMs: number
}

interface UseItemSystemReturn {
  items: ItemConfig[]
  useItem: (itemId: string) => UseItemResult
  isOnCooldown: (itemId: string) => boolean
  getCooldownRemaining: (itemId: string) => number
  activateItem: (itemId: string) => void
}

export function useItemSystem(): UseItemSystemReturn {
  const items = useConfigStore((s) => s.items)
  const cooldownTimestamps = useGameStore((s) => s.cooldownTimestamps)
  const dispatchEffect = useGameStore((s) => s.dispatchEffect)
  const recordCooldown = useGameStore((s) => s.recordCooldown)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now())
    }, 100)
    return () => clearInterval(intervalId)
  }, [])

  const getItem = useCallback((itemId: string): ItemConfig | undefined => {
    return items.find((item) => item.id === itemId)
  }, [items])

  const getCooldownRemaining = useCallback((itemId: string): number => {
    const item = getItem(itemId)
    if (!item) return 0
    const lastUsed = cooldownTimestamps[itemId]
    if (!lastUsed) return 0
    const elapsed = now - lastUsed
    const remaining = item.cooldownMs - elapsed
    return Math.max(0, remaining)
  }, [getItem, cooldownTimestamps, now])

  const isOnCooldown = useCallback((itemId: string): boolean => {
    return getCooldownRemaining(itemId) > 0
  }, [getCooldownRemaining])

  const useItem = useCallback((itemId: string): UseItemResult => {
    const remainingMs = getCooldownRemaining(itemId)
    return {
      canUse: remainingMs === 0,
      remainingMs,
    }
  }, [getCooldownRemaining])

  const activateItem = useCallback((itemId: string) => {
    const item = getItem(itemId)
    if (!item) return
    const remainingMs = getCooldownRemaining(itemId)
    if (remainingMs > 0) return

    dispatchEffect(item.effect as ItemEffect)
    recordCooldown(itemId, Date.now())
  }, [getItem, getCooldownRemaining, dispatchEffect, recordCooldown])

  return {
    items,
    useItem,
    isOnCooldown,
    getCooldownRemaining,
    activateItem,
  }
}
