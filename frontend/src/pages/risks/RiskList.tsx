import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { riskApi, RiskEvent } from '../../api/risk'
import { elderApi, Elder } from '../../api/elder'
import dayjs from 'dayjs'

const eventTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'fall', label: '跌倒' },
  { value: 'pressure_ulcer', label: '压疮' },
  { value: 'medication_error', label: '用药错误' },
  { value: 'missing', label: '走失' },
  { value: 'food_choking', label: '噎食' },
  { value: 'burn', label: '烫伤' },
  { value: 'other', label: '其他' },
]

const eventLevelOptions = [
  { value: '', label: '全部等级' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'critical', label: '严重' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
]

export default function RiskList() {
  const router = useRouter()
  const [list, setList] = useState<RiskEvent[]>([])
  const [elders, setElders] = useState<Elder[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventLevel, setEventLevel] = useState('')
  const [status, setStatus] = useState('')
  const [elderId, setElderId] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const fetchElders = async () => {
    try {
      const res = await elderApi.getList({ page_size: 100, status: 'active' })
      setElders(res.data.items)
    } catch (err) {
      console.error('获取老人列表失败', err)
    }
  }

  const fetchList = async () => {
    try {
      setLoading(true)
      const res = await riskApi.getList({
        page,
        page_size: pageSize,
        event_type: eventType || undefined,
        event_level: eventLevel || undefined,
        status: status || undefined,
        elder_id: elderId || undefined,
      })
      setList(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      console.error('获取风险事件列表失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchElders()
  }, [])

  useEffect(() => {
    fetchList()
  }, [page, eventType, eventLevel, status, elderId])

  const handleSearch = () => {
    setPage(1)
    fetchList()
  }

  const handleReset = () => {
    setKeyword('')
    setEventType('')
    setEventLevel('')
    setStatus('')
    setElderId('')
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该风险事件吗？')) return
    try {
      await riskApi.remove(id)
      fetchList()
    } catch (err) {
      console.error('删除失败', err)
    }
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await riskApi.updateStatus(id, newStatus)
      fetchList()
    } catch (err) {
      console.error('状态变更失败', err)
    }
  }

  const handleCreateIncident = async (id: number) => {
    if (!confirm('确定要为该风险事件生成异常单吗？')) return
    try {
      const res = await riskApi.createIncident(id)
      alert('异常单生成成功')
      router.navigate({ to: '/incidents/$id', params: { id: String(res.data.id) } })
    } catch (err) {
      console.error('生成异常单失败', err)
    }
  }

  const getElderName = (elderId: number) => {
    const elder = elders.find((e) => e.id === elderId)
    return elder?.name || '-'
  }

  const getEventTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      fall: '跌倒',
      pressure_ulcer: '压疮',
      medication_error: '用药错误',
      missing: '走失',
      food_choking: '噎食',
      burn: '烫伤',
      other: '其他',
    }
    return map[t] || t
  }

  const getEventLevelBadgeClass = (l: string) => {
    const map: Record<string, string> = {
      low: 'status-badge status-active',
      medium: 'status-badge status-pending',
      high: 'status-badge status-warning',
      critical: 'status-badge status-critical',
    }
    return map[l] || 'status-badge status-pending'
  }

  const getEventLevelLabel = (l: string) => {
    const map: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '严重',
    }
    return map[l] || l
  }

  const getStatusBadgeClass = (s: string) => {
    const map: Record<string, string> = {
      pending: 'status-badge status-pending',
      processing: 'status-badge status-active',
      resolved: 'status-badge status-completed',
      closed: 'status-badge status-inactive',
    }
    return map[s] || 'status-badge status-pending'
  }

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      closed: '已关闭',
    }
    return map[s] || s
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">风险事件</h1>
        <button
          className="btn btn-primary"
          onClick={() => alert('新增功能待实现')}
        >
          + 新增风险事件
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input
            type="text"
            className="form-input"
            placeholder="搜索事件描述..."
            style={{ width: '240px' }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            className="form-select"
            style={{ width: '140px' }}
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            {eventTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: '140px' }}
            value={eventLevel}
            onChange={(e) => setEventLevel(e.target.value)}
          >
            {eventLevelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: '140px' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: '160px' }}
            value={elderId}
            onChange={(e) => setElderId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">全部老人</option>
            {elders.map((elder) => (
              <option key={elder.id} value={elder.id}>
                {elder.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleSearch}>
            搜索
          </button>
          <button className="btn btn-outline" onClick={handleReset}>
            重置
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>老人姓名</th>
                <th>事件类型</th>
                <th>事件等级</th>
                <th>事件日期</th>
                <th>事件时间</th>
                <th>地点</th>
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
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div>暂无数据</div>
                    </div>
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.id}>
                    <td>{getElderName(item.elder_id)}</td>
                    <td>{getEventTypeLabel(item.event_type)}</td>
                    <td>
                      <span className={getEventLevelBadgeClass(item.event_level)}>
                        {getEventLevelLabel(item.event_level)}
                      </span>
                    </td>
                    <td>{dayjs(item.event_date).format('YYYY-MM-DD')}</td>
                    <td>{item.event_time || '-'}</td>
                    <td>{item.location || '-'}</td>
                    <td>
                      <span className={getStatusBadgeClass(item.status)}>
                        {getStatusLabel(item.status)}
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
                      {item.status !== 'closed' && (
                        <span
                          className="action-link"
                          onClick={() => handleStatusChange(item.id, item.status === 'pending' ? 'processing' : item.status === 'processing' ? 'resolved' : 'closed')}
                        >
                          变更状态
                        </span>
                      )}
                      <span
                        className="action-link"
                        onClick={() => handleCreateIncident(item.id)}
                      >
                        生成异常单
                      </span>
                      <span
                        className="action-link danger"
                        onClick={() => handleDelete(item.id)}
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
              共 {total} 条
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
