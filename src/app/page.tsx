'use client'

import { FileText, Clock, Target, ListChecks } from 'lucide-react'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'
import StatCard from '@/components/ui/stat-card'
import StatusBadge from '@/components/ui/status-badge'
import FunnelChart from '@/components/funnel/funnel-chart'
import type { FunnelStage, Ticket, TicketStatus } from '@/lib/types'

const mockStages: FunnelStage[] = [
  { stage: 'discovered', count: 120, conversionRate: 100, conclusions: [{ summary: '本期共发现 120 项审计问题', detail: '涵盖权限异常、数据访问、流程违规等类别' }] },
  { stage: 'assigned', count: 98, conversionRate: 81.7, conclusions: [{ summary: '已分配整改任务 98 项', detail: '22 项尚未分配责任人' }] },
  { stage: 'remediating', count: 76, conversionRate: 77.6, conclusions: [{ summary: '整改执行中 76 项', detail: '平均整改周期 12 天' }] },
  { stage: 'reviewing', count: 45, conversionRate: 59.2, conclusions: [{ summary: '待复核 45 项', detail: '其中 8 项为二次复核' }] },
  { stage: 'closed', count: 32, conversionRate: 71.1, conclusions: [{ summary: '已关闭 32 项', detail: '整改完成 28 项，风险接受 3 项，不再适用 1 项' }] },
]

const statusMap: Record<TicketStatus, 'pending_remediation' | 'in_remediation' | 'pending_review' | 'closed'> = {
  pending_remediation: 'pending_remediation',
  in_remediation: 'in_remediation',
  pending_review: 'pending_review',
  closed: 'closed',
}

const mockRecentTickets: Ticket[] = [
  { id: '1', ticketNo: 'AUD-2024-001', title: '权限分配异常-超范围授权', description: '', status: 'pending_review', department: '信息技术部', assigneeId: '', auditorId: '', dueDate: '2024-06-15', createdAt: '', updatedAt: '', firstResolution: true },
  { id: '2', ticketNo: 'AUD-2024-002', title: '未授权数据访问记录', description: '', status: 'in_remediation', department: '风控合规部', assigneeId: '', auditorId: '', dueDate: '2024-06-20', createdAt: '', updatedAt: '', firstResolution: false },
  { id: '3', ticketNo: 'AUD-2024-003', title: '审批流程缺失关键节点', description: '', status: 'pending_remediation', department: '运营管理部', assigneeId: '', auditorId: '', dueDate: '2024-06-25', createdAt: '', updatedAt: '', firstResolution: false },
  { id: '4', ticketNo: 'AUD-2024-004', title: '系统日志审计未覆盖', description: '', status: 'closed', department: '信息技术部', assigneeId: '', auditorId: '', dueDate: '2024-05-30', createdAt: '', updatedAt: '', firstResolution: true },
  { id: '5', ticketNo: 'AUD-2024-005', title: '第三方供应商合规评估缺失', description: '', status: 'pending_review', department: '采购部', assigneeId: '', auditorId: '', dueDate: '2024-07-01', createdAt: '', updatedAt: '', firstResolution: true },
]

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="仪表盘" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 gap-4">
            <StatCard icon={FileText} label="总工单数" value={120} trend="up" trendPercent={8.2} />
            <StatCard icon={Clock} label="待复核" value={45} trend="down" trendPercent={3.1} />
            <StatCard icon={Target} label="首次解决率" value="72.5%" trend="up" trendPercent={2.4} />
            <StatCard icon={ListChecks} label="活跃备注任务" value={12} />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-navy-900">整改跟踪漏斗概览</h2>
            <FunnelChart stages={mockStages} compact />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-navy-900">最近工单</h2>
            <div className="space-y-2">
              {mockRecentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="shrink-0 font-mono text-sm font-medium text-navy-900">{ticket.ticketNo}</span>
                    <span className="truncate text-sm text-slate-600">{ticket.title}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-slate-400">{ticket.department}</span>
                    <StatusBadge status={statusMap[ticket.status]} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
