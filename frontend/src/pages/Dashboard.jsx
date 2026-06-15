import React, { useState, useCallback } from 'react'
import ChartCard from '../components/ChartCard'
import TagTrendChart from '../components/TagTrendChart'
import ProgressCompositionChart from '../components/ProgressCompositionChart'
import GradeFeedbackTable from '../components/GradeFeedbackTable'
import AnomalyAlertsTable from '../components/AnomalyAlertsTable'
import ChapterRankChart from '../components/ChapterRankChart'
import ShareModal from '../components/ShareModal'
import { analyticsAPI } from '../utils/api'

const Dashboard = () => {
  const [shareModal, setShareModal] = useState({ open: false, chartType: '', chartTitle: '' })
  const [refreshTimes, setRefreshTimes] = useState({})
  const [completionFormula, setCompletionFormula] = useState('')
  const [loadingMap, setLoadingMap] = useState({})

  const handleRefresh = (chartType) => (time) => {
    setRefreshTimes(prev => ({
      ...prev,
      [chartType]: time
    }))
  }

  const handleShare = (chartType, chartTitle) => {
    setShareModal({
      open: true,
      chartType,
      chartTitle
    })
  }

  const handleRefreshChart = useCallback(async (chartType) => {
    setLoadingMap(prev => ({ ...prev, [chartType]: true }))
    try {
      if (chartType === 'tag_trend') {
        const res = await analyticsAPI.getTagTrend(30)
        setRefreshTimes(prev => ({ ...prev, tag_trend: res.refreshed_at }))
        setCompletionFormula(res.completion_rate_formula)
      } else if (chartType === 'progress_composition') {
        const res = await analyticsAPI.getProgressComposition()
        setRefreshTimes(prev => ({ ...prev, progress_composition: res.refreshed_at }))
      } else if (chartType === 'grade_feedback') {
        const res = await analyticsAPI.getGradeFeedback({ page: 1, page_size: 10 })
        setRefreshTimes(prev => ({ ...prev, grade_feedback: res.refreshed_at }))
      } else if (chartType === 'anomaly_alerts') {
        const res = await analyticsAPI.getAnomalyAlerts({ page: 1, page_size: 10 })
        setRefreshTimes(prev => ({ ...prev, anomaly_alerts: res.refreshed_at }))
      } else if (chartType === 'chapter_rank') {
        const res = await analyticsAPI.getChapterRank({ sort_by: 'completion_rate', view_mode: 'rate' })
        setRefreshTimes(prev => ({ ...prev, chapter_rank: res.refreshed_at }))
      }
    } catch (err) {
      console.error('刷新失败:', err)
    } finally {
      setLoadingMap(prev => ({ ...prev, [chartType]: false }))
    }
  }, [])

  return (
    <>
      <header className="app-header">
        <h1 className="app-title">职业教育题库练习风险监测</h1>
        <p className="app-subtitle">
          数据来源：直播平台 | 就业表 | LMS明细追溯
        </p>
      </header>

      <main className="app-content">
        <div className="dashboard-grid">
          <div className="full-width">
            <ChartCard
              title="题目标签趋势"
              refreshTime={refreshTimes.tag_trend}
              completionFormula={completionFormula}
              onRefresh={() => handleRefreshChart('tag_trend')}
              onShare={() => handleShare('tag_trend', '题目标签趋势')}
              loading={loadingMap.tag_trend}
            >
              <TagTrendChart onRefresh={handleRefresh('tag_trend')} />
            </ChartCard>
          </div>

          <div>
            <ChartCard
              title="学习进度构成"
              refreshTime={refreshTimes.progress_composition}
              completionFormula={completionFormula}
              onRefresh={() => handleRefreshChart('progress_composition')}
              onShare={() => handleShare('progress_composition', '学习进度构成')}
              loading={loadingMap.progress_composition}
            >
              <ProgressCompositionChart onRefresh={handleRefresh('progress_composition')} />
            </ChartCard>
          </div>

          <div>
            <ChartCard
              title="课程章节排行"
              refreshTime={refreshTimes.chapter_rank}
              completionFormula={completionFormula}
              onRefresh={() => handleRefreshChart('chapter_rank')}
              onShare={() => handleShare('chapter_rank', '课程章节排行')}
              loading={loadingMap.chapter_rank}
            >
              <ChapterRankChart onRefresh={handleRefresh('chapter_rank')} />
            </ChartCard>
          </div>

          <div className="full-width">
            <ChartCard
              title="成绩反馈明细"
              refreshTime={refreshTimes.grade_feedback}
              completionFormula={completionFormula}
              onRefresh={() => handleRefreshChart('grade_feedback')}
              onShare={() => handleShare('grade_feedback', '成绩反馈明细')}
              loading={loadingMap.grade_feedback}
            >
              <GradeFeedbackTable onRefresh={handleRefresh('grade_feedback')} />
            </ChartCard>
          </div>

          <div className="full-width">
            <ChartCard
              title="提醒规则异常标注"
              refreshTime={refreshTimes.anomaly_alerts}
              completionFormula={completionFormula}
              onRefresh={() => handleRefreshChart('anomaly_alerts')}
              onShare={() => handleShare('anomaly_alerts', '提醒规则异常标注')}
              loading={loadingMap.anomaly_alerts}
            >
              <AnomalyAlertsTable onRefresh={handleRefresh('anomaly_alerts')} />
            </ChartCard>
          </div>
        </div>
      </main>

      <ShareModal
        open={shareModal.open}
        onClose={() => setShareModal({ open: false, chartType: '', chartTitle: '' })}
        chartType={shareModal.chartType}
        chartTitle={shareModal.chartTitle}
      />
    </>
  )
}

export default Dashboard
