<script setup>
import { computed } from 'vue'

const props = defineProps({
  actions: {
    type: Array,
    default: () => [],
  },
  maxVisible: {
    type: Number,
    default: 5,
  },
})

const emit = defineEmits(['action-click'])

const handleAction = (action, event) => {
  if (action.disabled) return
  emit('action-click', action, event)
}

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-600/20',
  secondary: 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 shadow-sm',
  success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-sm shadow-green-600/20',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-600/20',
  warning: 'bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700 shadow-sm shadow-yellow-500/20',
  default: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 shadow-sm',
}

const visibleActions = computed(() => props.actions.slice(0, props.maxVisible))
</script>

<template>
  <div class="fixed inset-x-0 bottom-0 z-40 lg:hidden">
    <div class="border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div class="grid gap-1 px-3 py-2" :style="{ gridTemplateColumns: `repeat(${Math.min(visibleActions.length, 5)}, minmax(0, 1fr))` }">
        <button
          v-for="action in visibleActions"
          :key="action.key"
          type="button"
          @click="handleAction(action, $event)"
          :disabled="action.disabled"
          :class="[
            'relative flex flex-col items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl text-xs font-semibold transition-all min-h-[56px]',
            action.disabled
              ? 'opacity-40 cursor-not-allowed'
              : variantClasses[action.variant] || variantClasses.default,
          ]"
        >
          <component
            v-if="action.icon"
            :is="action.icon"
            class="w-5 h-5 shrink-0"
          />
          <span class="leading-tight text-center">{{ action.label }}</span>
          <span
            v-if="action.badge !== undefined && action.badge !== null && action.badge !== 0"
            class="absolute top-1 right-2 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white"
          >
            {{ action.badge > 99 ? '99+' : action.badge }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
