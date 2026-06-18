import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getFunnelData,
  getFunnelVehiclesByStage,
  refreshFunnelData as refreshApi,
  addReviewNote
} from '@/api/funnel'
import { detectAnomalies, STAGE_NAMES } from '@/utils/anomaly'

export const useFunnelStore = defineStore('funnel', () => {
  const stages = ref([])
  const anomalies = ref([])
  const vehiclesByStage = ref({})
  const selectedStage = ref(null)
  const lastUpdateTime = ref(null)
  const libraryLastUpdate = ref(null)
  const loading = ref(false)
  const refreshLoading = ref(false)
  const caliberChangeDate = ref('2026-06-01')
  const reviewNotes = ref({})

  const hasAnomalies = computed(() => anomalies.value.length > 0)
  const totalVehicles = computed(() => stages.value[0]?.count || 0)
  const successVehicles = computed(() => stages.value[stages.value.length - 1]?.count || 0)
  const overallConversion = computed(() => {
    if (!totalVehicles.value) return 0
    return (successVehicles.value / totalVehicles.value * 100).toFixed(2)
  })
  const selectedStageVehicles = computed(() => {
    if (selectedStage.value === null) return []
    return vehiclesByStage.value[selectedStage.value] || []
  })

  async function fetchFunnelData(forceRefresh = false) {
    loading.value = true
    try {
      let data = await getFunnelData().catch(() => null)
      if (!data || !data.stages) {
        data = getMockFunnelData()
      }
      stages.value = data.stages.map((s, i) => ({
        ...s,
        name: s.name || STAGE_NAMES[i],
        index: i,
        conversionRate: i === 0 ? 100 : data.stages[i - 1].count
          ? (s.count / data.stages[i - 1].count * 100).toFixed(2)
          : 0
      }))
      libraryLastUpdate.value = data.libraryLastUpdate
      lastUpdateTime.value = new Date().toISOString()
      anomalies.value = detectAnomalies(
        { stages: stages.value, libraryLastUpdate: libraryLastUpdate.value },
        { caliberChangeDate: caliberChangeDate.value }
      )
      if (data.anomalies && data.anomalies.length > 0) {
        anomalies.value = [...anomalies.value, ...data.anomalies]
      }
      return stages.value
    } finally {
      loading.value = false
    }
  }

  async function refreshFunnelData() {
    refreshLoading.value = true
    try {
      await refreshApi().catch(() => null)
      return await fetchFunnelData(true)
    } finally {
      refreshLoading.value = false
    }
  }

  async function fetchVehiclesByStage(stageIndex, params = {}) {
    try {
      let vehicles = await getFunnelVehiclesByStage(stageIndex, params).catch(() => null)
      if (!vehicles) {
        vehicles = getMockVehicles(stageIndex)
      }
      vehiclesByStage.value[stageIndex] = vehicles
      return vehicles
    } catch (e) {
      return []
    }
  }

  function selectStage(stageIndex) {
    if (selectedStage.value === stageIndex) {
      selectedStage.value = null
    } else {
      selectedStage.value = stageIndex
      if (!vehiclesByStage.value[stageIndex]) {
        fetchVehiclesByStage(stageIndex)
      }
    }
  }

  function clearSelection() {
    selectedStage.value = null
  }

  async function saveReviewNote(anomalyId, noteData) {
    try {
      const res = await addReviewNote({ anomalyId, ...noteData }).catch(() => noteData)
      if (!reviewNotes.value[anomalyId]) {
        reviewNotes.value[anomalyId] = []
      }
      reviewNotes.value[anomalyId].push({
        id: Date.now(),
        ...noteData,
        createdAt: new Date().toISOString()
      })
      return res
    } catch (e) {
      throw e
    }
  }

  function getReviewNotesByAnomaly(anomalyId) {
    return reviewNotes.value[anomalyId] || []
  }

  return {
    stages,
    anomalies,
    vehiclesByStage,
    selectedStage,
    lastUpdateTime,
    libraryLastUpdate,
    loading,
    refreshLoading,
    caliberChangeDate,
    reviewNotes,
    hasAnomalies,
    totalVehicles,
    successVehicles,
    overallConversion,
    selectedStageVehicles,
    fetchFunnelData,
    refreshFunnelData,
    fetchVehiclesByStage,
    selectStage,
    clearSelection,
    saveReviewNote,
    getReviewNotesByAnomaly
  }
})

function getMockFunnelData() {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 30 * 60 * 60 * 1000)
  return {
    stages: [
      { name: '评估', count: 320, avgDays: 1.2, missingDetectorCount: 0 },
      { name: '报价', count: 280, avgDays: 2.5, missingDetectorCount: 5 },
      { name: '资料收集', count: 235, avgDays: 4.8, missingDetectorCount: 32 },
      { name: '金融审批', count: 198, avgDays: 3.2, missingDetectorCount: 0 },
      { name: '上架成功', count: 165, avgDays: 1.5, missingDetectorCount: 0 }
    ],
    libraryLastUpdate: yesterday.toISOString()
  }
}

function getMockVehicles(stageIndex) {
  const now = new Date()
  const stages = ['评估', '报价', '资料收集', '金融审批', '上架成功']
  const brands = ['宝马', '奔驰', '奥迪', '丰田', '本田', '大众', '特斯拉', '比亚迪']
  const models = ['3系', 'C级', 'A4L', '凯美瑞', '雅阁', '帕萨特', 'Model 3', '汉EV']
  const plates = ['京A', '沪B', '粤C', '浙D', '苏E', '川F', '鲁G', '津H']
  const countArr = [320, 280, 235, 198, 165]
  const count = countArr[stageIndex] || 20
  const vehicles = []
  for (let i = 0; i < Math.min(count, 50); i++) {
    const brandIdx = Math.floor(Math.random() * brands.length)
    const year = 2018 + Math.floor(Math.random() * 7)
    const mileage = (Math.random() * 8 + 1).toFixed(1)
    vehicles.push({
      id: 'V' + stageIndex + '-' + (i + 1),
      vin: 'LBV' + Math.random().toString(36).substring(2, 13).toUpperCase(),
      plateNumber: plates[Math.floor(Math.random() * plates.length)] + String(Math.floor(Math.random() * 90000 + 10000)),
      brand: brands[brandIdx],
      model: models[brandIdx],
      year: year,
      color: ['黑色', '白色', '银色', '灰色', '红色'][Math.floor(Math.random() * 5)],
      mileage: mileage + '万公里',
      price: Math.floor(Math.random() * 300000 + 50000),
      costPrice: Math.floor(Math.random() * 250000 + 40000),
      customerName: stageIndex < 3 ? '客户' + (i + 1) : null,
      customerPhone: stageIndex < 3 ? '138****' + String(Math.floor(Math.random() * 9000 + 1000)) : null,
      stage: stages[stageIndex],
      stageIndex: stageIndex,
      enterDate: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysInStage: Math.floor(Math.random() * 15 + 1),
      hasAnomaly: stageIndex === 2 && i < 10,
      missingDetector: stageIndex === 2 && i < 8,
      operator: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
      remark: ''
    })
  }
  return vehicles
}
