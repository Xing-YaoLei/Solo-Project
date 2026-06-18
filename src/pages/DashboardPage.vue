<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import StatusBar from '@/components/StatusBar.vue'
import GlobalFilter from '@/components/GlobalFilter.vue'
import VehicleTrend from '@/components/VehicleTrend.vue'
import InspectionReport from '@/components/InspectionReport.vue'
import PrepListDetail from '@/components/PrepListDetail.vue'
import TestDriveAnomaly from '@/components/TestDriveAnomaly.vue'
import FilterViewDrawer from '@/components/FilterViewDrawer.vue'
import ShareExportBar from '@/components/ShareExportBar.vue'
import { Loader2 } from 'lucide-vue-next'

const store = useDashboardStore()
const drawerOpen = ref(false)
const initialLoading = ref(true)

onMounted(async () => {
  await store.loadDashboard()
  initialLoading.value = false
})

function handleOpenViews() {
  drawerOpen.value = true
}

function handleSaveView(name: string) {
  store.saveCurrentView(name)
}
</script>

<template>
  <div class="min-h-screen bg-primary-dark flex flex-col">
    <StatusBar />

    <GlobalFilter
      @open-views="handleOpenViews"
      @save-view="handleSaveView"
    />

    <main v-if="initialLoading" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-4">
        <Loader2 class="w-8 h-8 text-accent animate-spin" />
        <span class="text-ivory/60 text-sm font-sans">正在加载看板数据...</span>
      </div>
    </main>

    <main v-else class="flex-1 px-6 py-5 pb-20">
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 max-w-[1920px] mx-auto">
        <VehicleTrend />
        <InspectionReport />
        <PrepListDetail />
        <TestDriveAnomaly />
      </div>
    </main>

    <ShareExportBar />

    <FilterViewDrawer
      :open="drawerOpen"
      @close="drawerOpen = false"
      @save="store.saveCurrentView($event)"
    />
  </div>
</template>
