<template>
  <el-timeline>
    <el-timeline-item
      v-for="log in logs"
      :key="log.id"
      :timestamp="log.createdAt"
      placement="top"
      :type="getTimelineType(log.changeType)"
    >
      <el-card shadow="never" class="log-card">
        <div class="log-header">
          <span class="log-type">{{ getChangeTypeLabel(log.changeType) }}</span>
          <span class="log-operator">操作人：{{ log.operatorName || '系统' }}</span>
        </div>
        <div v-if="log.changeType === 'RESCHEDULE'" class="log-detail">
          <div class="change-compare">
            <div class="old-info">
              <span class="label">原信息：</span>
              <span>{{ log.oldValue }}</span>
            </div>
            <el-icon class="arrow-icon"><Right /></el-icon>
            <div class="new-info">
              <span class="label">新信息：</span>
              <span>{{ log.newValue }}</span>
            </div>
          </div>
          <div v-if="log.reason" class="log-reason">
            改约原因：{{ log.reason }}
          </div>
        </div>
        <div v-else class="log-detail">
          <span>{{ log.description || `${log.fieldName}: ${log.oldValue} → ${log.newValue}` }}</span>
        </div>
        <div v-if="log.sourceId" class="log-source">
          <el-link type="primary" @click="$emit('viewSource', log.sourceId)">
            查看原始记录
          </el-link>
        </div>
      </el-card>
    </el-timeline-item>
  </el-timeline>
  <el-empty v-if="!logs.length" description="暂无变更记录" />
</template>

<script setup>
defineProps({
  logs: { type: Array, default: () => [] }
})

defineEmits(['viewSource'])

function getChangeTypeLabel(type) {
  const map = { CREATE: '创建', UPDATE: '更新', RESCHEDULE: '改约', CANCEL: '取消', CONFIRM: '确认', STATUS_CHANGE: '状态变更' }
  return map[type] || type
}

function getTimelineType(type) {
  const map = { CREATE: 'primary', RESCHEDULE: 'warning', CANCEL: 'danger', CONFIRM: 'success' }
  return map[type] || 'info'
}
</script>

<style scoped>
.log-card {
  font-size: 13px;
}
.log-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.log-type {
  font-weight: 600;
  color: var(--text-primary);
}
.log-operator {
  color: var(--text-secondary);
  font-size: 12px;
}
.change-compare {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}
.old-info {
  color: var(--color-danger);
  text-decoration: line-through;
  opacity: 0.8;
}
.new-info {
  color: var(--color-success);
}
.label {
  font-weight: 500;
}
.arrow-icon {
  color: var(--text-secondary);
}
.log-reason {
  color: var(--color-warning);
  font-size: 12px;
  margin-top: 4px;
}
.log-source {
  margin-top: 6px;
}
</style>
