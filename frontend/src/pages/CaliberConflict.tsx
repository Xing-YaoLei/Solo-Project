import { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { conflictApi } from '../api'

const COLORS = ['#4f6ef7', '#36cfc9', '#ffc53d', '#ff7a45', '#9254de', '#597ef7', '#73d13d']

interface ConflictStats {
  total: number
  pending: number
  resolved: number
  field_distribution: Record<string, number>
}

interface Conflict {
  id: number
  conflict_id: string
  patient_id: string
  conflict_field: string
  source_system_a: string
  value_a: string
  source_system_b: string
  value_b: string
  resolution_status: string
}

const STATUS_MAP: Record<string, { label: string; tagClass: string }> = {
  pending: { label: '待处理', tagClass: 'tag-pending' },
  resolved: { label: '已解决', tagClass: 'tag-success' },
  dismissed: { label: '已忽略', tagClass: 'tag-warning' },
}

export default function CaliberConflict() {
  const [stats, setStats] = useState<ConflictStats | null>(null)
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalConflict, setModalConflict] = useState<Conflict | null>(null)
  const [resolvedBy, setResolvedBy] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')

  const fetchStats = () => {
    conflictApi.getConflictStats().then(res => setStats(res.data))
  }

  const fetchConflicts = () => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (sourceFilter) params.source_system = sourceFilter
    conflictApi.getConflicts(params).then(res => setConflicts(res.data))
  }

  useEffect(() => {
    Promise.all([conflictApi.getConflictStats(), conflictApi.getConflicts()])
      .then(([statsRes, conflictsRes]) => {
        setStats(statsRes.data)
        setConflicts(conflictsRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchConflicts()
  }, [statusFilter, sourceFilter])

  const handleResolve = async (resolutionStatus: string) => {
    if (!modalConflict) return
    await conflictApi.resolveConflict(modalConflict.id, {
      resolution_status: resolutionStatus,
      resolved_by: resolvedBy,
      resolution_notes: resolutionNotes,
      keep_both: true,
    })
    setModalConflict(null)
    setResolvedBy('')
    setResolutionNotes('')
    fetchStats()
    fetchConflicts()
  }

  const pieOption = stats && Object.keys(stats.field_distribution).length
    ? {
        color: COLORS,
        tooltip: { trigger: 'item' as const },
        legend: { bottom: 0, type: 'scroll' as const },
        series: [
          {
            type: 'pie' as const,
            radius: ['35%', '60%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
            label: { show: true, formatter: '{b}: {d}%' },
            data: Object.entries(stats.field_distribution).map(([name, value]) => ({
              name,
              value,
            })),
          },
        ],
      }
    : null

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>加载中...</div>
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.total ?? '-'}</div>
          <div className="stat-label">总冲突数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#096dd9' }}>{stats?.pending ?? '-'}</div>
          <div className="stat-label">待处理</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#389e0d' }}>{stats?.resolved ?? '-'}</div>
          <div className="stat-label">已解决</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="section-title">冲突概览</div>
          {pieOption && <ReactECharts option={pieOption} style={{ height: 300 }} />}
        </div>
        <div className="card">
          <div className="section-title">筛选条件</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 180 }}>
              <label>状态</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">全部</option>
                <option value="pending">待处理</option>
                <option value="resolved">已解决</option>
                <option value="dismissed">已忽略</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 180 }}>
              <label>来源系统</label>
              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                <option value="">全部</option>
                <option value="appointment_system">预约系统</option>
                <option value="imaging_system">影像系统</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title">口径冲突差异表</div>
        <table>
          <thead>
            <tr>
              <th>冲突ID</th>
              <th>患者ID</th>
              <th>冲突字段</th>
              <th>来源A</th>
              <th>A值</th>
              <th>来源B</th>
              <th>B值</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {conflicts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                  暂无冲突数据
                </td>
              </tr>
            ) : (
              conflicts.map(c => {
                const statusInfo = STATUS_MAP[c.resolution_status] ?? { label: c.resolution_status, tagClass: '' }
                return (
                  <tr key={c.id}>
                    <td>{c.conflict_id}</td>
                    <td>{c.patient_id}</td>
                    <td>{c.conflict_field}</td>
                    <td>{c.source_system_a}</td>
                    <td style={{ color: '#4f6ef7', fontWeight: 600 }}>{c.value_a}</td>
                    <td>{c.source_system_b}</td>
                    <td style={{ color: '#ff7a45', fontWeight: 600 }}>{c.value_b}</td>
                    <td>
                      <span className={`tag ${statusInfo.tagClass}`}>{statusInfo.label}</span>
                    </td>
                    <td>
                      {c.resolution_status === 'pending' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setModalConflict(c)}
                        >
                          解决(保留差异)
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {modalConflict && (
        <div className="modal-overlay" onClick={() => setModalConflict(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>解决口径冲突</h3>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: 16, borderRadius: 8, background: '#f0f5ff', border: '1px solid #adc6ff' }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>来源A: {modalConflict.source_system_a}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#4f6ef7' }}>{modalConflict.value_a}</div>
              </div>
              <div style={{ flex: 1, padding: 16, borderRadius: 8, background: '#fff7e6', border: '1px solid #ffd591' }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>来源B: {modalConflict.source_system_b}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#ff7a45' }}>{modalConflict.value_b}</div>
              </div>
            </div>

            <div style={{ padding: 12, borderRadius: 6, background: '#f6ffed', border: '1px solid #b7eb8f', marginBottom: 16, fontSize: 13, color: '#389e0d' }}>
              注意：解决冲突将保留双方数据，不会覆盖任何一方
            </div>

            <div className="form-group">
              <label>冲突字段</label>
              <div style={{ padding: '8px 12px', background: '#fafbfc', borderRadius: 6, fontSize: 13 }}>
                {modalConflict.conflict_field}
              </div>
            </div>

            <div className="form-group">
              <label>处理人</label>
              <input
                placeholder="请输入处理人姓名"
                value={resolvedBy}
                onChange={e => setResolvedBy(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>处理说明</label>
              <textarea
                placeholder="请输入处理说明（将记录双方数据均被保留）"
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, minHeight: 80, resize: 'vertical' }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setModalConflict(null)}>取消</button>
              <button className="btn btn-danger" onClick={() => handleResolve('dismissed')}>
                忽略(保留差异)
              </button>
              <button className="btn btn-primary" onClick={() => handleResolve('resolved')}>
                解决(保留差异)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
