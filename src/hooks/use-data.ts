'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Role, TrendDataPoint, GradeComposition, MaterialDetail, CampusCardRecord, AdvisorAnomaly } from '@/lib/types'

export interface DashboardData {
  trend: TrendDataPoint[]
  composition: GradeComposition[]
  materials: MaterialDetail[]
  campusCards: CampusCardRecord[]
  anomalies: AdvisorAnomaly[]
  error?: string
  message?: string
}

export function useDashboardData(role: Role = 'admin', department?: string, advisorId?: string, studentId?: string) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('role', role)
      if (department) params.set('department', department)
      if (advisorId) params.set('advisorId', advisorId)
      if (studentId) params.set('studentId', studentId)

      const res = await fetch(`/api/dashboard?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.message || json.error || '数据加载失败')
      }
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络连接异常')
    } finally {
      setLoading(false)
    }
  }, [role, department, advisorId, studentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export function useTrendData(role: Role = 'admin', department?: string, advisorId?: string, studentId?: string) {
  const [data, setTrendData] = useState<TrendDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('role', role)
      if (department) params.set('department', department)
      if (advisorId) params.set('advisorId', advisorId)
      if (studentId) params.set('studentId', studentId)

      const res = await fetch(`/api/students/trend?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.message || json.error || '数据加载失败')
        setTrendData([])
      } else {
        setTrendData(Array.isArray(json) ? json : json.data || [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络连接异常')
      setTrendData([])
    } finally {
      setLoading(false)
    }
  }, [role, department, advisorId, studentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export function useGradeComposition(role: Role = 'admin', department?: string, advisorId?: string, studentId?: string) {
  const [data, setData] = useState<GradeComposition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('role', role)
      if (department) params.set('department', department)
      if (advisorId) params.set('advisorId', advisorId)
      if (studentId) params.set('studentId', studentId)

      const res = await fetch(`/api/grades/composition?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.message || json.error || '数据加载失败')
        setData([])
      } else {
        setData(Array.isArray(json) ? json : json.data || [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络连接异常')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [role, department, advisorId, studentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export function useMaterialsData(role: Role = 'admin', department?: string, advisorId?: string, studentId?: string) {
  const [data, setData] = useState<{ materialDetails: MaterialDetail[], campusCardRecords: CampusCardRecord[] }>({
    materialDetails: [], campusCardRecords: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('role', role)
      if (department) params.set('department', department)
      if (advisorId) params.set('advisorId', advisorId)
      if (studentId) params.set('studentId', studentId)

      const res = await fetch(`/api/materials?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.message || json.error || '数据加载失败')
        setData({ materialDetails: [], campusCardRecords: [] })
      } else {
        setData({
          materialDetails: json.materialDetails || [],
          campusCardRecords: json.campusCardRecords || [],
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络连接异常')
      setData({ materialDetails: [], campusCardRecords: [] })
    } finally {
      setLoading(false)
    }
  }, [role, department, advisorId, studentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export function useAdvisorAnomalies(role: Role = 'admin', department?: string, advisorId?: string, studentId?: string) {
  const [data, setData] = useState<AdvisorAnomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('role', role)
      if (department) params.set('department', department)
      if (advisorId) params.set('advisorId', advisorId)
      if (studentId) params.set('studentId', studentId)

      const res = await fetch(`/api/advisors/anomaly?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.message || json.error || '数据加载失败')
        setData([])
      } else {
        setData(Array.isArray(json) ? json : json.data || [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络连接异常')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [role, department, advisorId, studentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
