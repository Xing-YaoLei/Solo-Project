import { defineStore } from 'pinia'
import { ref } from 'vue'
import { appointmentApi } from '@/api/appointment'

export const useAppointmentStore = defineStore('appointment', () => {
  const list = ref([])
  const total = ref(0)
  const loading = ref(false)
  const currentDetail = ref(null)

  const filters = ref({
    dateRange: [],
    campus: '',
    subject: '',
    status: '',
    teacher: '',
    keyword: ''
  })

  const pagination = ref({
    page: 1,
    pageSize: 20
  })

  async function fetchList() {
    loading.value = true
    try {
      const params = {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...filters.value
      }
      if (params.dateRange && params.dateRange.length === 2) {
        params.startDate = params.dateRange[0]
        params.endDate = params.dateRange[1]
      }
      delete params.dateRange
      const res = await appointmentApi.search(params)
      list.value = res.data.records
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(id) {
    loading.value = true
    try {
      const res = await appointmentApi.getById(id)
      currentDetail.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  function resetFilters() {
    filters.value = {
      dateRange: [],
      campus: '',
      subject: '',
      status: '',
      teacher: '',
      keyword: ''
    }
    pagination.value.page = 1
  }

  return { list, total, loading, currentDetail, filters, pagination, fetchList, fetchDetail, resetFilters }
})
