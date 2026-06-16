import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { incidentApi, IncidentOrder } from '../../api/incident'
import { elderApi, Elder } from '../../api/elder'
import dayjs from 'dayjs'

const incidentTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'fall', label: '跌倒' },
  { value: 'pressure_ulcer', label: '压疮' },
  { value: 'medication_error', label: '用药错误' },
  { value: 'missing', label: '走失' },
  { value: 'food_choking', label: '噎食' },
  { value: 'burn', label: '烫伤' },
  { value: 'other', label: '其他' },
]

const severityOptions = [
  { value: '', label: '全部严重程度' },
  { value: 'mild', label: '轻微' },
  { value: 'moderate', label: '一般' },
  { value: 'severe', label: '严重' },
  { value: 'critical', label: '重大' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'investigating', label: '调查中' },
  { value: 'handled', label: '已处理' },
  { value: 'closed', label: '已结案' },
]

export default function IncidentList() {
  const router = useRouter()
  const [list, setList] = useState<IncidentOrder[]>([])
  const [elders, setElders] = useState<Elder[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [incidentType, setIncidentType] = useState('')
  const [severity, setSeverity] = useState('')
  const [status, setStatus] = useState('')
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
      const res = await incidentApi.getList({
        page,
        page_size: pageSize,
        incident_type: incidentType || undefined,
        severity: severity || undefined,
        status: status || undefined,
      })
      setList(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      console.error('获取异常单列表失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchElders()
  }, [])

  useEffect(() => {
    fetchList()
  }, [page, incidentType, severity, status])

  const handleSearch = () => {
    setPage(1)
    fetchList()
  }

  const handleReset = () => {
    setKeyword('')
    setIncidentType('')
    setSeverity('')
    setStatus('')
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该异常单吗？')) return
    try {
      await incidentApi.remove(id)
      fetchList()
    } catch (err) {
      console.error('删除失败', err)
    }
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await incidentApi.updateStatus(id, newStatus)
      fetchList()
    } catch (err) {
      console.error('状态变更失败', err)
    }
  }

  const getElderName = (elderId: number) => {
    const elder = elders.find((e) => e.id === elderId)
    return elder?.name || '-'
  }

  const getIncidentTypeLabel = (t: string) => {
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

  const getSeverityBadgeClass = (s: string) => {
    const map: Record<string, string> = {
      mild: 'status-badge status-active',
      moderate: 'status-badge status-pending',
      severe: 'status-badge status-warning',
      critical: 'status-badge status-critical',
    }
    return map[s] || 'status-badge status-pending'
  }

  const getSeverityLabel = (s: string) => {
    const map: Record<string, string> = {
      mild: '轻微',
      moderate: '一般',
      severe: '严重',
      critical: '重大',
    }
    return map[s] || s
  }

  const getStatusBadgeClass = (s: string) => {
    const map: Record<string, string> = {
      pending: 'status-badge status-pending',
      investigating: 'status-badge status-active',
      handled: 'status-badge status-completed',
      closed: 'status-badge status-inactive',
    }
    return map[s] || 'status-badge status-pending'
  }

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: '待处理',
      investigating: '调查中',
      handled: '已处理',
      closed: '已结案',
    }
    return map[s] || s
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">异常单管理</h1>
        <button
          className="btn btn-primary"
          onClick={() => alert('新增功能待实现')}
        >
          + 新增异常单
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input
            type="text"
            className="form-input"
            placeholder="搜索异常单号、描述..."
            style={{ width: '240px' }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            className="form-select"
            style={{ width: '140px' }}
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
          >
            {incidentTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: '140px' }}
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            {severityOptions.map((opt) => (
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
                <th>异常单号</th>
                <th>老人姓名</th>
                <th>异常类型</th>
                <th>严重程度</th>
                <th>发生日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    加载中...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div>暂无数据</div>
                    </div>
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '600', color: '#991b1b' }}>
                      {item.order_no}
                    </td>
                    <td>{getElderName(item.elder_id)}</td>
                    <td>{getIncidentTypeLabel(item.incident_type)}</td>
                    <td>
                      <span className={getSeverityBadgeClass(item.severity)}>
                        {getSeverityLabel(item.severity)}
                      </span>
                    </td>
                    <td>{dayjs(item.incident_date).format('YYYY-MM-DD')}</td>
                    <td>
                      <span className={getStatusBadgeClass(item.status)}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="action-link"
                        onClick={() => router.navigate({ to: '/incidents/$id', params: { id: String(item.id) } })}
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
                          onClick={() => handleStatusChange(item.id, item.status === 'pending' ? 'investigating' : item.status === 'investigating' ? 'handled' : 'closed')}
                        >
                          变更状态
                        </span>
                      )}
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
