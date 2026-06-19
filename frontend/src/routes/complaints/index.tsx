import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/api/client'
import StatusBadge from '@/components/StatusBadge'
import ComplaintFormModal from '@/components/ComplaintFormModal'
import { STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types'
import type { ComplaintListItem, ComplaintStatus, Priority, SourceChannel } from '@/types'

const PAGE_SIZE = 10

export const Route = createFileRoute('/complaints/')({
  component: ComplaintsPage,
})

function ComplaintsPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as Record<string, string>
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [statusFilter, setStatusFilter] = useState(search.status || '')
  const [channelFilter, setChannelFilter] = useState(search.channel || '')
  const [priorityFilter, setPriorityFilter] = useState(search.priority || '')
  const [searchQuery, setSearchQuery] = useState(search.q || '')
  const [page, setPage] = useState(Number(search.page) || 1)

  const fetchComplaints = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      if (channelFilter) params.source_channel = channelFilter
      if (priorityFilter) params.priority = priorityFilter
      if (searchQuery) params.q = searchQuery
      const data = await api.complaints.list(params)
      setComplaints(data)
    } catch {
      setComplaints([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, channelFilter, priorityFilter, searchQuery])

  useEffect(() => {
    fetchComplaints()
  }, [fetchComplaints])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (channelFilter) params.channel = channelFilter
    if (priorityFilter) params.priority = priorityFilter
    if (searchQuery) params.q = searchQuery
    if (page > 1) params.page = String(page)
    navigate({ to: '/complaints', search: params, replace: true })
  }, [statusFilter, channelFilter, priorityFilter, searchQuery, page, navigate])

  const filtered = complaints
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const goToDetail = (id: string) => {
    navigate({ to: '/complaints/$complaintId', params: { complaintId: id } })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-800">客诉列表</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          新建客诉
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            {(Object.entries(STATUS_LABELS) as [ComplaintStatus, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={channelFilter}
            onChange={e => { setChannelFilter(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">全部渠道</option>
            {(['电话', '微信', '平台', '现场'] as SourceChannel[]).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">全部优先级</option>
            {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索标题、民宿名..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-xs">编号</th>
                <th className="px-4 py-3 text-xs">标题</th>
                <th className="px-4 py-3 text-xs">状态</th>
                <th className="px-4 py-3 text-xs">优先级</th>
                <th className="px-4 py-3 text-xs">来源渠道</th>
                <th className="px-4 py-3 text-xs">民宿名</th>
                <th className="px-4 py-3 text-xs">处理人</th>
                <th className="px-4 py-3 text-xs">创建时间</th>
                <th className="px-4 py-3 text-xs">标签</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-400">加载中...</td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-400">暂无数据</td>
                </tr>
              ) : (
                paged.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => goToDetail(c.id)}
                    className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${c.status === 'closed' ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">{c.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium max-w-[200px] truncate">{c.title}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[c.priority]}`}>
                        {PRIORITY_LABELS[c.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.source_channel}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.homestay_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.handler_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{c.created_at.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{tag}</span>
                        ))}
                        {c.tags.length > 2 && (
                          <span className="text-xs text-slate-400">+{c.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <span className="text-sm text-slate-500">
              共 {filtered.length} 条，第 {page}/{totalPages} 页
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ComplaintFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchComplaints}
      />
    </div>
  )
}
