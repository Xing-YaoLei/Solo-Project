'use client'

import { useMemo } from 'react'
import RefreshIndicator from '@/components/dashboard/RefreshIndicator'
import StudentTrendCard from '@/components/dashboard/StudentTrendCard'
import GradeCompositionCard from '@/components/dashboard/GradeCompositionCard'
import MaterialDetailCard from '@/components/dashboard/MaterialDetailCard'
import AdvisorAnomalyCard from '@/components/dashboard/AdvisorAnomalyCard'
import { useStore } from '@/store/use-store'
import { trendData, materialDetails, advisorAnomalies, gradeComposition } from '@/lib/mock-data'
import { filterTrendData, filterMaterialDetails, filterAdvisorAnomalies, filterGradeComposition } from '@/lib/role-filter'
import type { RoleScope } from '@/lib/types'
import { FileText, AlertTriangle, Users, Award, Database, CreditCard, ClipboardList, Share2, FileDown } from 'lucide-react'

const roleLabels: Record<string, string> = {
  admin: '教务管理员',
  dean: '院系领导',
  advisor: '导师',
  student: '学生',
}

export default function DashboardPage() {
  const currentRole = useStore((s) => s.currentRole)
  const toggleShareModal = useStore((s) => s.toggleShareModal)

  const scope: RoleScope = { role: currentRole }
  const filteredTrend = useMemo(() => filterTrendData(trendData, scope), [currentRole])
  const filteredMaterials = useMemo(() => filterMaterialDetails(materialDetails, scope), [currentRole])
  const filteredAnomalies = useMemo(() => filterAdvisorAnomalies(advisorAnomalies, scope), [currentRole])
  const filteredGrades = useMemo(() => filterGradeComposition(gradeComposition, scope), [currentRole])

  const totalApplications = filteredTrend.reduce((sum, d) => sum + d.count, 0)
  const pendingReviews = filteredMaterials.filter((m) => m.status === '待审核' || m.status === '审核中').length
  const highRiskCount = filteredMaterials.filter((m) => m.riskLevel === 'high').length
  const anomalousAdvisors = filteredAnomalies.filter((a) => a.anomalyRate > 10).length
  const avgRiskScore = filteredTrend.length > 0
    ? (filteredTrend.reduce((sum, d) => sum + d.riskScore, 0) / filteredTrend.length).toFixed(1)
    : '0'

  const statCards = [
    {
      label: '总复核申请数',
      value: totalApplications,
      icon: FileText,
      color: 'var(--navy)',
      bg: 'rgba(27, 42, 74, 0.08)',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      label: '待审核材料',
      value: pendingReviews,
      icon: ClipboardList,
      color: 'var(--amber)',
      bg: 'rgba(245, 158, 11, 0.08)',
      trend: '+3',
      trendUp: true,
    },
    {
      label: '高风险申请',
      value: highRiskCount,
      icon: AlertTriangle,
      color: 'var(--coral)',
      bg: 'rgba(239, 68, 68, 0.08)',
      trend: '-2',
      trendUp: false,
    },
    {
      label: '异常导师数',
      value: anomalousAdvisors,
      icon: Users,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.08)',
      trend: '0',
      trendUp: true,
    },
  ]

  const dataSources = [
    {
      icon: Database,
      title: '教务系统数据库',
      desc: '成绩记录、课程信息、导师数据',
    },
    {
      icon: ClipboardList,
      title: '学生申请表',
      desc: '复核申请、成绩异议、申诉材料',
    },
    {
      icon: CreditCard,
      title: '一卡通系统',
      desc: '门禁记录、消费明细、位置追溯',
    },
  ]

  const techStack = [
    'Next.js',
    'Recharts',
    'Prisma',
    'PostgreSQL',
    'Supabase',
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
            成绩复核风险监测
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--slate)' }}>
            高校教务成绩复核数据综合分析与风险预警平台
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshIndicator />
          <button
            onClick={toggleShareModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200"
            style={{ backgroundColor: 'var(--navy)', color: '#FFFFFF' }}
          >
            <Share2 size={13} />
            分享
          </button>
          <button
            onClick={toggleShareModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200"
            style={{ backgroundColor: 'var(--amber)', color: '#FFFFFF' }}
          >
            <FileDown size={13} />
            导出
          </button>
        </div>
      </div>

      <div
        className="flex items-center justify-between px-4 py-3 rounded-lg"
        style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
      >
        <div className="flex items-center gap-2">
          <Award size={16} style={{ color: '#D97706' }} />
          <span className="text-sm font-medium" style={{ color: '#D97706' }}>
            当前角色：{roleLabels[currentRole]}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: '#92400E' }}>
            {currentRole === 'admin' && '查看全部数据：所有院系、导师与学生'}
            {currentRole === 'dean' && '查看本院系数据：所属院系的导师与学生'}
            {currentRole === 'advisor' && '查看名下学生数据：本人指导的学生复核记录'}
            {currentRole === 'student' && '查看个人数据：仅本人的复核与申请记录'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className="rounded-xl p-5 shadow-sm"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--slate)' }}>
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: card.color }}>
                    {card.value}
                  </p>
                  <p
                    className="text-xs mt-1 font-medium"
                    style={{ color: card.trendUp ? 'var(--emerald)' : 'var(--coral)' }}
                  >
                    {card.trend} 较上学期
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: card.bg }}
                >
                  <Icon size={20} style={{ color: card.color }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <StudentTrendCard role={currentRole} />
        <GradeCompositionCard role={currentRole} />
        <MaterialDetailCard role={currentRole} />
        <AdvisorAnomalyCard role={currentRole} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--navy)' }}>
            数据来源
          </h3>
          <div className="space-y-3">
            {dataSources.map((source, index) => {
              const Icon = source.icon
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(27, 42, 74, 0.08)' }}
                  >
                    <Icon size={16} style={{ color: 'var(--navy)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
                      {source.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--slate)' }}>
                      {source.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--navy)' }}>
            技术架构
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--slate)' }}>
                底层技术栈
              </p>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: 'rgba(27, 42, 74, 0.08)',
                      color: 'var(--navy)',
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--slate)' }}>
                平均风险评分
              </p>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold" style={{ color: 'var(--coral)' }}>
                  {avgRiskScore}
                </span>
                <div className="flex-1">
                  <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#E2E8F0' }}>
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(Number(avgRiskScore) * 2, 100)}%`,
                        backgroundColor: Number(avgRiskScore) > 30 ? '#EF4444' : Number(avgRiskScore) > 20 ? '#F59E0B' : '#10B981',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs" style={{ color: 'var(--slate)' }}>低风险</span>
                    <span className="text-xs" style={{ color: 'var(--slate)' }}>高风险</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--slate)' }}>
                复核前后 A 级占比变化
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#94A3B8' }} />
                  <span className="text-xs" style={{ color: 'var(--slate)' }}>
                    复核前 {Math.round((108 / 500) * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--navy)' }} />
                  <span className="text-xs" style={{ color: 'var(--slate)' }}>
                    复核后 {filteredGrades.find(g => g.grade === 'A')?.percentage || 0}%
                  </span>
                </div>
                <span className="text-xs font-medium ml-auto" style={{ color: 'var(--emerald)' }}>
                  +{((filteredGrades.find(g => g.grade === 'A')?.percentage || 0) - Math.round((108 / 500) * 100))}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center gap-2 mb-3">
          <FileDown size={16} style={{ color: 'var(--navy)' }} />
          <h3 className="text-base font-semibold" style={{ color: 'var(--navy)' }}>
            导出说明
          </h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--slate)' }}>
          <span className="font-medium" style={{ color: 'var(--navy)' }}>教室利用率口径：</span>
          本报告所涉教室利用率数据来源于教务系统排课记录与一卡通门禁签到数据。
          利用率 = 实际使用课时 / 排课总课时 × 100%。
          其中实际使用课时以一卡通签到记录为准，签到时间与排课时间匹配度≥80%视为有效使用。
          统计周期为自然学期，不含补课与临时借用。
        </p>
      </div>
    </div>
  )
}
