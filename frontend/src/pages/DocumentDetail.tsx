import { useEffect, useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import dayjs from 'dayjs'
import {
  documentApi,
  auditApi,
  authApi,
} from '../lib/api'
import type {
  DocumentDetail as DocDetailType,
  Interaction,
  RiskHit,
  AuditRecord,
  DocumentStatus,
  User,
} from '../types'
import {
  STATUS_LABELS,
  DOC_TYPE_LABELS,
  INTERACTION_TYPE_LABELS,
} from '../types'
import { useAuthStore } from '../store/useAuthStore'
import StatusBadge from '../components/common/StatusBadge'

const STATUS_FLOW: DocumentStatus[] = [
  'draft',
  'interacting',
  'risk_checked',
  'version_verified',
  'pending_review',
]

export default function DocumentDetail() {
  const { id } = useParams({ strict: false }) as { id: string }
  const [doc, setDoc] = useState<DocDetailType | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [riskHits, setRiskHits] = useState<RiskHit[]>([])
  const [auditHistory, setAuditHistory] = useState<AuditRecord[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('interactions')

  const [showInteraction, setShowInteraction] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showAudit, setShowAudit] = useState(false)
  const [compareVersions, setCompareVersions] = useState<{ v1: number; v2: number } | null>(null)

  const [interactionForm, setInteractionForm] = useState({
    interaction_type: 'client_call',
    content: '',
    participants: '',
  })

  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    summary: '',
    client_name: '',
    case_no: '',
    material_tags_str: '',
    assignee_id: undefined as number | undefined,
  })

  const [auditForm, setAuditForm] = useState({
    action: 'approve' as 'approve' | 'reject',
    comments: '',
    material_tags_suggestion: '',
  })

  const hasRole = useAuthStore((s) => s.hasRole)
  const currentUser = useAuthStore((s) => s.user)

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [docRes, interRes, riskRes, auditRes] = await Promise.all([
        documentApi.get(Number(id)),
        auditApi.getInteractions(Number(id)),
        auditApi.getRiskHits(Number(id)),
        auditApi.getAuditHistory(Number(id)),
      ])
      setDoc(docRes.data)
      setInteractions(interRes.data)
      setRiskHits(riskRes.data)
      setAuditHistory(auditRes.data)

      setEditForm({
        title: docRes.data.title,
        content: docRes.data.content,
        summary: docRes.data.summary || '',
        client_name: docRes.data.client_name || '',
        case_no: docRes.data.case_no || '',
        material_tags_str: (docRes.data.material_tags || []).join(', '),
        assignee_id: docRes.data.assignee_id || undefined,
      })

      if (hasRole('admin', 'manager')) {
        const userRes = await authApi.getUsers()
        setUsers(userRes.data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [id])

  if (loading || !doc) {
    return <div className="empty-state">加载中...</div>
  }

  const currentStepIdx = STATUS_FLOW.indexOf(doc.status)

  const handleAdvanceStatus = async () => {
    try {
      await documentApi.advanceStatus(doc.id)
      fetchAll()
    } catch (err: any) {
      alert(err?.response?.data?.detail || '操作失败')
    }
  }

  const handleAddInteraction = async () => {
    if (!interactionForm.content) {
      alert('请填写互动内容')
      return
    }
    try {
      await auditApi.createInteraction({
        document_id: doc.id,
        interaction_type: interactionForm.interaction_type,
        content: interactionForm.content,
        participants: interactionForm.participants
          ? interactionForm.participants.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
          : [],
        attachments: [],
      })
      setShowInteraction(false)
      setInteractionForm({ interaction_type: 'client_call', content: '', participants: '' })
      fetchAll()
    } catch (err: any) {
      alert(err?.response?.data?.detail || '添加失败')
    }
  }

  const handleEdit = async () => {
    if (!editForm.title || !editForm.content) {
      alert('请填写标题和内容')
      return
    }
    try {
      const tags = editForm.material_tags_str
        ? editForm.material_tags_str.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
        : []
      await documentApi.update(doc.id, {
        ...editForm,
        material_tags: tags,
      })
      setShowEdit(false)
      fetchAll()
    } catch (err: any) {
      alert(err?.response?.data?.detail || '保存失败')
    }
  }

  const handleAudit = async () => {
    try {
      const tags = auditForm.material_tags_suggestion
        ? auditForm.material_tags_suggestion.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
        : []
      await auditApi.audit(doc.id, {
        action: auditForm.action,
        comments: auditForm.comments,
        material_tags_suggestion: tags,
      })
      setShowAudit(false)
      setAuditForm({ action: 'approve', comments: '', material_tags_suggestion: '' })
      fetchAll()
    } catch (err: any) {
      alert(err?.response?.data?.detail || '审核失败')
    }
  }

  const handleReanalyzeRisk = async () => {
    try {
      await auditApi.reanalyzeRisk(doc.id)
      alert('已触发风险词重新分析，请稍后刷新查看')
      setTimeout(fetchAll, 2000)
    } catch (err: any) {
      alert(err?.response?.data?.detail || '触发失败')
    }
  }

  const handleVerifyVersion = async () => {
    try {
      await auditApi.verifyVersion(doc.id)
      alert('已触发版本核对，请稍后刷新查看')
      setTimeout(fetchAll, 2000)
    } catch (err: any) {
      alert(err?.response?.data?.detail || '触发失败')
    }
  }

  const canEdit =
    hasRole('admin', 'manager') ||
    (currentUser?.id === doc.assignee_id && ['lawyer', 'assistant'].includes(currentUser?.role || ''))

  const canAdvance =
    canEdit && STATUS_FLOW.includes(doc.status) && currentStepIdx < STATUS_FLOW.length - 1

  const canAudit = hasRole('admin', 'manager', 'auditor') &&
    (doc.status === 'pending_review' || doc.status === 'rejected')

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link to="/documents" className="btn btn-sm btn-secondary">
          ← 返回列表
        </Link>
        <h1 className="page-title">{doc.title}</h1>
      </div>

      {doc.rejection_count > 0 && (
        <div
          className="card mb-4"
          style={{
            borderLeft: '4px solid #ef4444',
            background: '#fef2f2',
          }}
        >
          <div style={{ color: '#991b1b', fontWeight: 600 }}>
            ⚠ 该文书已被退回 {doc.rejection_count} 次
            {doc.review_comments && (
              <div
                style={{
                  marginTop: 8,
                  padding: 10,
                  background: 'white',
                  borderRadius: 4,
                  fontWeight: 400,
                  color: '#374151',
                  fontSize: 14,
                }}
              >
                最后审核意见：{doc.review_comments}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              {doc.title}
              <span style={{ marginLeft: 12 }}>
                <StatusBadge status={doc.status} rejectionCount={doc.rejection_count} />
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }} className="grid grid-cols-4 gap-2">
              <div>编号：{doc.document_no || '-'}</div>
              <div>类型：{DOC_TYPE_LABELS[doc.document_type]}</div>
              <div>客户：{doc.client_name || '-'}</div>
              <div>案件号：{doc.case_no || '-'}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button className="btn btn-sm btn-secondary" onClick={() => setShowEdit(true)}>
                ✏️ 编辑
              </button>
            )}
            {canAdvance && (
              <button className="btn btn-sm btn-primary" onClick={handleAdvanceStatus}>
                ➡️ 推进到下一步
              </button>
            )}
            {canAudit && (
              <button className="btn btn-sm btn-warning" onClick={() => setShowAudit(true)}>
                🔍 审核
              </button>
            )}
          </div>
        </div>

        <div className="status-flow">
          {STATUS_FLOW.map((s, idx) => (
            <span key={s}>
              <span
                className={`flow-step ${
                  idx < currentStepIdx || (currentStepIdx >= 0 && idx === currentStepIdx)
                    ? idx === currentStepIdx
                      ? 'current'
                      : 'done'
                    : ''
                }`}
              >
                {idx < currentStepIdx ? '✓ ' : ''}
                {STATUS_LABELS[s]}
              </span>
              {idx < STATUS_FLOW.length - 1 && <span className="flow-arrow">→</span>}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3" style={{ fontSize: 13 }}>
          <div>
            <span style={{ color: '#6b7280' }}>风险等级：</span>
            {doc.risk_level ? (
              <span className={`risk-pill risk-${doc.risk_level}`}>
                {doc.risk_level === 'high' ? '高' : doc.risk_level === 'medium' ? '中' : '低'}风险
                {' '}（{riskHits.length} 个命中）
              </span>
            ) : (
              <span style={{ color: '#9ca3af' }}>未检测</span>
            )}
            <button
              className="btn btn-sm btn-secondary"
              style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11 }}
              onClick={handleReanalyzeRisk}
            >
              重检
            </button>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>版本核对：</span>
            <span style={{ color: doc.is_version_verified ? '#10b981' : '#f59e0b', fontWeight: 500 }}>
              {doc.is_version_verified ? '✓ 已通过' : '⚠ 未核对'}（v{doc.current_version}）
            </span>
            <button
              className="btn btn-sm btn-secondary"
              style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11 }}
              onClick={handleVerifyVersion}
            >
              核对
            </button>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>素材标签：</span>
            {(doc.material_tags || []).length > 0
              ? (doc.material_tags || []).map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))
              : <span style={{ color: '#9ca3af' }}>未设置</span>}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            创建：{dayjs(doc.created_at).format('YYYY-MM-DD HH:mm')}
            <br />
            更新：{dayjs(doc.updated_at).format('YYYY-MM-DD HH:mm')}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {[
            { key: 'interactions', label: `💬 互动记录 (${interactions.length})` },
            { key: 'risk', label: `⚠️ 风险词命中 (${riskHits.length})` },
            { key: 'versions', label: `📑 版本历史 (${doc.versions.length})` },
            { key: 'audit', label: `📋 审核记录 (${auditHistory.length})` },
            { key: 'content', label: '📄 文书内容' },
          ].map((t) => (
            <button
              key={t.key}
              className={`tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}

          {activeTab === 'interactions' && (
            <div style={{ marginLeft: 'auto' }}>
              <button className="btn btn-sm btn-primary" onClick={() => setShowInteraction(true)}>
                + 添加互动
              </button>
            </div>
          )}
        </div>

        {activeTab === 'interactions' && (
          <div>
            {interactions.length === 0 ? (
              <div className="empty-state">暂无互动记录，点击右上角添加</div>
            ) : (
              <div className="timeline">
                {interactions.map((i) => (
                  <div key={i.id} className="timeline-item">
                    <div className="timeline-item-content">
                      <div className="flex justify-between mb-1">
                        <span className="timeline-type">
                          {INTERACTION_TYPE_LABELS[i.interaction_type as keyof typeof INTERACTION_TYPE_LABELS] ||
                            i.interaction_type}
                        </span>
                        <span className="timeline-time">
                          {dayjs(i.created_at).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                      {i.participants && i.participants.length > 0 && (
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                          参与人：{i.participants.join('、')}
                        </div>
                      )}
                      <div className="timeline-text">{i.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'risk' && (
          <div>
            {riskHits.length === 0 ? (
              <div className="empty-state">未发现风险词命中 ✓</div>
            ) : (
              <div>
                {riskHits.map((r) => (
                  <div key={r.id} className={`risk-item ${r.severity === 'high' ? 'high' : ''}`}>
                    <div className="flex justify-between items-start">
                      <span className="risk-keyword">
                        「{r.keyword}」
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 11,
                            padding: '1px 6px',
                            borderRadius: 3,
                            background: r.severity === 'high' ? '#fee2e2' : '#fef3c7',
                            color: r.severity === 'high' ? '#991b1b' : '#92400e',
                          }}
                        >
                          {r.severity === 'high' ? '高严重度' : '中严重度'}
                        </span>
                      </span>
                    </div>
                    {r.context && (
                      <div className="risk-context">
                        ...{r.context}...
                      </div>
                    )}
                    {r.suggestion && (
                      <div className="risk-suggestion">💡 建议：{r.suggestion}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'versions' && (
          <div>
            <table className="table">
              <thead>
                <tr>
                  <th>版本</th>
                  <th>标题</th>
                  <th>变更说明</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {[...doc.versions]
                  .sort((a, b) => b.version_number - a.version_number)
                  .map((v, idx) => {
                    const prev = doc.versions.find(
                      (p) => p.version_number === v.version_number - 1,
                    )
                    return (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 600 }}>
                          v{v.version_number}
                          {idx === 0 && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 11,
                                color: '#2563eb',
                                background: '#dbeafe',
                                padding: '2px 6px',
                                borderRadius: 3,
                              }}
                            >
                              当前
                            </span>
                          )}
                        </td>
                        <td>{v.title}</td>
                        <td style={{ fontSize: 13, color: '#6b7280' }}>
                          {v.change_summary || '-'}
                        </td>
                        <td style={{ fontSize: 13, color: '#6b7280' }}>
                          {dayjs(v.created_at).format('YYYY-MM-DD HH:mm')}
                        </td>
                        <td>
                          {prev && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() =>
                                setCompareVersions({
                                  v1: prev.version_number,
                                  v2: v.version_number,
                                })
                              }
                            >
                              与v{prev.version_number}对比
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>

            {compareVersions && (
              <div className="modal-overlay" onClick={() => setCompareVersions(null)}>
                <div
                  className="modal"
                  style={{ maxWidth: 900 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="modal-header">
                    <div className="modal-title">
                      版本对比：v{compareVersions.v1} → v{compareVersions.v2}
                    </div>
                    <button className="close-btn" onClick={() => setCompareVersions(null)}>
                      ×
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="version-compare">
                      <div>
                        <div className="section-title">v{compareVersions.v1}</div>
                        <div className="version-content">
                          {doc.versions.find((v) => v.version_number === compareVersions.v1)?.content}
                        </div>
                      </div>
                      <div>
                        <div className="section-title">
                          v{compareVersions.v2}（新版本）
                        </div>
                        <div className="version-content">
                          {doc.versions.find((v) => v.version_number === compareVersions.v2)?.content}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div>
            {auditHistory.length === 0 ? (
              <div className="empty-state">暂无审核记录</div>
            ) : (
              <div className="timeline">
                {auditHistory.map((a) => (
                  <div
                    key={a.id}
                    className={`timeline-item ${
                      a.action === 'reject'
                        ? 'rejected'
                        : a.action === 'approve'
                        ? 'approved'
                        : ''
                    }`}
                  >
                    <div className="timeline-item-content">
                      <div className="flex justify-between mb-1">
                        <span
                          className="timeline-type"
                          style={{
                            color:
                              a.action === 'reject'
                                ? '#dc2626'
                                : a.action === 'approve'
                                ? '#059669'
                                : '#3b82f6',
                          }}
                        >
                          {a.action === 'approve' ? '✅ 审核通过' : '❌ 审核退回'}
                        </span>
                        <span className="timeline-time">
                          {dayjs(a.created_at).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                        状态变更：
                        {a.previous_status
                          ? STATUS_LABELS[a.previous_status as DocumentStatus]
                          : '-'}
                        →{' '}
                        {a.new_status
                          ? STATUS_LABELS[a.new_status as DocumentStatus]
                          : '-'}
                      </div>
                      {a.material_tags_suggestion?.length > 0 && (
                        <div style={{ fontSize: 13, marginBottom: 6 }}>
                          建议标签：
                          {a.material_tags_suggestion.map((t) => (
                            <span key={t} className="tag">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {a.comments && (
                        <div
                          className="timeline-text"
                          style={{
                            padding: 10,
                            background: '#f3f4f6',
                            borderRadius: 4,
                          }}
                        >
                          <strong>审核意见：</strong>
                          <br />
                          {a.comments}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'content' && (
          <div
            style={{
              padding: 20,
              background: '#f9fafb',
              borderRadius: 6,
              whiteSpace: 'pre-wrap',
              lineHeight: 2,
              fontSize: 15,
            }}
          >
            {doc.content}
          </div>
        )}
      </div>

      {showInteraction && (
        <div className="modal-overlay" onClick={() => setShowInteraction(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">添加互动记录</div>
              <button className="close-btn" onClick={() => setShowInteraction(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">互动类型</label>
                <select
                  className="form-select"
                  value={interactionForm.interaction_type}
                  onChange={(e) =>
                    setInteractionForm({
                      ...interactionForm,
                      interaction_type: e.target.value,
                    })
                  }
                >
                  {Object.entries(INTERACTION_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">参与人（逗号分隔）</label>
                <input
                  type="text"
                  className="form-input"
                  value={interactionForm.participants}
                  onChange={(e) =>
                    setInteractionForm({
                      ...interactionForm,
                      participants: e.target.value,
                    })
                  }
                  placeholder="张三, 李四"
                />
              </div>
              <div className="form-group">
                <label className="form-label">内容 *</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={interactionForm.content}
                  onChange={(e) =>
                    setInteractionForm({
                      ...interactionForm,
                      content: e.target.value,
                    })
                  }
                  placeholder="请详细记录沟通内容、关键决策点、待办事项等..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowInteraction(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleAddInteraction}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">编辑文书（将创建新版本 v{doc.current_version + 1}）</div>
              <button className="close-btn" onClick={() => setShowEdit(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">标题</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">客户名称</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.client_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, client_name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">案件编号</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.case_no}
                    onChange={(e) =>
                      setEditForm({ ...editForm, case_no: e.target.value })
                    }
                  />
                </div>
              </div>
              {hasRole('admin', 'manager') && users.length > 0 && (
                <div className="form-group">
                  <label className="form-label">处理人</label>
                  <select
                    className="form-select"
                    value={editForm.assignee_id || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        assignee_id: e.target.value ? Number(e.target.value) : undefined,
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
                <label className="form-label">素材标签（逗号分隔）</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.material_tags_str}
                  onChange={(e) =>
                    setEditForm({ ...editForm, material_tags_str: e.target.value })
                  }
                  placeholder="合同审核, 客户A项目, 高优先级"
                />
              </div>
              <div className="form-group">
                <label className="form-label">内容</label>
                <textarea
                  className="form-textarea"
                  rows={10}
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">摘要 / 变更说明</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={editForm.summary}
                  onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleEdit}>
                保存（创建新版本）
              </button>
            </div>
          </div>
        </div>
      )}

      {showAudit && (
        <div className="modal-overlay" onClick={() => setShowAudit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                文书审核
                {doc.rejection_count > 0 && (
                  <span style={{ color: '#dc2626', marginLeft: 10, fontSize: 13 }}>
                    （已退回 {doc.rejection_count} 次）
                  </span>
                )}
              </div>
              <button className="close-btn" onClick={() => setShowAudit(false)}>
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
                      background: auditForm.action === 'approve' ? '#f0fdf4' : 'white',
                    }}
                  >
                    <input
                      type="radio"
                      name="action"
                      checked={auditForm.action === 'approve'}
                      onChange={() => setAuditForm({ ...auditForm, action: 'approve' })}
                      style={{ marginRight: 8 }}
                    />
                    <span style={{ color: '#10b981', fontWeight: 600 }}>✅ 通过审核</span>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      文书状态变更为「已通过」
                    </div>
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
                      background: auditForm.action === 'reject' ? '#fef2f2' : 'white',
                    }}
                  >
                    <input
                      type="radio"
                      name="action"
                      checked={auditForm.action === 'reject'}
                      onChange={() => setAuditForm({ ...auditForm, action: 'reject' })}
                      style={{ marginRight: 8 }}
                    />
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>❌ 退回修改</span>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      文书状态变更为「已退回」，退回次数 +1
                    </div>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">素材标签建议（逗号分隔，可选）</label>
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
                  placeholder="如：合同模板V2, 金融行业, 需二次复核"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  审核意见
                  {auditForm.action === 'reject' && (
                    <span style={{ color: '#dc2626' }}> *（退回时必填）</span>
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
                      ? '请详细说明退回原因，帮助起草人明确修改方向...'
                      : '可以填写通过的依据、备注信息等...'
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAudit(false)}>
                取消
              </button>
              <button
                className={auditForm.action === 'approve' ? 'btn btn-success' : 'btn btn-danger'}
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
