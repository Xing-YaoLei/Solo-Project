<template>
  <div class="page-container">
    <h3 class="page-title">改约记录</h3>

    <div class="filter-bar">
      <el-form inline>
        <el-form-item label="日期范围">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width: 240px" />
        </el-form-item>
        <el-form-item label="老师">
          <el-select v-model="teacherFilter" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="t in teacherList" :key="t.id" :label="t.name" :value="t.name" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">
            <el-icon><Search /></el-icon>查询
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table :data="logs" v-loading="loading" size="default">
        <el-table-column prop="createdAt" label="改约时间" width="160" />
        <el-table-column prop="operatorName" label="操作人" width="80" />
        <el-table-column label="原预约" min-width="200">
          <template #default="{ row }">
            <div class="old-info">
              <span>{{ row.oldStudentName }}</span>
              <span class="detail-text">{{ row.oldSubject }} · {{ row.oldTrialDate }} · {{ row.oldTimeSlot }}</span>
              <span class="teacher-text">老师：{{ row.oldTeacherName }}</span>
              <el-link v-if="row.sourceId" type="primary" @click="$router.push(`/appointments/${row.sourceId}`)">查看原单</el-link>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="" width="50">
          <template #default>
            <el-icon color="var(--edu-blue)"><Right /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="新预约" min-width="200">
          <template #default="{ row }">
            <div class="new-info">
              <span>{{ row.newStudentName }}</span>
              <span class="detail-text">{{ row.newSubject }} · {{ row.newTrialDate }} · {{ row.newTimeSlot }}</span>
              <span class="teacher-text">老师：{{ row.newTeacherName }}</span>
              <el-link v-if="row.newAppointmentId" type="primary" @click="$router.push(`/appointments/${row.newAppointmentId}`)">查看新单</el-link>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="改约原因" min-width="150" />
        <el-table-column prop="sourceOriginalId" label="追溯原始" width="100">
          <template #default="{ row }">
            <el-link v-if="row.sourceOriginalId" type="primary" @click="$router.push(`/appointments/${row.sourceOriginalId}`)">
              查看原始记录
            </el-link>
            <span v-else>-</span>
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
import { appointmentApi } from '@/api/appointment'

const loading = ref(false)
const logs = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dateRange = ref([])
const teacherFilter = ref('')

const teacherList = ref([
  { id: 1, name: '王老师' },
  { id: 2, name: '李老师' },
  { id: 3, name: '张老师' },
  { id: 4, name: '赵老师' },
  { id: 5, name: '陈老师' }
])

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, changeType: 'RESCHEDULE' }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    if (teacherFilter.value) params.teacher = teacherFilter.value
    const res = await appointmentApi.getAllChangeLogs(params)
    logs.value = res.data.records || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
}
.old-info, .new-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}
.old-info {
  color: var(--color-danger);
  opacity: 0.85;
}
.new-info {
  color: var(--color-success);
}
.detail-text, .teacher-text {
  font-size: 12px;
  color: var(--text-secondary);
}
.table-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
