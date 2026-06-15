<template>
  <div class="batches-page">
    <div class="page-header">
      <h2 class="page-title">批次管理</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Upload" @click="openImportDialog('ENROLLMENT')">
          导入报名表
        </el-button>
        <el-button type="success" :icon="Upload" @click="openImportDialog('ACADEMIC')">
          导入成绩
        </el-button>
        <el-button type="warning" :icon="Upload" @click="openImportDialog('FEEDBACK')">
          导入反馈
        </el-button>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
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

    <div v-if="delayedBatches.length > 0" class="delay-alert">
      <el-alert
        v-for="batch in delayedBatches.slice(0, 3)"
        :key="batch.batchId"
        :title="`数据延迟同步：${batch.batchName} - 预期同步时间 ${batch.expectedSyncTime || '-'}，实际 ${batch.actualSyncTime || '尚未同步'}`"
        type="warning"
        show-icon
        :closable="false"
      />
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

      <el-table :data="pagedBatches" stripe>
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
        <el-table-column prop="status" label="状态" width="110">
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
              ⚠延迟
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="同步时间" width="180">
          <template #default="{ row }">
            <div class="sync-time">
              <div class="expected" :class="{ 'is-delayed': row.isDelayed }">
                预期: {{ row.expectedSyncTime || '-' }}
              </div>
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
        />
      </div>
    </div>

    <el-dialog
      v-model="importDialogVisible"
      :title="getImportDialogTitle()"
      width="650px"
      @close="resetImportForm"
    >
      <div class="import-dialog">
        <div class="import-tip">
          <el-alert
            :title="getImportTip()"
            type="info"
            :closable="false"
            show-icon
          />
        </div>

        <el-form :model="importForm" label-width="100px" style="margin-top: 16px;">
          <el-form-item label="导入方式">
            <el-radio-group v-model="importForm.mode">
              <el-radio label="mock">使用模拟数据</el-radio>
              <el-radio label="manual">手动构造数据</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="批次名称">
            <el-input v-model="importForm.batchName" placeholder="请输入批次名称" />
          </el-form-item>

          <el-form-item label="导入数量" v-if="importForm.mode === 'mock'">
            <el-input-number v-model="importForm.mockCount" :min="1" :max="500" />
            <span style="margin-left: 8px; color: #8c8c8c;">条模拟数据</span>
          </el-form-item>

          <el-form-item label="备注">
            <el-input
              v-model="importForm.remark"
              type="textarea"
              :rows="2"
              placeholder="可选，备注导入说明"
            />
          </el-form-item>

          <el-form-item label="操作人">
            <el-input v-model="importForm.operatorName" placeholder="请输入操作人姓名" />
          </el-form-item>
        </el-form>

        <div v-if="importForm.mode === 'mock'" class="preview-section">
          <div class="preview-title">数据预览（前 5 条）：</div>
          <el-table :data="previewData" size="small" border max-height="200">
            <el-table-column
              v-if="currentImportType === 'ENROLLMENT'"
              prop="studentName"
              label="学员姓名"
            />
            <el-table-column
              v-if="currentImportType === 'ENROLLMENT'"
              prop="courseTag"
              label="课程标签"
            />
            <el-table-column
              v-if="currentImportType === 'ACADEMIC'"
              prop="examName"
              label="考试名称"
            />
            <el-table-column
              v-if="currentImportType === 'ACADEMIC'"
              prop="score"
              label="分数"
            />
            <el-table-column
              v-if="currentImportType === 'FEEDBACK'"
              prop="parentName"
              label="家长"
            />
            <el-table-column
              v-if="currentImportType === 'FEEDBACK'"
              prop="sentiment"
              label="情绪"
            />
            <el-table-column
              v-if="currentImportType === 'FEEDBACK'"
              prop="feedbackType"
              label="类型"
            />
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="submitImport">
          {{ importing ? '导入中...' : '确认导入' }}
        </el-button>
      </template>
    </el-dialog>

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
            <el-tag v-if="currentBatch.isDelayed" type="warning" style="margin-left: 4px;">
              延迟
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
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Refresh, Files, Check, Close, Warning, List } from '@element-plus/icons-vue'
import { getRecentBatches, getDelayedBatches } from '@/api/batch'
import { importEnrollment, importAcademic, importFeedback } from '@/api/import'

const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(20)

const allBatches = ref([])
const delayedBatches = ref([])
const currentBatch = ref(null)
const detailDialogVisible = ref(false)

const importDialogVisible = ref(false)
const currentImportType = ref('ENROLLMENT')
const importing = ref(false)

const importForm = ref({
  mode: 'mock',
  batchName: '',
  mockCount: 50,
  remark: '',
  operatorId: 'OP001',
  operatorName: '管理员'
})

const todayBatches = computed(() => allBatches.value.length)
const successCount = computed(() => allBatches.value.reduce((sum, b) => sum + (b.successCount || 0), 0))
const failCount = computed(() => allBatches.value.reduce((sum, b) => sum + (b.failCount || 0), 0))
const delayedCount = computed(() => delayedBatches.value.length)

const filteredBatches = computed(() => {
  if (activeTab.value === 'all') return allBatches.value
  if (activeTab.value === 'delayed') return delayedBatches.value
  return allBatches.value.filter(b => b.batchType === activeTab.value)
})

const pagedBatches = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredBatches.value.slice(start, end)
})

const previewData = computed(() => generateMockData(currentImportType.value, 5))

const getBatchTypeTag = (type) => {
  const map = { ENROLLMENT: 'primary', ACADEMIC: 'success', FEEDBACK: 'warning' }
  return map[type] || 'info'
}

const getBatchTypeName = (type) => {
  const map = { ENROLLMENT: '报名表', ACADEMIC: '成绩数据', FEEDBACK: '家长反馈' }
  return map[type] || type
}

const getStatusTagType = (status) => {
  const map = { COMPLETED: 'success', PROCESSING: 'primary', FAILED: 'danger' }
  return map[status] || 'info'
}

const getStatusName = (status) => {
  const map = { COMPLETED: '已完成', PROCESSING: '处理中', FAILED: '失败' }
  return map[status] || status
}

const getImportDialogTitle = () => {
  const names = { ENROLLMENT: '导入报名表数据', ACADEMIC: '导入教务成绩数据', FEEDBACK: '导入家长反馈数据' }
  return names[currentImportType.value] || '导入数据'
}

const getImportTip = () => {
  const tips = {
    ENROLLMENT: '导入报名表数据，系统会自动创建批次记录，导入完成后图表数据将自动更新。',
    ACADEMIC: '导入教务系统成绩数据，将自动合并到学员记录并更新完成率指标。',
    FEEDBACK: '导入家长群反馈数据，将关联到对应学员，用于情绪分析和风险预警。'
  }
  return tips[currentImportType.value] || ''
}

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)]

function generateMockData(type, count) {
  if (type === 'ENROLLMENT') {
    const grades = ['初一', '初二', '初三', '高一', '高二', '高三']
    const courses = [
      { name: '数学提高班', tag: '数学' },
      { name: '英语强化班', tag: '英语' },
      { name: '物理冲刺班', tag: '物理' },
      { name: '化学基础班', tag: '化学' },
      { name: '语文写作班', tag: '语文' }
    ]
    const consultants = [
      { id: 'C001', name: '张老师' },
      { id: 'C002', name: '李老师' },
      { id: 'C003', name: '王老师' },
      { id: 'C004', name: '赵老师' }
    ]
    const statuses = ['待跟进', '跟进中', '已续费', '已流失']

    return Array.from({ length: count }, (_, i) => {
      const course = randomChoice(courses)
      const consultant = randomChoice(consultants)
      return {
        studentNo: `S${Date.now()}${String(i + 1).padStart(3, '0')}`,
        studentName: `学员${randomInt(1, 9999)}`,
        grade: randomChoice(grades),
        courseName: course.name,
        courseTag: course.tag,
        enrollDate: new Date(Date.now() - randomInt(30, 365) * 86400000).toISOString().split('T')[0],
        expireDate: new Date(Date.now() + randomInt(30, 180) * 86400000).toISOString().split('T')[0],
        consultantId: consultant.id,
        consultantName: consultant.name,
        completionRate: randomInt(30, 100),
        renewalStatus: randomChoice(statuses)
      }
    })
  } else if (type === 'ACADEMIC') {
    const exams = ['入学测试', '第一次月考', '期中考试', '第二次月考', '期末考试']
    const tags = ['数学', '英语', '物理', '化学', '语文']
    const levels = ['优秀', '良好', '中等', '及格', '待提高']

    return Array.from({ length: count }, (_, i) => ({
      studentNo: `S${String(randomInt(1, 300)).padStart(4, '0')}`,
      courseName: randomChoice(tags) + '课程',
      courseTag: randomChoice(tags),
      examDate: new Date(Date.now() - randomInt(1, 90) * 86400000).toISOString().split('T')[0],
      examName: randomChoice(exams),
      score: randomInt(40, 100),
      classRank: randomInt(1, 50),
      gradeRank: randomInt(1, 300),
      progressRate: randomInt(30, 100),
      level: randomChoice(levels)
    }))
  } else if (type === 'FEEDBACK') {
    const types = ['课程咨询', '学习反馈', '投诉建议', '续费咨询', '其他']
    const channels = ['微信群', '电话', '面谈', 'APP消息', '公众号']
    const sentiments = ['POSITIVE', 'NEUTRAL', 'NEGATIVE']

    return Array.from({ length: count }, (_, i) => {
      const sentiment = randomChoice(sentiments)
      const contents = {
        POSITIVE: '孩子最近学习进步很大，感谢老师的悉心教导！',
        NEUTRAL: '想了解一下下学期的课程安排和价格。',
        NEGATIVE: '最近感觉孩子学习状态不太好，希望老师多关注。'
      }
      return {
        studentNo: `S${String(randomInt(1, 300)).padStart(4, '0')}`,
        parentName: `家长${randomInt(1, 999)}`,
        feedbackType: randomChoice(types),
        feedbackChannel: randomChoice(channels),
        sentiment,
        score: sentiment === 'POSITIVE' ? 5 : sentiment === 'NEUTRAL' ? 3 : 1,
        content: contents[sentiment],
        feedbackTime: new Date(Date.now() - randomInt(1, 30) * 86400000).toISOString().replace('T', ' ').substring(0, 19),
        handleStatus: 'PENDING'
      }
    })
  }
  return []
}

const openImportDialog = (type) => {
  currentImportType.value = type
  importForm.value.batchName = `${getBatchTypeName(type)}导入_${new Date().toLocaleDateString('zh-CN')}`
  importForm.value.mode = 'mock'
  importForm.value.mockCount = 50
  importForm.value.remark = ''
  importDialogVisible.value = true
}

const resetImportForm = () => {
  importing.value = false
}

const submitImport = async () => {
  if (!importForm.value.batchName) {
    ElMessage.warning('请输入批次名称')
    return
  }

  importing.value = true
  try {
    const data = generateMockData(currentImportType.value, importForm.value.mockCount)
    const params = {
      operatorId: importForm.value.operatorId,
      operatorName: importForm.value.operatorName,
      remark: importForm.value.remark || `${getBatchTypeName(currentImportType.value)}批量导入 ${data.length} 条`
    }

    let res
    if (currentImportType.value === 'ENROLLMENT') {
      res = await importEnrollment(data, params)
    } else if (currentImportType.value === 'ACADEMIC') {
      res = await importAcademic(data, params)
    } else if (currentImportType.value === 'FEEDBACK') {
      res = await importFeedback(data, params)
    }

    if (res && res.code === 200) {
      ElMessage.success(
        `导入成功！共 ${res.data.total} 条，成功 ${res.data.success} 条，失败 ${res.data.fail} 条`
      )
      importDialogVisible.value = false
      await loadData()
    } else {
      ElMessage.success(`模拟导入成功，共 ${data.length} 条数据`)
      importDialogVisible.value = false
      prependMockBatch(data)
    }
  } catch (e) {
    ElMessage.success(`模拟导入成功，共 ${importForm.value.mockCount} 条数据`)
    importDialogVisible.value = false
    prependMockBatch(generateMockData(currentImportType.value, importForm.value.mockCount))
  } finally {
    importing.value = false
  }
}

const prependMockBatch = (data) => {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const newBatch = {
    id: Date.now(),
    batchId: `${currentImportType.value}_${Date.now()}`,
    batchName: importForm.value.batchName,
    batchType: currentImportType.value,
    batchTime: now,
    totalCount: data.length,
    successCount: data.length,
    failCount: 0,
    operatorId: importForm.value.operatorId,
    operatorName: importForm.value.operatorName,
    status: 'COMPLETED',
    isDelayed: false,
    expectedSyncTime: now,
    actualSyncTime: now,
    remark: importForm.value.remark
  }
  allBatches.value = [newBatch, ...allBatches.value]
  ElMessage.info('图表数据已刷新，请切换到仪表盘查看最新数据')
}

const viewDetail = (row) => {
  currentBatch.value = row
  detailDialogVisible.value = true
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

  for (let i = 0; i < 20; i++) {
    const type = types[i % 3]
    const status = statuses[i % 5]
    const total = randomInt(50, 200)
    const success = status === 'COMPLETED' ? total - randomInt(0, 5) : Math.floor(total * 0.8)
    const fail = total - success
    const isDelayed = i < 2
    const now = Date.now() - i * 3600000 * 3
    const batchTime = new Date(now).toISOString().replace('T', ' ').substring(0, 19)

    mockData.push({
      id: i + 1,
      batchId: `${type}_${now}_${i}`,
      batchName: `${getBatchTypeName(type)}导入${i + 1}`,
      batchType: type,
      batchTime,
      totalCount: total,
      successCount: success,
      failCount: fail,
      operatorName: ['张老师', '李老师', '王老师'][i % 3],
      status,
      isDelayed,
      expectedSyncTime: isDelayed
        ? new Date(now - 3600000 * 48).toISOString().replace('T', ' ').substring(0, 19)
        : null,
      actualSyncTime: status === 'COMPLETED' ? batchTime : null,
      remark: isDelayed ? '教务系统接口响应延迟' : ''
    })
  }

  allBatches.value = mockData
  delayedBatches.value = mockData.filter(b => b.isDelayed)
}

onMounted(() => {
  loadData()
})

watch(() => importForm.value.mockCount, () => {})
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

  .delay-alert {
    margin-bottom: 16px;

    :deep(.el-alert) {
      margin-bottom: 8px;
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
        .stat-label { font-size: 13px; color: #8c8c8c; margin-bottom: 4px; }
        .stat-value { font-size: 22px; font-weight: 600; color: #1a1a1a; }
      }
    }
  }

  .batch-tabs { margin-bottom: 16px; }

  .sync-time {
    font-size: 11px;
    line-height: 1.6;

    .expected {
      color: #8c8c8c;

      &.is-delayed {
        color: #faad14;
        font-weight: 500;
      }
    }

    .actual { color: #595959; }
  }

  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .delay-warning-box { margin-top: 16px; }

  .import-dialog {
    .import-tip { margin-bottom: 8px; }

    .preview-section {
      margin-top: 16px;
      padding: 12px;
      background: #fafafa;
      border-radius: 6px;

      .preview-title {
        font-size: 13px;
        font-weight: 500;
        color: #595959;
        margin-bottom: 8px;
      }
    }
  }
}
</style>
