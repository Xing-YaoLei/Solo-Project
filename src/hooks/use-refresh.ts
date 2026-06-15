'use client'

import { useState, useCallback } from 'react'
import { useStore } from '@/store/use-store'

export function useRefresh() {
  const [isLoading, setIsLoading] = useState(false)
  const refreshData = useStore((s) => s.refreshData)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/refresh')
      if (res.ok) {
        refreshData()
      }
    } finally {
      setIsLoading(false)
    }
  }, [refreshData])

  return { refresh, isLoading }
}
