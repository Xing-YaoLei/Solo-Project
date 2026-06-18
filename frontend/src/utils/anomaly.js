export const ANOMALY_TYPES = {
  LIBRARY_DELAY: 'LIBRARY_DELAY',
  DETECTOR_MISSING: 'DETECTOR_MISSING',
  FINANCE_CALIBER_CHANGE: 'FINANCE_CALIBER_CHANGE'
}

export const ANOMALY_CONFIG = {
  [ANOMALY_TYPES.LIBRARY_DELAY]: {
    label: '车源库延迟',
    description: '车源数据入库延迟超过24小时',
    color: '#f56c6c',
    icon: 'Warning',
    affectedStages: [0, 1]
  },
  [ANOMALY_TYPES.DETECTOR_MISSING]: {
    label: '检测仪缺失',
    description: '车辆检测数据缺失或异常',
    color: '#e6a23c',
    icon: 'CircleClose',
    affectedStages: [1, 2]
  },
  [ANOMALY_TYPES.FINANCE_CALIBER_CHANGE]: {
    label: '金融审批口径变化',
    description: '金融审批标准近期发生调整',
    color: '#909399',
    icon: 'InfoFilled',
    affectedStages: [3]
  }
}

export const STAGE_NAMES = ['评估', '报价', '资料收集', '金融审批', '上架成功']

export function detectAnomalies(funnelData, options = {}) {
  const anomalies = []
  const { libraryDelayHours = 24, missingDetectorThreshold = 0.1, caliberChangeDate = null } = options

  if (funnelData?.libraryLastUpdate) {
    const hours = (Date.now() - new Date(funnelData.libraryLastUpdate).getTime()) / (1000 * 60 * 60)
    if (hours > libraryDelayHours) {
      anomalies.push({
        type: ANOMALY_TYPES.LIBRARY_DELAY,
        detectedAt: new Date().toISOString(),
        details: `车源库已 ${hours.toFixed(1)} 小时未更新`,
        stageRange: ANOMALY_CONFIG[ANOMALY_TYPES.LIBRARY_DELAY].affectedStages
      })
    }
  }

  if (funnelData?.stages && funnelData.stages.length >= 3) {
    const missingCount = funnelData.stages[2].missingDetectorCount || 0
    const totalCount = funnelData.stages[2].count || 1
    if (missingCount / totalCount > missingDetectorThreshold) {
      anomalies.push({
        type: ANOMALY_TYPES.DETECTOR_MISSING,
        detectedAt: new Date().toISOString(),
        details: `资料收集阶段检测仪缺失率 ${(missingCount / totalCount * 100).toFixed(1)}%，超过阈值 ${missingDetectorThreshold * 100}%`,
        stageRange: ANOMALY_CONFIG[ANOMALY_TYPES.DETECTOR_MISSING].affectedStages
      })
    }
  }

  if (caliberChangeDate) {
    const daysSinceChange = (Date.now() - new Date(caliberChangeDate).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceChange <= 30) {
      anomalies.push({
        type: ANOMALY_TYPES.FINANCE_CALIBER_CHANGE,
        detectedAt: new Date().toISOString(),
        details: `金融审批口径于 ${caliberChangeDate} 调整（${daysSinceChange.toFixed(0)}天前），请注意数据对比`,
        stageRange: ANOMALY_CONFIG[ANOMALY_TYPES.FINANCE_CALIBER_CHANGE].affectedStages
      })
    }
  }

  return anomalies
}

export function getAnomalyStageRanges(anomalies) {
  if (!anomalies || anomalies.length === 0) return []
  return anomalies.map(a => ({
    type: a.type,
    stages: a.stageRange,
    config: ANOMALY_CONFIG[a.type]
  }))
}
