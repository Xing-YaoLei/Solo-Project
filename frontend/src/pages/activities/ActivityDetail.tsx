import { useState, useEffect } from 'react'
import { useRouter, useParams } from '@tanstack/react-router'
import { activityApi, Activity, ActivitySignIn } from '../../api/activity'
import { elderApi, Elder } from '../../api/elder'
import dayjs from 'dayjs'

type TabKey = 'basic' | 'signIn'

export default function ActivityDetail() {
  const router = useRouter()
  const { id } = useParams({ from: '/layout/activities/$id' })
  const activityId = Number(id)

  const [activity, setActivity] = useState<Activity | null>(null)
  const [signIns, setSignIns] = useState<ActivitySignIn[]>([])
  const [elders, setElders] = useState<Elder[]>([])
  const [loading, setLoading] = useState(true)
  const [signInsLoading, setSignInsLoading] = useState(false)
  const [eldersLoading, setEldersLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('basic')
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [selectedElderId, setSelectedElderId] = useState<number | null>(null)
  const [healthBefore, setHealthBefore] = useState('')

  const fetchDetail = async () => {
    try {
      setLoading(true)
      const res = await activityApi.getDetail(activityId)
      setActivity(res.data)
    } catch (err) {
      console.error('获取活动详情失败', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSignIns = async () => {
    try {
      setSignInsLoading(true)
      const res = await activityApi.getSignIns(activityId)
      setSignIns(res.data)
    } catch (err) {
      console.error('获取签到列表失败', err)
    } finally {
      setSignInsLoading(false)
    }
  }

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

  useEffect(() => {
    fetchDetail()
  }, [activityId])

  useEffect(() => {
    if (activeTab === 'signIn') {
      fetchSignIns()
    }
  }, [activeTab, activityId])

  useEffect(() => {
    if (showSignInModal) {
      fetchElders()
    }
  }, [showSignInModal])

  const handleSignIn = async () => {
    if (!selectedElderId) return
    try {
      await activityApi.signIn(activityId, {
        elder_id: selectedElderId,
        health_before: healthBefore || undefined,
      })
      setShowSignInModal(false)
      setHealthBefore('')
      fetchSignIns()
    } catch (err) {
      console.error('签到失败', err)
    }
  }

  const handleSignOut = async (signInId: number) => {
    if (!confirm('确定要签退吗？')) return
    try {
      await activityApi.updateSignIn(signInId, {
        sign_out_time: dayjs().format('HH:mm:ss'),
      })
      fetchSignIns()
    } catch (err) {
      console.error('签退失败', err)
    }
  }

  const handleUpdateSignInStatus = async (signInId: number, status: string) => {
    try {
      await activityApi.updateSignIn(signInId, {
        participation_status: status,
      })
      fetchSignIns()
    } catch (err) {
      console.error('更新签到状态失败', err)
    }
  }

  const getTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      recreation: '休闲娱乐',
      exercise: '运动健身',
      education: '学习教育',
      medical: '医疗健康',
      social: '社交活动',
      other: '其他',
    }
    return map[t] || t
  }

  const getStatusBadgeClass = (s: string) => {
    const map: Record<string, string> = {
      planned: 'status-badge status-pending',
      ongoing: 'status-badge status-active',
      completed: 'status-badge status-completed',
      cancelled: 'status-badge status-inactive',
    }
    return map[s] || 'status-badge status-pending'
  }

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      planned: '计划中',
      ongoing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    }
    return map[s] || s
  }

  const getRiskLevelBadgeClass = (r: string) => {
    const map: Record<string, string> = {
      low: 'status-badge status-active',
      medium: 'status-badge status-pending',
      high: 'status-badge status-critical',
    }
    return map[r] || 'status-badge status-pending'
  }

  const getRiskLevelLabel = (r: string) => {
    const map: Record<string, string> = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
    }
    return map[r] || r
  }

  const getParticipationStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      signed_in: '已签到',
      signed_out: '已签退',
      absent: '未参加',
      partial: '部分参加',
    }
    return map[s] || s
  }

  const getParticipationStatusBadgeClass = (s: string) => {
    const map: Record<string, string> = {
      signed_in: 'status-badge status-active',
      signed_out: 'status-badge status-completed',
      absent: 'status-badge status-inactive',
      partial: 'status-badge status-pending',
    }
    return map[s] || 'status-badge status-pending'
  }

  const getElderName = (elderId: number) => {
    const elder = elders.find((e) => e.id === elderId)
    return elder?.name || ''
  }

  const getSignedInElderIds = () => {
    return signIns.map((s) => s.elder_id)
  }

  const getAvailableElders = () => {
    const signedInIds = getSignedInElderIds()
    return elders.filter((e) => !signedInIds.includes(e.id))
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'basic', label: '基本信息' },
    { key: 'signIn', label: '签到管理' },
  ]

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">活动详情</h1>
        </div>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            加载中...
          </div>
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">活动详情</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <div>未找到活动信息</div>
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
            onClick={() => router.navigate({ to: '/activities' })}
          >
            ← 返回列表
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>
            活动详情
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
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            🎉
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                {activity.name}
              </h2>
              <span className={getStatusBadgeClass(activity.status)}>
                {getStatusLabel(activity.status)}
              </span>
              <span className={getRiskLevelBadgeClass(activity.risk_level)}>
                {getRiskLevelLabel(activity.risk_level)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '24px', color: '#6b7280', fontSize: '14px' }}>
              <span>{getTypeLabel(activity.activity_type)}</span>
              <span>{dayjs(activity.activity_date).format('YYYY-MM-DD')}</span>
              <span>{activity.start_time} - {activity.end_time}</span>
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
                <span className="detail-label">活动名称：</span>
                <span className="detail-value">{activity.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">活动类型：</span>
                <span className="detail-value">{getTypeLabel(activity.activity_type)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">活动日期：</span>
                <span className="detail-value">
                  {dayjs(activity.activity_date).format('YYYY-MM-DD')}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">开始时间：</span>
                <span className="detail-value">{activity.start_time}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">结束时间：</span>
                <span className="detail-value">{activity.end_time}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">活动地点：</span>
                <span className="detail-value">{activity.location || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">最大参与人数：</span>
                <span className="detail-value">{activity.max_participants || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">负责人员：</span>
                <span className="detail-value">{activity.instructor || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">风险等级：</span>
                <span className="detail-value">{getRiskLevelLabel(activity.risk_level)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">状态：</span>
                <span className="detail-value">{getStatusLabel(activity.status)}</span>
              </div>
            </div>

            {activity.description && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                  活动描述
                </h3>
                <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{activity.description}</p>
              </div>
            )}

            {activity.equipment_needed && (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                  所需设备
                </h3>
                <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{activity.equipment_needed}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'signIn' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                签到列表
              </h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowSignInModal(true)}
                disabled={activity.status === 'completed' || activity.status === 'cancelled'}
              >
                + 签到
              </button>
            </div>

            {signInsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                加载中...
              </div>
            ) : signIns.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✍️</div>
                <div>暂无签到记录</div>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>老人姓名</th>
                      <th>签到时间</th>
                      <th>签退时间</th>
                      <th>参与状态</th>
                      <th>健康状况（活动前）</th>
                      <th>健康状况（活动后）</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signIns.map((signIn) => (
                      <tr key={signIn.id}>
                        <td>{getElderName(signIn.elder_id) || `老人#${signIn.elder_id}`}</td>
                        <td>{signIn.sign_in_time || '-'}</td>
                        <td>{signIn.sign_out_time || '-'}</td>
                        <td>
                          <span className={getParticipationStatusBadgeClass(signIn.participation_status)}>
                            {getParticipationStatusLabel(signIn.participation_status)}
                          </span>
                        </td>
                        <td>{signIn.health_before || '-'}</td>
                        <td>{signIn.health_after || '-'}</td>
                        <td>
                          {signIn.participation_status === 'signed_in' && !signIn.sign_out_time && (
                            <span
                              className="action-link"
                              onClick={() => handleSignOut(signIn.id)}
                            >
                              签退
                            </span>
                          )}
                          {signIn.participation_status !== 'absent' && (
                            <span
                              className="action-link"
                              onClick={() => handleUpdateSignInStatus(signIn.id, 'absent')}
                            >
                              标记未参加
                            </span>
                          )}
                          {signIn.participation_status === 'absent' && (
                            <span
                              className="action-link"
                              onClick={() => handleUpdateSignInStatus(signIn.id, 'signed_in')}
                            >
                              标记已参加
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showSignInModal && (
        <div className="modal-overlay" onClick={() => setShowSignInModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">新增签到</h2>
              <button
                className="modal-close"
                onClick={() => setShowSignInModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">选择老人</label>
                <select
                  className="form-select"
                  value={selectedElderId || ''}
                  onChange={(e) => setSelectedElderId(Number(e.target.value))}
                  disabled={eldersLoading}
                >
                  {eldersLoading ? (
                    <option value="">加载中...</option>
                  ) : getAvailableElders().length === 0 ? (
                    <option value="">所有老人均已签到</option>
                  ) : (
                    getAvailableElders().map((elder) => (
                      <option key={elder.id} value={elder.id}>
                        {elder.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">活动前健康状况</label>
                <textarea
                  className="form-textarea"
                  value={healthBefore}
                  onChange={(e) => setHealthBefore(e.target.value)}
                  placeholder="请输入活动前健康状况（可选）"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowSignInModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSignIn}
                disabled={!selectedElderId || getAvailableElders().length === 0}
              >
                确认签到
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
