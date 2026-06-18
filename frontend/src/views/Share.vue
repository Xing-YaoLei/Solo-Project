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
      <el-table :data="shareLinks" stripe border>
        <el-table-column prop="title" label="链接名称" min-width="160">
          <template #default="{ row }">
            <div class="share-title">
              <el-icon color="#409eff"><Link /></el-icon>
              {{ row.title }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="token" label="分享码" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" type="info" monospaced>{{ row.token }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataType" label="数据类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.dataType === 'funnel' ? 'primary' : 'success'" effect="light">
              {{ row.dataType === 'funnel' ? '漏斗数据' : '报价数据' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="allowedRole" label="可见范围" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="roleType(row.allowedRole)" effect="light">
              {{ roleLabel(row.allowedRole) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="敏感字段" width="140">
          <template #default="{ row }">
            <span v-if="row.hideSensitive" style="color:#67c23a" class="flex-center">
              <el-icon><Lock /></el-icon>已隐藏
            </span>
            <span v-else style="color:#f56c6c" class="flex-center">
              <el-icon><Unlock /></el-icon>可见
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="访问次数" width="90" align="right" />
        <el-table-column prop="expireAt" label="有效期" width="180">
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

    <el-dialog v-model="createVisible" title="创建分享链接" width="520px">
      <el-form :model="shareForm" label-width="100px">
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
          <el-select v-model="shareForm.allowedRole" style="width:100%">
            <el-option label="所有人(含外部)" value="all" />
            <el-option label="仅内部员工" value="internal" />
            <el-option label="仅运营/管理" value="operator_plus" />
          </el-select>
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
          <el-checkbox v-model="shareForm.hideSensitive">隐藏价格、客户等敏感字段</el-checkbox>
        </el-form-item>
        <el-form-item label="访问密码">
          <el-input v-model="shareForm.password" placeholder="留空表示无需密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">生成链接</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logsVisible" title="访问日志" width="640px">
      <el-table :data="currentLogs" size="small">
        <el-table-column prop="time" label="访问时间" width="170" />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="location" label="地理位置" width="140" />
        <el-table-column prop="ua" label="浏览器" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { exportToExcel } from '@/utils/download'
import dayjs from 'dayjs'
import { Plus, Link, CircleCheckFilled, View, Lock, Unlock } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const createVisible = ref(false)
const logsVisible = ref(false)
const currentLogs = ref([])

const shareStats = reactive({
  total: 0,
  active: 0,
  views: 0
})

const shareForm = reactive({
  title: '',
  dataType: 'funnel',
  allowedRole: 'all',
  validDays: 7,
  hideSensitive: true,
  password: ''
})

const shareLinks = ref([])

function generateMock() {
  const titles = ['每日漏斗数据分享', '周报数据', '客户报价汇总', '呆滞库存清单', '金融审批进度']
  const creators = ['张经理', '李运营', '王金融']
  const links = []
  for (let i = 0; i < 15; i++) {
    const days = [1, 7, 30, 90][Math.floor(Math.random() * 4)]
    const createdAt = new Date(Date.now() - Math.random() * 30 * 86400000)
    const expireAt = new Date(createdAt.getTime() + days * 86400000)
    links.push({
      id: i + 1,
      title: titles[i % titles.length],
      token: Math.random().toString(36).substring(2, 10),
      dataType: ['funnel', 'quotation', 'archive'][i % 3],
      allowedRole: ['all', 'internal', 'operator_plus'][i % 3],
      hideSensitive: Math.random() > 0.2,
      viewCount: Math.floor(Math.random() * 200),
      createdAt: createdAt.toISOString(),
      expireAt: expireAt.toISOString(),
      createdBy: creators[i % creators.length]
    })
  }
  return links
}

onMounted(() => {
  shareLinks.value = generateMock()
  shareStats.total = shareLinks.value.length
  shareStats.active = shareLinks.value.filter(l => !isExpired(l)).length
  shareStats.views = shareLinks.value.reduce((s, l) => s + l.viewCount, 0)
})

function roleType(r) {
  return { all: 'info', internal: 'warning', operator_plus: 'primary' }[r] || 'info'
}
function roleLabel(r) {
  return { all: '所有人', internal: '内部员工', operator_plus: '运营/管理' }[r] || r
}
function isExpired(row) {
  return new Date(row.expireAt) < new Date()
}

function copyLink(row) {
  const link = `${window.location.origin}/public/share/${row.token}`
  navigator.clipboard.writeText(link).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  })
}
function viewLogs(row) {
  const logs = []
  for (let i = 0; i < Math.min(row.viewCount, 15); i++) {
    logs.push({
      time: dayjs(new Date(Date.now() - Math.random() * 30 * 86400000)).format('YYYY-MM-DD HH:mm:ss'),
      ip: `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      location: ['北京', '上海', '广州', '深圳', '杭州'][Math.floor(Math.random()*5)],
      ua: ['Chrome', 'Safari', 'Edge', 'Firefox'][Math.floor(Math.random()*4)]
    })
  }
  currentLogs.value = logs
  logsVisible.value = true
}
function editRow(row) {
  ElMessage.info(`编辑 ${row.title}`)
}
function revoke(row) {
  ElMessageBox.confirm(`确认撤销分享链接 ${row.title}？`, '撤销确认', { type: 'warning' }).then(() => {
    row.expireAt = new Date().toISOString()
    shareStats.active--
    ElMessage.success('链接已撤销')
  }).catch(() => {})
}
function del(row) {
  ElMessageBox.confirm(`确认删除 ${row.title}？`, '删除确认', { type: 'error' }).then(() => {
    const idx = shareLinks.value.findIndex(l => l.id === row.id)
    if (idx >= 0) shareLinks.value.splice(idx, 1)
    shareStats.total--
    if (!isExpired(row)) shareStats.active--
    ElMessage.success('已删除')
  }).catch(() => {})
}
function handleCreate() {
  if (!shareForm.title) {
    ElMessage.warning('请输入链接名称')
    return
  }
  const link = {
    id: Date.now(),
    title: shareForm.title,
    token: Math.random().toString(36).substring(2, 10),
    dataType: shareForm.dataType,
    allowedRole: shareForm.allowedRole,
    hideSensitive: shareForm.hideSensitive,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    expireAt: new Date(Date.now() + shareForm.validDays * 86400000).toISOString(),
    createdBy: '当前用户'
  }
  shareLinks.value.unshift(link)
  shareStats.total++
  shareStats.active++
  const fullLink = `${window.location.origin}/public/share/${link.token}`
  ElMessageBox.alert(
    `链接已生成：<code style="background:#f5f7fa;padding:4px 8px;border-radius:4px;word-break:break-all;display:block;margin-top:8px;">${fullLink}</code>`,
    '创建成功',
    { dangerouslyUseHTMLString: true }
  )
  createVisible.value = false
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
}
</style>
