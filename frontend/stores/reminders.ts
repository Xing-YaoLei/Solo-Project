import { defineStore } from 'pinia'
import type { ReminderRule, ReminderLog, PaginatedResponse } from '~/types'

interface RemindersState {
  rules: ReminderRule[]
  logs: ReminderLog[]
  loading: boolean
  logSearchQuery: string
}

export const useRemindersStore = defineStore('reminders', {
  state: (): RemindersState => ({
    rules: [],
    logs: [],
    loading: false,
    logSearchQuery: '',
  }),
  getters: {
    filteredLogs(state): ReminderLog[] {
      if (!state.logSearchQuery) return state.logs
      const q = state.logSearchQuery.toLowerCase()
      return state.logs.filter(
        (l) =>
          l.rule_name.toLowerCase().includes(q) ||
          l.student_name.toLowerCase().includes(q)
      )
    },
  },
  actions: {
    setLogSearchQuery(query: string) {
      this.logSearchQuery = query
    },
    async fetchRules() {
      const api = useApi()
      this.loading = true
      try {
        const response = await api.get<PaginatedResponse<ReminderRule>>('/reminders/rules/')
        this.rules = response.results
      } finally {
        this.loading = false
      }
    },
    async fetchLogs() {
      const api = useApi()
      try {
        const response = await api.get<PaginatedResponse<ReminderLog>>('/reminders/logs/')
        this.logs = response.results
      } catch (e) {
        console.error('Failed to fetch logs', e)
      }
    },
    async createRule(data: Partial<ReminderRule>) {
      const api = useApi()
      try {
        const response = await api.post<ReminderRule>('/reminders/rules/', data)
        this.rules.unshift(response)
        return response
      } catch (e) {
        console.error('Failed to create rule', e)
        throw e
      }
    },
    async updateRule(id: number, data: Partial<ReminderRule>) {
      const api = useApi()
      try {
        const response = await api.patch<ReminderRule>(`/reminders/rules/${id}/`, data)
        const idx = this.rules.findIndex((r) => r.id === id)
        if (idx !== -1) {
          this.rules[idx] = response
        }
        return response
      } catch (e) {
        console.error('Failed to update rule', e)
        throw e
      }
    },
    async toggleRule(id: number, isActive: boolean) {
      await this.updateRule(id, { is_active: isActive })
    },
    async init() {
      await Promise.all([this.fetchRules(), this.fetchLogs()])
    },
  },
})
