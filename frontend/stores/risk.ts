import { defineStore } from 'pinia'
import type { RiskRecord, RiskRecordList, Communication, ReviewConclusion, RiskLevel, PaginatedResponse } from '~/types'

interface RiskState {
  riskRecords: RiskRecordList[]
  riskDetail: RiskRecord | null
  loading: boolean
  levelFilter: RiskLevel | null
  searchQuery: string
}

export const useRiskStore = defineStore('risk', {
  state: (): RiskState => ({
    riskRecords: [],
    riskDetail: null,
    loading: false,
    levelFilter: null,
    searchQuery: '',
  }),
  getters: {
    filteredRiskRecords(state): RiskRecordList[] {
      let list = state.riskRecords
      if (state.levelFilter) {
        list = list.filter((r) => r.risk_level === state.levelFilter)
      }
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase()
        list = list.filter(
          (r) =>
            r.student_name.toLowerCase().includes(q) ||
            r.material_title.toLowerCase().includes(q) ||
            r.reason.toLowerCase().includes(q)
        )
      }
      return list
    },
    highRiskCount(state): number {
      return state.riskRecords.filter((r) => r.risk_level === 'high').length
    },
    mediumRiskCount(state): number {
      return state.riskRecords.filter((r) => r.risk_level === 'medium').length
    },
    lowRiskCount(state): number {
      return state.riskRecords.filter((r) => r.risk_level === 'low').length
    },
  },
  actions: {
    setLevelFilter(level: RiskLevel | null) {
      this.levelFilter = level
    },
    setSearchQuery(query: string) {
      this.searchQuery = query
    },
    async fetchRiskRecords() {
      const api = useApi()
      this.loading = true
      try {
        const params: Record<string, unknown> = {}
        if (this.levelFilter) params.risk_level = this.levelFilter
        if (this.searchQuery) params.search = this.searchQuery
        const response = await api.get<PaginatedResponse<RiskRecordList>>('/risks/', params)
        this.riskRecords = response.results
      } finally {
        this.loading = false
      }
    },
    async fetchRiskDetail(id: number) {
      const api = useApi()
      this.loading = true
      try {
        const response = await api.get<RiskRecord>(`/risks/${id}/`)
        this.riskDetail = response
        return response
      } finally {
        this.loading = false
      }
    },
    async addCommunication(riskId: number, content: string, commType: Communication['comm_type']) {
      const api = useApi()
      try {
        const response = await api.post<Communication>('/risks/communications/', {
          risk: riskId,
          content,
          comm_type: commType,
        })
        if (this.riskDetail && this.riskDetail.id === riskId) {
          this.riskDetail.communications.unshift(response)
        }
        return response
      } catch (e) {
        console.error('Failed to add communication', e)
        throw e
      }
    },
    async addReviewConclusion(riskId: number, conclusion: string) {
      const api = useApi()
      try {
        const response = await api.post<ReviewConclusion>('/risks/reviews/', {
          risk: riskId,
          conclusion,
        })
        if (this.riskDetail && this.riskDetail.id === riskId) {
          this.riskDetail.review_conclusions.unshift(response)
        }
        return response
      } catch (e) {
        console.error('Failed to add review conclusion', e)
        throw e
      }
    },
    async init() {
      await this.fetchRiskRecords()
    },
  },
})
