'use client'

import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@/store/use-store'

export function useRefresh() {
  const [isLoading, setIsLoading] = useState(false)
  const refreshData = useStore((s) => s.refreshData)
  const setLastRefreshedAt = useStore((s) => s.setLastRefreshedAt)

  useEffect(() => {
    const fetchLastRefresh = async () => {
      try {
        const res = await fetch('/api/refresh', { method: 'GET' })
        if (res.ok) {
          const data = await res.json()
          if (data.lastRefreshedAt) {
            setLastRefreshedAt(data.lastRefreshedAt)
          }
        }
      } catch {
      }
    }
    fetchLastRefresh()
  }, [setLastRefreshedAt])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/refresh', {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        if (data.lastRefreshedAt) {
          setLastRefreshedAt(data.lastRefreshedAt)
        } else {
          refreshData()
        }
      } else {
        refreshData()
      }
    } catch {
      refreshData()
    } finally {
      setIsLoading(false)
    }
  }, [refreshData, setLastRefreshedAt])

  return { refresh, isLoading }
}
