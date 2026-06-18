<template>
  <div class="monthly-review">
    <el-card shadow="hover">
      <template #header>
        <div class="review-header">
          <span class="title">月度复盘 — 线索转化</span>
        </div>
      </template>

      <div class="filter-bar">
        <el-date-picker
          v-model="query.yearMonth"
          type="month"
          placeholder="选择月份"
          value-format="YYYY-MM"
          @change="loadStats"
        />
        <el-select v-model="query.groupBy" placeholder="分组维度" style="width:130px" @change="loadStats">
          <el-option label="按线索来源" value="leadSource" />
          <el-option label="按销售顾问" value="salesPerson" />
          <el-option label="按线索状态" value="leadStatus" />
        </el-select>
        <el-input v-model="query.salesPerson" placeholder="销售顾问" clearable style="width:150px" @change="loadStats" />
        <el-select v-model="query.leadSource" placeholder="线索来源" clearable style="width:130px" @change="loadStats">
          <el-option label="线上推广" value="ONLINE" />
          <el-option label="到店自然" value="WALK_IN" />
          <el-option label="转介绍" value="REFERRAL" />
          <el-option label="电话邀约" value="CALL" />
        </el-select>
        <el-select v-model="query.leadStatus" placeholder="线索状态" clearable style="width:130px" @change="loadStats">
          <el-option label="新线索" value="NEW" />
          <el-option label="跟进中" value="FOLLOWING" />
          <el-option label="已转化" value="CONVERTED" />
          <el-option label="已流失" value="LOST" />
        </el-select>
        <el-button type="primary" @click="loadStats">查询</el-button>
      </div>

      <ConversionChart :data="stats" />

      <el-table :data="stats" stripe size="small" style="margin-top: 20px;">
        <el-table-column prop="category" :label="groupLabel" />
        <el-table-column prop="total" label="总线索数" />
        <el-table-column prop="converted" label="转化数" />
        <el-table-column label="转化率">
          <template #default="{ row }">
            <el-progress :percentage="Number(row.rate).toFixed(1)" :stroke-width="14" :text-inside="true" />
          </template>
        </el-table-column>
      </el-table>

      <div class="export-bar">
        <el-input v-model="operator" placeholder="操作者姓名" style="width:180px" />
        <el-button type="success" :icon="Download" @click="handleExport" :loading="exporting">
          导出月报
        </el-button>
        <el-button @click="showExportMeta = true">预览导出信息</el-button>
      </div>
    </el-card>

    <el-dialog v-model="showExportMeta" title="导出文件元信息" width="480px">
      <el-descriptions :column="1" border v-if="exportMeta">
        <el-descriptions-item label="筛选口径">{{ exportMeta.filterCriteria }}</el-descriptions-item>
        <el-descriptions-item label="生成时间">{{ exportMeta.generatedAt }}</el-descriptions-item>
        <el-descriptions-item label="操作者">{{ exportMeta.operator }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showExportMeta = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { getConversionStats, exportMonthlyReport, getExportMeta } from '../api/review'
import ConversionChart from '../components/ConversionChart.vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const query = ref({
  yearMonth: dayjs().format('YYYY-MM'),
  groupBy: 'leadSource',
  salesPerson: '',
  leadSource: '',
  leadStatus: ''
})
const stats = ref([])
const operator = ref('')
const exporting = ref(false)
const showExportMeta = ref(false)
const exportMeta = ref(null)

const groupLabel = computed(() => {
  const map = { leadSource: '线索来源', salesPerson: '销售顾问', leadStatus: '线索状态' }
  return map[query.value.groupBy] || '线索来源'
})

function buildExportParams() {
  const p = { yearMonth: query.value.yearMonth, groupBy: query.value.groupBy, operator: operator.value }
  if (query.value.salesPerson) p.salesPerson = query.value.salesPerson
  if (query.value.leadSource) p.leadSource = query.value.leadSource
  if (query.value.leadStatus) p.leadStatus = query.value.leadStatus
  return p
}

async function loadStats() {
  try {
    stats.value = await getConversionStats(query.value)
  } catch {
    stats.value = []
  }
}

async function handleExport() {
  if (!operator.value) {
    ElMessage.warning('请填写操作者姓名')
    return
  }
  exporting.value = true
  try {
    const blob = await exportMonthlyReport(buildExportParams())
    const url = window.URL.createObjectURL(new Blob([blob]))
    const a = document.createElement('a')
    a.href = url
    a.download = `线索转化月报_${query.value.yearMonth}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

async function loadExportMeta() {
  if (!operator.value) return
  try {
    exportMeta.value = await getExportMeta({ ...query.value, operator: operator.value })
  } catch { /* ignore */ }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.monthly-review { height: 100%; }
.review-header .title { font-weight: 600; font-size: 16px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
.export-bar { display: flex; gap: 12px; margin-top: 20px; align-items: center; padding-top: 16px; border-top: 1px solid #ebeef5; }
</style>
