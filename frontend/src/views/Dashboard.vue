<template>
  <div class="page-container">
    <h3 class="page-title">工作台</h3>

    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <div class="stat-card" style="border-top: 3px solid var(--edu-blue)">
          <div class="stat-value" style="color: var(--edu-blue)">{{ stats.todayCount }}</div>
          <div class="stat-label">今日预约数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="border-top: 3px solid var(--color-warning)">
          <div class="stat-value" style="color: var(--color-warning)">{{ stats.pendingCount }}</div>
          <div class="stat-label">待确认</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="border-top: 3px solid var(--color-danger)">
          <div class="stat-value" style="color: var(--color-danger)">{{ stats.conflictCount }}</div>
          <div class="stat-label">冲突数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="border-top: 3px solid var(--color-success)">
          <div class="stat-value" style="color: var(--color-success)">{{ stats.attendanceRate }}%</div>
          <div class="stat-label">到场率</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="16">
        <div class="table-card">
          <div class="card-header">
            <span class="card-title">今日预约列表</span>
            <el-button type="primary" link @click="$router.push('/appointments')">查看全部</el-button>
          </div>
          <el-table :data="todayList" size="small" v-loading="loading">
            <el-table-column prop="studentName" label="学生" width="80" />
            <el-table-column prop="subject" label="科目" width="70" />
            <el-table-column prop="timeSlot" label="时段" width="110" />
            <el-table-column prop="teacherName" label="老师" width="70" />
            <el-table-column prop="campus" label="校区" width="90" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <StatusTag :status="row.status" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="$router.push(`/appointments/${row.id}`)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="table-card">
          <div class="card-header">
            <span class="card-title">待提醒列表</span>
            <el-button type="primary" link @click="$router.push('/reminders')">查看全部</el-button>
          </div>
          <div v-for="item in reminderList" :key="item.id" class="reminder-item">
            <div class="reminder-info">
              <span class="reminder-name">{{ item.studentName }}</span>
              <span class="reminder-time">{{ item.trialDate }} {{ item.timeSlot }}</span>
            </div>
            <el-button type="primary" size="small" @click="handleSendReminder(item)">发送</el-button>
          </div>
          <el-empty v-if="!reminderList.length" description="暂无待提醒" :image-size="60" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { appointmentApi } from '@/api/appointment'
import { reminderApi } from '@/api/reminder'
import { attendanceApi } from '@/api/attendance'
import StatusTag from '@/components/StatusTag.vue'
import dayjs from 'dayjs'

const loading = ref(false)
const todayList = ref([])
const reminderList = ref([])

const stats = ref({
  todayCount: 0,
  pendingCount: 0,
  conflictCount: 0,
  attendanceRate: 0
})

onMounted(() => {
  loadDashboard()
})

async function loadDashboard() {
  loading.value = true
  try {
    const today = dayjs().format('YYYY-MM-DD')
    const [listRes, rateRes] = await Promise.all([
      appointmentApi.search({ startDate: today, endDate: today, page: 1, pageSize: 50 }),
      attendanceApi.getRate({ startDate: today, endDate: today })
    ])
    todayList.value = listRes.data.records || []
    const records = listRes.data.records || []
    stats.value.todayCount = listRes.data.total || records.length
    stats.value.pendingCount = records.filter(r => r.status === 'PENDING').length
    stats.value.conflictCount = records.filter(r => r.status === 'CONFLICT').length
    stats.value.attendanceRate = rateRes.data?.rate ?? 0

    const reminderRes = await reminderApi.getList({ status: 'PENDING', page: 1, pageSize: 10 })
    reminderList.value = reminderRes.data.records || []
  } catch {
    // use default empty data
  } finally {
    loading.value = false
  }
}

async function handleSendReminder(item) {
  try {
    await reminderApi.send(item.id)
    ElMessage.success('提醒已发送')
    loadDashboard()
  } catch { /* ignore */ }
}
</script>

<style scoped>
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
  color: var(--text-primary);
}
.stat-row {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.card-title {
  font-weight: 600;
  font-size: 15px;
}
.reminder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}
.reminder-item:last-child {
  border-bottom: none;
}
.reminder-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.reminder-name {
  font-weight: 500;
  font-size: 14px;
}
.reminder-time {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
