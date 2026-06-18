<template>
  <el-card class="appointment-slots-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><Clock /></el-icon>
        <span>预约时段</span>
      </div>
    </template>
    <div v-if="data" class="appointment-info">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="预约日期">{{ data.appointmentDate }}</el-descriptions-item>
        <el-descriptions-item label="时段">
          <span class="time-range">{{ data.startTime }} - {{ data.endTime }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="预约状态">
          <el-tag :type="aptStatusType(data.appointmentStatus)" size="small">
            {{ data.appointmentStatus }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="分派负责人">{{ data.assignedTo }}</el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ data.customerName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ data.customerPhone }}</el-descriptions-item>
      </el-descriptions>
    </div>
    <el-empty v-else description="暂无预约信息" :image-size="60" />
  </el-card>
</template>

<script setup>
const props = defineProps({
  data: { type: Object, default: null }
})

function aptStatusType(status) {
  const map = {
    'PENDING': 'info', 'CONFIRMED': 'warning', 'COMPLETED': 'success',
    'CANCELLED': 'danger', 'NO_SHOW': 'danger'
  }
  return map[status] || 'info'
}
</script>

<style scoped>
.appointment-slots-card { height: 100%; }
.card-header { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.time-range { font-weight: 600; color: #409eff; }
</style>
