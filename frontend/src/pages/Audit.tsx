import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { documentApi, auditApi, authApi } from '../lib/api'
import type { Document, User, AuditRecord as AuditType } from '../types'
import { useAuthStore } from '../store/useAuthStore'
import StatusBadge from '../components/common/StatusBadge'

export default function Audit() {
  const [pendingList, setPendingList] = useState<Document[]>([])
  const [recentAudits, setRecentAudits] = useState<AuditType[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [auditForm, setAuditForm] = useState({
    action: 'approve' as 'approve' | 'reject',
    comments: '',
    material_tags_suggestion: '',
  })

  const user = useAuthStore((s) => s.user)

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [pendingRes, usersRes] = await Promise.all([
        documentApi.list({ status: 'pending_review' }),
        authApi.getUsers(),
      ])
      const rejectedRes = await documentApi.list({ status: 'rejected' })

      const merged = [...pendingRes.data, ...rejectedRes.data].sort(
        (a, b) =>
          (b.rejection_count || 0) - (a.rejection_count || 0) ||
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      setPendingList(merged)
      setUsers(usersRes.data)

      let allHistory: AuditType[] = []
      for (const d of merged.slice(0, 10)) {
        try {
          const h = await auditApi.getAuditHistory(d.id)
          allHistory = [...allHistory, ...h.data]
        } catch {}
      }
      allHistory.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      setRecentAudits(allHistory.slice(0, 20))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleAudit = async () => {
    if (!selectedDoc) return
    if (auditForm.action === 'reject' && !auditForm.comments) {
      alert('退回时必须填写审核意见')
      return
    }
    try {
      const tags = auditForm.material_tags_suggestion
        ? auditForm.material_tags_suggestion
            .split(/[,，]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : []
      await auditApi.audit(selectedDoc.id, {
        action: auditForm.action,
        comments: auditForm.comments,
        material_tags_suggestion: tags,
      })
      setSelectedDoc(null)
      setAuditForm({
        action: 'approve',
        comments: '',
        material_tags_suggestion: '',
      })
      fetchAll()
    } catch (err: any) {
      alert(err?.response?.data?.detail || '审核失败')
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="page-title">🔍 审核台</h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>
          审核员：{user?.full_name || user?.username}
        </p>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="tabs" style={{ padding: '0 20px', margin: 0 }}>
          <button
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            待办 ({pendingList.filter((d) => d.status === 'pending_review').length}{' '}
            待审 / {pendingList.filter((d) => d.status === 'rejected').length} 重审)
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            最近审核记录 ({recentAudits.length})
          </button>
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : activeTab === 'pending' ? (
            pendingList.length === 0 ? (
              <div className="empty-state">🎉 没有待审核文书，辛苦了！</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingList.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: 16,
                      border:
                        d.rejection_count > 0
                          ? '2px solid #fecaca'
                          : '1px solid #e5e7eb',
                      borderRadius: 8,
                      background: d.rejection_count > 0 ? '#fef2f2' : 'white',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            to="/documents/$id"
                            params={{ id: String(d.id) }}
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color:
                                d.rejection_count > 0 ? '#dc2626' : '#111827',
                            }}
                          >
                            {d.title}
                          </Link>
                          <StatusBadge
                            status={d.status}
                            rejectionCount={d.rejection_count}
                          />
                          {d.rejection_count > 0 && (
                            <span
                              style={{
                                fontSize: 12,
                                color: '#dc2626',
                                background: '#fee2e2',
                                padding: '2px 8px',
                                borderRadius: 4,
                              }}
                            >
                              已被退回 {d.rejection_count} 次
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: '#6b7280',
                            marginTop: 4,
                          }}
                        >
                          编号：{d.document_no} · 客户：{d.client_name || '-'} ·{' '}
                          风险等级：
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
                          {' · '}
                          更新：{dayjs(d.updated_at).format('MM-DD HH:mm')}
                        </div>
                        {d.rejection_count > 0 && d.review_comments && (
                          <div
                            style={{
                              marginTop: 10,
                              padding: 10,
                              background: '#fff7ed',
                              borderRadius: 4,
                              fontSize: 13,
                              color: '#92400e',
                            }}
                          >
                            ⚠ 上次审核意见：{d.review_comments}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2" style={{ flexShrink: 0 }}>
                        <Link
                          to="/documents/$id"
                          params={{ id: String(d.id) }}
                          className="btn btn-sm btn-secondary"
                        >
                          查看详情
                        </Link>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => {
                            setSelectedDoc(d)
                            setAuditForm({
                              action: 'approve',
                              comments: '',
                              material_tags_suggestion: '',
                            })
                          }}
                        >
                          ⚡ 快速通过
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            setSelectedDoc(d)
                            setAuditForm({
                              action: 'reject',
                              comments: '',
                              material_tags_suggestion: '',
                            })
                          }}
                        >
                          退回
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : recentAudits.length === 0 ? (
            <div className="empty-state">暂无审核记录</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>文书</th>
                  <th>操作</th>
                  <th>审核员</th>
                  <th>意见</th>
                </tr>
              </thead>
              <tbody>
                {recentAudits.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontSize: 13, color: '#6b7280' }}>
                      {dayjs(a.created_at).format('MM-DD HH:mm')}
                    </td>
                    <td>
                      <Link
                        to="/documents/$id"
                        params={{ id: String(a.document_id) }}
                        style={{ color: '#2563eb' }}
                      >
                        {pendingList.find((d) => d.id === a.document_id)
                          ?.title || `#${a.document_id}`}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`risk-pill ${
                          a.action === 'approve' ? 'risk-low' : 'risk-high'
                        }`}
                      >
                        {a.action === 'approve' ? '✅ 通过' : '❌ 退回'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {users.find((u) => u.id === a.auditor_id)?.full_name ||
                        `#${a.auditor_id}`}
                    </td>
                    <td
                      style={{
                        fontSize: 13,
                        color: '#6b7280',
                        maxWidth: 400,
                      }}
                    >
                      {a.comments || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedDoc && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                审核：{selectedDoc.title}
                {selectedDoc.rejection_count > 0 && (
                  <span
                    style={{
                      color: '#dc2626',
                      fontSize: 13,
                      marginLeft: 10,
                    }}
                  >
                    （已退回 {selectedDoc.rejection_count} 次）
                  </span>
                )}
              </div>
              <button className="close-btn" onClick={() => setSelectedDoc(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">审核操作</label>
                <div className="flex gap-3">
                  <label
                    style={{
                      flex: 1,
                      padding: 12,
                      border:
                        auditForm.action === 'approve'
                          ? '2px solid #10b981'
                          : '1px solid #d1d5db',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background:
                        auditForm.action === 'approve' ? '#f0fdf4' : 'white',
                    }}
                  >
                    <input
                      type="radio"
                      name="audit_action"
                      checked={auditForm.action === 'approve'}
                      onChange={() =>
                        setAuditForm({ ...auditForm, action: 'approve' })
                      }
                      style={{ marginRight: 8 }}
                    />
                    <span style={{ color: '#10b981', fontWeight: 600 }}>
                      ✅ 通过审核
                    </span>
                  </label>
                  <label
                    style={{
                      flex: 1,
                      padding: 12,
                      border:
                        auditForm.action === 'reject'
                          ? '2px solid #ef4444'
                          : '1px solid #d1d5db',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background:
                        auditForm.action === 'reject' ? '#fef2f2' : 'white',
                    }}
                  >
                    <input
                      type="radio"
                      name="audit_action"
                      checked={auditForm.action === 'reject'}
                      onChange={() =>
                        setAuditForm({ ...auditForm, action: 'reject' })
                      }
                      style={{ marginRight: 8 }}
                    />
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                      ❌ 退回修改
                    </span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">素材标签建议</label>
                <input
                  type="text"
                  className="form-input"
                  value={auditForm.material_tags_suggestion}
                  onChange={(e) =>
                    setAuditForm({
                      ...auditForm,
                      material_tags_suggestion: e.target.value,
                    })
                  }
                  placeholder="用逗号分隔，如：合同模板V2, 金融行业"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  审核意见
                  {auditForm.action === 'reject' && (
                    <span style={{ color: '#dc2626' }}> *</span>
                  )}
                </label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={auditForm.comments}
                  onChange={(e) =>
                    setAuditForm({ ...auditForm, comments: e.target.value })
                  }
                  placeholder={
                    auditForm.action === 'reject'
                      ? '请详细说明退回原因...'
                      : '填写通过依据或备注...'
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedDoc(null)}
              >
                取消
              </button>
              <button
                className={
                  auditForm.action === 'approve'
                    ? 'btn btn-success'
                    : 'btn btn-danger'
                }
                onClick={handleAudit}
              >
                {auditForm.action === 'approve' ? '确认通过' : '确认退回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
