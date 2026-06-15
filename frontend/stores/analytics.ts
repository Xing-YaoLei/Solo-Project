import { defineStore } from 'pinia'
import type { AnalyticsOverview, CompletionTrend, RiskDistributionData } from '~/types'

interface AnalyticsState {
  overview: AnalyticsOverview
  completionTrend: CompletionTrend
  riskDistribution: RiskDistributionData
  loading: boolean
  period: 'month' | 'quarter' | 'year'
  courseId: number | null
  excludeIrrelevant: boolean
}

export const useAnalyticsStore = defineStore('analytics', {
  state: (): AnalyticsState => ({
    overview: {
      total_students: 0,
      completion_rate: 0,
      risk_count: 0,
      pending_count: 0,
    },
    completionTrend: {
      labels: [],
      planned: [],
      actual: [],
    },
    riskDistribution: {
      high: 0,
      medium: 0,
      low: 0,
      by_course: {},
    },
    loading: false,
    period: 'month',
    courseId: null,
    excludeIrrelevant: true,
  }),
  getters: {
    riskDistributionList(state): { name: string; value: number }[] {
      return [
        { name: '高风险', value: state.riskDistribution.high },
        { name: '中风险', value: state.riskDistribution.medium },
        { name: '低风险', value: state.riskDistribution.low },
      ]
    },
    completionTrendList(state) {
      return state.completionTrend.labels.map((label, idx) => ({
        month: label,
        planned: state.completionTrend.planned[idx] || 0,
        actual: state.completionTrend.actual[idx] || 0,
      }))
    },
  },
  actions: {
    setPeriod(period: 'month' | 'quarter' | 'year') {
      this.period = period
    },
    setCourseId(courseId: number | null) {
      this.courseId = courseId
    },
    setExcludeIrrelevant(val: boolean) {
      this.excludeIrrelevant = val
    },
    _buildParams(): Record<string, unknown> {
      const params: Record<string, unknown> = {}
      if (this.excludeIrrelevant) params.exclude_irrelevant = 'true'
      return params
    },
    async fetchOverview() {
      const api = useApi()
      try {
        this.overview = await api.get<AnalyticsOverview>('/analytics/overview/', this._buildParams())
      } catch (e) {
        console.error('Failed to fetch overview', e)
      }
    },
    async fetchCompletionTrend() {
      const api = useApi()
      try {
        const params = this._buildParams()
        params.period = this.period
        if (this.courseId) params.course_id = this.courseId
        this.completionTrend = await api.get<CompletionTrend>('/analytics/completion-trend/', params)
      } catch (e) {
        console.error('Failed to fetch completion trend', e)
      }
    },
    async fetchRiskDistribution() {
      const api = useApi()
      try {
        const params = this._buildParams()
        if (this.courseId) params.course_id = this.courseId
        this.riskDistribution = await api.get<RiskDistributionData>('/analytics/risk-distribution/', params)
      } catch (e) {
        console.error('Failed to fetch risk distribution', e)
      }
    },
    async init() {
      this.loading = true
      try {
        await Promise.all([
          this.fetchOverview(),
          this.fetchCompletionTrend(),
          this.fetchRiskDistribution(),
        ])
      } finally {
        this.loading = false
      }
    },
  },
})
