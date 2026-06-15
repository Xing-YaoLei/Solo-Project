'use client'

import { useState, useEffect } from 'react'
import RefreshIndicator from '@/components/dashboard/RefreshIndicator'
import StudentTrendCard from '@/components/dashboard/StudentTrendCard'
import GradeCompositionCard from '@/components/dashboard/GradeCompositionCard'
import MaterialDetailCard from '@/components/dashboard/MaterialDetailCard'
import AdvisorAnomalyCard from '@/components/dashboard/AdvisorAnomalyCard'
import { Shield, Eye, Loader2, AlertTriangle } from 'lucide-react'
import type { Role } from '@/lib/types'

const roleLabels: Record<string, string> = {
  admin: '教务管理员',
  dean: '院系领导',
  advisor: '导师',
  student: '学生',
}

const roleScopeDescriptions: Record<string, string> = {
  admin: '查看全部数据：所有院系、导师与学生',
  dean: '查看本院系数据：所属院系的导师与学生',
  advisor: '查看名下学生数据：本人指导的学生复核记录',
  student: '查看个人数据：仅本人的复核与申请记录',
}

interface ShareDashboardProps {
  token: string
}

export default function ShareDashboard({ token }: ShareDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('admin')
  const [scope, setScope] = useState<Record<string, unknown>>({})

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/share/verify?token=${encodeURIComponent(token)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.valid) {
            setValid(true)
            setRole((data.role as Role) || 'admin')
            setScope(data.scope || {})
          } else {
            setValid(false)
            setError(data.error || '链接无效')
          }
        } else {
          setValid(false)
          setError('验证失败')
        }
      } catch {
        setValid(false)
        setError('网络错误，请稍后重试')
      } finally {
        setLoading(false)
      }
    }
    verifyToken()
  }, [token])

  const roleLabel = roleLabels[role] || '教务管理员'
  const scopeDesc = roleScopeDescriptions[role] || ''

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 size={48} className="animate-spin mb-4" style={{ color: 'var(--amber)' }} />
        <p className="text-sm" style={{ color: 'var(--slate)' }}>正在验证分享链接...</p>
      </div>
    )
  }

  if (!valid) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: '#FEF2F2' }}
        >
          <AlertTriangle size={32} style={{ color: '#EF4444' }} />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--navy)' }}>
          分享链接无效
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--slate)' }}>
          {error || '该分享链接已过期或不存在'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-lg"
        style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
      >
        <div className="flex items-center gap-2">
          <Shield size={16} style={{ color: '#D97706' }} />
          <span className="text-sm font-medium" style={{ color: '#D97706' }}>
            您正在以{roleLabel}身份查看分享数据
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye size={14} style={{ color: '#92400E' }} />
          <span className="text-xs" style={{ color: '#92400E' }}>
            {scopeDesc}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
          成绩复核风险监测
        </h1>
        <RefreshIndicator />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <StudentTrendCard role={role} />
        <GradeCompositionCard role={role} />
        <MaterialDetailCard role={role} />
        <AdvisorAnomalyCard role={role} />
      </div>
    </div>
  )
}
