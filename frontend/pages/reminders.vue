<template>
  <div class="page-container">
    <n-tabs v-model:value="activeTab" type="card">
      <n-tab-pane name="rules" tab="提醒规则">
        <div class="card-section">
          <div class="filter-bar">
            <div style="flex:1;" />
            <n-button type="primary" @click="openRuleModal()">新建规则</n-button>
          </div>
          <n-data-table
            :columns="ruleColumns"
            :data="remindersStore.rules"
            :pagination="{ pageSize: 10 }"
            :row-key="(row: ReminderRule) => row.id"
            :loading="remindersStore.loading"
            striped
          />
        </div>
      </n-tab-pane>

      <n-tab-pane name="logs" tab="提醒日志">
        <div class="card-section">
          <div class="filter-bar">
            <n-input
              v-model:value="logSearch"
              placeholder="搜索规则或目标"
              clearable
              style="width: 240px;"
              @update:value="onLogSearchChange"
            />
          </div>
          <n-data-table
            :columns="logColumns"
            :data="remindersStore.filteredLogs"
            :pagination="{ pageSize: 10 }"
            :row-key="(row: ReminderLog) => row.id"
            striped
          />
        </div>
      </n-tab-pane>
    </n-tabs>

    <n-modal
      v-model:show="showRuleModal"
      preset="card"
      :title="editingRule ? '编辑规则' : '新建规则'"
      style="width: 560px;"
    >
      <n-form :model="ruleForm" label-placement="left" label-width="100">
        <n-form-item label="规则名称">
          <n-input v-model:value="ruleForm.name" placeholder="输入规则名称" />
        </n-form-item>
        <n-form-item label="触发条件">
          <n-select v-model:value="ruleForm.condition_type" :options="conditionOptions" placeholder="选择条件类型" />
        </n-form-item>
        <n-form-item label="阈值">
          <n-input-number
            v-model:value="ruleForm.threshold"
            :min="1"
            placeholder="输入阈值"
            style="width: 100%;"
          />
        </n-form-item>
        <n-form-item label="提醒方式">
          <n-select v-model:value="ruleForm.remind_method" :options="methodOptions" placeholder="选择提醒方式" />
        </n-form-item>
        <n-form-item label="提醒频次（天）">
          <n-input-number
            v-model:value="ruleForm.frequency_days"
            :min="1"
            placeholder="输入天数"
            style="width: 100%;"
          />
        </n-form-item>
        <n-form-item label="启用状态">
          <n-switch v-model:value="ruleForm.is_active" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <n-button @click="showRuleModal = false">取消</n-button>
          <n-button type="primary" :loading="submittingRule" @click="saveRule">保存</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import type { ReminderRule, ReminderLog } from '~/types'

const remindersStore = useRemindersStore()

onMounted(async () => {
  await remindersStore.init()
})

const activeTab = ref('rules')
const showRuleModal = ref(false)
const editingRule = ref<ReminderRule | null>(null)
const submittingRule = ref(false)
const logSearch = computed({
  get: () => remindersStore.logSearchQuery,
  set: (v: string) => remindersStore.setLogSearchQuery(v),
})

const conditionOptions = [
  { label: '进度低于（%）', value: 'progress_below' },
  { label: '未更新天数', value: 'no_update_days' },
  { label: '成绩低于（分）', value: 'grade_below' },
]

const methodOptions = [
  { label: '站内', value: 'in_app' },
  { label: '邮件', value: 'email' },
  { label: '站内+邮件', value: 'both' },
]

const ruleForm = reactive({
  name: '',
  condition_type: 'progress_below' as 'progress_below' | 'no_update_days' | 'grade_below',
  threshold: 30,
  remind_method: 'in_app' as 'in_app' | 'email' | 'both',
  frequency_days: 7,
  is_active: true,
})

function onLogSearchChange() {
  // search handled by getter
}

const ruleColumns: DataTableColumns<ReminderRule> = [
  { title: '规则名称', key: 'name', width: 160 },
  {
    title: '触发条件', key: 'condition_type_display', width: 160,
    render(row) {
      return `${row.condition_type_display} > ${row.threshold}`
    },
  },
  {
    title: '提醒方式', key: 'remind_method_display', width: 100,
  },
  {
    title: '频次', key: 'frequency_days', width: 100,
    render(row) {
      return `每${row.frequency_days}天`
    },
  },
  {
    title: '状态', key: 'is_active', width: 80,
    render(row) {
      return h(
        'span',
        { style: `color:${row.is_active ? '#27AE60' : '#999'};font-weight:500;` },
        row.is_active ? '启用' : '停用'
      )
    },
  },
  {
    title: '操作', key: 'actions', width: 140,
    render(row) {
      return h('div', { style: 'display:flex;gap:12px;' }, [
        h(
          'a',
          { style: 'color:#1B3A5C;cursor:pointer;', onClick: () => openRuleModal(row) },
          '编辑'
        ),
        h(
          'a',
          {
            style: `color:${row.is_active ? '#E74C3C' : '#27AE60'};cursor:pointer;`,
            onClick: async () => {
              await remindersStore.toggleRule(row.id, !row.is_active)
              window.$message?.success('状态已更新')
            },
          },
          row.is_active ? '停用' : '启用'
        ),
      ])
    },
  },
]

const logColumns: DataTableColumns<ReminderLog> = [
  { title: '规则名称', key: 'rule_name', width: 160 },
  { title: '学员', key: 'student_name', width: 100 },
  { title: '消息内容', key: 'message', ellipsis: { tooltip: true } },
  {
    title: '发送时间', key: 'sent_at', width: 170,
    render(row) {
      return row.sent_at ? row.sent_at.replace('T', ' ').slice(0, 16) : '-'
    },
  },
  {
    title: '状态', key: 'is_read', width: 100,
    render(row) {
      return h(
        'span',
        { style: `color:${row.is_read ? '#27AE60' : '#F39C12'};font-weight:500;` },
        row.is_read ? '已读' : '未读'
      )
    },
  },
]

function openRuleModal(rule?: ReminderRule) {
  if (rule) {
    editingRule.value = rule
    Object.assign(ruleForm, {
      name: rule.name,
      condition_type: rule.condition_type,
      threshold: rule.threshold,
      remind_method: rule.remind_method,
      frequency_days: rule.frequency_days,
      is_active: rule.is_active,
    })
  } else {
    editingRule.value = null
    Object.assign(ruleForm, {
      name: '',
      condition_type: 'progress_below',
      threshold: 30,
      remind_method: 'in_app',
      frequency_days: 7,
      is_active: true,
    })
  }
  showRuleModal.value = true
}

async function saveRule() {
  if (!ruleForm.name.trim()) {
    window.$message?.warning('请填写规则名称')
    return
  }
  submittingRule.value = true
  try {
    if (editingRule.value) {
      await remindersStore.updateRule(editingRule.value.id, { ...ruleForm })
    } else {
      await remindersStore.createRule({ ...ruleForm })
    }
    window.$message?.success('保存成功')
    showRuleModal.value = false
  } catch (e) {
    window.$message?.error('保存失败')
  } finally {
    submittingRule.value = false
  }
}
</script>
