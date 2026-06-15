<template>
  <div v-if="selectedCount > 0" class="batch-bar">
    <div class="batch-info">
      <el-icon><InfoFilled /></el-icon>
      <span>已选择 <strong>{{ selectedCount }}</strong> 项</span>
    </div>
    <div class="batch-actions">
      <el-button type="success" @click="$emit('batchConfirm')">
        <el-icon><Select /></el-icon>批量确认
      </el-button>
      <el-button type="danger" @click="$emit('batchCancel')">
        <el-icon><CloseBold /></el-icon>批量取消
      </el-button>
      <el-button @click="$emit('clearSelection')">
        <el-icon><RefreshLeft /></el-icon>取消选择
      </el-button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  selectedCount: { type: Number, default: 0 }
})

defineEmits(['batchConfirm', 'batchCancel', 'clearSelection'])
</script>

<style scoped>
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--edu-blue-lighter);
  border: 1px solid var(--edu-blue-light);
  border-radius: 8px;
  margin-bottom: 12px;
}
.batch-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--edu-blue);
  font-size: 14px;
}
.batch-actions {
  display: flex;
  gap: 8px;
}
</style>
