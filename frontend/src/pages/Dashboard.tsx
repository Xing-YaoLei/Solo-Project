import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { documentApi } from '../lib/api'
import type { DashboardData, DocumentStatus } from '../types'
import { STATUS_LABELS } from '../types'
import { useAuthStore } from '../store/useAuthStore'
import StatusBadge from '../components/common/StatusBadge'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((s) => s.user)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await documentApi.getDashboard()
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return <div className="empty-state">加载中...</div>
  }

  if (!data) return null

  const statCards = [
    { label: '我的待办', value: data.my_todo, className: '' },
    { label: '待审核', value: data.pending_review, className: 'pending' },
    { label: '已退回', value: data.rejected, className: 'rejected' },
    { label: '文书总数', value: data.total, className: 'approved' },
  ]

  return (
    <div>
      <div className="mb-4">
        <h1 className="page-title">
          工作台 <span style={{ fontSize: '14px', fontWeight: 400, color: '#6b7280' }}>
            · {dayjs().format('YYYY年MM月DD日')} · 欢迎回来，{user?.full_name || user?.username}
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-4 mb-4">
        {statCards.map((s) => (
          <div key={s.label} className={`stat-card ${s.className}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">📋 各状态分布</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(data.by_status).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between items-center"
                style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: 4 }}
              >
                <span style={{ fontSize: '13px', color: '#374151' }}>
                  {STATUS_LABELS[k as DocumentStatus]}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title flex justify-between items-center">
            <span>🕐 最近更新文书</span>
            <Link to="/documents" className="btn btn-sm btn-secondary">
              查看全部 →
            </Link>
          </div>
          {data.recent_documents.length === 0 ? (
            <div className="empty-state">暂无文书记录</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>文书</th>
                  <th>状态</th>
                  <th>更新时间</th>
                  <th>处理人</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_documents.map((d) => (
                  <tr
                    key={d.id}
                    className={d.rejection_count > 0 ? 'rejected-row' : ''}
                  >
                    <td>
                      <Link
                        to="/documents/$id"
                        params={{ id: String(d.id) }}
                        style={{ color: '#2563eb', fontWeight: 500 }}
                      >
                        {d.title}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge
                        status={d.status}
                        rejectionCount={d.rejection_count}
                      />
                    </td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>
                      {dayjs(d.updated_at).format('MM-DD HH:mm')}
                    </td>
                    <td style={{ fontSize: '13px' }}>{d.assignee || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
