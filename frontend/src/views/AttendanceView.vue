<template>
  <div class="page-container">
    <h3 class="page-title">到场状态管理</h3>

    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <div class="stat-card" style="border-top: 3px solid var(--color-success)">
          <div class="stat-value" style="color: var(--color-success)">{{ rateStats.checkedIn }}</div>
          <div class="stat-label">已签到</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="border-top: 3px solid var(--color-warning)">
          <div class="stat-value" style="color: var(--color-warning)">{{ rateStats.late }}</div>
          <div class="stat-label">迟到</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="border-top: 3px solid var(--color-danger)">
          <div class="stat-value" style="color: var(--color-danger)">{{ rateStats.noShow }}</div>
          <div class="stat-label">未到</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="border-top: 3px solid var(--edu-blue)">
          <div class="stat-value" style="color: var(--edu-blue)">{{ rateStats.rate }}%</div>
          <div class="stat-label">到场率</div>
        </div>
      </el-col>
    </el-row>

    <div class="filter-bar">
      <el-form inline>
        <el-form-item label="日期">
          <el-date-picker v-model="filterDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" @change="loadData" />
        </el-form-item>
        <el-form-item label="到场状态">
          <el-select v-model="attendanceFilter" placeholder="全部" clearable style="width: 120px" @change="loadData">
            <el-option label="已签到" value="CHECKED_IN" />
            <el-option label="迟到" value="LATE" />
            <el-option label="未到" value="NO_SHOW" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <BatchOperationBar
      v-if="selectedIds.length"
      :selected-count="selectedIds.length"
      @batch-confirm="handleBatchCheckIn"
      @clear-selection="clearSelection"
    />

    <div class="table-card">
      <div class="action-bar">
        <el-button v-permission="['ADMIN', 'RECEPTIONIST']" type="success" :disabled="!selectedIds.length" @click="handleBatchCheckIn">
          批量签到
        </el-button>
      </div>

      <el-table :data="list" v-loading="loading" @selection-change="handleSelectionChange" stripe>
        <el-table-column type="selection" width="45" />
        <el-table-column prop="studentName" label="学生姓名" width="100" />
        <el-table-column prop="subject" label="科目" width="80" />
        <el-table-column prop="trialDate" label="试听日期" width="110" />
        <el-table-column prop="timeSlot" label="时段" width="120" />
        <el-table-column prop="teacherName" label="老师" width="80" />
        <el-table-column prop="campus" label="校区" width="100" />
        <el-table-column prop="attendanceStatus" label="到场状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.attendanceStatus === 'CHECKED_IN'" type="success">已签到</el-tag>
            <el-tag v-else-if="row.attendanceStatus === 'LATE'" type="warning">迟到</el-tag>
            <el-tag v-else-if="row.attendanceStatus === 'NO_SHOW'" type="danger">未到</el-tag>
            <el-tag v-else type="info">待签到</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="checkInTime" label="签到时间" width="160" />
        <el-table-column label="操作" width="180" v-permission="['ADMIN', 'RECEPTIONIST']">
          <template #default="{ row }">
            <el-button v-if="!row.attendanceStatus" type="success" link size="small" @click="handleCheckIn(row, 'CHECKED_IN')">签到</el-button>
            <el-button v-if="!row.attendanceStatus" type="warning" link size="small" @click="handleCheckIn(row, 'LATE')">迟到</el-button>
            <el-button v-if="!row.attendanceStatus" type="danger" link size="small" @click="handleCheckIn(row, 'NO_SHOW')">未到</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        class="table-pagination"
        @current-change="loadData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { appointmentApi } from '@/api/appointment'
import { attendanceApi } from '@/api/attendance'
import dayjs from 'dayjs'
import BatchOperationBar from '@/components/BatchOperationBar.vue'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterDate = ref(dayjs().format('YYYY-MM-DD'))
const attendanceFilter = ref('')
const selectedIds = ref([])

const rateStats = ref({ checkedIn: 0, late: 0, noShow: 0, rate: 0 })

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, status: 'CONFIRMED' }
    if (filterDate.value) params.trialDate = filterDate.value
    if (attendanceFilter.value) params.attendanceStatus = attendanceFilter.value

    const [listRes, rateRes] = await Promise.all([
      appointmentApi.search(params),
      attendanceApi.getRate({ date: filterDate.value })
    ])
    list.value = listRes.data.records || []
    total.value = listRes.data.total || 0
    rateStats.value = {
      checkedIn: rateRes.data?.checkedIn ?? 0,
      late: rateRes.data?.late ?? 0,
      noShow: rateRes.data?.noShow ?? 0,
      rate: rateRes.data?.rate ?? 0
    }
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

function clearSelection() {
  selectedIds.value = []
}

async function handleCheckIn(row, status) {
  try {
    await attendanceApi.checkIn(row.id, { status })
    ElMessage.success('操作成功')
    loadData()
  } catch { /* ignore */ }
}

async function handleBatchCheckIn() {
  try {
    await attendanceApi.batchCheckIn({ ids: selectedIds.value, status: 'CHECKED_IN' })
    ElMessage.success('批量签到成功')
    clearSelection()
    loadData()
  } catch { /* ignore */ }
}
</script>

<style scoped>
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
}
.stat-row {
  margin-bottom: 20px;
}
.action-bar {
  margin-bottom: 12px;
}
.table-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
