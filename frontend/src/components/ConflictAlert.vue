<template>
  <el-card class="conflict-alert" shadow="hover" :body-style="{ padding: '16px' }">
    <div class="alert-header">
      <el-icon class="alert-icon" :size="20"><WarningFilled /></el-icon>
      <span class="alert-title">时段冲突</span>
    </div>
    <div class="conflict-items">
      <div v-for="item in conflicts" :key="item.id" class="conflict-item">
        <div class="conflict-info">
          <span class="student">{{ item.studentName }}</span>
          <span class="detail">{{ item.subject }} · {{ item.timeSlot }}</span>
          <span class="teacher">老师：{{ item.teacherName }}</span>
        </div>
        <el-button type="primary" size="small" @click="$emit('resolve', item)">
          解决冲突
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  conflicts: { type: Array, default: () => [] }
})

defineEmits(['resolve'])
</script>

<style scoped>
.conflict-alert {
  border-left: 4px solid var(--color-danger);
}
.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.alert-icon {
  color: var(--color-danger);
}
.alert-title {
  font-weight: 600;
  color: var(--color-danger);
  font-size: 15px;
}
.conflict-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border-color);
}
.conflict-item:last-child {
  border-bottom: none;
}
.conflict-info {
  display: flex;
  gap: 12px;
  font-size: 13px;
}
.student {
  font-weight: 500;
}
.detail {
  color: var(--text-secondary);
}
.teacher {
  color: var(--text-secondary);
}
</style>
