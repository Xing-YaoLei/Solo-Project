import { defineStore } from 'pinia'
import request from '../api/index.js'

export const useFunnelStore = defineStore('funnel', {
  state: () => ({
    dashboardData: null,
    details: [],
    loading: false,
    selectedStage: '',
  }),
  actions: {
    async fetchDashboard() {
      this.loading = true
      try {
        const res = await request.get('/funnel/dashboard')
        this.dashboardData = res
      } finally {
        this.loading = false
      }
    },
    async fetchDetails(stage) {
      const params = {}
      if (stage) params.stage = stage
      const res = await request.get('/funnel/details', { params })
      this.details = res
    },
  },
})
