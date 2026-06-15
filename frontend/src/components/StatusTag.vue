<template>
  <el-tag v-if="status === 'CONFLICT'" type="danger" effect="dark" class="conflict-tag">
    <el-icon class="conflict-icon"><WarningFilled /></el-icon>
    {{ label }}
  </el-tag>
  <el-tag v-else :type="tagType" effect="light">{{ label }}</el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { useDictStore } from '@/stores/dict'

const props = defineProps({
  status: { type: String, required: true }
})

const dictStore = useDictStore()

const label = computed(() => dictStore.getStatusLabel(props.status))
const tagType = computed(() => dictStore.getStatusType(props.status))
</script>

<style scoped>
.conflict-tag {
  animation: conflict-blink 1.5s ease-in-out infinite;
}
.conflict-icon {
  margin-right: 4px;
  vertical-align: middle;
}
@keyframes conflict-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
