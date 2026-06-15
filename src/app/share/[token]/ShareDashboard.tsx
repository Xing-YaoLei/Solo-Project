'use client'

import { useState, useEffect } from 'react'
import RefreshIndicator from '@/components/dashboard/RefreshIndicator'
import StudentTrendCard from '@/components/dashboard/StudentTrendCard'
import GradeCompositionCard from '@/components/dashboard/GradeCompositionCard'
import MaterialDetailCard from '@/components/dashboard/MaterialDetailCard'
import AdvisorAnomalyCard from '@/components/dashboard/AdvisorAnomalyCard'
import { Shield, Eye, Loader2, AlertTriangle, FileDown } from 'lucide-react'
import type { Role } from '@/lib/types'

const roleLabels: Record<string, string> = {
  admin: '教务管理员',
  dean: '院系领导',
  advisor: '导师',
  student: '学生',
}

interface ShareDashboardProps {
  token: string
}

export default function ShareDashboard({ token }: ShareDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('admin')
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined)
  const [advisorId, setAdvisorId] = useState<string | undefined>(undefined)
  const [studentId, setStudentId] = useState<string | undefined>(undefined)
  const [departmentName, setDepartmentName] = useState<string | null>(null)
  const [advisorName, setAdvisorName] = useState<string | null>(null)
  const [studentName, setStudentName] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/share/verify?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (res.ok && data.valid) {
          setValid(true)
          setRole((data.role as Role) || 'admin')
          setDepartmentId(data.departmentId || undefined)
          setAdvisorId(data.advisorId || undefined)
          setStudentId(data.studentId || undefined)
          setDepartmentName(data.departmentName || null)
          setAdvisorName(data.advisorName || null)
          setStudentName(data.studentName || null)
        } else {
          setValid(false)
          setError(data.error || '链接无效')
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

  const scopeDescription = (() => {
    if (studentName) return `查看学生「${studentName}」的个人复核与申请记录`
    if (advisorName) return `查看导师「${advisorName}」名下学生的复核记录`
    if (departmentName) return `查看「${departmentName}」院系的导师与学生数据`
    if (role === 'admin') return '查看全部数据：所有院系、导师与学生'
    if (role === 'dean') return '查看本院系数据：所属院系的导师与学生'
    if (role === 'advisor') return '查看名下学生数据：本人指导的学生复核记录'
    if (role === 'student') return '查看个人数据：仅本人的复核与申请记录'
    return '按角色权限查看数据'
  })()

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    setExporting(true)
    try {
      const body: Record<string, unknown> = {
        format,
        role,
        includeCaliberNote: true,
      }
      if (departmentId) body.department = departmentId
      if (advisorId) body.advisorId = advisorId
      if (studentId) body.studentId = studentId

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || '导出失败')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      a.download = `成绩复核风险监测报告_${dateStr}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

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
            {scopeDescription}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
          成绩复核风险监测
        </h1>
        <div className="flex items-center gap-2">
          <RefreshIndicator />
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 disabled:opacity-50"
            style={{ backgroundColor: 'var(--navy)', color: '#FFFFFF' }}
          >
            <FileDown size={13} />
            PDF
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 disabled:opacity-50"
            style={{ backgroundColor: 'var(--amber)', color: '#FFFFFF' }}
          >
            <FileDown size={13} />
            Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <StudentTrendCard
          role={role}
          department={departmentId}
          advisorId={advisorId}
          studentId={studentId}
        />
        <GradeCompositionCard
          role={role}
          department={departmentId}
          advisorId={advisorId}
          studentId={studentId}
        />
        <MaterialDetailCard
          role={role}
          department={departmentId}
          advisorId={advisorId}
          studentId={studentId}
        />
        <AdvisorAnomalyCard
          role={role}
          department={departmentId}
          advisorId={advisorId}
          studentId={studentId}
        />
      </div>
    </div>
  )
}
