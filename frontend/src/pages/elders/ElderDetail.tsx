import { useState, useEffect } from 'react'
import { useRouter, useParams } from '@tanstack/react-router'
import { elderApi, Elder } from '../../api/elder'
import { medicationApi, Medication } from '../../api/medication'
import { visitApi, VisitRecord } from '../../api/visit'
import { auditApi, AuditLog } from '../../api/audit'
import dayjs from 'dayjs'

type TabKey = 'basic' | 'medication' | 'visit' | 'audit'

export default function ElderDetail() {
  const router = useRouter()
  const { id } = useParams({ from: '/layout/elders/$id' })
  const elderId = Number(id)

  const [elder, setElder] = useState<Elder | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [visits, setVisits] = useState<VisitRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('basic')

  const fetchDetail = async () => {
    try {
      setLoading(true)
      const res = await elderApi.getDetail(elderId)
      setElder(res.data)
    } catch (err) {
      console.error('获取老人详情失败', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMedications = async () => {
    try {
      const res = await medicationApi.getList(elderId)
      setMedications(res.data)
    } catch (err) {
      console.error('获取用药记录失败', err)
    }
  }

  const fetchVisits = async () => {
    try {
      const res = await visitApi.getList(elderId)
      setVisits(res.data)
    } catch (err) {
      console.error('获取探访记录失败', err)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const res = await auditApi.getEntityHistory('elder', elderId)
      setAuditLogs(res.data)
    } catch (err) {
      console.error('获取审计历史失败', err)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [elderId])

  useEffect(() => {
    if (activeTab === 'medication') {
      fetchMedications()
    } else if (activeTab === 'visit') {
      fetchVisits()
    } else if (activeTab === 'audit') {
      fetchAuditLogs()
    }
  }, [activeTab, elderId])

  const getGenderLabel = (gender: string) => {
    const map: Record<string, string> = {
      male: '男',
      female: '女',
    }
    return map[gender] || gender
  }

  const getHealthStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      healthy: '健康',
      sub_healthy: '亚健康',
      ill: '患病',
      critical: '危重',
    }
    return map[s] || s
  }

  const getCareLevelLabel = (s: string) => {
    const map: Record<string, string> = {
      independent: '自理',
      semi_care: '半护理',
      full_care: '全护理',
      special_care: '特护',
    }
    return map[s] || s
  }

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      active: '在院',
      inactive: '离院',
    }
    return map[s] || s
  }

  const getStatusBadgeClass = (s: string) => {
    const map: Record<string, string> = {
      active: 'status-badge status-active',
      inactive: 'status-badge status-inactive',
    }
    return map[s] || 'status-badge status-pending'
  }

  const getMedicationStatusBadgeClass = (s: string) => {
    const map: Record<string, string> = {
      active: 'status-badge status-active',
      discontinued: 'status-badge status-inactive',
      pending: 'status-badge status-pending',
    }
    return map[s] || 'status-badge status-pending'
  }

  const getMedicationStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      active: '服用中',
      discontinued: '已停用',
      pending: '待开始',
    }
    return map[s] || s
  }

  const calculateAge = (birthDate: string) => {
    return dayjs().diff(dayjs(birthDate), 'year')
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'basic', label: '基本信息' },
    { key: 'medication', label: '用药记录' },
    { key: 'visit', label: '探访记录' },
    { key: 'audit', label: '审计历史' },
  ]

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">老人详情</h1>
        </div>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            加载中...
          </div>
        </div>
      </div>
    )
  }

  if (!elder) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">老人详情</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <div>未找到老人信息</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => router.navigate({ to: '/elders' })}
          >
            ← 返回列表
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>
            老人详情
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => alert('编辑功能待实现')}
          >
            编辑
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: '600',
            }}
          >
            {elder.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                {elder.name}
              </h2>
              <span className={getStatusBadgeClass(elder.status)}>
                {getStatusLabel(elder.status)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '24px', color: '#6b7280', fontSize: '14px' }}>
              <span>{getGenderLabel(elder.gender)}</span>
              <span>{calculateAge(elder.birth_date)} 岁</span>
              <span>房间号：{elder.room_number || '-'}</span>
              <span>床号：{elder.bed_number || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {activeTab === 'basic' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              基本信息
            </h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">姓名：</span>
                <span className="detail-value">{elder.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">性别：</span>
                <span className="detail-value">{getGenderLabel(elder.gender)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">出生日期：</span>
                <span className="detail-value">
                  {dayjs(elder.birth_date).format('YYYY-MM-DD')}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">年龄：</span>
                <span className="detail-value">{calculateAge(elder.birth_date)} 岁</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">身份证号：</span>
                <span className="detail-value">{elder.id_card}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">联系电话：</span>
                <span className="detail-value">{elder.phone || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">紧急联系人：</span>
                <span className="detail-value">{elder.emergency_contact || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">紧急联系电话：</span>
                <span className="detail-value">{elder.emergency_phone || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">家庭住址：</span>
                <span className="detail-value">{elder.address || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">健康状态：</span>
                <span className="detail-value">{getHealthStatusLabel(elder.health_status)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">护理等级：</span>
                <span className="detail-value">{getCareLevelLabel(elder.care_level)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">房间号：</span>
                <span className="detail-value">{elder.room_number || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">床号：</span>
                <span className="detail-value">{elder.bed_number || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">入院日期：</span>
                <span className="detail-value">
                  {elder.admission_date ? dayjs(elder.admission_date).format('YYYY-MM-DD') : '-'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">行动能力：</span>
                <span className="detail-value">{elder.mobility_level || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">认知能力：</span>
                <span className="detail-value">{elder.cognitive_level || '-'}</span>
              </div>
            </div>

            {elder.medical_history && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                  病史
                </h3>
                <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{elder.medical_history}</p>
              </div>
            )}

            {elder.allergies && (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                  过敏史
                </h3>
                <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{elder.allergies}</p>
              </div>
            )}

            {elder.dietary_restrictions && (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                  饮食限制
                </h3>
                <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{elder.dietary_restrictions}</p>
              </div>
            )}

            {elder.remark && (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                  备注
                </h3>
                <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{elder.remark}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'medication' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                用药记录
              </h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => alert('新增用药功能待实现')}
              >
                + 新增用药
              </button>
            </div>
            {medications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💊</div>
                <div>暂无用药记录</div>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>药品名称</th>
                      <th>通用名</th>
                      <th>剂量</th>
                      <th>频次</th>
                      <th>给药途径</th>
                      <th>开始日期</th>
                      <th>结束日期</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((med) => (
                      <tr key={med.id}>
                        <td>{med.drug_name}</td>
                        <td>{med.generic_name || '-'}</td>
                        <td>{med.dosage}</td>
                        <td>{med.frequency}</td>
                        <td>{med.route}</td>
                        <td>
                          {med.start_date ? dayjs(med.start_date).format('YYYY-MM-DD') : '-'}
                        </td>
                        <td>
                          {med.end_date ? dayjs(med.end_date).format('YYYY-MM-DD') : '-'}
                        </td>
                        <td>
                          <span className={getMedicationStatusBadgeClass(med.status)}>
                            {getMedicationStatusLabel(med.status)}
                          </span>
                        </td>
                        <td>
                          <span className="action-link" onClick={() => alert('编辑功能待实现')}>
                            编辑
                          </span>
                          <span
                            className="action-link"
                            onClick={() => alert('状态变更功能待实现')}
                          >
                            状态变更
                          </span>
                          <span className="action-link danger" onClick={() => alert('删除功能待实现')}>
                            删除
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'visit' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                探访记录
              </h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => alert('新增探访功能待实现')}
              >
                + 新增探访
              </button>
            </div>
            {visits.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <div>暂无探访记录</div>
              </div>
            ) : (
              <div>
                {visits.map((visit) => (
                  <div key={visit.id} className="audit-item">
                    <div className="audit-header">
                    <span className="audit-action">
                      {visit.visitor_name || '匿名访客'} · {visit.visitor_relation || ''}
                    </span>
                    <span className="audit-time">
                      {dayjs(visit.visit_date).format('YYYY-MM-DD')} {visit.visit_time}
                    </span>
                    </div>
                    <div className="audit-content">
                      <p><strong>探访类型：</strong>{visit.visit_type}</p>
                      {visit.visit_duration && <p><strong>探访时长：</strong>{visit.visit_duration} 分钟</p>}
                      {visit.physical_condition && <p><strong>身体状况：</strong>{visit.physical_condition}</p>}
                      {visit.mental_condition && <p><strong>精神状态：</strong>{visit.mental_condition}</p>}
                      {visit.elder_mood && <p><strong>老人情绪：</strong>{visit.elder_mood}</p>}
                      {visit.conversation_content && (
                        <p><strong>谈话内容：</strong>{visit.conversation_content}</p>
                      )}
                      {visit.needs_follow_up && (
                        <p><strong>是否需要跟进：</strong>{visit.needs_follow_up}</p>
                      )}
                      {visit.remark && <p><strong>备注：</strong>{visit.remark}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              审计历史
            </h3>
            {auditLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <div>暂无审计记录</div>
              </div>
            ) : (
              <div>
                {auditLogs.map((log) => (
                <div key={log.id} className="audit-item">
                  <div className="audit-header">
                    <span className="audit-action">{log.action}</span>
                    <span className="audit-time">
                      {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  </div>
                  <div className="audit-content">
                    <p>
                      <strong>操作人：</strong>
                      {log.user_full_name || '系统'}
                    </p>
                    {log.field_name && (
                      <p>
                        <strong>字段：</strong>
                        {log.field_name}
                      </p>
                    )}
                    {log.old_value && (
                      <p>
                        <strong>旧值：</strong>
                        {log.old_value}
                      </p>
                    )}
                    {log.new_value && (
                      <p>
                        <strong>新值：</strong>
                        {log.new_value}
                      </p>
                    )}
                    {log.remark && (
                      <p>
                        <strong>备注：</strong>
                        {log.remark}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
