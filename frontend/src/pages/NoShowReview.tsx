import { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { warningApi } from '../api'

const COLORS = ['#4f6ef7', '#36cfc9', '#ffc53d', '#ff7a45', '#9254de', '#597ef7', '#73d13d']

interface HighRiskPatient {
  patient_id: string
  patient_name: string
  no_show_count: number
  follow_up_count: number
  follow_up_rate: number
}

interface NoShowAnalysis {
  total_no_shows: number
  follow_up_count: number
  overall_follow_up_rate: number
  high_risk_patients: HighRiskPatient[]
}

interface ReviewItem {
  id: number
  review_id: string
  patient_id: string
  patient_name?: string
  no_show_date: string
  follow_up_rate: number
  historical_no_show_count: number
  status: string
  review_status: string
  review_materials?: ReviewMaterials
}

interface ReviewMaterials {
  patient_info?: Record<string, unknown>
  no_show_summary?: Record<string, unknown>
  historical_no_shows?: Record<string, unknown>[]
  recent_visits?: Record<string, unknown>[]
  review_suggestions?: string[]
  [key: string]: unknown
}

function getRateTag(rate: number) {
  if (rate < 30) return <span className="tag tag-danger">{rate.toFixed(1)}%</span>
  if (rate < 60) return <span className="tag tag-warning">{rate.toFixed(1)}%</span>
  return <span className="tag tag-success">{rate.toFixed(1)}%</span>
}

export default function NoShowReview() {
  const [analysis, setAnalysis] = useState<NoShowAnalysis | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [materials, setMaterials] = useState<ReviewMaterials | null>(null)
  const [materialsPatientId, setMaterialsPatientId] = useState('')
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => {
    loadAnalysis()
    loadReviews()
  }, [])

  useEffect(() => {
    loadReviews()
  }, [statusFilter])

  const loadAnalysis = () => {
    warningApi.getNoShowAnalysis().then(res => {
      setAnalysis(res.data.no_show_analysis ?? res.data)
    }).finally(() => setLoading(false))
  }

  const loadReviews = () => {
    warningApi.getNoShowReviews(statusFilter || undefined).then(res => {
      setReviews(res.data.reviews ?? res.data)
    })
  }

  const handleGenerate = async (patientId: string) => {
    setGenerating(patientId)
    try {
      await warningApi.createNoShowReview(patientId)
      loadAnalysis()
      loadReviews()
    } finally {
      setGenerating(null)
    }
  }

  const handleViewDetail = async (patientId: string) => {
    const res = await warningApi.getNoShowReviewMaterials(patientId)
    setMaterials(res.data.review_materials ?? res.data)
    setMaterialsPatientId(patientId)
    setModalOpen(true)
  }

  const handleMarkComplete = async (id: number) => {
    await warningApi.updateNoShowReview(id, 'completed')
    loadReviews()
  }

  const barOption = analysis?.high_risk_patients?.length
    ? {
        color: COLORS,
        tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
        grid: { left: 50, right: 30, top: 20, bottom: 60 },
        xAxis: {
          type: 'category' as const,
          data: analysis.high_risk_patients.slice(0, 10).map(p => p.patient_name || p.patient_id),
          axisLabel: { rotate: 30, fontSize: 11 },
        },
        yAxis: {
          type: 'value' as const,
          name: '复诊率(%)',
          max: 100,
        },
        series: [
          {
            type: 'bar' as const,
            data: analysis.high_risk_patients.slice(0, 10).map(p => ({
              value: Number(p.follow_up_rate.toFixed(1)),
              itemStyle: {
                color: p.follow_up_rate < 30 ? '#ff4d4f' : p.follow_up_rate < 60 ? '#faad14' : '#52c41a',
              },
            })),
            barWidth: 32,
            itemStyle: { borderRadius: [4, 4, 0, 0] },
            label: { show: true, position: 'top' as const, formatter: '{c}%' },
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
          <div className="stat-value">{analysis?.total_no_shows ?? '-'}</div>
          <div className="stat-label">总爽约次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analysis?.follow_up_count ?? '-'}</div>
          <div className="stat-label">复诊人数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {analysis ? `${analysis.overall_follow_up_rate.toFixed(1)}%` : '-'}
          </div>
          <div className="stat-label">整体复诊率</div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">高风险患者</div>
        {barOption && (
          <ReactECharts option={barOption} style={{ height: 320 }} />
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr>
              <th>患者姓名</th>
              <th>患者ID</th>
              <th>爽约次数</th>
              <th>复诊次数</th>
              <th>复诊率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {analysis?.high_risk_patients?.map(p => (
              <tr key={p.patient_id}>
                <td>{p.patient_name || '-'}</td>
                <td>{p.patient_id}</td>
                <td>{p.no_show_count}</td>
                <td>{p.follow_up_count}</td>
                <td>{getRateTag(p.follow_up_rate)}</td>
                <td>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={generating === p.patient_id}
                    onClick={() => handleGenerate(p.patient_id)}
                  >
                    {generating === p.patient_id ? '生成中...' : '生成复盘材料'}
                  </button>
                </td>
              </tr>
            ))}
            {(!analysis?.high_risk_patients?.length) && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无高风险患者数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="section-title">复盘材料列表</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { label: '全部', value: '' },
            { label: '待处理', value: 'pending' },
            { label: '已完成', value: 'completed' },
          ].map(tab => (
            <button
              key={tab.value}
              className={`btn btn-sm ${statusFilter === tab.value ? 'btn-primary' : ''}`}
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>复盘ID</th>
              <th>患者ID</th>
              <th>爽约日期</th>
              <th>复诊率</th>
              <th>历史爽约次数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id}>
                <td>{r.review_id}</td>
                <td>{r.patient_id}</td>
                <td>{r.no_show_date || '-'}</td>
                <td>{r.follow_up_rate != null ? getRateTag(r.follow_up_rate) : '-'}</td>
                <td>{r.historical_no_show_count ?? '-'}</td>
                <td>
                  {r.review_status === 'completed' ? (
                    <span className="tag tag-success">已完成</span>
                  ) : (
                    <span className="tag tag-pending">待处理</span>
                  )}
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewDetail(r.patient_id)}
                  >
                    查看详情
                  </button>
                  {r.review_status === 'pending' && (
                    <button
                      className="btn btn-sm"
                      onClick={() => handleMarkComplete(r.id)}
                    >
                      标记完成
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!reviews.length && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无复盘记录</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && materials && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '80vh', overflow: 'auto' }}>
            <div className="section-title">复盘材料 - 患者 {materialsPatientId}</div>

            {materials.patient_info && (
              <div className="form-group">
                <h4 style={{ marginBottom: 8 }}>患者信息</h4>
                <div style={{ background: '#f7f8fa', borderRadius: 8, padding: 12 }}>
                  {Object.entries(materials.patient_info).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
                      <span style={{ color: '#666', minWidth: 100 }}>{k}</span>
                      <span style={{ fontWeight: 500 }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {materials.no_show_summary && (
              <div className="form-group">
                <h4 style={{ marginBottom: 8 }}>爽约概要</h4>
                <div style={{ background: '#f7f8fa', borderRadius: 8, padding: 12 }}>
                  {Object.entries(materials.no_show_summary).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
                      <span style={{ color: '#666', minWidth: 100 }}>{k}</span>
                      <span style={{ fontWeight: 500 }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {materials.historical_no_shows?.length ? (
              <div className="form-group">
                <h4 style={{ marginBottom: 8 }}>历史爽约记录</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {Object.keys(materials.historical_no_shows[0]).map(k => (
                        <th key={k}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {materials.historical_no_shows.map((item, i) => (
                      <tr key={i}>
                        {Object.values(item).map((v, j) => (
                          <td key={j}>{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {materials.recent_visits?.length ? (
              <div className="form-group">
                <h4 style={{ marginBottom: 8 }}>近期就诊记录</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {Object.keys(materials.recent_visits[0]).map(k => (
                        <th key={k}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {materials.recent_visits.map((item, i) => (
                      <tr key={i}>
                        {Object.values(item).map((v, j) => (
                          <td key={j}>{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {materials.review_suggestions?.length ? (
              <div className="form-group">
                <h4 style={{ marginBottom: 8 }}>复盘建议</h4>
                <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                  {materials.review_suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="modal-actions">
              <button className="btn" onClick={() => setModalOpen(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
