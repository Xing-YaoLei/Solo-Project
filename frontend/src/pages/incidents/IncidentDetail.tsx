import { useState, useEffect } from 'react'
import { useRouter, useParams } from '@tanstack/react-router'
import { incidentApi, IncidentOrder } from '../../api/incident'
import { elderApi, Elder } from '../../api/elder'
import dayjs from 'dayjs'

export default function IncidentDetail() {
  const router = useRouter()
  const { id } = useParams({ from: '/layout/incidents/$id' })
  const incidentId = Number(id)

  const [incident, setIncident] = useState<IncidentOrder | null>(null)
  const [elder, setElder] = useState<Elder | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  const fetchDetail = async () => {
    try {
      setLoading(true)
      const res = await incidentApi.getDetail(incidentId)
      setIncident(res.data)
      if (res.data.elder_id) {
        const elderRes = await elderApi.getDetail(res.data.elder_id)
        setElder(elderRes.data)
      }
    } catch (err) {
      console.error('获取异常单详情失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [incidentId])

  const handleStatusChange = async () => {
    if (!newStatus) return
    try {
      await incidentApi.updateStatus(incidentId, newStatus)
      setShowStatusModal(false)
      setNewStatus('')
      fetchDetail()
    } catch (err) {
      console.error('状态变更失败', err)
    }
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

  const getNextStatusOptions = () => {
    if (!incident) return []
    const statusFlow: Record<string, { value: string; label: string }[]> = {
      pending: [
        { value: 'investigating', label: '调查中' },
        { value: 'closed', label: '已结案' },
      ],
      investigating: [
        { value: 'handled', label: '已处理' },
        { value: 'closed', label: '已结案' },
      ],
      handled: [
        { value: 'closed', label: '已结案' },
      ],
      closed: [],
    }
    return statusFlow[incident.status] || []
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">异常单详情</h1>
        </div>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            加载中...
          </div>
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">异常单详情</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <div>未找到异常单信息</div>
          </div>
        </div>
      </div>
    )
  }

  const nextStatusOptions = getNextStatusOptions()

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => router.navigate({ to: '/incidents' })}
          >
            ← 返回列表
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>
            异常单详情
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {nextStatusOptions.length > 0 && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowStatusModal(true)}
            >
              变更状态
            </button>
          )}
          <button
            className="btn btn-outline btn-sm"
            onClick={() => alert('编辑功能待实现')}
          >
            编辑
          </button>
        </div>
      </div>

      <div className="incident-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="incident-order-no">
              {incident.order_no}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <span style={{ color: '#7f1d1d', fontSize: '15px' }}>
                👤 {elder?.name || '-'}
              </span>
              <span style={{ color: '#7f1d1d', fontSize: '15px' }}>
                📋 {getIncidentTypeLabel(incident.incident_type)}
              </span>
              <span className={getSeverityBadgeClass(incident.severity)}>
                {getSeverityLabel(incident.severity)}
              </span>
              <span className={getStatusBadgeClass(incident.status)}>
                {getStatusLabel(incident.status)}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', color: '#7f1d1d', fontSize: '13px' }}>
            <div>发生日期：{dayjs(incident.incident_date).format('YYYY-MM-DD')}</div>
            <div style={{ marginTop: '4px' }}>发生时间：{incident.incident_time || '-'}</div>
            <div style={{ marginTop: '4px' }}>发生地点：{incident.location || '-'}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
          核心信息
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '8px', fontWeight: '500' }}>
              影响范围
            </div>
            <div style={{ fontSize: '14px', color: '#7f1d1d', fontWeight: '600', lineHeight: '1.5' }}>
              {incident.impact_scope || '-'}
            </div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '8px', fontWeight: '500' }}>
              责任归属
            </div>
            <div style={{ fontSize: '14px', color: '#7f1d1d', fontWeight: '600', lineHeight: '1.5' }}>
              {incident.responsibility || '-'}
            </div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '8px', fontWeight: '500' }}>
              处理结果
            </div>
            <div style={{ fontSize: '14px', color: '#7f1d1d', fontWeight: '600', lineHeight: '1.5' }}>
              {incident.handling_result || '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
          详细信息
        </h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">责任人：</span>
            <span className="detail-value">{incident.responsible_person || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">预防措施：</span>
            <span className="detail-value">{incident.preventive_measures || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">处理人：</span>
            <span className="detail-value">{incident.handled_by || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">审核人：</span>
            <span className="detail-value">{incident.reviewed_by || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">结案日期：</span>
            <span className="detail-value">
              {incident.closure_date ? dayjs(incident.closure_date).format('YYYY-MM-DD') : '-'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">创建时间：</span>
            <span className="detail-value">
              {dayjs(incident.created_at).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
          事件描述
        </h3>
        <p style={{ color: '#4b5563', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {incident.description || '-'}
        </p>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
          处理过程
        </h3>
        <div className="detail-grid">
          <div className="detail-item" style={{ gridColumn: 'span 2' }}>
            <span className="detail-label">即时措施：</span>
            <span className="detail-value">{incident.immediate_actions || '-'}</span>
          </div>
          <div className="detail-item" style={{ gridColumn: 'span 2' }}>
            <span className="detail-label">医疗处理：</span>
            <span className="detail-value">{incident.medical_treatment || '-'}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
          家属通知情况
        </h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">是否通知：</span>
            <span className="detail-value">
              {incident.family_notified === 'yes' ? '已通知' : incident.family_notified === 'no' ? '未通知' : incident.family_notified || '-'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">通知时间：</span>
            <span className="detail-value">
              {incident.family_notification_time ? dayjs(incident.family_notification_time).format('YYYY-MM-DD HH:mm') : '-'}
            </span>
          </div>
          <div className="detail-item" style={{ gridColumn: 'span 2' }}>
            <span className="detail-label">家属反馈：</span>
            <span className="detail-value">{incident.family_response || '-'}</span>
          </div>
        </div>
      </div>

      {incident.remark && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            备注
          </h3>
          <p style={{ color: '#4b5563', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {incident.remark}
          </p>
        </div>
      )}

      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">变更状态</h2>
              <button
                className="modal-close"
                onClick={() => setShowStatusModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">选择新状态</label>
                <select
                  className="form-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">请选择</option>
                  {nextStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowStatusModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStatusChange}
                disabled={!newStatus}
              >
                确认变更
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
