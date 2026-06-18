<template>
  <div class="finance-page">
    <div class="page-header flex-between mb-20">
      <div>
        <h2 class="page-title">金融资料管理</h2>
        <p class="page-desc">管理车辆金融审批资料和贷款申请</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="handleExport">导出</el-button>
        <el-button type="primary" :icon="Upload" @click="uploadVisible = true">批量上传资料</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card card-shadow" shadow="hover">
          <div class="stat-content">
            <div class="stat-label">待审批</div>
            <div class="stat-value" style="color:#e6a23c">{{ stats.pending }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow" shadow="hover">
          <div class="stat-content">
            <div class="stat-label">审批通过</div>
            <div class="stat-value" style="color:#67c23a">{{ stats.approved }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow" shadow="hover">
          <div class="stat-content">
            <div class="stat-label">已拒绝</div>
            <div class="stat-value" style="color:#f56c6c">{{ stats.rejected }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow" shadow="hover">
          <div class="stat-content">
            <div class="stat-label">资料缺失</div>
            <div class="stat-value" style="color:#409eff">{{ stats.missingDocs }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow">
      <div class="table-header flex-between mb-20">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="全部资料" name="all" />
          <el-tab-pane label="待审批" name="pending" />
          <el-tab-pane label="审批通过" name="approved" />
          <el-tab-pane label="已拒绝" name="rejected" />
          <el-tab-pane label="资料缺失" name="missing" />
        </el-tabs>
        <el-input v-model="searchKw" placeholder="搜索车牌号/客户" style="width: 220px" size="default">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <el-table :data="filteredData" v-loading="loading" stripe border>
        <el-table-column prop="plateNumber" label="车牌号" width="110" />
        <el-table-column label="车辆信息" min-width="180">
          <template #default="{ row }">
            <div>
              <div class="vehicle-name">{{ row.brand }} {{ row.model }} {{ row.year }}款</div>
              <div class="vin-code">VIN: {{ row.vin }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户姓名" width="100" />
        <el-table-column prop="loanAmount" label="贷款金额" width="120" align="right">
          <template #default="{ row }">¥{{ (row.loanAmount / 10000).toFixed(2) }}万</template>
        </el-table-column>
        <el-table-column prop="financeCompany" label="金融机构" width="120" />
        <el-table-column label="资料清单" min-width="260">
          <template #default="{ row }">
            <div class="doc-tags">
              <el-tag
                v-for="doc in row.documents"
                :key="doc.name"
                :type="doc.uploaded ? 'success' : 'danger'"
                size="small"
                effect="plain"
                class="doc-tag"
              >
                <el-icon><component :is="doc.uploaded ? 'CircleCheck' : 'WarningFilled'" /></el-icon>
                {{ doc.name }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="审批状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitDate" label="提交时间" width="120">
          <template #default="{ row }">{{ dayjs(row.submitDate).format('MM-DD') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button
              size="small"
              link
              type="success"
              v-if="row.status === 'pending'"
              @click="handleApprove(row)"
            >通过</el-button>
            <el-button
              size="small"
              link
              type="danger"
              v-if="row.status === 'pending'"
              @click="handleReject(row)"
            >拒绝</el-button>
            <el-button size="small" link type="warning" @click="uploadVisible = true">补资料</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="uploadVisible" title="上传金融资料" width="560px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="选择车辆">
          <el-select v-model="uploadForm.vehicleId" placeholder="请选择车辆" style="width:100%">
            <el-option v-for="v in filteredData" :key="v.id" :label="v.plateNumber" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="资料类型">
          <el-checkbox-group v-model="uploadForm.docTypes">
            <el-checkbox label="身份证" />
            <el-checkbox label="驾驶证" />
            <el-checkbox label="银行流水" />
            <el-checkbox label="工作证明" />
            <el-checkbox label="征信报告" />
            <el-checkbox label="车辆登记证" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload
            action="#"
            multiple
            :auto-upload="false"
            drag
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽文件到此或 <em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 PDF/JPG/PNG，单个文件不超过 10MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUploadSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { exportToExcel } from '@/utils/download'
import dayjs from 'dayjs'
import { Download, Upload, UploadFilled, Search, CircleCheck, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const activeTab = ref('all')
const searchKw = ref('')
const uploadVisible = ref(false)

const stats = reactive({
  pending: 18,
  approved: 124,
  rejected: 15,
  missingDocs: 9
})

const uploadForm = reactive({
  vehicleId: '',
  docTypes: []
})

const rawData = ref([])

const filteredData = computed(() => {
  let data = rawData.value
  if (activeTab.value !== 'all') {
    if (activeTab.value === 'missing') {
      data = data.filter(d => d.documents.some(doc => !doc.uploaded))
    } else {
      data = data.filter(d => d.status === activeTab.value)
    }
  }
  if (searchKw.value) {
    const kw = searchKw.value.toLowerCase()
    data = data.filter(d =>
      d.plateNumber.toLowerCase().includes(kw) ||
      (d.customerName && d.customerName.toLowerCase().includes(kw))
    )
  }
  return data
})

function generateMock() {
  const docNames = ['身份证', '驾驶证', '银行流水', '工作证明', '征信报告', '车辆登记证']
  const statuses = ['pending', 'approved', 'rejected']
  const institutions = ['招商银行', '平安银行', '工商银行', '比亚迪金融', '吉致金融']
  const data = []
  for (let i = 0; i < 30; i++) {
    const docs = docNames.map(name => ({
      name,
      uploaded: Math.random() > 0.15
    }))
    data.push({
      id: i + 1,
      plateNumber: `京${['A','B','C','D'][Math.floor(Math.random()*4)]}${Math.floor(Math.random()*90000+10000)}`,
      vin: `LBV${Math.random().toString(36).substring(2,13).toUpperCase()}`,
      brand: ['宝马','奔驰','奥迪','丰田','比亚迪'][Math.floor(Math.random()*5)],
      model: ['3系','C级','A4L','凯美瑞','汉EV'][Math.floor(Math.random()*5)],
      year: 2019 + Math.floor(Math.random() * 5),
      customerName: `客户${i + 1}`,
      loanAmount: Math.floor(Math.random() * 300000 + 50000),
      financeCompany: institutions[Math.floor(Math.random() * institutions.length)],
      documents: docs,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      submitDate: new Date(Date.now() - Math.random() * 20 * 86400000).toISOString(),
      operator: ['张三','李四','王五'][Math.floor(Math.random()*3)]
    })
  }
  return data
}

onMounted(() => {
  rawData.value = generateMock()
})

function statusType(s) {
  return { pending: 'warning', approved: 'success', rejected: 'danger' }[s] || 'info'
}
function statusLabel(s) {
  return { pending: '待审批', approved: '已通过', rejected: '已拒绝' }[s] || s
}

function handleTabChange() {}

function viewDetail(row) {
  ElMessage.info(`查看 ${row.plateNumber} 的金融资料详情`)
}
function handleApprove(row) {
  ElMessageBox.confirm(`确认通过 ${row.plateNumber} 的审批？`, '审批确认', {
    type: 'success'
  }).then(() => {
    row.status = 'approved'
    stats.pending--; stats.approved++
    ElMessage.success('审批已通过')
  }).catch(() => {})
}
function handleReject(row) {
  ElMessageBox.prompt('请输入拒绝原因', '拒绝确认', {
    confirmButtonText: '确认拒绝',
    type: 'warning'
  }).then(() => {
    row.status = 'rejected'
    stats.pending--; stats.rejected++
    ElMessage.success('已拒绝')
  }).catch(() => {})
}
function handleUploadSubmit() {
  ElMessage.success('资料已提交，等待审核')
  uploadVisible.value = false
}
function handleExport() {
  const exportData = filteredData.value.map(r => ({
    '车牌号': r.plateNumber,
    'VIN': r.vin,
    '品牌': r.brand,
    '型号': r.model,
    '客户': r.customerName,
    '贷款金额(万)': (r.loanAmount / 10000).toFixed(2),
    '金融机构': r.financeCompany,
    '资料完整度': `${r.documents.filter(d=>d.uploaded).length}/${r.documents.length}`,
    '状态': statusLabel(r.status),
    '提交日期': dayjs(r.submitDate).format('YYYY-MM-DD')
  }))
  exportToExcel(exportData, '金融资料清单', '金融资料')
  ElMessage.success('导出成功')
}
</script>

<style lang="scss" scoped>
.finance-page {
  .page-title { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #303133; }
  .page-desc { margin: 0; font-size: 13px; color: #909399; }
  .header-actions { display: flex; gap: 10px; }
  .stat-card :deep(.el-card__body) { padding: 16px 20px; }
  .stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
  .stat-value { font-size: 28px; font-weight: 700; }
  .table-header { align-items: flex-start; }
  .vehicle-name { font-weight: 500; }
  .vin-code { font-size: 11px; color: #909399; margin-top: 2px; }
  .doc-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .doc-tag { display: inline-flex; align-items: center; gap: 2px; }
}
</style>
