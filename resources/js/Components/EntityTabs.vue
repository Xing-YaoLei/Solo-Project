<script setup>
import { computed } from 'vue'

const props = defineProps({
  tabs: {
    type: Array,
    required: true,
  },
  activeKey: {
    type: String,
    default: '',
  },
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['change', 'update:modelValue'])

const current = computed(() => props.activeKey || props.modelValue || (props.tabs[0]?.key || ''))

const handleClick = (key) => {
  if (key === current.value) return
  emit('change', key)
  emit('update:modelValue', key)
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div class="px-2 sm:px-4 border-b border-gray-100">
      <nav class="flex gap-1 sm:gap-2 overflow-x-auto -mb-px" aria-label="标签页">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          @click="handleClick(tab.key)"
          :class="[
            'group inline-flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
            current === tab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
          ]"
        >
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.count !== undefined && tab.count !== null"
            :class="[
              'inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-xs font-semibold rounded-full transition-colors',
              current === tab.key
                ? 'bg-blue-50 text-blue-700'
                : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200',
            ]"
          >
            {{ tab.count > 99 ? '99+' : tab.count }}
          </span>
        </button>
      </nav>
    </div>
    <div class="p-4 sm:p-6">
      <slot />
    </div>
  </div>
</template>
