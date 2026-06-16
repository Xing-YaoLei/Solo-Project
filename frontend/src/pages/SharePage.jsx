import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spin, Alert, Button, Tag } from 'antd'
import { ArrowLeftOutlined, LockOutlined } from '@ant-design/icons'
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
    if (token) {
      fetchShareContent()
    }
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
    const permissions = shareData.permissions || {}
    const formula = shareData.completion_rate_formula || shareData.data?.completion_rate_formula

    const chartProps = {
      externalData: data,
      showToggle: false
    }

    const renderWithCard = (title, chartNode) => (
      <ChartCard
        title={title}
        refreshTime={data.refreshed_at}
        completionFormula={formula}
      >
        {chartNode}
      </ChartCard>
    )

    switch (chartType) {
      case 'tag_trend':
        return renderWithCard(
          chartTitles.tag_trend,
          <TagTrendChart {...chartProps} />
        )

      case 'progress_composition':
        return renderWithCard(
          chartTitles.progress_composition,
          <ProgressCompositionChart {...chartProps} />
        )

      case 'grade_feedback':
        return renderWithCard(
          chartTitles.grade_feedback,
          <GradeFeedbackTable {...chartProps} />
        )

      case 'anomaly_alerts':
        return renderWithCard(
          chartTitles.anomaly_alerts,
          <AnomalyAlertsTable {...chartProps} />
        )

      case 'chapter_rank':
        return renderWithCard(
          chartTitles.chapter_rank,
          <ChapterRankChart {...chartProps} />
        )

      case 'dashboard':
        return (
          <div className="dashboard-grid">
            <div className="full-width">
              {renderWithCard(
                chartTitles.tag_trend,
                <TagTrendChart externalData={data.tag_trend} />
              )}
            </div>
            <div>
              {renderWithCard(
                chartTitles.progress_composition,
                <ProgressCompositionChart externalData={data.progress_composition} />
              )}
            </div>
            <div>
              {renderWithCard(
                chartTitles.chapter_rank,
                <ChapterRankChart externalData={data.chapter_rank_top10} showToggle={false} />
              )}
            </div>
            <div className="full-width">
              {renderWithCard(
                chartTitles.anomaly_alerts,
                <AnomalyAlertsTable externalData={data.anomaly_alerts_summary} />
              )}
            </div>
          </div>
        )

      default:
        return (
          <Alert
            message="不支持的图表类型"
            description={`当前分享的图表类型「${chartType}」不支持显示`}
            type="warning"
            showIcon
          />
        )
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
  const permissions = shareData?.permissions || {}
  const formula = shareData?.completion_rate_formula || shareData?.data?.completion_rate_formula

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
              <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#9ca3af' }}>
                分享自职业教育题库练习风险监测系统
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                有效期至：{dayjs(shareData?.expires_at).format('YYYY-MM-DD HH:mm')}
              </div>
              {permissions && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Tag icon={<LockOutlined />} color="blue" style={{ fontSize: 11 }}>
                    {permissions.view_raw_data ? '可查看明细' : '无明细权限'}
                  </Tag>
                  <Tag icon={<LockOutlined />} color="green" style={{ fontSize: 11 }}>
                    可查看完成率口径
                  </Tag>
                  {permissions.export_data && (
                    <Tag icon={<LockOutlined />} color="orange" style={{ fontSize: 11 }}>
                      可导出数据
                    </Tag>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {formula && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 16,
            fontSize: 12,
            color: '#92400e'
          }}>
            <strong>完成率口径：</strong>{formula}
          </div>
        )}

        {!permissions.view_raw_data && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 16,
            fontSize: 12,
            color: '#92400e'
          }}>
            <strong>提示：</strong>当前分享未开启明细数据权限，部分数据可能无法查看。
          </div>
        )}

        <div style={{ background: 'white', borderRadius: 12, padding: 20, minHeight: 400 }}>
          {renderChart()}
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/">
            <Button icon={<ArrowLeftOutlined />}>
              返回监测系统
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SharePage
