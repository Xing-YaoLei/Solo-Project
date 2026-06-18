<template>
  <div>
    <NSpace justify="space-between" style="margin-bottom: 16px;">
      <NInput v-model:value="searchText" placeholder="搜索合同号/买方/卖方" clearable style="width: 260px;" />
      <NButton type="primary" @click="$emit('refresh')">刷新</NButton>
    </NSpace>
    <NDataTable
      :columns="visibleColumns"
      :data="filteredRecords"
      :pagination="pagination"
      :bordered="false"
      :row-props="rowProps"
      striped
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NTag, NButton, NSpace, NBadge } from 'naive-ui'
import type { TransferRecord } from '~/types'

const props = defineProps<{
  records: TransferRecord[]
  status: string
}>()

const emit = defineEmits<{
  open: [id: string]
  refresh: []
}>()

const searchText = ref('')

const pagination = { pageSize: 15 }

const filteredRecords = computed(() => {
  if (!searchText.value) return props.records
  const s = searchText.value.toLowerCase()
  return props.records.filter(r =>
    r.contract_no.toLowerCase().includes(s) ||
    r.buyer_name.toLowerCase().includes(s) ||
    r.seller_name.toLowerCase().includes(s)
  )
})

function statusLabel(status: string) {
  const map: Record<string, string> = { pending: '待处理', review: '待复核', completed: '已完成', exception: '异常' }
  return map[status] || status
}

function statusTagType(status: string): 'warning' | 'info' | 'success' | 'error' | 'default' | 'primary' {
  const map: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default' | 'primary'> = { pending: 'warning', review: 'info', completed: 'success', exception: 'error' }
  return map[status] || 'default'
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const baseColumns = [
  { title: '合同编号', key: 'contract_no', width: 140, ellipsis: { tooltip: true } },
  { title: '买方', key: 'buyer_name', width: 100 },
  { title: '卖方', key: 'seller_name', width: 100 },
  {
    title: '状态', key: 'status', width: 90,
    render(row: TransferRecord) {
      return h(NTag, { type: statusTagType(row.status), size: 'small' }, { default: () => statusLabel(row.status) })
    },
  },
  {
    title: '过户税费', key: 'transfer_tax', width: 110,
    render(row: TransferRecord) {
      return h('span', { class: 'mono' }, `¥${new Intl.NumberFormat('zh-CN').format(row.transfer_tax)}`)
    },
  },
  { title: '负责人', key: 'assignee.username', width: 90 },
  { title: '创建时间', key: 'created_at', width: 110, render: (row: TransferRecord) => formatDate(row.created_at) },
]

const exceptionCountColumn = {
  title: '异常数', key: 'exception_count', width: 80,
  render(row: TransferRecord) {
    if (row.exception_count > 0) {
      return h(NBadge, { value: row.exception_count, type: 'error' }, {
        default: () => h('span', { style: 'padding: 0 8px;' }, '有异常')
      })
    }
    return h('span', { style: 'color: #999;' }, '无')
  },
}

const reviewTagsColumn = {
  title: '复盘标签', key: 'review_tags', width: 160,
  render(row: TransferRecord) {
    if (!row.review_tags?.length) return h('span', { style: 'color: #999;' }, '-')
    return h(NSpace, { size: 4 }, {
      default: () => row.review_tags.map((tag: string) =>
        h(NTag, { size: 'small', type: 'info' }, { default: () => tag })
      ),
    })
  },
}

const actionsColumn = {
  title: '操作', key: 'actions', width: 80, fixed: 'right' as const,
  render(row: TransferRecord) {
    return h(NButton, { text: true, type: 'primary', onClick: () => emit('open', row.id) }, { default: () => '查看' })
  },
}

const visibleColumns = computed(() => {
  const cols = [...baseColumns]
  if (props.status === 'pending' || props.status === 'exception') {
    cols.push(exceptionCountColumn)
  }
  if (props.status === 'completed') {
    cols.push(reviewTagsColumn)
  }
  if (props.status === 'review') {
    cols.push(reviewTagsColumn)
  }
  cols.push(actionsColumn)
  return cols
})

function rowProps(row: TransferRecord) {
  const isRejectedBack = props.status === 'pending' && !!row.review_note
  return {
    style: isRejectedBack ? 'border-left: 3px solid #F97316; cursor: pointer;' : 'cursor: pointer;',
    onClick: () => emit('open', row.id),
  }
}
</script>
