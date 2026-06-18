<template>
  <el-tooltip :content="tooltipContent" placement="top" :show-after="300">
    <el-tag
      class="anomaly-badge"
      :type="tagType"
      :color="config?.color"
      effect="light"
      size="small"
      @click="handleClick"
    >
      <el-icon class="badge-icon"><component :is="badgeIcon" /></el-icon>
      <span v-if="showLabel">{{ config?.label }}</span>
      <slot />
    </el-tag>
  </el-tooltip>
</template>

<script setup>
import { computed } from 'vue'
import { ANOMALY_CONFIG } from '@/utils/anomaly'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  showLabel: {
    type: Boolean,
    default: true
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const cursorStyle = computed(() => props.clickable ? 'pointer' : 'default')
const config = computed(() => ANOMALY_CONFIG[props.type])

const tagType = computed(() => {
  switch (props.type) {
    case 'LIBRARY_DELAY': return 'danger'
    case 'DETECTOR_MISSING': return 'warning'
    case 'FINANCE_CALIBER_CHANGE': return 'info'
    default: return 'info'
  }
})

const badgeIcon = computed(() => config.value?.icon || 'InfoFilled')

const tooltipContent = computed(() => {
  const parts = []
  if (config.value?.label) parts.push(config.value.label)
  if (config.value?.description) parts.push(config.value.description)
  if (props.details) parts.push(props.details)
  return parts.join(' | ')
})

function handleClick() {
  if (props.clickable) {
    emit('click', { type: props.type, config: config.value, details: props.details })
  }
}
</script>

<style lang="scss" scoped>
.anomaly-badge {
  cursor: v-bind('cursorStyle');
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;

  .badge-icon {
    font-size: 12px;
  }
}
</style>
