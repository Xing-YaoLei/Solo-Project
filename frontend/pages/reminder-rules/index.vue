<template>
  <div class="reminder-rules-page">
    <n-card class="filter-card" :bordered="false">
      <n-space justify="space-between">
        <n-form :model="filters" inline>
          <n-form-item label="触发类型">
            <n-select
              v-model:value="filters.trigger_type"
              :options="triggerTypeOptions"
              placeholder="全部类型"
              clearable
              style="width: 150px"
            />
          </n-form-item>
          <n-form-item label="状态">
            <n-select
              v-model:value="filters.is_active"
              :options="statusOptions"
              placeholder="全部状态"
              clearable
              style="width: 120px"
            />
          </n-form-item>
          <n-button type="primary" @click="fetchRules">
            <template #icon><SearchOutline /></template>
            查询
          </n-button>
        </n-form>
        <n-button type="primary" @click="showCreate = true">
          <template #icon><AddOutline /></template>
          新建规则
        </n-button>
      </n-space>
    </n-card>

    <n-card :bordered="false">
      <n-data-table
        :columns="columns"
        :data="rules"
        :loading="loading"
        :pagination="pagination"
        @update:page="handlePageChange"
        :row-key="(row: any) => row.id"
      />
    </n-card>

    <n-modal v-model:show="showCreate" preset="card" :title="editingId ? '编辑规则' : '新建规则'" style="width: 500px">
      <n-form :model="ruleForm" label-placement="top">
        <n-form-item label="规则名称">
          <n-input v-model:value="ruleForm.name" placeholder="请输入规则名称" />
        </n-form-item>
        <n-form-item label="触发类型">
          <n-select v-model:value="ruleForm.trigger_type" :options="triggerTypeOptions" />
        </n-form-item>
        <n-form-item label="阈值">
          <n-input-number v-model:value="ruleForm.threshold" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="ruleForm.description" type="textarea" :rows="3" />
        </n-form-item>
        <n-form-item label="通知对象">
          <n-checkbox-group v-model:value="ruleForm.notify_targets">
            <n-checkbox value="counselor">咨询师</n-checkbox>
            <n-checkbox value="teacher">老师</n-checkbox>
          </n-checkbox-group>
        </n-form-item>
        <n-form-item label="是否启用">
          <n-switch v-model:value="ruleForm.is_active" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreate = false">取消</n-button>
          <n-button type="primary" @click="handleSave">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { SearchOutline, AddOutline, PencilOutline, TrashOutline } from '@vicons/ionicons5'
import { h } from 'vue'
import dayjs from 'dayjs'

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const rules = ref<any[]>([])
const showCreate = ref(false)
const editingId = ref<number | null>(null)

const filters = reactive({
  trigger_type: null,
  is_active: null,
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
})

const ruleForm = reactive({
  name: '',
  trigger_type: 'progress_behind',
  threshold: 50,
  description: '',
  notify_targets: ['counselor'],
  is_active: true,
})

const triggerTypeOptions = [
  { label: '进度落后', value: 'progress_behind' },
  { label: '续费到期', value: 'due_date' },
  { label: '成绩偏低', value: 'score_low' },
  { label: '长期不活跃', value: 'inactivity' },
]

const statusOptions = [
  { label: '启用', value: true },
  { label: '停用', value: false },
]

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '规则名称', key: 'name', width: 180 },
  {
    title: '触发类型',
    key: 'trigger_type',
    width: 120,
    render: (row: any) => {
      const map: Record<string, string> = {
        progress_behind: '进度落后',
        due_date: '续费到期',
        score_low: '成绩偏低',
        inactivity: '长期不活跃',
      }
      return h('n-tag', { type: 'info' }, () => map[row.trigger_type] || row.trigger_type)
    },
  },
  { title: '阈值', key: 'threshold', width: 80 },
  {
    title: '通知咨询师',
    key: 'notify_counselor',
    width: 100,
    render: (row: any) => row.notify_counselor ? '是' : '否',
  },
  {
    title: '通知老师',
    key: 'notify_teacher',
    width: 100,
    render: (row: any) => row.notify_teacher ? '是' : '否',
  },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    render: (row: any) => h('n-tag', { type: row.is_active ? 'success' : 'default' }, () => row.is_active ? '启用' : '停用'),
  },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  {
    title: '创建时间',
    key: 'created_at',
    width: 160,
    render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: (row: any) => h('n-space', null, () => [
      h('n-button', {
        size: 'small',
        type: 'primary',
        quaternary: true,
        onClick: () => handleEdit(row),
      }, () => h('n-icon', null, () => h(PencilOutline))),
      h('n-button', {
        size: 'small',
        type: 'error',
        quaternary: true,
        onClick: () => handleDelete(row),
      }, () => h('n-icon', null, () => h(TrashOutline))),
    ]),
  },
]

const fetchRules = async () => {
  loading.value = true
  try {
    const api = useApi()
    const params: any = {
      page: pagination.page,
      page_size: pagination.pageSize,
    }
    if (filters.trigger_type) params.trigger_type = filters.trigger_type
    if (filters.is_active !== null && filters.is_active !== undefined) params.is_active = filters.is_active

    const response = await api.get('/followups/reminder-rules/', { params })
    rules.value = response.data.results
    pagination.itemCount = response.data.count
  } catch (e) {
    message.error('获取规则列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchRules()
}

const handleEdit = (row: any) => {
  editingId.value = row.id
  ruleForm.name = row.name
  ruleForm.trigger_type = row.trigger_type
  ruleForm.threshold = row.threshold
  ruleForm.description = row.description
  ruleForm.notify_targets = []
  if (row.notify_counselor) ruleForm.notify_targets.push('counselor')
  if (row.notify_teacher) ruleForm.notify_targets.push('teacher')
  ruleForm.is_active = row.is_active
  showCreate.value = true
}

const handleDelete = (row: any) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除规则"${row.name}"吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const api = useApi()
        await api.delete(`/followups/reminder-rules/${row.id}/`)
        message.success('删除成功')
        fetchRules()
      } catch (e) {
        message.error('删除失败')
      }
    },
  })
}

const handleSave = async () => {
  if (!ruleForm.name) {
    message.warning('请输入规则名称')
    return
  }

  const data = {
    name: ruleForm.name,
    trigger_type: ruleForm.trigger_type,
    threshold: ruleForm.threshold,
    description: ruleForm.description,
    notify_counselor: ruleForm.notify_targets.includes('counselor'),
    notify_teacher: ruleForm.notify_targets.includes('teacher'),
    is_active: ruleForm.is_active,
  }

  try {
    const api = useApi()
    if (editingId.value) {
      await api.put(`/followups/reminder-rules/${editingId.value}/`, data)
      message.success('更新成功')
    } else {
      await api.post('/followups/reminder-rules/', data)
      message.success('创建成功')
    }
    showCreate.value = false
    resetForm()
    fetchRules()
  } catch (e) {
    message.error('保存失败')
  }
}

const resetForm = () => {
  editingId.value = null
  ruleForm.name = ''
  ruleForm.trigger_type = 'progress_behind'
  ruleForm.threshold = 50
  ruleForm.description = ''
  ruleForm.notify_targets = ['counselor']
  ruleForm.is_active = true
}

onMounted(() => {
  fetchRules()
})
</script>

<style scoped>
.reminder-rules-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card :deep(.n-card__content) {
  padding: 16px 20px;
}
</style>
