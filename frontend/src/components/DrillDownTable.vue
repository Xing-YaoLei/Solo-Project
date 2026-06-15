<template>
  <el-dialog
    v-model="visible"
    title="下钻数据"
    width="900px"
    destroy-on-close
  >
    <div class="drill-header">
      <span>{{ title }}</span>
      <el-button size="small" @click="handleExport">
        <el-icon><Download /></el-icon>导出
      </el-button>
    </div>
    <el-table :data="tableData" v-loading="loading" size="small" max-height="400">
      <el-table-column prop="studentName" label="学生姓名" width="100" />
      <el-table-column prop="subject" label="科目" width="80" />
      <el-table-column prop="trialDate" label="试听日期" width="110" />
      <el-table-column prop="timeSlot" label="时段" width="120" />
      <el-table-column prop="teacherName" label="老师" width="80" />
      <el-table-column prop="campus" label="校区" width="100" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <StatusTag :status="row.status" />
        </template>
      </el-table-column>
      <el-table-column prop="attendanceStatus" label="到场" width="80">
        <template #default="{ row }">
          <span v-if="row.attendanceStatus === 'CHECKED_IN'" style="color: #38A169">已签到</span>
          <span v-else-if="row.attendanceStatus === 'LATE'" style="color: #ED8936">迟到</span>
          <span v-else-if="row.attendanceStatus === 'NO_SHOW'" style="color: #E53E3E">未到</span>
          <span v-else style="color: #A0AEC0">-</span>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      class="drill-pagination"
      @current-change="fetchData"
    />
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { statisticsApi } from '@/api/statistics'
import StatusTag from './StatusTag.vue'
import * as XLSX from 'xlsx'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  drillParams: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const tableData = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

watch(() => props.modelValue, (val) => {
  if (val) {
    page.value = 1
    fetchData()
  }
})

async function fetchData() {
  loading.value = true
  try {
    const res = await statisticsApi.drillDown({
      ...props.drillParams,
      page: page.value,
      pageSize: pageSize.value
    })
    tableData.value = res.data.records || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

function handleExport() {
  if (!tableData.value.length) return
  const ws = XLSX.utils.json_to_sheet(tableData.value)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, `${props.title}.xlsx`)
}
</script>

<style scoped>
.drill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
}
.drill-pagination {
  margin-top: 12px;
  justify-content: flex-end;
}
</style>
