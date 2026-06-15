import { defineStore } from 'pinia'
import type { Distribution, Tag, StatusCount, DistributionStatus, Material, Student, PaginatedResponse } from '~/types'

interface DistributionState {
  distributions: Distribution[]
  loading: boolean
  statusFilter: DistributionStatus | null
  tagFilter: number | null
  searchQuery: string
  materials: Material[]
  students: Student[]
  tags: Tag[]
  stats: StatusCount
}

export const useDistributionStore = defineStore('distribution', {
  state: (): DistributionState => ({
    distributions: [],
    loading: false,
    statusFilter: null,
    tagFilter: null,
    searchQuery: '',
    materials: [],
    students: [],
    tags: [],
    stats: {
      pending: 0,
      following: 0,
      reviewing: 0,
      completed: 0,
    },
  }),
  getters: {
    filteredDistributions(state): Distribution[] {
      let list = state.distributions
      if (state.statusFilter) {
        list = list.filter((d) => d.status === state.statusFilter)
      }
      if (state.tagFilter) {
        list = list.filter((d) => d.tags.some((t) => t.id === state.tagFilter))
      }
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase()
        list = list.filter(
          (d) =>
            d.student.name.toLowerCase().includes(q) ||
            d.material_title.toLowerCase().includes(q)
        )
      }
      return list
    },
  },
  actions: {
    setStatusFilter(status: DistributionStatus | null) {
      this.statusFilter = status
    },
    setTagFilter(tagId: number | null) {
      this.tagFilter = tagId
    },
    setSearchQuery(query: string) {
      this.searchQuery = query
    },
    async fetchDistributions() {
      const api = useApi()
      this.loading = true
      try {
        const params: Record<string, unknown> = {}
        if (this.statusFilter) params.status = this.statusFilter
        if (this.searchQuery) params.search = this.searchQuery
        const response = await api.get<PaginatedResponse<Distribution>>('/distributions/', params)
        this.distributions = response.results
      } finally {
        this.loading = false
      }
    },
    async fetchStats() {
      const api = useApi()
      try {
        const response = await api.get<Record<string, number>>('/distributions/stats/')
        this.stats = {
          pending: response.pending || 0,
          following: response.following || 0,
          reviewing: response.reviewing || 0,
          completed: response.completed || 0,
        }
      } catch (e) {
        console.error('Failed to fetch stats', e)
      }
    },
    async fetchMaterials() {
      const api = useApi()
      try {
        const response = await api.get<PaginatedResponse<Material>>('/materials/')
        this.materials = response.results
      } catch (e) {
        console.error('Failed to fetch materials', e)
      }
    },
    async fetchStudents() {
      const api = useApi()
      try {
        const response = await api.get<PaginatedResponse<Student>>('/students/')
        this.students = response.results
      } catch (e) {
        console.error('Failed to fetch students', e)
      }
    },
    async fetchTags() {
      const api = useApi()
      try {
        const response = await api.get<PaginatedResponse<Tag>>('/materials/tags/')
        this.tags = response.results
      } catch (e) {
        console.error('Failed to fetch tags', e)
      }
    },
    async updateDistributionStatus(id: number, status: DistributionStatus) {
      const api = useApi()
      try {
        await api.patch<Distribution>(`/distributions/${id}/`, { status })
        const item = this.distributions.find((d) => d.id === id)
        if (item) {
          item.status = status
          const statusMap: Record<DistributionStatus, string> = {
            pending: '待发放',
            following: '待跟进',
            reviewing: '待复核',
            completed: '已完成',
          }
          item.status_display = statusMap[status]
        }
        await this.fetchStats()
      } catch (e) {
        console.error('Failed to update status', e)
        throw e
      }
    },
    async batchDistribute(materialId: number, studentIds: number[]) {
      const api = useApi()
      try {
        const response = await api.post<{ created_count: number; distributions: Distribution[] }>(
          '/distributions/batch/',
          { material_id: materialId, student_ids: studentIds }
        )
        this.distributions = [...response.distributions, ...this.distributions]
        await this.fetchStats()
        return response
      } catch (e) {
        console.error('Failed to batch distribute', e)
        throw e
      }
    },
    async init() {
      await Promise.all([
        this.fetchDistributions(),
        this.fetchStats(),
        this.fetchMaterials(),
        this.fetchStudents(),
        this.fetchTags(),
      ])
    },
  },
})
