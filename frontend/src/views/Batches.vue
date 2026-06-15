<template>
  <div class="batches-page">
    <div class="page-header">
      <h2 class="page-title">批次管理</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Upload">
          导入报名表
        </el-button>
        <el-button type="success" :icon="Upload">
          导入成绩
        </el-button>
        <el-button type="warning" :icon="Upload">
          导入反馈
        </el-button>
      </div>
    </div>

    <div class="batch-stats grid-4">
      <div class="stat-card">
        <div class="stat-icon icon-blue">
          <el-icon><Files /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">今日导入批次</div>
          <div class="stat-value">{{ todayBatches }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-green">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">成功条数</div>
          <div class="stat-value success-text">{{ successCount }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-red">
          <el-icon><Close /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">失败条数</div>
          <div class="stat-value danger-text">{{ failCount }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-orange">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">延迟同步</div>
          <div class="stat-value warning-text">{{ delayedCount }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">
        <el-icon><List /></el-icon>
        最近批次记录
      </div>

      <el-tabs v-model="activeTab" class="batch-tabs">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="报名表" name="ENROLLMENT" />
        <el-tab-pane label="成绩数据" name="ACADEMIC" />
        <el-tab-pane label="家长反馈" name="FEEDBACK" />
        <el-tab-pane label="延迟批次" name="delayed" />
      </el-tabs>

      <el-table :data="filteredBatches" stripe>
        <el-table-column prop="batchId" label="批次号" width="220" />
        <el-table-column prop="batchName" label="批次名称" width="180" />
        <el-table-column prop="batchType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getBatchTypeTag(row.batchType)" size="small">
              {{ getBatchTypeName(row.batchType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalCount" label="总数" width="80" />
        <el-table-column prop="successCount" label="成功" width="80">
          <template #default="{ row }">
            <span class="success-text">{{ row.successCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failCount" label="失败" width="80">
          <template #default="{ row }">
            <span class="danger-text">{{ row.failCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="batchTime" label="导入时间" width="170" />
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
            <el-tag
              v-if="row.isDelayed"
              type="warning"
              size="small"
              effect="dark"
              style="margin-left: 4px;"
            >
              延迟
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="同步时间" width="180">
          <template #default="{ row }">
            <div class="sync-time">
              <div class="expected">预期: {{ row.expectedSyncTime || '-' }}</div>
              <div class="actual">实际: {{ row.actualSyncTime || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredBatches.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="detailDialogVisible"
      title="批次详情"
      width="600px"
    >
      <div v-if="currentBatch" class="batch-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="批次号">{{ currentBatch.batchId }}</el-descriptions-item>
          <el-descriptions-item label="批次名称">{{ currentBatch.batchName }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ getBatchTypeName(currentBatch.batchType) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentBatch.status)">
              {{ getStatusName(currentBatch.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总条数">{{ currentBatch.totalCount }}</el-descriptions-item>
          <el-descriptions-item label="成功条数">
            <span class="success-text">{{ currentBatch.successCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="失败条数">
            <span class="danger-text">{{ currentBatch.failCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentBatch.operatorName }}</el-descriptions-item>
          <el-descriptions-item label="导入时间">{{ currentBatch.batchTime }}</el-descriptions-item>
          <el-descriptions-item label="是否延迟">
            <el-tag v-if="currentBatch.isDelayed" type="warning">是</el-tag>
            <el-tag v-else type="success">否</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预期同步时间" :span="2">
            {{ currentBatch.expectedSyncTime || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="实际同步时间" :span="2">
            {{ currentBatch.actualSyncTime || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ currentBatch.remark || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentBatch.isDelayed" class="delay-warning-box">
          <el-alert
            title="该批次数据同步延迟，图表数据可能不准确，请注意时间标注"
            type="warning"
            show-icon
            :closable="false"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Upload, Files, Check, Close, Warning, List } from '@element-plus/icons-vue'
import { getRecentBatches, getBatchesByType, getDelayedBatches } from '@/api/batch'

const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(20)

const allBatches = ref([])
const delayedBatches = ref([])
const currentBatch = ref(null)
const detailDialogVisible = ref(false)

const todayBatches = computed(() => allBatches.value.length)
const successCount = computed(() => allBatches.value.reduce((sum, b) => sum + (b.successCount || 0), 0))
const failCount = computed(() => allBatches.value.reduce((sum, b) => sum + (b.failCount || 0), 0))
const delayedCount = computed(() => delayedBatches.value.length)

const filteredBatches = computed(() => {
  if (activeTab.value === 'all') return allBatches.value
  if (activeTab.value === 'delayed') return delayedBatches.value
  return allBatches.value.filter(b => b.batchType === activeTab.value)
})

const getBatchTypeTag = (type) => {
  const map = {
    'ENROLLMENT': 'primary',
    'ACADEMIC': 'success',
    'FEEDBACK': 'warning'
  }
  return map[type] || 'info'
}

const getBatchTypeName = (type) => {
  const map = {
    'ENROLLMENT': '报名表',
    'ACADEMIC': '成绩数据',
    'FEEDBACK': '家长反馈'
  }
  return map[type] || type
}

const getStatusTagType = (status) => {
  const map = {
    'COMPLETED': 'success',
    'PROCESSING': 'primary',
    'FAILED': 'danger'
  }
  return map[status] || 'info'
}

const getStatusName = (status) => {
  const map = {
    'COMPLETED': '已完成',
    'PROCESSING': '处理中',
    'FAILED': '失败'
  }
  return map[status] || status
}

const loadData = async () => {
  try {
    const res = await getRecentBatches(50)
    if (res.code === 200) {
      allBatches.value = res.data
    }
    const delayedRes = await getDelayedBatches()
    if (delayedRes.code === 200) {
      delayedBatches.value = delayedRes.data
    }
  } catch (e) {
    loadMockData()
  }
}

const loadMockData = () => {
  const types = ['ENROLLMENT', 'ACADEMIC', 'FEEDBACK']
  const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'PROCESSING', 'FAILED']
  const mockData = []

  for (let i = 0; i < 30; i++) {
    const type = types[i % 3]
    const status = statuses[i % 5]
    const total = Math.floor(Math.random() * 200) + 50
    const success = status === 'COMPLETED' ? total - Math.floor(Math.random() * 10) : Math.floor(total * 0.8)
    const fail = total - success
    const isDelayed = i < 3 && Math.random() > 0.5

    const batchTime = new Date(Date.now() - i * 3600000 * 2).toISOString()
      .replace('T', ' ').substring(0, 19)

    mockData.push({
      id: i + 1,
      batchId: `${type}_${Date.now() - i * 100000}_${i}`,
      batchName: `${getBatchTypeName(type)}导入${i + 1}`,
      batchType: type,
      batchTime,
      totalCount: total,
      successCount: success,
      failCount: fail,
      operatorId: `OP${i % 3 + 1}`,
      operatorName: ['张老师', '李老师', '王老师'][i % 3],
      status,
      isDelayed,
      expectedSyncTime: isDelayed ? new Date(Date.now() - 3600000 * 48).toISOString().replace('T', ' ').substring(0, 19) : null,
      actualSyncTime: status === 'COMPLETED' ? batchTime : null,
      remark: isDelayed ? '教务系统接口响应延迟' : ''
    })
  }

  allBatches.value = mockData
  delayedBatches.value = mockData.filter(b => b.isDelayed)
}

const viewDetail = (row) => {
  currentBatch.value = row
  detailDialogVisible.value = true
}

const handleSizeChange = () => {}
const handlePageChange = () => {}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.batches-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      color: #1a1a1a;
    }
  }

  .batch-stats {
    margin-bottom: 16px;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .stat-icon {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: white;

        &.icon-blue { background: linear-gradient(135deg, #1890ff, #096dd9); }
        &.icon-green { background: linear-gradient(135deg, #52c41a, #389e0d); }
        &.icon-red { background: linear-gradient(135deg, #f5222d, #cf1322); }
        &.icon-orange { background: linear-gradient(135deg, #faad14, #d46b08); }
      }

      .stat-info {
        .stat-label {
          font-size: 13px;
          color: #8c8c8c;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 22px;
          font-weight: 600;
          color: #1a1a1a;
        }
      }
    }
  }

  .batch-tabs {
    margin-bottom: 16px;
  }

  .sync-time {
    font-size: 11px;
    color: #8c8c8c;
    line-height: 1.6;

    .expected {
      color: #8c8c8c;
    }

    .actual {
      color: #595959;
    }
  }

  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .delay-warning-box {
    margin-top: 16px;
  }
}
</style>
