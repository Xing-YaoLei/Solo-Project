import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spin, Alert, Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { shareAPI } from '../utils/api'
import ChartCard from '../components/ChartCard'
import TagTrendChart from '../components/TagTrendChart'
import ProgressCompositionChart from '../components/ProgressCompositionChart'
import GradeFeedbackTable from '../components/GradeFeedbackTable'
import AnomalyAlertsTable from '../components/AnomalyAlertsTable'
import ChapterRankChart from '../components/ChapterRankChart'
import dayjs from 'dayjs'

const chartTitles = {
  tag_trend: '题目标签趋势',
  progress_composition: '学习进度构成',
  grade_feedback: '成绩反馈明细',
  anomaly_alerts: '提醒规则异常标注',
  chapter_rank: '课程章节排行',
  dashboard: '题库练习风险监测总览'
}

const SharePage = () => {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareData, setShareData] = useState(null)

  useEffect(() => {
    fetchShareContent()
  }, [token])

  const fetchShareContent = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await shareAPI.getShareContent(token)
      setShareData(res)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('分享链接不存在或已过期')
      } else {
        setError('加载失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const renderChart = () => {
    if (!shareData || !shareData.data) return null

    const chartType = shareData.chart_type
    const data = shareData.data

    switch (chartType) {
      case 'tag_trend':
        return <TagTrendChart data={data} />
      case 'progress_composition':
        return <ProgressCompositionChart data={data} />
      case 'grade_feedback':
        return <GradeFeedbackTable data={data} />
      case 'anomaly_alerts':
        return <AnomalyAlertsTable data={data} />
      case 'chapter_rank':
        return <ChapterRankChart data={data} />
      case 'dashboard':
        return (
          <div className="dashboard-grid">
            <div className="full-width">
              <ChartCard title="题目标签趋势" refreshTime={data.refreshed_at}>
                <TagTrendChart />
              </ChartCard>
            </div>
            <div>
              <ChartCard title="学习进度构成" refreshTime={data.progress_composition?.refreshed_at}>
                <ProgressCompositionChart />
              </ChartCard>
            </div>
            <div>
              <ChartCard title="课程章节排行" refreshTime={data.chapter_rank_top10?.refreshed_at}>
                <ChapterRankChart />
              </ChartCard>
            </div>
          </div>
        )
      default:
        return <div>不支持的图表类型</div>
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Alert
            message="无法访问"
            description={error}
            type="warning"
            showIcon
            style={{ marginBottom: 20 }}
          />
          <Link to="/">
            <Button type="primary" icon={<ArrowLeftOutlined />}>
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const title = chartTitles[shareData?.chart_type] || '分享图表'

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
              <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#9ca3af' }}>
                分享自职业教育题库练习风险监测系统
              </p>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              有效期至：{dayjs(shareData?.expires_at).format('YYYY-MM-DD HH:mm')}
            </div>
          </div>
        </div>

        {shareData?.data?.completion_rate_formula && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 16,
            fontSize: 12,
            color: '#92400e'
          }}>
            <strong>完成率口径：</strong>{shareData.data.completion_rate_formula}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: 12, padding: 20, minHeight: 400 }}>
          {renderChart()}
        </div>

        {shareData?.permissions && (
          <div style={{ marginTop: 16, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
            您的权限：
            {shareData.permissions.view_formula && '查看完成率口径 '}
            {shareData.permissions.view_raw_data && '查看明细数据 '}
            {shareData.permissions.export_data && '导出数据 '}
          </div>
        )}
      </div>
    </div>
  )
}

export default SharePage
