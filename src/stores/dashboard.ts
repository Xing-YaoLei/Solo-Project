import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DashboardOverview,
  VehicleArchiveTrend,
  InspectionReportComposition,
  PrepListDetail,
  TestDriveAnomaly,
  FilterView,
  FilterState,
} from '@/types'
import {
  fetchOverview,
  fetchVehicleTrend,
  fetchInspectionReport,
  fetchPrepList,
  fetchTestDriveAnomaly,
  fetchFilterViews,
  saveFilterView,
  deleteFilterView as apiDeleteView,
} from '@/mock/api'

export const useDashboardStore = defineStore('dashboard', () => {
  const overview = ref<DashboardOverview | null>(null)
  const vehicleTrend = ref<VehicleArchiveTrend[]>([])
  const inspectionReport = ref<InspectionReportComposition | null>(null)
  const prepList = ref<PrepListDetail | null>(null)
  const testDriveAnomaly = ref<TestDriveAnomaly | null>(null)
  const filterViews = ref<FilterView[]>([])
  const loading = ref(false)

  const filters = ref<FilterState>({
    storeIds: [],
    dateRange: { start: '', end: '' },
    brands: [],
    sourceTypes: [],
    vehicleCondition: [],
  })

  const activeFilterView = ref<FilterView | null>(null)

  const defaultView = computed(() => filterViews.value.find((v) => v.isDefault) ?? null)

  const isLoading = computed(() => loading.value)

  async function loadDashboard() {
    loading.value = true
    try {
      const [ov, vt, ir, pl, td, fv] = await Promise.all([
        fetchOverview(),
        fetchVehicleTrend(filters.value),
        fetchInspectionReport(filters.value),
        fetchPrepList(filters.value),
        fetchTestDriveAnomaly(filters.value),
        fetchFilterViews(),
      ])
      overview.value = ov
      vehicleTrend.value = vt
      inspectionReport.value = ir
      prepList.value = pl
      testDriveAnomaly.value = td
      filterViews.value = fv
      if (defaultView.value) {
        activeFilterView.value = defaultView.value
        filters.value = { ...defaultView.value.filters }
      }
    } finally {
      loading.value = false
    }
  }

  async function refreshData() {
    loading.value = true
    try {
      const [ov, vt, ir, pl, td] = await Promise.all([
        fetchOverview(),
        fetchVehicleTrend(filters.value),
        fetchInspectionReport(filters.value),
        fetchPrepList(filters.value),
        fetchTestDriveAnomaly(filters.value),
      ])
      overview.value = ov
      vehicleTrend.value = vt
      inspectionReport.value = ir
      prepList.value = pl
      testDriveAnomaly.value = td
    } finally {
      loading.value = false
    }
  }

  async function applyFilters(newFilters: FilterState) {
    filters.value = { ...newFilters }
    activeFilterView.value = null
    await refreshData()
  }

  async function loadFilterView(view: FilterView) {
    activeFilterView.value = view
    filters.value = { ...view.filters }
    await refreshData()
  }

  async function saveCurrentView(name: string) {
    const view: FilterView = {
      id: `fv_${Date.now()}`,
      name,
      isDefault: false,
      filters: { ...filters.value },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const saved = await saveFilterView(view)
    filterViews.value.push(saved)
    activeFilterView.value = saved
    return saved
  }

  async function removeFilterView(id: string) {
    await apiDeleteView(id)
    filterViews.value = filterViews.value.filter((v) => v.id !== id)
    if (activeFilterView.value?.id === id) {
      activeFilterView.value = null
    }
  }

  return {
    overview,
    vehicleTrend,
    inspectionReport,
    prepList,
    testDriveAnomaly,
    filterViews,
    filters,
    activeFilterView,
    defaultView,
    isLoading,
    loadDashboard,
    refreshData,
    applyFilters,
    loadFilterView,
    saveCurrentView,
    removeFilterView,
  }
})
