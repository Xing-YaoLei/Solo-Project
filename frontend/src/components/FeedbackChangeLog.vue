<template>
  <div class="change-log-panel">
    <div class="log-header">
      <el-button link @click="emit('back')">
        <el-icon><ArrowLeft /></el-icon> 返回编辑
      </el-button>
      <span class="log-title">变更记录</span>
    </div>

    <el-timeline v-if="logs.length > 0">
      <el-timeline-item
        v-for="log in logs"
        :key="log.id"
        :timestamp="log.changedAt"
        placement="top"
      >
        <el-card shadow="never" class="log-card">
          <div class="log-field">
            <el-tag size="small" type="info">{{ fieldLabel(log.fieldName) }}</el-tag>
            <span class="log-operator">操作人: {{ log.changedBy }}</span>
          </div>
          <div class="log-values">
            <div class="value-row">
              <span class="label-old">原值:</span>
              <span class="value-old">{{ log.oldValue || '(空)' }}</span>
            </div>
            <div class="value-row">
              <span class="label-new">新值:</span>
              <span class="value-new">{{ log.newValue || '(空)' }}</span>
            </div>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else description="暂无变更记录" :image-size="60" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getFeedbackChangeLogs } from '../api/feedback'

const props = defineProps({
  feedbackId: { type: Number, required: true }
})

const emit = defineEmits(['back'])
const logs = ref([])

const fieldLabels = {
  satisfaction: '满意度',
  customerOpinion: '客户意见',
  purchaseIntention: '购买意向',
  internalNote: '内部备注'
}

function fieldLabel(name) {
  return fieldLabels[name] || name
}

onMounted(async () => {
  try {
    logs.value = await getFeedbackChangeLogs(props.feedbackId)
  } catch {
    logs.value = []
  }
})
</script>

<style scoped>
.log-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.log-title { font-weight: 600; font-size: 15px; }
.log-card { margin-bottom: 0; }
.log-field { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.log-operator { color: #909399; font-size: 13px; }
.log-values { padding-left: 8px; }
.value-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.label-old { color: #f56c6c; font-size: 13px; font-weight: 500; min-width: 40px; }
.label-new { color: #67c23a; font-size: 13px; font-weight: 500; min-width: 40px; }
.value-old { color: #f56c6c; text-decoration: line-through; font-size: 13px; }
.value-new { color: #67c23a; font-size: 13px; font-weight: 500; }
</style>
