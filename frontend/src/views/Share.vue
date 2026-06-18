<template>
  <div class="share-page">
    <div class="page-header flex-between mb-20">
      <div>
        <h2 class="page-title">分享链接管理</h2>
        <p class="page-desc">创建和管理对外分享链接，按角色控制数据可见范围</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="createVisible = true">创建分享链接</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="mb-20">
      <el-col :span="8">
        <el-card class="stat-card card-shadow" shadow="hover">
          <div class="stat-icon" style="background:#ecf5ff;color:#409eff"><el-icon :size="24"><Link /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ shareStats.total }}</div>
            <div class="stat-lbl">总链接数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card card-shadow" shadow="hover">
          <div class="stat-icon" style="background:#f0f9eb;color:#67c23a"><el-icon :size="24"><CircleCheckFilled /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ shareStats.active }}</div>
            <div class="stat-lbl">生效中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card card-shadow" shadow="hover">
          <div class="stat-icon" style="background:#fdf6ec;color:#e6a23c"><el-icon :size="24"><View /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ shareStats.views }}</div>
            <div class="stat-lbl">累计访问</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow">
      <el-table :data="shareLinks" stripe border v-loading="loading">
        <el-table-column prop="title" label="链接名称" min-width="160">
          <template #default="{ row }">
            <div class="share-title">
              <el-icon color="#409eff"><Link /></el-icon>
              {{ row.title || '未命名链接' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="linkToken" label="分享码" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" type="info" monospaced>{{ row.linkToken || row.token }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="dataTypeTag(row.dataType)" effect="light">
              {{ dataTypeLabel(row.dataType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="可见范围" width="200">
          <template #default="{ row }">
            <div class="role-tags">
              <el-tag
                v-for="r in parseRoleScope(row.roleScope)"
                :key="r.value"
                size="small"
                :type="roleType(r.value)"
                effect="light"
                style="margin-right:4px"
              >{{ r.label }}</el-tag>
              <span v-if="!row.roleScope" class="empty-scope">未设置</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="敏感字段" width="140">
          <template #default="{ row }">
            <span v-if="!row.includeSensitive" style="color:#67c23a" class="flex-center">
              <el-icon><Lock /></el-icon>已隐藏
            </span>
            <span v-else style="color:#f56c6c" class="flex-center">
              <el-icon><Unlock /></el-icon>可见
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="访问次数" width="90" align="right" />
        <el-table-column label="有效期" width="180">
          <template #default="{ row }">
            <div class="expire-info">
              <span>{{ dayjs(row.createdAt).format('MM-DD') }} ~ {{ dayjs(row.expireAt).format('MM-DD') }}</span>
              <el-tag v-if="isExpired(row)" size="small" type="danger" effect="plain">已过期</el-tag>
              <el-tag v-else size="small" type="success" effect="plain">生效中</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" width="90" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="copyLink(row)">复制链接</el-button>
            <el-button size="small" link type="success" @click="viewLogs(row)">访问日志</el-button>
            <el-button size="small" link type="warning" @click="editRow(row)">编辑</el-button>
            <el-button size="small" link type="danger" @click="revoke(row)" v-if="!isExpired(row)">撤销</el-button>
            <el-button size="small" link type="danger" @click="del(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="createVisible" title="创建分享链接" width="560px">
      <el-form :model="shareForm" label-width="110px">
        <el-form-item label="链接名称">
          <el-input v-model="shareForm.title" placeholder="请输入分享链接名称" />
        </el-form-item>
        <el-form-item label="数据类型">
          <el-radio-group v-model="shareForm.dataType">
            <el-radio value="funnel">漏斗数据</el-radio>
            <el-radio value="quotation">报价数据</el-radio>
            <el-radio value="archive">车辆档案</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="可见范围">
          <el-select v-model="shareForm.roleScope" multiple style="width:100%" placeholder="选择可访问的角色">
            <el-option
              v-for="opt in ROLE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <div class="form-tip">外部人员默认只能访问脱敏数据，不在此列选</div>
        </el-form-item>
        <el-form-item label="有效期">
          <el-radio-group v-model="shareForm.validDays">
            <el-radio :value="1">1天</el-radio>
            <el-radio :value="7">7天</el-radio>
            <el-radio :value="30">30天</el-radio>
            <el-radio :value="90">永久</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="隐私保护">
          <el-checkbox v-model="shareForm.includeSensitive">允许查看价格、客户等敏感字段（仅内部角色可见）</el-checkbox>
        </el-form-item>
        <el-form-item label="访问密码">
          <el-input v-model="shareForm.password" placeholder="留空表示无需密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">生成链接</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logsVisible" title="访问日志" width="640px">
      <el-table :data="currentLogs" size="small">
        <el-table-column prop="time" label="访问时间" width="170" />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="location" label="地理位置" width="140" />
        <el-table-column prop="ua" label="浏览器" />
      </el-table>
      <el-empty v-if="!currentLogs.length" description="暂无访问记录" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import { Plus, Link, CircleCheckFilled, View, Lock, Unlock } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ROLE_OPTIONS,
  getShareList,
  createShareLink,
  deleteShareLink,
  updateShareLink
} from '@/api/share'

const createVisible = ref(false)
const logsVisible = ref(false)
const currentLogs = ref([])
const loading = ref(false)
const submitting = ref(false)

const shareStats = reactive({
  total: 0,
  active: 0,
  views: 0
})

const shareForm = reactive({
  title: '',
  dataType: 'funnel',
  roleScope: ['ASSESSOR', 'SALES', 'FINANCE_STAFF', 'STORE_MANAGER'],
  validDays: 7,
  includeSensitive: false,
  password: ''
})

const shareLinks = ref([])

async function loadData() {
  loading.value = true
  try {
    const data = await getShareList()
    shareLinks.value = (Array.isArray(data) ? data : []).map(l => ({
      ...l,
      token: l.linkToken || l.token
    }))
    shareStats.total = shareLinks.value.length
    shareStats.active = shareLinks.value.filter(l => !isExpired(l)).length
    shareStats.views = shareLinks.value.reduce((s, l) => s + (l.viewCount || 0), 0)
  } catch (e) {
    ElMessage.error('加载分享列表失败：' + (e?.message || '未知错误'))
    shareLinks.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function dataTypeTag(t) {
  return { funnel: 'primary', quotation: 'success', archive: 'warning' }[t] || 'info'
}
function dataTypeLabel(t) {
  return { funnel: '漏斗数据', quotation: '报价数据', archive: '车辆档案' }[t] || t
}
function roleType(r) {
  return {
    ASSESSOR: 'success',
    SALES: 'warning',
    FINANCE_STAFF: 'primary',
    STORE_MANAGER: 'danger'
  }[r] || 'info'
}
function parseRoleScope(scope) {
  if (!scope) return []
  const arr = Array.isArray(scope) ? scope : String(scope).split(/[,\s]+/).filter(Boolean)
  return arr.map(r => {
    const opt = ROLE_OPTIONS.find(o => o.value === r)
    return opt || { value: r, label: r }
  })
}
function isExpired(row) {
  if (!row.expireAt) return false
  return new Date(row.expireAt) < new Date()
}

function copyLink(row) {
  const token = row.linkToken || row.token
  const link = `${window.location.origin}/public/share/${token}`
  navigator.clipboard.writeText(link).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.success(`请手动复制：${link}`)
  })
}
function viewLogs(row) {
  currentLogs.value = []
  logsVisible.value = true
}
function editRow(row) {
  ElMessage.info(`编辑 ${row.title || '链接'}`)
}
async function revoke(row) {
  ElMessageBox.confirm(`确认撤销分享链接 ${row.title || ''}？`, '撤销确认', { type: 'warning' }).then(async () => {
    try {
      const nowExpire = dayjs().toISOString()
      await updateShareLink(row.id, {
        ...row,
        expireAt: nowExpire
      })
      row.expireAt = nowExpire
      shareStats.active = Math.max(0, shareStats.active - 1)
      ElMessage.success('链接已撤销')
    } catch (e) {
      ElMessage.error('撤销失败：' + (e?.message || '未知错误'))
    }
  }).catch(() => {})
}
async function del(row) {
  ElMessageBox.confirm(`确认删除 ${row.title || '该链接'}？`, '删除确认', { type: 'error' }).then(async () => {
    try {
      if (row.id) await deleteShareLink(row.id)
      const idx = shareLinks.value.findIndex(l => l.id === row.id)
      if (idx >= 0) shareLinks.value.splice(idx, 1)
      shareStats.total = Math.max(0, shareStats.total - 1)
      if (!isExpired(row)) shareStats.active = Math.max(0, shareStats.active - 1)
      ElMessage.success('已删除')
    } catch (e) {
      ElMessage.error('删除失败：' + (e?.message || '未知错误'))
    }
  }).catch(() => {})
}
async function handleCreate() {
  if (!shareForm.title) {
    ElMessage.warning('请输入链接名称')
    return
  }
  if (!shareForm.roleScope || shareForm.roleScope.length === 0) {
    ElMessage.warning('请至少选择一个可见角色')
    return
  }
  submitting.value = true
  try {
    const data = await createShareLink({
      ...shareForm,
      createdBy: 1
    })
    const saved = data || {}
    const newLink = {
      ...saved,
      title: saved.title || shareForm.title,
      dataType: saved.dataType || shareForm.dataType,
      token: saved.linkToken || saved.token,
      linkToken: saved.linkToken || saved.token,
      roleScope: saved.roleScope || shareForm.roleScope.join(','),
      includeSensitive: saved.includeSensitive !== undefined ? saved.includeSensitive : shareForm.includeSensitive,
      viewCount: saved.viewCount || 0,
      createdAt: saved.createdAt || new Date().toISOString(),
      expireAt: saved.expireAt || new Date(Date.now() + shareForm.validDays * 86400000).toISOString(),
      createdBy: saved.createdBy || '当前用户'
    }
    shareLinks.value.unshift(newLink)
    shareStats.total++
    shareStats.active++
    const fullLink = `${window.location.origin}/public/share/${newLink.token}`
    ElMessageBox.alert(
      `链接已生成：<code style="background:#f5f7fa;padding:4px 8px;border-radius:4px;word-break:break-all;display:block;margin-top:8px;">${fullLink}</code>`,
      '创建成功',
      { dangerouslyUseHTMLString: true }
    )
    createVisible.value = false
    shareForm.title = ''
    shareForm.validDays = 7
    shareForm.includeSensitive = false
    shareForm.password = ''
  } catch (e) {
    ElMessage.error('创建失败：' + (e?.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.share-page {
  .page-title { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #303133; }
  .page-desc { margin: 0; font-size: 13px; color: #909399; }
  .header-actions { display: flex; gap: 10px; }
  .stat-card :deep(.el-card__body) {
    display: flex; align-items: center; gap: 16px; padding: 16px 20px;
  }
  .stat-icon {
    width: 52px; height: 52px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
  }
  .stat-info {
    .stat-num { font-size: 24px; font-weight: 700; color: #303133; }
    .stat-lbl { font-size: 12px; color: #909399; margin-top: 2px; }
  }
  .share-title { display: flex; align-items: center; gap: 6px; font-weight: 500; }
  .expire-info { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
  .role-tags { .empty-scope { color: #c0c4cc; font-size: 12px; } }
  .form-tip { margin-top: 4px; font-size: 12px; color: #909399; }
}
</style>
