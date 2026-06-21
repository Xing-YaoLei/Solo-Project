'use client'

import { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDashboardStore } from '@/store/useDashboardStore'

export function RouteSelector() {
  const [routes, setRoutes] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const { routeId, setRouteId } = useDashboardStore()

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('/api/routes')
        if (response.ok) {
          const data = await response.json()
          setRoutes(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch routes:', error)
        setRoutes([
          { id: 'route-001', name: '朝阳区-海淀区' },
          { id: 'route-002', name: '西城区-东城区' },
          { id: 'route-003', name: '丰台区-石景山' },
          { id: 'route-004', name: '通州区-大兴区' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchRoutes()
  }, [])

  if (loading) {
    return <Skeleton className="h-10 w-48 rounded-lg" />
  }

  const options = [
    { value: '', label: '全部路线' },
    ...routes.map(r => ({ value: r.id, label: r.name })),
  ]

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <Select
        value={routeId || ''}
        onChange={(e) => setRouteId(e.target.value || null)}
        options={options}
        className="w-48"
      />
    </div>
  )
}
