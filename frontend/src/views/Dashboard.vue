<template>
  <div class="dashboard-page">
    <div class="page-header flex-between mb-20">
      <div>
        <h2 class="page-title">上架漏斗看板</h2>
        <p class="page-desc">
          最后更新: {{ lastUpdateText }}
          <el-tag v-if="funnelStore.hasAnomalies" type="danger" size="small" class="ml-10">
            检测到 {{ funnelStore.anomalies.length }} 个异常
          </el-tag>
        </p>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="handleExport">导出 Excel</el-button>
        <el-button :icon="Share" @click="handleShare">生成分享</el-button>
        <el-button
          type="primary"
          :icon="Refresh"
          :loading="funnelStore.refreshLoading"
          @click="handleRefresh"
        >
          刷新数据
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="mb-20">
      <el-col :span="6" v-for="(stat, idx) in statCards" :key="idx">
        <el-card class="stat-card card-shadow" shadow="hover">
          <div class="stat-content flex-between">
            <div>
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
              <div class="stat-desc">{{ stat.desc }}</div>
            </div>
            <el-icon class="stat-icon" :style="{ color: stat.color }" :size="44">
              <component :is="stat.icon" />
            </el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mb-20" v-if="funnelStore.hasAnomalies">
      <el-col :span="24">
        <el-card class="card-shadow anomaly-card">
          <template #header>
            <div class="flex-between">
              <div class="card-title">
                <el-icon color="#f56c6c"><WarningFilled /></el-icon>
                <span>异常预警</span>
              </div>
              <el-tag type="info" size="small">点击异常卡片可添加复盘备注</el-tag>
            </div>
          </template>
          <div class="anomaly-list">
            <div
              v-for="(anomaly, idx) in funnelStore.anomalies"
              :key="idx"
              class="anomaly-item"
              @click="openReviewDialog(anomaly, idx)"
            >
              <AnomalyBadge
                :type="anomaly.type"
                :details="anomaly.details"
                :clickable="false"
              />
              <div class="anomaly-range">
                <el-icon><Histogram /></el-icon>
                影响阶段: {{ getStageRangeText(anomaly.stageRange) }}
              </div>
              <div class="anomaly-detected">
                <el-icon><Clock /></el-icon>
                {{ formatDetectedTime(anomaly.detectedAt) }}
              </div>
              <el-button type="primary" size="small" link>
                <el-icon><EditPen /></el-icon>
                复盘备注
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="funnelStore.selectedStage !== null ? 14 : 24">
        <el-card class="card-shadow funnel-card">
          <template #header>
            <div class="flex-between">
              <div class="card-title">
                <el-icon color="#409eff"><Histogram /></el-icon>
                <span>上架漏斗图</span>
                <el-tag v-if="funnelStore.selectedStage !== null" type="primary" size="small" class="ml-10">
                  已选: {{ funnelStore.stages[funnelStore.selectedStage]?.name }}
                  <el-button link size="small" type="danger" class="close-btn" @click="funnelStore.clearSelection()">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </el-tag>
              </div>
              <span class="tip-text">点击阶段筛选车源，点击异常框查看详情</span>
            </div>
          </template>
          <div v-loading="funnelStore.loading" class="funnel-wrapper">
            <FunnelChart
              :stages="funnelStore.stages"
              :anomalies="funnelStore.anomalies"
              :selected-stage="funnelStore.selectedStage"
              :height="520"
              @stage-click="handleStageClick"
              @anomaly-click="handleAnomalyClick"
            />
          </div>
        </el-card>
      </el-col>

      <el-col :span="10" v-if="funnelStore.selectedStage !== null">
        <el-card class="card-shadow vehicle-card">
          <template #header>
            <div class="flex-between">
              <div class="card-title">
                <el-icon color="#67c23a"><Van /></el-icon>
                <span>{{ funnelStore.stages[funnelStore.selectedStage]?.name }} · 车源列表</span>
                <el-tag size="small" class="ml-10">
                  {{ funnelStore.selectedStageVehicles.length }} 条
                </el-tag>
              </div>
              <el-input v-model="searchKeyword" placeholder="搜索品牌/车牌号" size="small" style="width: 180px">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </div>
          </template>
          <div class="vehicle-list">
            <div
              v-for="vehicle in filteredVehicles"
              :key="vehicle.id"
              class="vehicle-item"
              :class="{ 'has-anomaly': vehicle.hasAnomaly }"
            >
              <div class="vehicle-main flex-between">
                <div>
                  <div class="vehicle-title">
                    <span class="brand">{{ vehicle.brand }} {{ vehicle.model }}</span>
                    <span class="year">{{ vehicle.year }}款</span>
                    <el-tag
                      v-if="vehicle.missingDetector"
                      type="warning"
                      size="small"
                      effect="light"
                      class="ml-10"
                    >
                      检测仪缺失
                    </el-tag>
                  </div>
                  <div class="vehicle-meta">
                    <span><el-icon><Postcard /></el-icon>{{ vehicle.plateNumber }}</span>
                    <span><el-icon><Guide /></el-icon>{{ vehicle.mileage }}</span>
                    <span><el-icon><Brush /></el-icon>{{ vehicle.color }}</span>
                  </div>
                </div>
                <div class="vehicle-right" v-if="!userStore.isExternal">
                  <div class="vehicle-price">¥{{ formatPrice(vehicle.price) }}</div>
                  <div class="vehicle-days">在库 {{ vehicle.daysInStage }} 天</div>
                </div>
                <div class="vehicle-right" v-else>
                  <div class="vehicle-days">在库 {{ vehicle.daysInStage }} 天</div>
                </div>
              </div>
              <div class="vehicle-footer" v-if="!userStore.isExternal">
                <span class="vin">VIN: {{ vehicle.vin }}</span>
                <span class="operator">负责: {{ vehicle.operator }}</span>
              </div>
            </div>
            <el-empty v-if="filteredVehicles.length === 0" description="暂无数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <ReviewNoteDialog
      v-model="reviewDialogVisible"
      :anomaly-id="currentAnomalyId"
      :anomaly-info="currentAnomaly"
      @saved="handleNoteSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFunnelStore } from '@/stores/funnel'
import { useUserStore } from '@/stores/user'
import { ANOMALY_CONFIG } from '@/utils/anomaly'
import { exportToExcel } from '@/utils/download'
import { STAGE_NAMES } from '@/utils/anomaly'
import dayjs from 'dayjs'
import {
  Download, Share, Refresh, WarningFilled, Histogram, Clock,
  EditPen, Close, Search, Van, Postcard, Guide, Brush
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import FunnelChart from '@/components/FunnelChart.vue'
import AnomalyBadge from '@/components/AnomalyBadge.vue'
import ReviewNoteDialog from '@/components/ReviewNoteDialog.vue'

const funnelStore = useFunnelStore()
const userStore = useUserStore()

const searchKeyword = ref('')
const reviewDialogVisible = ref(false)
const currentAnomaly = ref(null)
const currentAnomalyId = ref('')

const statCards = computed(() => [
  {
    label: '评估车源总数',
    value: funnelStore.totalVehicles,
    desc: '进入评估阶段',
    icon: 'Van',
    color: '#5470c6'
  },
  {
    label: '上架成功数',
    value: funnelStore.successVehicles,
    desc: '完成全流程上架',
    icon: 'CircleCheckFilled',
    color: '#67c23a'
  },
  {
    label: '整体转化率',
    value: funnelStore.overallConversion + '%',
    desc: '评估到上架成功',
    icon: 'TrendCharts',
    color: '#409eff'
  },
  {
    label: '异常待处理',
    value: funnelStore.anomalies.length,
    desc: funnelStore.hasAnomalies ? '需要关注处理' : '暂无异常',
    icon: 'WarningFilled',
    color: funnelStore.hasAnomalies ? '#f56c6c' : '#909399'
  }
])

const lastUpdateText = computed(() => {
  if (!funnelStore.lastUpdateTime) return '未更新'
  return dayjs(funnelStore.lastUpdateTime).format('YYYY-MM-DD HH:mm:ss')
})

const filteredVehicles = computed(() => {
  const list = funnelStore.selectedStageVehicles
  if (!searchKeyword.value) return list
  const kw = searchKeyword.value.toLowerCase()
  return list.filter(v =>
    v.brand.toLowerCase().includes(kw) ||
    v.plateNumber.toLowerCase().includes(kw) ||
    v.model.toLowerCase().includes(kw)
  )
})

onMounted(() => {
  funnelStore.fetchFunnelData()
})

function formatPrice(price) {
  if (!price) return '--'
  return (price / 10000).toFixed(2) + '万'
}

function formatDetectedTime(time) {
  if (!time) return ''
  return '检测于 ' + dayjs(time).format('MM-DD HH:mm')
}

function getStageRangeText(range) {
  if (!range || range.length === 0) return ''
  if (range.length === 1) return STAGE_NAMES[range[0]]
  const min = Math.min(...range)
  const max = Math.max(...range)
  return `${STAGE_NAMES[min]} ~ ${STAGE_NAMES[max]}`
}

function handleStageClick(index) {
  funnelStore.selectStage(index)
}

function handleAnomalyClick(anomaly, idx) {
  const index = funnelStore.anomalies.findIndex(a => a.type === anomaly.type)
  openReviewDialog(anomaly, index >= 0 ? index : 0)
}

function openReviewDialog(anomaly, idx) {
  currentAnomaly.value = {
    ...anomaly,
    config: ANOMALY_CONFIG[anomaly.type]
  }
  currentAnomalyId.value = `anomaly-${anomaly.type}-${idx}`
  reviewDialogVisible.value = true
}

function handleRefresh() {
  funnelStore.refreshFunnelData()
  ElMessage.success('数据已刷新')
}

function handleExport() {
  const stagesData = funnelStore.stages.map(s => ({
    '阶段名称': s.name,
    '数量(辆)': s.count,
    '阶段转化率(%)': s.conversionRate,
    '平均停留天数': s.avgDays || '-',
    '检测仪缺失数': s.missingDetectorCount || 0
  }))

  const summary = [
    ['上架漏斗数据报告'],
    ['导出时间', dayjs().format('YYYY-MM-DD HH:mm:ss')],
    ['总评估数', funnelStore.totalVehicles],
    ['上架成功数', funnelStore.successVehicles],
    ['整体转化率(%)', funnelStore.overallConversion],
    ['异常数', funnelStore.anomalies.length],
    ['']
  ]

  if (funnelStore.anomalies.length > 0) {
    summary.push(['异常详情'])
    summary.push(['类型', '描述', '影响阶段', '检测时间'])
    funnelStore.anomalies.forEach(a => {
      summary.push([
        ANOMALY_CONFIG[a.type]?.label || a.type,
        a.details || '-',
        getStageRangeText(a.stageRange),
        dayjs(a.detectedAt).format('YYYY-MM-DD HH:mm')
      ])
    })
  }

  const fullData = [...summary, [], ...stagesData]
  exportToExcel(fullData, '上架漏斗数据报告', '漏斗数据', true)
  ElMessage.success('导出成功，附带库存周转计算规则说明')
}

function handleShare() {
  ElMessageBox.prompt('请设置分享链接有效期（天）', '生成分享链接', {
    confirmButtonText: '生成',
    cancelButtonText: '取消',
    inputValue: '7',
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入有效天数'
  }).then(({ value }) => {
    const mockLink = `${window.location.origin}/public/share/${Math.random().toString(36).substring(2, 10)}`
    ElMessageBox.alert(
      `分享链接已生成（有效期 ${value} 天）：<br/><code style="background:#f5f7fa;padding:4px 8px;border-radius:4px;word-break:break-all;">${mockLink}</code><br/><br/>外部人员将看不到价格、客户等敏感字段`,
      '分享链接',
      { dangerouslyUseHTMLString: true }
    )
  }).catch(() => {})
}

function handleNoteSaved(data) {
  ElMessage.success(`备注已保存: ${data.anomalyId}`)
}
</script>

<style lang="scss" scoped>
.dashboard-page {
  .page-title {
    margin: 0 0 4px;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }

  .page-desc {
    margin: 0;
    font-size: 13px;
    color: #909399;
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #303133;

    .close-btn {
      padding: 0;
      margin-left: 4px;
    }
  }

  .tip-text {
    font-size: 12px;
    color: #909399;
  }

  .stat-card {
    :deep(.el-card__body) { padding: 16px 20px; }

    .stat-content {
      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 6px;
      }
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .stat-desc {
        font-size: 12px;
        color: #c0c4cc;
      }
      .stat-icon { opacity: 0.18; }
    }
  }

  .anomaly-card {
    :deep(.el-card__body) { padding: 12px 20px; }
  }

  .anomaly-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .anomaly-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: #fff7f7;
    border: 1px solid #fde2e2;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
    min-width: 280px;

    &:hover {
      background: #fef0f0;
      border-color: #f56c6c;
      transform: translateY(-1px);
    }

    .anomaly-range,
    .anomaly-detected {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #909399;
    }
  }

  .funnel-card {
    :deep(.el-card__body) { padding: 8px 8px 16px; }
  }

  .funnel-wrapper {
    padding: 8px;
  }

  .vehicle-card {
    :deep(.el-card__body) { padding: 8px; }
  }

  .vehicle-list {
    max-height: 540px;
    overflow-y: auto;
    padding: 0 4px;
  }

  .vehicle-item {
    padding: 12px 14px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 10px;
    transition: all 0.2s;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 8px rgba(64,158,255,0.1);
    }

    &.has-anomaly {
      background: #fffbe6;
      border-color: #f5dab1;
    }

    .vehicle-title {
      margin-bottom: 6px;
      .brand { font-size: 15px; font-weight: 600; color: #303133; }
      .year { font-size: 13px; color: #909399; margin-left: 4px; }
    }

    .vehicle-meta {
      display: flex;
      gap: 14px;
      font-size: 12px;
      color: #606266;

      span { display: flex; align-items: center; gap: 3px; }
    }

    .vehicle-right {
      text-align: right;
      .vehicle-price { font-size: 18px; font-weight: 700; color: #f56c6c; }
      .vehicle-days { font-size: 12px; color: #909399; }
    }

    .vehicle-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #ebeef5;
      font-size: 11px;
      color: #c0c4cc;
    }
  }
}
</style>
