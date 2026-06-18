<template>
  <el-card class="no-show-log-panel" shadow="never">
    <template #header>
      <div class="panel-header">
        <el-icon><Warning /></el-icon>
        <span>爽约日志</span>
      </div>
    </template>

    <el-timeline v-if="logs.length > 0">
      <el-timeline-item
        v-for="log in logs"
        :key="log.id"
        :timestamp="log.createdAt"
        placement="top"
        :type="log.status === 'OPEN' ? 'danger' : 'success'"
      >
        <el-card shadow="never" class="log-entry">
          <div class="log-meta">
            <el-tag :type="log.status === 'OPEN' ? 'danger' : 'success'" size="small">
              {{ log.status === 'OPEN' ? '待处理' : '已关闭' }}
            </el-tag>
            <span class="responsible">负责人: {{ log.responsiblePerson }}</span>
          </div>
          <div v-if="log.reason" class="log-field">
            <span class="field-label">爽约原因:</span> {{ log.reason }}
          </div>
          <div v-if="log.handleAction" class="log-field">
            <span class="field-label">处理动作:</span> {{ log.handleAction }}
          </div>
          <div v-if="log.closedAt" class="log-field">
            <span class="field-label">关闭时间:</span> {{ log.closedAt }}
          </div>
          <div v-if="log.closedBy" class="log-field">
            <span class="field-label">关闭人:</span> {{ log.closedBy }}
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else description="暂无爽约记录" :image-size="60" />
  </el-card>
</template>

<script setup>
defineProps({
  logs: { type: Array, default: () => [] }
})
</script>

<style scoped>
.no-show-log-panel { height: 100%; }
.panel-header { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.log-entry { margin-bottom: 0; }
.log-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.responsible { color: #909399; font-size: 13px; }
.log-field { margin-bottom: 4px; font-size: 13px; color: #606266; }
.field-label { color: #909399; margin-right: 4px; }
</style>
