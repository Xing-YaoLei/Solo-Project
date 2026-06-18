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
  const error = ref<string | null>(null)

  const filters = ref<FilterState>({
    storeIds: [],
    dateRange: { start: '', end: '' },
    brands: [],
    sourceTypes: [],
    vehicleCondition: [],
  })

  const activeFilterView = ref<FilterView | null>(null)
  const shareToken = ref<string | null>(null)

  const defaultView = computed(() => filterViews.value.find((v) => v.isDefault) ?? null)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  const activeViewId = computed(() => activeFilterView.value?.id)

  function setShareToken(token: string | null) {
    shareToken.value = token
  }

  function clearError() {
    error.value = null
  }

  async function loadDashboard() {
    loading.value = true
    error.value = null
    try {
      const [ov, vt, ir, pl, td, fv] = await Promise.all([
        fetchOverview(shareToken.value ?? undefined),
        fetchVehicleTrend(filters.value, activeViewId.value ?? undefined, shareToken.value ?? undefined),
        fetchInspectionReport(filters.value, activeViewId.value ?? undefined, shareToken.value ?? undefined),
        fetchPrepList(filters.value, activeViewId.value ?? undefined, shareToken.value ?? undefined),
        fetchTestDriveAnomaly(filters.value, activeViewId.value ?? undefined, shareToken.value ?? undefined),
        fetchFilterViews(),
      ])
      overview.value = ov
      vehicleTrend.value = vt
      inspectionReport.value = ir
      prepList.value = pl
      testDriveAnomaly.value = td
      filterViews.value = fv
      if (defaultView.value && !activeFilterView.value) {
        activeFilterView.value = defaultView.value
        filters.value = { ...defaultView.value.filters }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载数据失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function refreshData() {
    loading.value = true
    error.value = null
    try {
      const [ov, vt, ir, pl, td] = await Promise.all([
        fetchOverview(shareToken.value ?? undefined),
        fetchVehicleTrend(filters.value, activeViewId.value ?? undefined, shareToken.value ?? undefined),
        fetchInspectionReport(filters.value, activeViewId.value ?? undefined, shareToken.value ?? undefined),
        fetchPrepList(filters.value, activeViewId.value ?? undefined, shareToken.value ?? undefined),
        fetchTestDriveAnomaly(filters.value, activeViewId.value ?? undefined, shareToken.value ?? undefined),
      ])
      overview.value = ov
      vehicleTrend.value = vt
      inspectionReport.value = ir
      prepList.value = pl
      testDriveAnomaly.value = td
    } catch (e) {
      error.value = e instanceof Error ? e.message : '刷新数据失败'
      throw e
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
    const view = await saveFilterView({
      name,
      isDefault: false,
      filters: { ...filters.value },
    })
    filterViews.value.push(view)
    activeFilterView.value = view
    return view
  }

  async function removeFilterView(id: string) {
    await apiDeleteView(id)
    filterViews.value = filterViews.value.filter((v) => v.id !== id)
    if (activeFilterView.value?.id === id) {
      activeFilterView.value = null
    }
  }

  async function setDefaultView(view: FilterView) {
    filterViews.value.forEach((v) => {
      v.isDefault = v.id === view.id
    })
  }

  return {
    overview,
    vehicleTrend,
    inspectionReport,
    prepList,
    testDriveAnomaly,
    filterViews,
    loading,
    error,
    filters,
    activeFilterView,
    shareToken,
    defaultView,
    isLoading,
    hasError,
    activeViewId,
    setShareToken,
    clearError,
    loadDashboard,
    refreshData,
    applyFilters,
    loadFilterView,
    saveCurrentView,
    removeFilterView,
    setDefaultView,
  }
})
