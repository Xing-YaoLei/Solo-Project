<template>
  <div class="page-container">
    <h1 class="page-title">异常处理中心</h1>

    <NSpace style="margin-bottom: 16px;" align="center">
      <NSelect v-model:value="filterUrgency" :options="urgencyOptions" placeholder="紧急程度" clearable style="width: 140px;" />
      <NSelect v-model:value="filterStatus" :options="statusOptions" placeholder="状态" clearable style="width: 140px;" />
      <NSelect v-model:value="filterMissingType" :options="missingTypeFilterOptions" placeholder="缺失类型" clearable style="width: 160px;" />
      <NButton type="primary" @click="loadExceptions">筛选</NButton>
    </NSpace>

    <NSpin :show="loading">
      <div class="kanban-board">
        <div v-for="type in missingTypes" :key="type.value" class="kanban-column">
          <div class="kanban-column-header">{{ type.label }}</div>
          <div class="kanban-column-body">
            <div
              v-for="item in filteredByType(type.value)"
              :key="item.id"
              class="kanban-card"
              :style="{ borderLeftColor: urgencyBorderColor(item.urgency) }"
              @click="openDetail(item)"
            >
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <NText strong style="font-size: 13px;">{{ (item as any).record?.contract_no || '-' }}</NText>
                <NTag :type="urgencyTagType(item.urgency)" size="tiny">{{ urgencyLabel(item.urgency) }}</NTag>
              </div>
              <NText depth="3" style="font-size: 12px; margin-top: 4px; display: block;">
                {{ formatDate(item.discovered_at) }}
              </NText>
              <NTag :type="statusTagType(item.status)" size="small" style="margin-top: 8px;">{{ statusLabel(item.status) }}</NTag>
            </div>
            <NEmpty v-if="filteredByType(type.value).length === 0" description="暂无" style="padding: 20px 0;" />
          </div>
        </div>
      </div>
    </NSpin>

    <NModal v-model:show="showDetailModal" preset="card" :title="`异常详情 - ${(selectedItem as any)?.record?.contract_no || ''}`" style="width: 640px;">
      <template v-if="selectedItem">
        <NDescriptions bordered :column="2" size="small">
          <NDescriptionsItem label="缺失类型">{{ missingTypeLabel(selectedItem.missing_type) }}</NDescriptionsItem>
          <NDescriptionsItem label="紧急程度">{{ urgencyLabel(selectedItem.urgency) }}</NDescriptionsItem>
          <NDescriptionsItem label="状态">{{ statusLabel(selectedItem.status) }}</NDescriptionsItem>
          <NDescriptionsItem label="发现时间">{{ formatDate(selectedItem.discovered_at) }}</NDescriptionsItem>
          <NDescriptionsItem label="解决时间">{{ selectedItem.resolved_at ? formatDate(selectedItem.resolved_at) : '-' }}</NDescriptionsItem>
        </NDescriptions>

        <NDivider>处理记录</NDivider>
        <NTimeline v-if="selectedItem.notes.length > 0">
          <NTimelineItem v-for="note in selectedItem.notes" :key="note.id" :type="note.author?.role === 'manager' ? 'success' : 'default'">
            <NText strong>{{ note.author?.username }}</NText>
            <NText depth="3" style="margin-left: 8px; font-size: 12px;">{{ formatDate(note.created_at) }}</NText>
            <div style="margin-top: 4px;">{{ note.content }}</div>
          </NTimelineItem>
        </NTimeline>
        <NEmpty v-else description="暂无处理记录" />

        <NDivider>状态变更</NDivider>
        <NSpace align="center">
          <NSelect v-model:value="nextStatus" :options="statusTransitionOptions" placeholder="变更状态" style="width: 160px;" />
          <NButton type="primary" :disabled="!nextStatus" @click="handleUpdateStatus">更新状态</NButton>
        </NSpace>

        <NDivider>添加备注</NDivider>
        <NInput v-model:value="newNote" type="textarea" placeholder="添加处理备注..." :rows="3" />
        <NSpace style="margin-top: 8px; justify-content: flex-end;">
          <NButton :disabled="!newNote.trim()" @click="handleAddNote">添加备注</NButton>
          <NButton type="info" @click="goToWorkspace">前往工作台</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ExceptionItem, MissingType, UrgencyLevel, ExceptionStatus } from '~/types'

const api = useApi()
const { message } = useNaiveDiscrete()

const loading = ref(false)
const exceptions = ref<ExceptionItem[]>([])
const filterUrgency = ref<string | null>(null)
const filterStatus = ref<string | null>(null)
const filterMissingType = ref<string | null>(null)
const showDetailModal = ref(false)
const selectedItem = ref<ExceptionItem | null>(null)
const nextStatus = ref<ExceptionStatus | null>(null)
const newNote = ref('')

const missingTypes: { label: string; value: MissingType }[] = [
  { label: '买方身份证', value: 'buyer_id' },
  { label: '卖方身份证', value: 'seller_id' },
  { label: '行驶证', value: 'license' },
  { label: '登记证', value: 'registration' },
  { label: '合同', value: 'contract' },
  { label: '金融资料', value: 'finance' },
  { label: '其他', value: 'other' },
]

const urgencyOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
]

const statusOptions = [
  { label: '待处理', value: 'open' },
  { label: '已催办', value: 'reminded' },
  { label: '已升级', value: 'escalated' },
  { label: '已补齐', value: 'resolved' },
  { label: '已关闭', value: 'closed' },
]

const missingTypeFilterOptions = missingTypes.map(t => ({ label: t.label, value: t.value }))

const statusTransitionOptions = computed(() => {
  const transitions: Record<ExceptionStatus, ExceptionStatus[]> = {
    open: ['reminded', 'escalated', 'resolved', 'closed'],
    reminded: ['escalated', 'resolved', 'closed'],
    escalated: ['resolved', 'closed'],
    resolved: ['closed'],
    closed: [],
  }
  if (!selectedItem.value) return []
  return transitions[selectedItem.value.status].map(s => ({ label: statusLabel(s), value: s }))
})

function filteredByType(type: MissingType) {
  return exceptions.value.filter(e => e.missing_type === type)
}

function urgencyBorderColor(u: UrgencyLevel) {
  const map: Record<UrgencyLevel, string> = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' }
  return map[u]
}

function missingTypeLabel(type: MissingType) {
  const map: Record<MissingType, string> = { buyer_id: '买方身份证', seller_id: '卖方身份证', license: '行驶证', registration: '登记证', contract: '合同', finance: '金融资料', other: '其他' }
  return map[type]
}

function urgencyLabel(u: UrgencyLevel) {
  const map: Record<UrgencyLevel, string> = { high: '紧急', medium: '中等', low: '低' }
  return map[u]
}

function urgencyTagType(u: UrgencyLevel) {
  const map: Record<UrgencyLevel, string> = { high: 'error', medium: 'warning', low: 'success' }
  return map[u] as any
}

function statusLabel(s: ExceptionStatus) {
  const map: Record<ExceptionStatus, string> = { open: '待处理', reminded: '已催办', escalated: '已升级', resolved: '已补齐', closed: '已关闭' }
  return map[s]
}

function statusTagType(s: ExceptionStatus) {
  const map: Record<ExceptionStatus, string> = { open: 'error', reminded: 'warning', escalated: 'error', resolved: 'success', closed: 'default' }
  return map[s] as any
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function openDetail(item: ExceptionItem) {
  selectedItem.value = item
  nextStatus.value = null
  newNote.value = ''
  showDetailModal.value = true
}

async function loadExceptions() {
  loading.value = true
  try {
    const params: Record<string, string> = { page_size: '100' }
    if (filterUrgency.value) params.urgency = filterUrgency.value
    if (filterStatus.value) params.status = filterStatus.value
    if (filterMissingType.value) params.missing_type = filterMissingType.value
    const data = await api.getExceptions(params)
    exceptions.value = data.results || []
  } catch (e: any) {
    message.error(e.message || '加载异常列表失败')
  } finally {
    loading.value = false
  }
}

async function handleUpdateStatus() {
  if (!selectedItem.value || !nextStatus.value) return
  try {
    const patch: Partial<ExceptionItem> = { status: nextStatus.value }
    if (nextStatus.value === 'resolved') {
      patch.resolved_at = new Date().toISOString() as any
    }
    await api.updateException(selectedItem.value.id, patch)
    message.success('状态已更新')
    await loadExceptions()
    showDetailModal.value = false
  } catch (e: any) {
    message.error(e.message || '更新状态失败')
  }
}

async function handleAddNote() {
  if (!selectedItem.value || !newNote.value.trim()) return
  try {
    await api.addExceptionNote(selectedItem.value.id, newNote.value.trim())
    message.success('备注已添加')
    newNote.value = ''
    await loadExceptions()
    const updated = exceptions.value.find(e => e.id === selectedItem.value!.id)
    if (updated) selectedItem.value = updated
  } catch (e: any) {
    message.error(e.message || '添加备注失败')
  }
}

function goToWorkspace() {
  if (!selectedItem.value) return
  navigateTo(`/workspace/${selectedItem.value.record_id}`)
}

onMounted(loadExceptions)
</script>

<style scoped>
.kanban-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.kanban-column {
  min-width: 220px;
  flex: 1;
  background: var(--n-color-modal, #fafafa);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.kanban-column-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid var(--n-border-color, #e0e0e0);
}

.kanban-column-body {
  padding: 8px;
  flex: 1;
  min-height: 120px;
}

.kanban-card {
  background: var(--n-color, #fff);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  border-left: 4px solid #10b981;
  transition: box-shadow 0.2s;
}

.kanban-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
</style>
