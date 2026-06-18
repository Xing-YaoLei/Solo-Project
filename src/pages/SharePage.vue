<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ShieldAlert, Eye, Download, Loader2, BarChart3, AlertCircle } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import VehicleTrend from '@/components/VehicleTrend.vue'
import InspectionReport from '@/components/InspectionReport.vue'
import PrepListDetail from '@/components/PrepListDetail.vue'
import TestDriveAnomaly from '@/components/TestDriveAnomaly.vue'
import { validateShareLink, exportReport, type ShareLinkValidation } from '@/mock/api'

const props = defineProps<{
  token: string
}>()

const store = useDashboardStore()

const authorized = ref(false)
const loading = ref(true)
const initialLoading = ref(true)
const shareValidation = ref<ShareLinkValidation | null>(null)
const exporting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

onMounted(async () => {
  try {
    const validation = await validateShareLink(props.token)

    if (!validation.valid) {
      authorized.value = false
      errorMessage.value = '该分享链接已过期或已被撤销'
      loading.value = false
      return
    }

    authorized.value = true
    shareValidation.value = validation

    store.setShareToken(props.token)
    store.filters = { ...validation.filters }

    await store.loadDashboard()
    initialLoading.value = false
    loading.value = false
  } catch (e) {
    authorized.value = false
    errorMessage.value = e instanceof Error ? e.message : '链接验证失败'
    loading.value = false
  }
})

const canView = computed(() => shareValidation.value?.permissions.includes('view') ?? false)
const canExport = computed(() => shareValidation.value?.permissions.includes('export') ?? false)
const includesTurnover = computed(() => shareValidation.value?.includesTurnoverMetrics ?? false)

const dataSources = computed(() => {
  const ds = store.overview?.dataSources
  return [
    { label: '检测仪', status: ds?.inspection?.status ?? 'offline' },
    { label: '金融审批', status: ds?.finance?.status ?? 'offline' },
    { label: '车源库', status: ds?.inventory?.status ?? 'offline' },
  ]
})

async function handleExport(format: 'pdf' | 'excel') {
  if (!canExport.value) return
  exporting.value = true
  try {
    const fileName = await exportReport(
      format,
      { ...store.filters },
      includesTurnover.value,
      store.activeViewId ?? undefined,
      props.token,
    )
    successMessage.value = `已导出: ${fileName}`
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '导出失败'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-primary-dark flex flex-col">
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-4">
        <Loader2 class="w-8 h-8 text-accent animate-spin" />
        <span class="text-ivory/60 text-sm font-sans">验证分享链接权限...</span>
      </div>
    </div>

    <div v-else-if="!authorized" class="flex-1 flex items-center justify-center p-8">
      <div class="text-center">
        <ShieldAlert class="w-16 h-16 text-danger mx-auto mb-4" />
        <h2 class="font-serif text-2xl text-ivory mb-2">无权访问</h2>
        <p class="text-ivory/50 font-sans text-sm">
          {{ errorMessage || '该分享链接无效或已过期，请联系分享者获取新链接' }}
        </p>
      </div>
    </div>

    <template v-else-if="canView">
      <div v-if="errorMessage" class="bg-danger/10 border-b border-danger/20 px-6 py-2 flex items-center gap-2">
        <AlertCircle class="w-4 h-4 text-danger" />
        <span class="text-sm font-sans text-danger">{{ errorMessage }}</span>
      </div>

      <div class="bg-primary border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Eye class="w-5 h-5 text-accent" />
          <h1 class="font-serif text-xl text-ivory tracking-wide">
            车源上架趋势看板 <span class="text-ivory/40 text-sm font-sans">（分享视图）</span>
          </h1>
        </div>

        <div class="flex items-center gap-2 text-sm">
          <span
            v-if="store.overview?.lastRefreshTime"
            class="font-mono text-accent text-xs tracking-wider"
          >
            {{ store.overview.lastRefreshTime }}
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

          <div v-if="canExport" class="flex items-center gap-2 ml-3">
            <button
              :disabled="exporting"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-ivory text-xs font-sans hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleExport('pdf')"
            >
              <Loader2 v-if="exporting" class="w-3.5 h-3.5 animate-spin" />
              <Download v-else class="w-3.5 h-3.5" />
              导出 PDF
            </button>
            <button
              :disabled="exporting"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/15 text-accent text-xs font-sans hover:bg-accent/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleExport('excel')"
            >
              <Download class="w-3.5 h-3.5" />
              导出 Excel
            </button>
          </div>
        </div>
      </div>

      <div class="bg-primary border-b border-white/5 px-6 py-2.5 flex items-center justify-between">
        <div class="flex items-center gap-4 text-xs font-sans text-ivory/60">
          <div class="flex items-center gap-1.5">
            <Eye class="w-3.5 h-3.5 text-success" />
            <span>查看权限：已授权</span>
          </div>
          <div class="flex items-center gap-1.5">
            <Download class="w-3.5 h-3.5" :class="canExport ? 'text-success' : 'text-ivory/30'" />
            <span>导出权限：{{ canExport ? '已授权' : '未授权' }}</span>
          </div>
          <div v-if="includesTurnover && store.overview?.turnover" class="flex items-center gap-1.5">
            <BarChart3 class="w-3.5 h-3.5 text-accent" />
            <span>周转口径：已包含 · 平均 <span class="font-mono text-ivory">{{ store.overview.turnover.avgTurnoverDays.toFixed(1) }}</span> 天 · 周转率 <span class="font-mono text-ivory">{{ store.overview.turnover.turnoverRate.toFixed(1) }}</span></span>
          </div>
          <div v-if="shareValidation?.expiresAt" class="flex items-center gap-1.5 text-ivory/40">
            <span>链接有效期至 {{ new Date(shareValidation.expiresAt).toLocaleString('zh-CN') }}</span>
          </div>
        </div>
        <div v-if="successMessage" class="flex items-center gap-1.5 text-xs font-sans text-success animate-pulse">
          {{ successMessage }}
        </div>
      </div>

      <main v-if="initialLoading" class="flex-1 flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <Loader2 class="w-8 h-8 text-accent animate-spin" />
          <span class="text-ivory/60 text-sm font-sans">正在加载看板数据...</span>
        </div>
      </main>

      <main v-else class="flex-1 px-6 py-5">
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 max-w-[1920px] mx-auto">
          <VehicleTrend />
          <InspectionReport />
          <PrepListDetail />
          <TestDriveAnomaly />
        </div>

        <div v-if="includesTurnover && store.overview?.turnover" class="max-w-[1920px] mx-auto mt-5">
          <div class="chart-card bg-primary-light/80 rounded-xl border border-white/5 p-5">
            <div class="flex items-center gap-2.5 mb-4">
              <BarChart3 class="w-5 h-5 text-accent" />
              <h3 class="font-serif text-ivory text-lg">库存周转口径</h3>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div class="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                <div class="text-xs font-sans text-ivory/40 mb-1">平均周转天数</div>
                <div class="font-mono text-xl text-ivory">{{ store.overview.turnover.avgTurnoverDays.toFixed(1) }} <span class="text-xs text-ivory/40">天</span></div>
              </div>
              <div class="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                <div class="text-xs font-sans text-ivory/40 mb-1">库存周转率</div>
                <div class="font-mono text-xl text-ivory">{{ store.overview.turnover.turnoverRate.toFixed(1) }} <span class="text-xs text-ivory/40">次/月</span></div>
              </div>
              <div class="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                <div class="text-xs font-sans text-ivory/40 mb-1">快消车辆（≤30天）</div>
                <div class="font-mono text-xl text-success">{{ store.overview.turnover.fastMovingCount }} <span class="text-xs text-ivory/40">辆</span></div>
              </div>
              <div class="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                <div class="text-xs font-sans text-ivory/40 mb-1">滞销车辆（≥60天）</div>
                <div class="font-mono text-xl text-danger">{{ store.overview.turnover.slowMovingCount }} <span class="text-xs text-ivory/40">辆</span></div>
              </div>
            </div>
            <p class="text-xs font-sans text-ivory/40 leading-relaxed pt-3 border-t border-white/5">
              口径说明：{{ store.overview.turnover.definition }}
            </p>
          </div>
        </div>
      </main>

      <div class="bg-primary border-t border-white/5 px-6 py-3">
        <p class="text-ivory/40 text-xs font-sans text-center">
          分享页面遵守权限设置，仅展示您有权限查看的数据内容。如需完整数据，请联系车商管理员开通账号。
        </p>
      </div>
    </template>
  </div>
</template>
