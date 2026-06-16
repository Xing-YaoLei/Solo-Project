import { useState, useEffect, Fragment } from 'react'
import { auditApi, AuditLog } from '../../api/audit'
import dayjs from 'dayjs'

const entityTypeOptions = [
  { value: '', label: '全部实体' },
  { value: 'elder', label: '老人档案' },
  { value: 'medication', label: '用药清单' },
  { value: 'visit', label: '探访记录' },
  { value: 'activity', label: '活动签到' },
  { value: 'risk', label: '风险事件' },
  { value: 'incident', label: '异常单' },
]

const actionOptions = [
  { value: '', label: '全部操作' },
  { value: 'create', label: '创建' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'status_change', label: '状态变更' },
]

const actionColorMap: Record<string, { badge: string; text: string }> = {
  create: { badge: 'status-badge status-active', text: '创建' },
  update: { badge: 'status-badge status-completed', text: '更新' },
  delete: { badge: 'status-badge status-critical', text: '删除' },
  status_change: { badge: 'status-badge status-pending', text: '状态变更' },
}

const entityTypeLabelMap: Record<string, string> = {
  elder: '老人档案',
  medication: '用药清单',
  visit: '探访记录',
  activity: '活动签到',
  risk: '风险事件',
  incident: '异常单',
}

export default function AuditLogPage() {
  const [list, setList] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [userId, setUserId] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchList = async () => {
    try {
      setLoading(true)
      const res = await auditApi.getList({
        page,
        page_size: pageSize,
        entity_type: entityType || undefined,
        action: action || undefined,
        user_id: userId ? Number(userId) : undefined,
      })
      setList(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      console.error('获取审计日志失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [page, entityType, action, userId])

  const handleSearch = () => {
    setPage(1)
    fetchList()
  }

  const handleReset = () => {
    setEntityType('')
    setAction('')
    setUserId('')
    setPage(1)
  }

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getActionBadge = (act: string) => {
    const config = actionColorMap[act] || actionColorMap.update
    return <span className={config.badge}>{config.text || act}</span>
  }

  const getEntityTypeLabel = (type: string) => {
    return entityTypeLabelMap[type] || type
  }

  const formatJsonValue = (value?: string) => {
    if (!value) return '-'
    try {
      const parsed = JSON.parse(value)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return value
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">审计日志</h1>
      </div>

      <div className="card">
        <div className="search-bar">
          <select
            className="form-select"
            style={{ width: '160px' }}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            {entityTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: '140px' }}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            {actionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="form-input"
            placeholder="用户ID"
            style={{ width: '120px' }}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
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
                <th style={{ width: '50px' }}></th>
                <th>时间</th>
                <th>操作人</th>
                <th>实体类型</th>
                <th>实体ID</th>
                <th>操作类型</th>
                <th>字段</th>
                <th>备注</th>
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
                list.map((log) => (
                  <Fragment key={log.id}>
                    <tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleExpand(log.id)}
                    >
                      <td>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {expandedId === log.id ? '▼' : '▶'}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#6b7280' }}>
                        {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                      </td>
                      <td>
                        {log.user_full_name || (log.user_id ? `用户 ${log.user_id}` : '-')}
                      </td>
                      <td>{getEntityTypeLabel(log.entity_type)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                        #{log.entity_id}
                      </td>
                      <td>{getActionBadge(log.action)}</td>
                      <td style={{ color: '#6b7280', fontSize: '13px' }}>
                        {log.field_name || '-'}
                      </td>
                      <td style={{ color: '#6b7280', fontSize: '13px' }}>
                        {log.remark || '-'}
                      </td>
                    </tr>
                    {expandedId === log.id && (log.old_value || log.new_value) && (
                      <tr>
                        <td colSpan={8} style={{ padding: 0, background: '#f9fafb' }}>
                          <div
                            style={{
                              padding: '16px 20px',
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '20px',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#6b7280',
                                  marginBottom: '8px',
                                }}
                              >
                                旧值 (old_value)
                              </div>
                              <pre
                                style={{
                                  background: 'white',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  border: '1px solid #e5e7eb',
                                  fontSize: '12px',
                                  color: '#991b1b',
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-all',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                }}
                              >
                                {formatJsonValue(log.old_value)}
                              </pre>
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#6b7280',
                                  marginBottom: '8px',
                                }}
                              >
                                新值 (new_value)
                              </div>
                              <pre
                                style={{
                                  background: 'white',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  border: '1px solid #e5e7eb',
                                  fontSize: '12px',
                                  color: '#065f46',
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-all',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                }}
                              >
                                {formatJsonValue(log.new_value)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
