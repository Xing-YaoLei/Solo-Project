<template>
  <div class="bg-primary border-t border-white/5 px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="relative" ref="shareMenuRef">
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/15 text-accent text-sm font-sans hover:bg-accent/25 transition-colors"
          @click="shareOpen = !shareOpen"
        >
          <Share2 class="w-4 h-4" />
          分享
        </button>

        <div
          v-if="shareOpen"
          class="absolute bottom-full left-0 mb-2 w-80 rounded-xl bg-graphite shadow-2xl border border-white/10 p-4 z-50"
        >
          <p class="text-sm font-sans text-ivory mb-3">分享权限</p>

          <div class="space-y-2 mb-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="sharePermissions"
                :value="['view']"
                class="accent-accent"
              />
              <span class="text-sm font-sans text-ivory/90">仅查看</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="sharePermissions"
                :value="['view', 'export']"
                class="accent-accent"
              />
              <span class="text-sm font-sans text-ivory/90">查看+导出</span>
            </label>
          </div>

          <label class="flex items-center gap-2 cursor-pointer mb-4">
            <input
              type="checkbox"
              v-model="includeTurnover"
              class="accent-accent w-4 h-4 rounded"
            />
            <span class="text-sm font-sans text-ivory/90">包含库存周转口径</span>
          </label>

          <button
            :disabled="generatingLink"
            class="w-full py-2 rounded-lg bg-accent text-primary-dark text-sm font-sans font-medium hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleCreateLink"
          >
            <Loader2 v-if="generatingLink" class="w-4 h-4 animate-spin inline-block mr-1" />
            生成分享链接
          </button>

          <div v-if="generatedLink" class="mt-3">
            <div class="flex items-center gap-2 bg-primary/50 rounded-lg px-3 py-2">
              <span class="flex-1 text-xs font-mono text-ivory/80 truncate">{{ generatedLink.url }}</span>
              <button
                class="shrink-0 p-1 rounded hover:bg-accent/20 transition-colors"
                @click="handleCopyLink"
              >
                <Check v-if="copied" class="w-3.5 h-3.5 text-success" />
                <Copy v-else class="w-3.5 h-3.5 text-ivory/60" />
              </button>
            </div>
          </div>

          <p class="mt-3 text-xs font-sans text-ivory/40 leading-relaxed">
            分享链接将遵守当前权限设置，接收者只能查看有权限的数据
          </p>
        </div>
      </div>

      <div class="relative" ref="exportMenuRef">
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-ivory text-sm font-sans hover:bg-white/15 transition-colors"
          @click="exportOpen = !exportOpen"
        >
          <Download class="w-4 h-4" />
          导出
        </button>

        <div
          v-if="exportOpen"
          class="absolute bottom-full left-0 mb-2 w-72 rounded-xl bg-graphite shadow-2xl border border-white/10 p-3 z-50"
        >
          <label class="flex items-center gap-2 cursor-pointer mb-3 px-1">
            <input
              type="checkbox"
              v-model="includeTurnover"
              class="accent-accent w-4 h-4 rounded"
            />
            <span class="text-xs font-sans text-ivory/90">同步导出库存周转口径说明</span>
          </label>

          <button
            :disabled="exporting"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left"
            @click="handleExport('pdf')"
          >
            <FileText class="w-4 h-4 text-danger" />
            <div>
              <p class="text-sm font-sans text-ivory">导出为 PDF</p>
              <p class="text-xs font-sans text-ivory/40">{{ includeTurnover ? '含周转口径说明' : '基础数据报表' }}</p>
            </div>
          </button>

          <button
            :disabled="exporting"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left"
            @click="handleExport('excel')"
          >
            <FileSpreadsheet class="w-4 h-4 text-success" />
            <div>
              <p class="text-sm font-sans text-ivory">导出为 Excel</p>
              <p class="text-xs font-sans text-ivory/40">{{ includeTurnover ? '含周转口径说明' : '基础数据报表' }}</p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div v-if="successMessage" class="flex items-center gap-2 text-sm font-sans text-success animate-pulse">
      <CheckCircle class="w-4 h-4" />
      {{ successMessage }}
    </div>

    <div v-else class="flex items-center gap-4 text-xs font-sans text-ivory/50">
      <div class="flex items-center gap-1.5">
        <RefreshCw class="w-3.5 h-3.5 text-accent/70" />
        <span>数据每 5 分钟自动刷新</span>
      </div>
      <div v-if="store.overview?.turnover" class="flex items-center gap-1.5">
        <BarChart3 class="w-3.5 h-3.5 text-accent/70" />
        <span>周转天数 <span class="font-mono text-ivory/80">{{ store.overview.turnover.avgTurnoverDays.toFixed(1) }}</span> · 周转率 <span class="font-mono text-ivory/80">{{ store.overview.turnover.turnoverRate.toFixed(1) }}</span></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Share2, Download, Copy, Check, Loader2, FileText, FileSpreadsheet, CheckCircle, RefreshCw, BarChart3 } from 'lucide-vue-next'
import { createShareLink, exportReport } from '@/mock/api'
import type { ShareLink } from '@/types'
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()

const shareOpen = ref(false)
const exportOpen = ref(false)
const sharePermissions = ref<('view' | 'export')[]>(['view'])
const includeTurnover = ref(true)
const generatingLink = ref(false)
const generatedLink = ref<ShareLink | null>(null)
const copied = ref(false)
const exporting = ref(false)
const successMessage = ref('')

const shareMenuRef = ref<HTMLElement | null>(null)
const exportMenuRef = ref<HTMLElement | null>(null)

let successTimer: ReturnType<typeof setTimeout> | null = null

function showSuccess(msg: string) {
  successMessage.value = msg
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

async function handleCreateLink() {
  generatingLink.value = true
  try {
    const link = await createShareLink(sharePermissions.value, includeTurnover.value)
    generatedLink.value = link
    showSuccess('分享链接已生成')
  } finally {
    generatingLink.value = false
  }
}

async function handleCopyLink() {
  if (!generatedLink.value) return
  try {
    await navigator.clipboard.writeText(generatedLink.value.url)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copied.value = false
  }
}

async function handleExport(format: 'pdf' | 'excel') {
  exporting.value = true
  try {
    const fileName = await exportReport(format, { ...store.filters }, includeTurnover.value)
    exportOpen.value = false
    showSuccess(`已导出: ${fileName}`)
  } finally {
    exporting.value = false
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (shareOpen.value && shareMenuRef.value && !shareMenuRef.value.contains(target)) {
    shareOpen.value = false
  }
  if (exportOpen.value && exportMenuRef.value && !exportMenuRef.value.contains(target)) {
    exportOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (successTimer) clearTimeout(successTimer)
})
</script>
