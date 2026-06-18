<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: [Object, Number, String],
    required: true,
  },
  statusOptions: {
    type: Array,
    default: () => [],
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
})

const colorClasses = {
  primary: 'bg-blue-50 text-blue-700 ring-blue-200',
  success: 'bg-green-50 text-green-700 ring-green-200',
  warning: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  secondary: 'bg-purple-50 text-purple-700 ring-purple-200',
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

const currentOption = computed(() => {
  if (props.statusOptions.length === 0) return null
  if (typeof props.status === 'object') {
    return (
      props.statusOptions.find((o) => o.value === props.status.value) ||
      props.statusOptions.find((o) => o.value === props.status.id) ||
      props.status
    )
  }
  return props.statusOptions.find((o) => o.value === props.status) || null
})

const label = computed(() => {
  if (typeof props.status === 'object') {
    return currentOption.value?.label || props.status.label || props.status.name || '-'
  }
  return currentOption.value?.label || props.status || '-'
})

const color = computed(() => {
  if (typeof props.status === 'object') {
    return currentOption.value?.color || props.status.color || 'gray'
  }
  return currentOption.value?.color || 'gray'
})

const dotColorClasses = {
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-cyan-500',
  secondary: 'bg-purple-500',
  gray: 'bg-gray-400',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
      colorClasses[color] || colorClasses.gray,
      sizeClasses[size],
    ]"
  >
    <span :class="['w-1.5 h-1.5 rounded-full', dotColorClasses[color] || dotColorClasses.gray]" />
    {{ label }}
  </span>
</template>
