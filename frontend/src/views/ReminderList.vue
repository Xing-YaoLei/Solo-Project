<template>
  <div class="page-container">
    <h3 class="page-title">提醒名单</h3>

    <div class="filter-bar">
      <el-form inline>
        <el-form-item label="状态">
          <el-select v-model="statusFilter" placeholder="全部" clearable style="width: 120px" @change="loadData">
            <el-option label="待发送" value="PENDING" />
            <el-option label="已发送" value="SENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="filterDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" @change="loadData" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <div class="action-bar">
        <el-button v-permission="['ADMIN', 'RECEPTIONIST']" type="success" :disabled="!selectedIds.length" @click="handleBatchSend">
          <el-icon><Promotion /></el-icon>批量发送
        </el-button>
      </div>

      <el-table :data="list" v-loading="loading" @selection-change="handleSelectionChange" stripe>
        <el-table-column type="selection" width="45" />
        <el-table-column prop="studentName" label="学生姓名" width="100" />
        <el-table-column prop="studentPhone" label="联系电话" width="130" />
        <el-table-column prop="subject" label="科目" width="80" />
        <el-table-column prop="trialDate" label="试听日期" width="110" />
        <el-table-column prop="timeSlot" label="时段" width="120" />
        <el-table-column prop="teacherName" label="老师" width="80" />
        <el-table-column prop="type" label="提醒类型" width="90" />
        <el-table-column prop="status" label="发送状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'SENT' ? 'success' : 'warning'" size="small">
              {{ row.status === 'SENT' ? '已发送' : '待发送' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sentAt" label="发送时间" width="160" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              v-permission="['ADMIN', 'RECEPTIONIST']"
              v-if="row.status === 'PENDING'"
              type="primary" link size="small"
              @click="handleSend(row)"
            >发送</el-button>
            <el-button type="info" link size="small" @click="$router.push(`/appointments/${row.appointmentId}`)">查看预约</el-button>
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
import { reminderApi } from '@/api/reminder'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const statusFilter = ref('')
const filterDate = ref(dayjs().format('YYYY-MM-DD'))
const selectedIds = ref([])

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (statusFilter.value) params.status = statusFilter.value
    if (filterDate.value) params.date = filterDate.value
    const res = await reminderApi.getList(params)
    list.value = res.data.records || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

async function handleSend(row) {
  try {
    await reminderApi.send(row.id)
    ElMessage.success('提醒已发送')
    loadData()
  } catch { /* ignore */ }
}

async function handleBatchSend() {
  try {
    await reminderApi.batchSend(selectedIds.value)
    ElMessage.success('批量发送成功')
    selectedIds.value = []
    loadData()
  } catch { /* ignore */ }
}
</script>

<style scoped>
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
}
.action-bar {
  margin-bottom: 12px;
}
.table-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
