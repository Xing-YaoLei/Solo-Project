import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { documentApi, authApi } from '../lib/api'
import type { Document, User } from '../types'
import { STATUS_LABELS, DOC_TYPE_LABELS } from '../types'
import { useAuthStore } from '../store/useAuthStore'
import StatusBadge from '../components/common/StatusBadge'

export default function Documents() {
  const [list, setList] = useState<Document[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const [filterRisk, setFilterRisk] = useState<string>('')
  const [searchClient, setSearchClient] = useState('')

  const hasRole = useAuthStore((s) => s.hasRole)

  const fetchList = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterStatus) params.status = filterStatus
      if (filterType) params.document_type = filterType
      if (filterAssignee) params.assignee_id = Number(filterAssignee)
      if (filterRisk) params.risk_level = filterRisk
      if (searchClient) params.client_name = searchClient
      const res = await documentApi.list(params)
      setList(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    if (hasRole('admin', 'manager')) {
      authApi.getUsers().then((r) => setUsers(r.data))
    }
  }, [filterStatus, filterType, filterAssignee, filterRisk, searchClient, hasRole])

  const [formData, setFormData] = useState({
    title: '',
    document_type: 'contract',
    content: '',
    summary: '',
    client_name: '',
    case_no: '',
    assignee_id: undefined as number | undefined,
  })

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      alert('请填写标题和内容')
      return
    }
    try {
      await documentApi.create(formData)
      setShowCreate(false)
      setFormData({
        title: '',
        document_type: 'contract',
        content: '',
        summary: '',
        client_name: '',
        case_no: '',
        assignee_id: undefined,
      })
      fetchList()
    } catch (err: any) {
      alert(err?.response?.data?.detail || '创建失败')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title">📄 文书管理</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + 新建文书
        </button>
      </div>

      <div className="filter-bar card">
        <div className="filter-item">
          <label className="form-label">状态</label>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label className="form-label">类型</label>
          <select
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">全部类型</option>
            {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label className="form-label">风险等级</label>
          <select
            className="form-select"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
          >
            <option value="">全部</option>
            <option value="high">高风险</option>
            <option value="medium">中风险</option>
            <option value="low">低风险</option>
          </select>
        </div>

        {hasRole('admin', 'manager') && (
          <div className="filter-item">
            <label className="form-label">处理人</label>
            <select
              className="form-select"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            >
              <option value="">全部处理人</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.username}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-item" style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label">客户名称</label>
          <input
            type="text"
            className="form-input"
            placeholder="搜索客户名称..."
            value={searchClient}
            onChange={(e) => setSearchClient(e.target.value)}
          />
        </div>

        <div className="filter-item" style={{ minWidth: 'auto' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilterStatus('')
              setFilterType('')
              setFilterAssignee('')
              setFilterRisk('')
              setSearchClient('')
            }}
          >
            重置
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : list.length === 0 ? (
          <div className="empty-state">暂无文书记录</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>文书编号</th>
                <th>标题</th>
                <th>类型</th>
                <th>客户</th>
                <th>状态</th>
                <th>风险</th>
                <th>版本</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr
                  key={d.id}
                  className={d.rejection_count > 0 ? 'rejected-row' : ''}
                >
                  <td style={{ fontSize: '13px', color: '#6b7280' }}>
                    {d.document_no || '-'}
                  </td>
                  <td>
                    <Link
                      to="/documents/$id"
                      params={{ id: String(d.id) }}
                      style={{ color: '#2563eb', fontWeight: 500 }}
                    >
                      {d.title}
                      {d.rejection_count > 0 && (
                        <span
                          style={{
                            color: '#dc2626',
                            marginLeft: 6,
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          ⚠ 已退回{d.rejection_count}次
                        </span>
                      )}
                    </Link>
                  </td>
                  <td>{DOC_TYPE_LABELS[d.document_type]}</td>
                  <td>{d.client_name || '-'}</td>
                  <td>
                    <StatusBadge
                      status={d.status}
                      rejectionCount={d.rejection_count}
                    />
                  </td>
                  <td>
                    {d.risk_level ? (
                      <span className={`risk-pill risk-${d.risk_level}`}>
                        {d.risk_level === 'high'
                          ? '高'
                          : d.risk_level === 'medium'
                          ? '中'
                          : '低'}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    v{d.current_version}
                    {d.is_version_verified ? (
                      <span style={{ color: '#10b981' }}>✓</span>
                    ) : (
                      <span style={{ color: '#f59e0b' }}>!</span>
                    )}
                  </td>
                  <td style={{ fontSize: '13px', color: '#6b7280' }}>
                    {dayjs(d.updated_at).format('MM-DD HH:mm')}
                  </td>
                  <td>
                    <Link
                      to="/documents/$id"
                      params={{ id: String(d.id) }}
                      className="btn btn-sm btn-secondary"
                    >
                      详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">新建文书</div>
              <button className="close-btn" onClick={() => setShowCreate(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">标题 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="请输入文书标题"
                />
              </div>
              <div className="form-group">
                <label className="form-label">类型</label>
                <select
                  className="form-select"
                  value={formData.document_type}
                  onChange={(e) =>
                    setFormData({ ...formData, document_type: e.target.value })
                  }
                >
                  {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">客户名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.client_name}
                  onChange={(e) =>
                    setFormData({ ...formData, client_name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">案件编号</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.case_no}
                  onChange={(e) =>
                    setFormData({ ...formData, case_no: e.target.value })
                  }
                />
              </div>
              {hasRole('admin', 'manager') && users.length > 0 && (
                <div className="form-group">
                  <label className="form-label">指派处理人</label>
                  <select
                    className="form-select"
                    value={formData.assignee_id || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignee_id: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  >
                    <option value="">不指派</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">内容 *</label>
                <textarea
                  className="form-textarea"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="请输入文书内容..."
                  rows={8}
                />
              </div>
              <div className="form-group">
                <label className="form-label">摘要</label>
                <textarea
                  className="form-textarea"
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData({ ...formData, summary: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreate}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
