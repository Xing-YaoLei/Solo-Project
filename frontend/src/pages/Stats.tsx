import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { statsApi } from '../lib/api'

export default function Stats() {
  const [days, setDays] = useState(30)
  const [trendData, setTrendData] = useState<any>(null)
  const [typeData, setTypeData] = useState<any[]>([])
  const [assigneeData, setAssigneeData] = useState<any[]>([])
  const [riskData, setRiskData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [trendRes, typeRes, assigneeRes, riskRes] = await Promise.all([
        statsApi.getConversionTrend(days),
        statsApi.getByType(),
        statsApi.getByAssignee(),
        statsApi.getRiskDistribution(),
      ])
      setTrendData(trendRes.data)
      setTypeData(typeRes.data)
      setAssigneeData(assigneeRes.data)
      setRiskData(riskRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [days])

  if (loading || !trendData) {
    return <div className="empty-state">加载中...</div>
  }

  const trendOption = {
    title: {
      text: '内容转化趋势',
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['新建', '进入互动', '风险检测', '送审', '通过', '退回'],
      top: 28,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 80, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.daily.map((d: any) => d.date.slice(5)),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '新建',
        type: 'line',
        smooth: true,
        data: trendData.daily.map((d: any) => d.created),
        itemStyle: { color: '#6366f1' },
      },
      {
        name: '进入互动',
        type: 'line',
        smooth: true,
        data: trendData.daily.map((d: any) => d.interacting),
        itemStyle: { color: '#3b82f6' },
      },
      {
        name: '风险检测',
        type: 'line',
        smooth: true,
        data: trendData.daily.map((d: any) => d.risk_checked),
        itemStyle: { color: '#8b5cf6' },
      },
      {
        name: '送审',
        type: 'line',
        smooth: true,
        data: trendData.daily.map((d: any) => d.pending_review),
        itemStyle: { color: '#f59e0b' },
      },
      {
        name: '通过',
        type: 'line',
        smooth: true,
        data: trendData.daily.map((d: any) => d.approved),
        itemStyle: { color: '#10b981' },
      },
      {
        name: '退回',
        type: 'line',
        smooth: true,
        data: trendData.daily.map((d: any) => d.rejected),
        itemStyle: { color: '#ef4444' },
      },
    ],
  }

  const funnelOption = {
    title: {
      text: '整体转化漏斗',
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [
      {
        name: '漏斗',
        type: 'funnel',
        left: '10%',
        width: '80%',
        label: { show: true, position: 'inside', formatter: '{b}\n{c}' },
        data: [
          { value: trendData.funnel.total_created, name: '新建文书' },
          { value: trendData.funnel.total_interacting, name: '进入互动' },
          { value: trendData.funnel.total_risk_checked, name: '风险检测' },
          { value: trendData.funnel.total_version_verified, name: '版本核对' },
          { value: trendData.funnel.total_pending, name: '待审核' },
          { value: trendData.funnel.total_approved, name: '最终通过' },
        ],
        color: ['#6366f1', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'],
      },
    ],
  }

  const typeOption = {
    title: {
      text: '文书类型分布',
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        data: typeData.map((t) => ({
          value: t.total,
          name: t.document_type,
        })),
        label: { formatter: '{b}\n{d}%' },
      },
    ],
  }

  const riskOption = {
    title: {
      text: '风险等级分布',
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['35%', '60%'],
        data: riskData.map((r) => ({
          value: r.count,
          name:
            r.risk_level === 'high'
              ? '高风险'
              : r.risk_level === 'medium'
              ? '中风险'
              : '低风险',
          itemStyle: {
            color:
              r.risk_level === 'high'
                ? '#ef4444'
                : r.risk_level === 'medium'
                ? '#f59e0b'
                : '#10b981',
          },
        })),
      },
    ],
  }

  const typeBarOption = {
    title: {
      text: '各类型通过率',
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: { trigger: 'axis' },
    legend: { data: ['总数', '通过数'], top: 28 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 80, containLabel: true },
    xAxis: {
      type: 'category',
      data: typeData.map((t) => t.document_type),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '总数',
        type: 'bar',
        data: typeData.map((t) => t.total),
        itemStyle: { color: '#93c5fd' },
      },
      {
        name: '通过数',
        type: 'bar',
        data: typeData.map((t) => t.approved),
        itemStyle: { color: '#3b82f6' },
      },
    ],
  }

  const assigneeBarOption = {
    title: {
      text: '处理人工作统计',
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['总数', '通过', '退回', '待审'],
      top: 28,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 80, containLabel: true },
    xAxis: {
      type: 'category',
      data: assigneeData.map((a) => a.full_name || `#${a.user_id}`),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '总数',
        type: 'bar',
        stack: 'total',
        data: assigneeData.map((a) => a.total),
        itemStyle: { color: '#93c5fd' },
      },
      {
        name: '通过',
        type: 'bar',
        data: assigneeData.map((a) => a.approved),
        itemStyle: { color: '#10b981' },
      },
      {
        name: '退回',
        type: 'bar',
        data: assigneeData.map((a) => a.rejected),
        itemStyle: { color: '#ef4444' },
      },
      {
        name: '待审',
        type: 'bar',
        data: assigneeData.map((a) => a.pending),
        itemStyle: { color: '#f59e0b' },
      },
    ],
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title">📈 统计报表</h1>
        <div className="flex gap-2">
          {[7, 15, 30, 90].map((d) => (
            <button
              key={d}
              className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDays(d)}
            >
              近{d}天
            </button>
          ))}
        </div>
      </div>

      <div className="card mb-4">
        <div className="section-title">📊 统计周期：{trendData.period}</div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '新建文书', value: trendData.funnel.total_created, color: '#6366f1' },
            {
              label: '通过总数',
              value: trendData.funnel.total_approved,
              color: '#10b981',
            },
            {
              label: '退回总数',
              value: trendData.funnel.total_rejected,
              color: '#ef4444',
            },
            {
              label: '通过率',
              value:
                trendData.funnel.total_created > 0
                  ? (
                      (trendData.funnel.total_approved /
                        trendData.funnel.total_created) *
                      100
                    ).toFixed(1) + '%'
                  : '-',
              color: '#06b6d4',
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: 16,
                background: '#f9fafb',
                borderRadius: 8,
                borderLeft: `4px solid ${s.color}`,
              }}
            >
              <div style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card">
          <ReactECharts option={trendOption} style={{ height: 350 }} />
        </div>
        <div className="card">
          <ReactECharts option={funnelOption} style={{ height: 350 }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card">
          <ReactECharts option={typeOption} style={{ height: 320 }} />
        </div>
        <div className="card">
          <ReactECharts option={riskOption} style={{ height: 320 }} />
        </div>
      </div>

      <div className="card mb-4">
        <ReactECharts option={typeBarOption} style={{ height: 320 }} />
      </div>

      <div className="card">
        <ReactECharts option={assigneeBarOption} style={{ height: 360 }} />
      </div>
    </div>
  )
}
