<script setup>
import { ref, watch, onMounted } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

const page = usePage()
const toasts = ref([])

const typeConfig = {
  success: {
    icon: CheckCircle2,
    bgClass: 'bg-green-50 border-green-200',
    iconClass: 'text-green-600',
    textClass: 'text-green-800',
  },
  error: {
    icon: XCircle,
    bgClass: 'bg-red-50 border-red-200',
    iconClass: 'text-red-600',
    textClass: 'text-red-800',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-yellow-50 border-yellow-200',
    iconClass: 'text-yellow-600',
    textClass: 'text-yellow-800',
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-50 border-blue-200',
    iconClass: 'text-blue-600',
    textClass: 'text-blue-800',
  },
}

const addToast = (message, type = 'info') => {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    removeToast(id)
  }, 5000)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

onMounted(() => {
  const flash = page.props.flash || {}
  if (flash.success) addToast(flash.success, 'success')
  if (flash.error) addToast(flash.error, 'error')
  if (flash.warning) addToast(flash.warning, 'warning')
  if (flash.info) addToast(flash.info, 'info')
})

watch(
  () => page.props.flash,
  (flash) => {
    if (!flash) return
    if (flash.success) addToast(flash.success, 'success')
    if (flash.error) addToast(flash.error, 'error')
    if (flash.warning) addToast(flash.warning, 'warning')
    if (flash.info) addToast(flash.info, 'info')
  },
  { deep: true }
)
</script>

<template>
  <div class="fixed top-4 right-4 z-50 space-y-3 w-full max-w-sm">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm',
          typeConfig[toast.type]?.bgClass || typeConfig.info.bgClass,
        ]"
      >
        <component
          :is="typeConfig[toast.type]?.icon || Info"
          :class="['w-5 h-5 shrink-0 mt-0.5', typeConfig[toast.type]?.iconClass || typeConfig.info.iconClass]"
        />
        <p :class="['flex-1 text-sm font-medium', typeConfig[toast.type]?.textClass || typeConfig.info.textClass]">
          {{ toast.message }}
        </p>
        <button
          type="button"
          @click="removeToast(toast.id)"
          :class="['shrink-0 p-1 rounded-md transition-colors hover:bg-black/5', typeConfig[toast.type]?.textClass || typeConfig.info.textClass]"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
