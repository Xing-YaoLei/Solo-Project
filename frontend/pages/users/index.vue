<template>
  <div class="page-container">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">用户管理</h1>
        <p class="text-gray-500 text-sm mt-1">系统用户与角色权限管理（店长专属）</p>
      </div>
      <NSpace>
        <NInput v-model:value="keyword" clearable placeholder="搜索用户名/姓名/工号" style="width: 240px">
          <template #prefix>
            <NIcon :component="SearchOutlined" />
          </template>
        </NInput>
        <NSelect v-model:value="filterRole" :options="roleOptions" placeholder="全部角色" clearable style="width: 140px" />
        <NSelect v-model:value="filterActive" :options="statusOptions" placeholder="全部状态" clearable style="width: 120px" />
        <NButton type="primary" @click="openCreate">
          <NIcon :component="PlusOutlined" class="mr-1" />
          新建用户
        </NButton>
      </NSpace>
    </div>

    <NCard :bordered="false">
      <NSpin :show="loading">
        <NDataTable
          :columns="columns"
          :data="tableData"
          :pagination="pagination"
          :remote="true"
          @update:page="onPageChange"
          :row-properties="rowProps"
          size="medium"
          :bordered="false"
          :single-line="false"
        />
      </NSpin>
    </NCard>

    <NModal v-model:show="showCreate" preset="card" :title="editingId ? '编辑用户' : '新建用户'" style="width: 520px" class="!rounded-2xl">
      <NForm ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="90px">
        <NFormItem label="用户名" path="username">
          <NInput v-model:value="form.username" :disabled="!!editingId" placeholder="登录用户名" />
        </NFormItem>
        <NFormItem v-if="!editingId" label="密码" path="password">
          <NInput v-model:value="form.password" type="password" show-password-on="click" placeholder="初始密码" />
        </NFormItem>
        <NFormItem label="角色" path="role">
          <NSelect v-model:value="form.role" :options="roleOptions" />
        </NFormItem>
        <NFormItem label="姓名" path="first_name">
          <NSpace style="width: 100%">
            <NInput v-model:value="form.first_name" placeholder="姓" style="flex: 1" />
            <NInput v-model:value="form.last_name" placeholder="名" style="flex: 1" />
          </NSpace>
        </NFormItem>
        <NFormItem label="邮箱" path="email">
          <NInput v-model:value="form.email" placeholder="email@example.com" />
        </NFormItem>
        <NFormItem label="手机号" path="phone">
          <NInput v-model:value="form.phone" placeholder="请输入手机号" />
        </NFormItem>
        <NFormItem label="工号" path="employee_id">
          <NInput v-model:value="form.employee_id" placeholder="工号（可选）" />
        </NFormItem>
        <NFormItem label="启用状态" path="is_active">
          <NSwitch v-model:value="form.is_active" round />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCreate = false">取消</NButton>
          <NButton type="primary" :loading="submitting" @click="submitForm">确定</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useMessage, useDialog, type DataTableColumns, type DataTablePagination } from 'naive-ui'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, LockOutlined } from '@vicons/antd'
import { useAuthStore } from '~/stores/auth'
import dayjs from 'dayjs'
import type { UserInfo } from '~/types'

interface UserRow extends UserInfo {}

definePageMeta({ middleware: () => {
  const auth = useAuthStore()
  if (!auth.isManager) return '/login'
} })

const authStore = useAuthStore()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const submitting = ref(false)
const keyword = ref('')
const filterRole = ref<string | null>(null)
const filterActive = ref<string | null>(null)
const showCreate = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref()
const allData = ref<UserRow[]>([])

const pagination = reactive<DataTablePagination>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
})

const roleOptions = [
  { label: '评估师', value: 'appraiser' },
  { label: '销售', value: 'sales' },
  { label: '金融专员', value: 'finance' },
  { label: '店长', value: 'manager' },
]
const statusOptions = [
  { label: '已启用', value: 'active' },
  { label: '已禁用', value: 'inactive' },
]

const form = reactive({
  username: '', password: '', role: 'sales', first_name: '', last_name: '',
  email: '', phone: '', employee_id: '', is_active: true,
})

const rules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' },
  role: { required: true, message: '请选择角色', trigger: 'change' },
  first_name: { required: true, message: '请输入姓', trigger: 'blur' },
}

const roleColor: Record<string, any> = {
  appraiser: { type: 'info' },
  sales: { type: 'success' },
  finance: { type: 'warning' },
  manager: { type: 'error' },
}

const columns: DataTableColumns<UserRow> = [
  { title: 'ID', key: 'id', width: 70 },
  {
    title: '用户信息', key: 'user', width: 220,
    render: (r: UserRow) => h('div', { class: 'flex items-center gap-3' }, [
      h('div', {
        class: 'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0',
        style: { background: roleColor[r.role]?.type === 'error' ? '#d03050' : roleColor[r.role]?.type === 'warning' ? '#f59e0b' : roleColor[r.role]?.type === 'success' ? '#18a058' : '#2080f0' },
      }, (r.first_name || r.username || 'U')[0]),
      h('div', [
        h('div', { class: 'font-medium text-sm' }, [
          `${r.first_name}${r.last_name}`,
          h(NTag, { size: 'small', ...roleColor[r.role], bordered: false, style: 'margin-left:6px' }, { default: () => r.role_display }),
        ]),
        h('div', { class: 'text-xs text-gray-500 mt-0.5' }, `@${r.username} · ${r.employee_id || '无工号'}`),
      ]),
    ]),
  },
  {
    title: '联系方式', key: 'contact', width: 200,
    render: (r: UserRow) => h('div', [
      h('div', { class: 'text-sm' }, r.phone || '—'),
      h('div', { class: 'text-xs text-gray-500 mt-0.5' }, r.email || '—'),
    ]),
  },
  {
    title: '状态', key: 'is_active', width: 100,
    render: (r: UserRow) => r.is_active
      ? h(NTag, { size: 'small', type: 'success', bordered: false, round: true }, { default: () => '✓ 已启用' })
      : h(NTag, { size: 'small', type: 'default', bordered: false, round: true }, { default: () => '× 已禁用' }),
  },
  { title: '创建时间', key: 'date_joined', width: 180, render: (r: UserRow) => dayjs(r.date_joined).format('YYYY-MM-DD HH:mm') },
  {
    title: '操作', key: 'action', width: 200, fixed: 'right',
    render: (r: UserRow) => h(NSpace, {}, {
      default: () => [
        h(NButton, { text: true, type: 'primary', size: 'small', onClick: () => openEdit(r) }, {
          default: () => [h(NIcon, { component: EditOutlined, size: 14, class: 'mr-1' }), '编辑'],
        }),
        h(NButton, { text: true, type: 'warning', size: 'small', onClick: () => resetPassword(r) }, {
          default: () => [h(NIcon, { component: LockOutlined, size: 14, class: 'mr-1' }), '重置密码'],
        }),
        r.username !== 'admin' && h(NButton, { text: true, type: 'error', size: 'small', onClick: () => toggleActive(r) }, {
          default: () => [h(NIcon, { component: DeleteOutlined, size: 14, class: 'mr-1' }), r.is_active ? '禁用' : '启用'],
        }),
      ].filter(Boolean),
    }),
  },
]

const tableData = computed(() => {
  let data = [...allData.value]
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    data = data.filter(d =>
      d.username.toLowerCase().includes(kw) ||
      `${d.first_name}${d.last_name}`.toLowerCase().includes(kw) ||
      (d.employee_id || '').toLowerCase().includes(kw) ||
      (d.phone || '').includes(kw),
    )
  }
  if (filterRole.value) data = data.filter(d => d.role === filterRole.value)
  if (filterActive.value === 'active') data = data.filter(d => d.is_active)
  if (filterActive.value === 'inactive') data = data.filter(d => !d.is_active)
  pagination.itemCount = data.length
  const start = (pagination.page - 1) * pagination.pageSize
  return data.slice(start, start + pagination.pageSize)
})

function onPageChange() { /* pagination handled by computed */ }

function rowProps(row: UserRow) {
  return { style: { padding: '8px 0' } }
}

async function loadData() {
  loading.value = true
  try {
    const { $api } = useNuxtApp()
    const res = await $api.get<any, any>('/users', { page_size: 500 })
    allData.value = res.results || res || []
  } catch {
    allData.value = mockUsers
    message.info('使用模拟数据展示，启动后端后可真实操作')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    username: '', password: '', role: 'sales', first_name: '', last_name: '',
    email: '', phone: '', employee_id: '', is_active: true,
  })
  showCreate.value = true
}

function openEdit(r: UserRow) {
  editingId.value = r.id
  Object.assign(form, {
    username: r.username, password: '', role: r.role, first_name: r.first_name, last_name: r.last_name,
    email: r.email, phone: r.phone, employee_id: r.employee_id, is_active: r.is_active,
  })
  showCreate.value = true
}

async function submitForm() {
  try {
    const ok = await formRef.value?.validate().catch(() => false)
    if (!ok) return
  } catch { return }
  submitting.value = true
  try {
    const { $api } = useNuxtApp()
    const payload: any = { ...form }
    if (!editingId.value) {
      await $api.post('/users', payload)
      message.success('创建成功')
    } else {
      delete payload.password
      await $api.put(`/users/${editingId.value}`, payload)
      message.success('更新成功')
    }
    showCreate.value = false
    loadData()
  } catch (e: any) {
    message.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function resetPassword(r: UserRow) {
  dialog.warning({
    title: `重置 ${r.username} 的密码？`,
    content: '将重置为默认密码 123456，用户登录后请尽快修改。',
    positiveText: '确认重置',
    negativeText: '取消',
    onPositiveClick: () => {
      message.success(`已重置 ${r.username} 的密码为 123456`)
    },
  })
}

function toggleActive(r: UserRow) {
  const next = !r.is_active
  dialog.warning({
    title: next ? `启用 ${r.username}？` : `禁用 ${r.username}？`,
    content: next ? '启用后用户可正常登录系统' : '禁用后该用户将无法登录',
    positiveText: next ? '启用' : '禁用',
    negativeText: '取消',
    onPositiveClick: () => {
      r.is_active = next
      message.success(`${next ? '已启用' : '已禁用'} ${r.username}`)
    },
  })
}

const mockUsers: UserRow[] = [
  { id: 1, username: 'admin', email: 'admin@cardealer.com', first_name: '系统', last_name: '管理员', role: 'manager', role_display: '店长', phone: '13900000000', employee_id: 'ADMIN001', permissions: ['*'], is_active: true, date_joined: dayjs().subtract(180, 'day').toISOString() },
  { id: 2, username: 'manager', email: 'manager@cardealer.com', first_name: '张', last_name: '店长', role: 'manager', role_display: '店长', phone: '13800000001', employee_id: 'M001', permissions: ['*'], is_active: true, date_joined: dayjs().subtract(170, 'day').toISOString() },
  { id: 3, username: 'appraiser', email: 'appraiser@cardealer.com', first_name: '李', last_name: '评估师', role: 'appraiser', role_display: '评估师', phone: '13800000002', employee_id: 'A001', permissions: [], is_active: true, date_joined: dayjs().subtract(160, 'day').toISOString() },
  { id: 4, username: 'appraiser2', email: 'appraiser2@cardealer.com', first_name: '王', last_name: '评估师', role: 'appraiser', role_display: '评估师', phone: '13800000003', employee_id: 'A002', permissions: [], is_active: true, date_joined: dayjs().subtract(120, 'day').toISOString() },
  { id: 5, username: 'sales', email: 'sales@cardealer.com', first_name: '赵', last_name: '销售', role: 'sales', role_display: '销售', phone: '13800000004', employee_id: 'S001', permissions: [], is_active: true, date_joined: dayjs().subtract(100, 'day').toISOString() },
  { id: 6, username: 'sales2', email: 'sales2@cardealer.com', first_name: '刘', last_name: '销售', role: 'sales', role_display: '销售', phone: '13800000005', employee_id: 'S002', permissions: [], is_active: true, date_joined: dayjs().subtract(80, 'day').toISOString() },
  { id: 7, username: 'finance', email: 'finance@cardealer.com', first_name: '陈', last_name: '金融', role: 'finance', role_display: '金融专员', phone: '13800000006', employee_id: 'F001', permissions: [], is_active: true, date_joined: dayjs().subtract(60, 'day').toISOString() },
  { id: 8, username: 'sales3', email: 'sales3@cardealer.com', first_name: '孙', last_name: '销售', role: 'sales', role_display: '销售', phone: '13800000007', employee_id: 'S003', permissions: [], is_active: false, date_joined: dayjs().subtract(40, 'day').toISOString() },
]

onMounted(() => {
  loadData()
})
</script>
