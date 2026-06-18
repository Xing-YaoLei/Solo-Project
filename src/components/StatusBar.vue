<template>
  <div class="bg-primary border-b border-white/5 px-6 py-3 flex items-center justify-between">
    <h1 class="font-serif text-xl text-ivory tracking-wide">
      车源上架趋势看板
    </h1>

    <div class="flex items-center gap-2 text-sm">
      <RefreshCw
        :class="['w-3.5 h-3.5 text-accent', isLoading ? 'animate-spin' : '']"
      />
      <span
        :class="[
          'font-mono text-accent text-xs tracking-wider',
          justRefreshed ? 'pulse-anomaly' : '',
        ]"
      >
        {{ formattedTime }}
      </span>
    </div>

    <div class="flex items-center gap-5">
      <div
        v-for="source in dataSources"
        :key="source.label"
        class="flex items-center gap-1.5 text-xs text-ivory/70"
      >
        <span :class="['status-dot', `status-dot-${source.status}`]" />
        <span class="font-sans">{{ source.label }}</span>
      </div>

      <button
        :disabled="isLoading"
        class="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 text-accent text-xs font-medium hover:bg-accent/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleRefresh"
      >
        <Loader2 v-if="isLoading" class="w-3.5 h-3.5 animate-spin" />
        <RefreshCw v-else class="w-3.5 h-3.5" />
        刷新
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RefreshCw, Loader2 } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()
const justRefreshed = ref(false)
let pulseTimer: ReturnType<typeof setTimeout> | null = null

const isLoading = computed(() => store.isLoading)

const formattedTime = computed(() => {
  if (!store.overview?.lastRefreshTime) return '--:--:--'
  return store.overview.lastRefreshTime
})

const dataSources = computed(() => {
  const ds = store.overview?.dataSources
  return [
    { label: '检测仪', status: ds?.inspection?.status ?? 'offline' },
    { label: '金融审批', status: ds?.finance?.status ?? 'offline' },
    { label: '车源库', status: ds?.inventory?.status ?? 'offline' },
  ]
})

watch(
  () => store.isLoading,
  (loading, wasLoading) => {
    if (wasLoading && !loading) {
      justRefreshed.value = true
      if (pulseTimer) clearTimeout(pulseTimer)
      pulseTimer = setTimeout(() => {
        justRefreshed.value = false
      }, 2000)
    }
  },
)

async function handleRefresh() {
  await store.refreshData()
}
</script>
