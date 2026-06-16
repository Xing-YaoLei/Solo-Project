import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { elderApi } from '../api/elder'
import { riskApi } from '../api/risk'
import { incidentApi } from '../api/incident'
import { activityApi } from '../api/activity'

interface StatItem {
  label: string
  value: number
  icon: string
  color: string
  path: string
}

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<StatItem[]>([
    { label: '在院老人', value: 0, icon: '👴', color: 'blue', path: '/elders' },
    { label: '今日活动', value: 0, icon: '🏃', color: 'green', path: '/activities' },
    { label: '待处理风险', value: 0, icon: '⚠️', color: 'orange', path: '/risks' },
    { label: '未结案异常单', value: 0, icon: '📋', color: 'red', path: '/incidents' },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [eldersRes, risksRes, incidentsRes, activitiesRes] = await Promise.all([
        elderApi.getList({ page_size: 1, status: 'active' }),
        riskApi.getList({ page_size: 1, status: 'reported' }),
        incidentApi.getList({ page_size: 1, status: 'pending' }),
        activityApi.getList({ page_size: 1 }),
      ])
      setStats([
        { label: '在院老人', value: eldersRes.data.total || 0, icon: '👴', color: 'blue', path: '/elders' },
        { label: '今日活动', value: activitiesRes.data.total || 0, icon: '🏃', color: 'green', path: '/activities' },
        { label: '待处理风险', value: risksRes.data.total || 0, icon: '⚠️', color: 'orange', path: '/risks' },
        { label: '未结案异常单', value: incidentsRes.data.total || 0, icon: '📋', color: 'red', path: '/incidents' },
      ])
    } catch (err) {
      console.error('获取统计数据失败', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">工作台</h1>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => router.navigate({ to: stat.path as any })}
          >
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>系统说明</h3>
        <div style={{ lineHeight: '1.8', color: '#4b5563' }}>
          <p><strong>养老护理康复活动跟进系统</strong>，旨在解决养老护理中康复活动交接慢、记录散的问题。</p>
          <p style={{ marginTop: '12px' }}>主要功能模块：</p>
          <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
            <li><strong>老人档案</strong>：管理老人基本信息、健康状况、护理等级等</li>
            <li><strong>用药清单</strong>：记录每位老人的用药情况，便于交接</li>
            <li><strong>探访记录</strong>：记录家属探访情况，关注老人心理状态</li>
            <li><strong>活动签到</strong>：康复活动签到管理，跟踪参与情况</li>
            <li><strong>风险事件</strong>：记录跌倒、压疮等风险事件</li>
            <li><strong>异常单</strong>：严重事件生成异常单，明确影响范围、责任归属和处理结果</li>
            <li><strong>数据导出</strong>：每份导出都附带口径说明，便于向团队解释</li>
            <li><strong>审计日志</strong>：每次状态变更都留下痕迹，可追溯</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
