'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Role, RoleScope, TrendDataPoint, GradeComposition, MaterialDetail, CampusCardRecord, AdvisorAnomaly } from '@/lib/types'

export interface DashboardData {
  trend: TrendDataPoint[]
  composition: GradeComposition[]
  materials: MaterialDetail[]
  campusCards: CampusCardRecord[]
  anomalies: AdvisorAnomaly[]
}

export function useDashboardData(scope: RoleScope) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const params = new URLSearchParams()
  if (scope.role) params.set('role', scope.role)
  if (scope.department) params.set('department', scope.department)
  if (scope.advisorId) params.set('advisorId', scope.advisorId)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [params.toString()])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export function useTrendData(role: Role = 'admin', department?: string) {
  const [data, setTrendData] = useState<TrendDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('role', role)
      if (department) params.set('department', department)
      const res = await fetch(`/api/students/trend?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setTrendData(json)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [role, department])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, refetch: fetchData }
}

export function useGradeComposition(role: Role = 'admin', department?: string) {
  const [data, setData] = useState<GradeComposition[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('role', role)
      if (department) params.set('department', department)
      const res = await fetch(`/api/grades/composition?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [role, department])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, refetch: fetchData }
}

export function useMaterialsData(role: Role = 'admin', department?: string) {
  const [data, setData] = useState<{ materialDetails: MaterialDetail[], campusCardRecords: CampusCardRecord[] }>({
    materialDetails: [], campusCardRecords: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('role', role)
      if (department) params.set('department', department)
      const res = await fetch(`/api/materials?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [role, department])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, refetch: fetchData }
}

export function useAdvisorAnomalies(role: Role = 'admin', department?: string, advisorId?: string) {
  const [data, setData] = useState<AdvisorAnomaly[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('role', role)
      if (department) params.set('department', department)
      if (advisorId) params.set('advisorId', advisorId)
      const res = await fetch(`/api/advisors/anomaly?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [role, department, advisorId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, refetch: fetchData }
}
