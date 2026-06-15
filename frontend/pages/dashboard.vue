<template>
  <div class="page-container">
    <div class="stat-row">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="stat-card"
        :style="{ borderLeft: `4px solid ${card.color}` }"
        @click="handleStatClick(card.key)"
      >
        <div class="stat-icon" :style="{ background: card.bgColor }">
          <span>{{ card.icon }}</span>
        </div>
        <div class="stat-info">
          <div class="stat-value" :style="{ color: card.color }">{{ card.count }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <div class="card-section">
      <div class="section-header">
        <div class="card-section-title" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
          发放记录列表
        </div>
        <div class="filter-bar" style="margin-bottom: 0;">
          <n-input
            v-model:value="searchQuery"
            placeholder="搜索学员或教材"
            clearable
            style="width: 240px;"
            @update:value="onSearchChange"
          >
            <template #prefix>
              <span>🔍</span>
            </template>
          </n-input>
          <n-select
            v-model:value="tagFilter"
            placeholder="题目标签"
            clearable
            :options="tagOptions"
            style="width: 140px;"
            @update:value="onTagFilterChange"
          />
          <n-button type="primary" @click="showDistributeModal = true">
            快速发放
          </n-button>
        </div>
      </div>
      <n-data-table
        :columns="columns"
        :data="distStore.filteredDistributions"
        :pagination="pagination"
        :row-key="(row: Distribution) => row.id"
        :loading="distStore.loading"
        striped
        style="margin-top: 16px;"
      />
    </div>

    <n-modal
      v-model:show="showDistributeModal"
      preset="card"
      title="快速发放教材"
      style="width: 640px;"
    >
      <n-form ref="formRef" :model="distributeForm" label-placement="left" label-width="80">
        <n-form-item label="教材">
          <n-select
            v-model:value="distributeForm.materialId"
            :options="materialOptions"
            placeholder="选择教材"
          />
        </n-form-item>
        <n-form-item label="学员">
          <n-transfer
            v-model:value="distributeForm.studentIds"
            :options="studentTransferOptions"
            source-filterable
            source-filter-placeholder="搜索学员"
            :max-tag-count="3"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <n-button @click="showDistributeModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleDistribute">确认发放</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import type { Distribution, DistributionStatus } from '~/types'

const distStore = useDistributionStore()

onMounted(async () => {
  await distStore.init()
})

const searchQuery = computed({
  get: () => distStore.searchQuery,
  set: (v: string) => distStore.setSearchQuery(v),
})

const tagFilter = ref<number | null>(null)

const statusCounts = computed(() => distStore.stats)

const showDistributeModal = ref(false)
const submitting = ref(false)
const distributeForm = reactive({
  materialId: null as number | null,
  studentIds: [] as number[],
})

const statCards = computed(() => [
  { key: 'pending' as DistributionStatus, label: '待发放', count: statusCounts.value.pending, icon: '📦', color: '#3498DB', bgColor: 'rgba(52,152,219,0.1)' },
  { key: 'following' as DistributionStatus, label: '待跟进', count: statusCounts.value.following, icon: '👀', color: '#F28C28', bgColor: 'rgba(242,140,40,0.1)' },
  { key: 'reviewing' as DistributionStatus, label: '待复核', count: statusCounts.value.reviewing, icon: '📋', color: '#9B59B6', bgColor: 'rgba(155,89,182,0.1)' },
  { key: 'completed' as DistributionStatus, label: '已完成', count: statusCounts.value.completed, icon: '✅', color: '#27AE60', bgColor: 'rgba(39,174,96,0.1)' },
])

const tagOptions = computed(() =>
  distStore.tags.map((t) => ({
    label: t.name,
    value: t.id,
  }))
)

const materialOptions = computed(() =>
  distStore.materials.map((m) => ({
    label: m.title,
    value: m.id,
  }))
)

const studentTransferOptions = computed(() =>
  distStore.students.map((s) => ({
    label: `${s.name} (${s.class_name || '未分班'})`,
    value: s.id,
  }))
)

function onSearchChange() {
  distStore.fetchDistributions()
}

function onTagFilterChange(val: number | null) {
  distStore.setTagFilter(val)
}

function getRiskDotClass(level: string | null) {
  if (level === 'high') return 'risk-dot risk-dot-high'
  if (level === 'medium') return 'risk-dot risk-dot-medium'
  return 'risk-dot risk-dot-low'
}

function getRiskColor(level: string | null) {
  if (level === 'high') return '#E74C3C'
  if (level === 'medium') return '#F39C12'
  return '#F1C40F'
}

function getRiskLabel(level: string | null) {
  if (level === 'high') return '高'
  if (level === 'medium') return '中'
  if (level === 'low') return '低'
  return '-'
}

const columns: DataTableColumns<Distribution> = [
  {
    title: '题目标签',
    key: 'tags',
    width: 160,
    render(row) {
      if (row.tags.length === 0) return h('span', { style: 'color:#999;font-size:13px;' }, '-')
      return h(
        'div',
        { style: 'display:flex;gap:4px;flex-wrap:wrap;' },
        row.tags.map((tag) =>
          h(
            'span',
            {
              class: 'n-tag',
              style: `background:${tag.color}15;color:${tag.color};border:1px solid ${tag.color}30;border-radius:4px;padding:1px 8px;font-size:12px;line-height:20px;',
            },
            tag.name
          )
        )
      )
    },
  },
  {
    title: '学员',
    key: 'student.name',
    width: 120,
    render(row) {
      return h(
        'div',
        null,
        [
          h('div', { style: 'font-weight:500;' }, row.student.name),
          h(
            'div',
            { style: 'font-size:12px;color:#7F8C9B;margin-top:2px;' },
            row.student.class_name || '-'
          ),
        ]
      )
    },
  },
  {
    title: '教材',
    key: 'material_title',
    width: 180,
  },
  {
    title: '状态',
    key: 'status_display',
    width: 100,
    render(row) {
      const statusColorMap: Record<string, string> = {
        pending: '#3498DB',
        following: '#F28C28',
        reviewing: '#9B59B6',
        completed: '#27AE60',
      }
      return h(
        'span',
        {
          style: `color:${statusColorMap[row.status] || '#333'};font-weight:500;`,
        },
        row.status_display || '-'
      )
    },
  },
  {
    title: '风险等级',
    key: 'risk_level',
    width: 100,
    sorter: (a, b) => {
      const order: Record<string, number> = { high: 3, medium: 2, low: 1 }
      return (order[a.risk_level || ''] || 0) - (order[b.risk_level || ''] || 0)
    },
    render(row) {
      if (!row.risk_level) {
        return h('span', { style: 'color:#999;' }, '-')
      }
      return h('div', { class: 'risk-badge' }, [
        h('span', { class: getRiskDotClass(row.risk_level) }),
        h('span', { style: `color:${getRiskColor(row.risk_level)}` }, getRiskLabel(row.risk_level)),
      ])
    },
  },
  {
    title: '发放日期',
    key: 'distributed_at',
    width: 120,
    render(row) {
      return row.distributed_at ? row.distributed_at.split('T')[0] : '-'
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    render(row) {
      const actions: any[] = []
      if (row.status === 'pending') {
        actions.push(
          h(
            'a',
            {
              style: 'color:#1B3A5C;cursor:pointer;margin-right:12px;',
              onClick: async () => {
                await distStore.updateDistributionStatus(row.id, 'following')
                window.$message?.success('状态已更新')
              },
            },
            '发放'
          )
        )
      }
      if (row.status === 'following') {
        actions.push(
          h(
            'a',
            {
              style: 'color:#1B3A5C;cursor:pointer;margin-right:12px;',
              onClick: async () => {
                await distStore.updateDistributionStatus(row.id, 'reviewing')
                window.$message?.success('状态已更新')
              },
            },
            '提交复核'
          )
        )
      }
      if (row.status === 'reviewing') {
        actions.push(
          h(
            'a',
            {
              style: 'color:#27AE60;cursor:pointer;',
              onClick: async () => {
                await distStore.updateDistributionStatus(row.id, 'completed')
                window.$message?.success('已通过复核')
              },
            },
            '通过'
          )
        )
      }
      if (actions.length === 0) {
        return h('span', { style: 'color:#999;' }, '-')
      }
      return h('div', actions)
    },
  },
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

function handleStatClick(key: DistributionStatus) {
  distStore.setStatusFilter(key)
  distStore.fetchDistributions()
}

async function handleDistribute() {
  if (!distributeForm.materialId || distributeForm.studentIds.length === 0) {
    window.$message?.warning('请选择教材和学员')
    return
  }
  submitting.value = true
  try {
    await distStore.batchDistribute(distributeForm.materialId!, distributeForm.studentIds)
    window.$message?.success('发放成功')
    showDistributeModal.value = false
    distributeForm.materialId = null
    distributeForm.studentIds = []
  } catch (e) {
    window.$message?.error('发放失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
