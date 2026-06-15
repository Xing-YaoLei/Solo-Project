'use client'

import RefreshIndicator from '@/components/dashboard/RefreshIndicator'
import StudentTrendCard from '@/components/dashboard/StudentTrendCard'
import GradeCompositionCard from '@/components/dashboard/GradeCompositionCard'
import MaterialDetailCard from '@/components/dashboard/MaterialDetailCard'
import AdvisorAnomalyCard from '@/components/dashboard/AdvisorAnomalyCard'
import { Shield, Eye } from 'lucide-react'
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

export default function ShareDashboard({ role }: { role: string }) {
  const safeRole = (role || 'admin') as Role
  const roleLabel = roleLabels[safeRole] || '教务管理员'
  const scopeDesc = roleScopeDescriptions[safeRole] || ''

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
        <StudentTrendCard role={safeRole} />
        <GradeCompositionCard role={safeRole} />
        <MaterialDetailCard role={safeRole} />
        <AdvisorAnomalyCard role={safeRole} />
      </div>
    </div>
  )
}
