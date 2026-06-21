import { useState, useMemo } from 'react'
import { Receipt } from 'lucide-react'
import { useSettlementDetails } from '@/api/hooks'
import StatusBadge from '@/components/StatusBadge'
import DataTable, { type ColumnDef } from '@/components/DataTable'
import Empty from '@/components/Empty'
import { useAuthStore } from '@/stores/auth'
import type { SettlementDetail } from '@/types'

const formatCurrency = (n: number) => `¥${Number(n).toFixed(2)}`

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function RiderSubsidies() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const riderId = currentUser?.id ?? ''
  const [page, setPage] = useState(1)

  const { data, isLoading } = useSettlementDetails({ rider_id: riderId, page_size: 20, page })
  const details = useMemo(() => data?.items ?? [], [data])

  const columns: ColumnDef<SettlementDetail>[] = [
    { key: 'order_id', header: '订单ID', render: (r) => <span className="font-mono text-sm">{r.order_id.slice(0, 8)}</span> },
    { key: 'calculated_amount', header: '计算金额', render: (r) => <span className="text-base font-medium">{formatCurrency(r.calculated_amount)}</span> },
    { key: 'final_amount', header: '最终金额', render: (r) => <span className="text-base font-semibold text-primary-600">{formatCurrency(r.final_amount)}</span> },
    { key: 'status', header: '状态', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: '日期', render: (r) => <span className="text-sm text-slate-500">{formatDate(r.created_at)}</span> },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">我的补贴</h1>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : details.length === 0 ? (
        <Empty icon={Receipt} message="暂无补贴记录" />
      ) : (
        <DataTable
          columns={columns}
          data={details}
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
          getRowKey={(r: SettlementDetail) => r.id}
          loading={isLoading}
        />
      )}
    </div>
  )
}
