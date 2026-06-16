import { useState, useEffect } from 'react'
import { visitApi, VisitRecord } from '../../api/visit'
import { elderApi, Elder } from '../../api/elder'
import dayjs from 'dayjs'

export default function VisitList() {
  const [elders, setElders] = useState<Elder[]>([])
  const [selectedElderId, setSelectedElderId] = useState<number | null>(null)
  const [visits, setVisits] = useState<VisitRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [eldersLoading, setEldersLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const fetchElders = async () => {
    try {
      setEldersLoading(true)
      const res = await elderApi.getList({ page_size: 100, status: 'active' })
      setElders(res.data.items)
      if (res.data.items.length > 0) {
        setSelectedElderId(res.data.items[0].id)
      }
    } catch (err) {
      console.error('获取老人列表失败', err)
    } finally {
      setEldersLoading(false)
    }
  }

  const fetchVisits = async () => {
    if (!selectedElderId) return
    try {
      setLoading(true)
      const res = await visitApi.getList(selectedElderId)
      setVisits(res.data)
      setPage(1)
    } catch (err) {
      console.error('获取探访记录失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchElders()
  }, [])

  useEffect(() => {
    if (selectedElderId) {
      fetchVisits()
    }
  }, [selectedElderId])

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该探访记录吗？')) return
    try {
      await visitApi.remove(id)
      fetchVisits()
    } catch (err) {
      console.error('删除失败', err)
    }
  }

  const getStatusBadgeClass = (s: string) => {
    const map: Record<string, string> = {
      completed: 'status-badge status-completed',
      pending: 'status-badge status-pending',
      cancelled: 'status-badge status-inactive',
    }
    return map[s] || 'status-badge status-pending'
  }

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      completed: '已完成',
      pending: '待探访',
      cancelled: '已取消',
    }
    return map[s] || s
  }

  const getVisitTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      family: '家属探访',
      friend: '朋友探访',
      volunteer: '志愿者探访',
      medical: '医疗探访',
      other: '其他',
    }
    return map[t] || t
  }

  const getElderName = (elderId: number) => {
    const elder = elders.find((e) => e.id === elderId)
    return elder?.name || ''
  }

  const getSelectedElderName = () => {
    const elder = elders.find((e) => e.id === selectedElderId)
    return elder?.name || ''
  }

  const totalPages = Math.ceil(visits.length / pageSize)
  const paginatedVisits = visits.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">探访记录</h1>
        <button
          className="btn btn-primary"
          onClick={() => alert('新增功能待实现')}
          disabled={!selectedElderId}
        >
          + 新增探访
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
              选择老人：
            </label>
            <select
              className="form-select"
              style={{ width: '200px' }}
              value={selectedElderId || ''}
              onChange={(e) => setSelectedElderId(Number(e.target.value))}
              disabled={eldersLoading}
            >
              {eldersLoading ? (
                <option value="">加载中...</option>
              ) : elders.length === 0 ? (
                <option value="">暂无老人</option>
              ) : (
                elders.map((elder) => (
                  <option key={elder.id} value={elder.id}>
                    {elder.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {selectedElderId && getSelectedElderName() && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '6px' }}>
            <span style={{ color: '#1e40af', fontWeight: '500' }}>
              当前查看：{getSelectedElderName()} 的探访记录
            </span>
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>老人姓名</th>
                <th>探访日期</th>
                <th>探访时间</th>
                <th>探访类型</th>
                <th>探访人</th>
                <th>老人情绪</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    加载中...
                  </td>
                </tr>
              ) : !selectedElderId ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👴</div>
                      <div>请先选择一位老人</div>
                    </div>
                  </td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <div>暂无探访记录</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedVisits.map((visit) => (
                  <tr key={visit.id}>
                    <td>{getElderName(visit.elder_id)}</td>
                    <td>{dayjs(visit.visit_date).format('YYYY-MM-DD')}</td>
                    <td>{visit.visit_time}</td>
                    <td>{getVisitTypeLabel(visit.visit_type)}</td>
                    <td>{visit.visitor_name || '-'}</td>
                    <td>{visit.elder_mood || '-'}</td>
                    <td>
                      <span className={getStatusBadgeClass(visit.status)}>
                        {getStatusLabel(visit.status)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="action-link"
                        onClick={() => alert('查看详情功能待实现')}
                      >
                        详情
                      </span>
                      <span
                        className="action-link"
                        onClick={() => alert('编辑功能待实现')}
                      >
                        编辑
                      </span>
                      <span
                        className="action-link danger"
                        onClick={() => handleDelete(visit.id)}
                      >
                        删除
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              下一页
            </button>
            <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '8px' }}>
              共 {visits.length} 条
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
