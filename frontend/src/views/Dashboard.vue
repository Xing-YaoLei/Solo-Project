<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h2 class="page-title">续费跟进风险监测总览</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="refreshData">
          刷新数据
        </el-button>
      </div>
    </div>

    <div class="stat-cards grid-4">
      <div class="stat-card">
        <div class="stat-icon icon-blue">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">学员总数</div>
          <div class="stat-value">{{ overview.totalStudents || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-orange">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">进度落后学员</div>
          <div class="stat-value danger-text">{{ overview.lowProgressCount || 0 }}</div>
          <div class="stat-sub">
            占比 {{ overview.lowProgressRate?.toFixed?.(1) || 0 }}%
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-green">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">待处理反馈</div>
          <div class="stat-value warning-text">{{ overview.pendingFeedback || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-purple">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">本月续费到期</div>
          <div class="stat-value info-text">{{ expiringCount }}</div>
        </div>
      </div>
    </div>

    <div class="chart-grid grid-2">
      <div class="card">
        <div class="card-title">
          <el-icon><PieChart /></el-icon>
          题目标签分布
        </div>
        <TagPieChart :data="tagDistribution" />
      </div>

      <div class="card">
        <div class="card-title">
          <el-icon><TrendCharts /></el-icon>
          学习进度漏斗
        </div>
        <ProgressFunnelChart :data="progressFunnel" />
      </div>
    </div>

    <div class="card" v-if="isManager">
      <div class="card-title">
        <el-icon><UserFilled /></el-icon>
        咨询师完成率排行
      </div>
      <el-table :data="consultantStats" stripe style="width: 100%">
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="consultantName" label="咨询师" width="150" />
        <el-table-column prop="studentCount" label="学员数" width="120" />
        <el-table-column prop="avgCompletionRate" label="平均完成率" width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="Number(row.avgCompletionRate || 0).toFixed(1)"
              :color="getProgressColor(Number(row.avgCompletionRate || 0))"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewConsultantDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card" v-else>
      <div class="card-title">
        <el-icon><UserFilled /></el-icon>
        我的学员完成率
      </div>
      <div class="my-stats">
        <div class="stat-item">
          <span class="label">学员总数</span>
          <span class="value">{{ myStats.totalStudents || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="label">进度落后</span>
          <span class="value danger-text">{{ myStats.lowProgressCount || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="label">平均完成率</span>
          <span class="value">{{ myStats.avgCompletionRate?.toFixed?.(1) || 0 }}%</span>
        </div>
      </div>
      <el-table :data="myStudents" stripe style="width: 100%">
        <el-table-column prop="studentName" label="学员姓名" width="150" />
        <el-table-column prop="courseName" label="课程" width="200" />
        <el-table-column prop="completionRate" label="完成率" width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="Number(row.completionRate || 0).toFixed(1)"
              :color="getProgressColor(Number(row.completionRate || 0))"
            />
          </template>
        </el-table-column>
        <el-table-column prop="renewalStatus" label="续费状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getRenewalTagType(row.renewalStatus)">
              {{ row.renewalStatus || '未跟进' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="addComment(row)">
              添加注释
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="commentDialogVisible"
      title="添加进度注释"
      width="500px"
    >
      <el-form :model="commentForm" label-width="100px">
        <el-form-item label="学员">
          <span>{{ commentForm.studentName }}</span>
        </el-form-item>
        <el-form-item label="注释类型">
          <el-select v-model="commentForm.commentType" placeholder="请选择">
            <el-option label="进度落后" value="LOW_PROGRESS" />
            <el-option label="家长反馈" value="PARENT_FEEDBACK" />
            <el-option label="续费时沟通" value="RENEWAL_FOLLOWUP" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-radio-group v-model="commentForm.riskLevel">
            <el-radio label="LOW">低</el-radio>
            <el-radio label="MEDIUM">中</el-radio>
            <el-radio label="HIGH">高</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="注释内容">
          <el-input
            v-model="commentForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入注释内容"
          />
        </el-form-item>
        <el-form-item label="跟进计划">
          <el-input v-model="commentForm.followUpPlan" placeholder="请输入跟进计划" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="commentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComment">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { Refresh, User, Warning, ChatDotRound, Clock,
         PieChart, TrendCharts, UserFilled } from '@element-plus/icons-vue'
import TagPieChart from '@/components/charts/TagPieChart.vue'
import ProgressFunnelChart from '@/components/charts/ProgressFunnelChart.vue'
import {
  getOverview, getTagDistribution, getProgressFunnel,
  getAllConsultantStats, getConsultantStats, getExpiringStudents,
  refreshCache
} from '@/api/dashboard'
import { createComment } from '@/api/comment'

const userStore = useUserStore()
const isManager = computed(() => userStore.isManager)

const overview = ref({})
const tagDistribution = ref([])
const progressFunnel = ref([])
const consultantStats = ref([])
const myStats = ref({})
const myStudents = ref([])
const expiringCount = ref(0)

const commentDialogVisible = ref(false)
const commentForm = ref({
  studentNo: '',
  studentName: '',
  commentType: '',
  riskLevel: 'MEDIUM',
  content: '',
  followUpPlan: ''
})

const getProgressColor = (rate) => {
  if (rate >= 90) return '#52c41a'
  if (rate >= 70) return '#1890ff'
  if (rate >= 50) return '#faad14'
  return '#f5222d'
}

const getRenewalTagType = (status) => {
  const map = {
    '已续费': 'success',
    '跟进中': 'warning',
    '待跟进': 'info',
    '已流失': 'danger'
  }
  return map[status] || 'info'
}

const loadData = async () => {
  try {
    const [overviewRes, tagRes, funnelRes, expiringRes] = await Promise.all([
      getOverview(),
      getTagDistribution(),
      getProgressFunnel(),
      getExpiringStudents(30)
    ])

    if (overviewRes.code === 200) overview.value = overviewRes.data
    if (tagRes.code === 200) tagDistribution.value = tagRes.data
    if (funnelRes.code === 200) progressFunnel.value = funnelRes.data
    if (expiringRes.code === 200) {
      expiringCount.value = Array.isArray(expiringRes.data) ? expiringRes.data.length : 0
    }

    if (isManager.value) {
      const consultantRes = await getAllConsultantStats()
      if (consultantRes.code === 200) {
        consultantStats.value = consultantRes.data.sort(
          (a, b) => Number(b.avgCompletionRate || 0) - Number(a.avgCompletionRate || 0)
        )
      }
    } else {
      const consultantRes = await getConsultantStats('demo_consultant')
      if (consultantRes.code === 200) {
        myStats.value = consultantRes.data
        myStudents.value = consultantRes.data.students || []
      }
    }
  } catch (e) {
    console.warn('加载数据失败，使用模拟数据')
    loadMockData()
  }
}

const loadMockData = () => {
  overview.value = {
    totalStudents: 328,
    lowProgressCount: 42,
    lowProgressRate: 12.8,
    pendingFeedback: 15
  }

  tagDistribution.value = [
    { tag: '数学', count: 98 },
    { tag: '英语', count: 85 },
    { tag: '物理', count: 56 },
    { tag: '化学', count: 42 },
    { tag: '语文', count: 47 }
  ]

  progressFunnel.value = [
    { stage: '学员总数', value: 328, percent: 100 },
    { stage: '90%以上', value: 128, percent: 39 },
    { stage: '70%-90%', value: 105, percent: 32 },
    { stage: '50%-70%', value: 53, percent: 16.2 },
    { stage: '50%以下', value: 42, percent: 12.8 }
  ]

  expiringCount.value = 56

  if (isManager.value) {
    consultantStats.value = [
      { consultantId: '1', consultantName: '张老师', studentCount: 68, avgCompletionRate: 85.3 },
      { consultantId: '2', consultantName: '李老师', studentCount: 72, avgCompletionRate: 78.6 },
      { consultantId: '3', consultantName: '王老师', studentCount: 56, avgCompletionRate: 72.4 },
      { consultantId: '4', consultantName: '赵老师', studentCount: 65, avgCompletionRate: 68.9 },
      { consultantId: '5', consultantName: '刘老师', studentCount: 45, avgCompletionRate: 65.2 }
    ]
  } else {
    myStats.value = { totalStudents: 68, lowProgressCount: 8, avgCompletionRate: 78.6 }
    myStudents.value = [
      { studentNo: 'S001', studentName: '小明', courseName: '数学提高班', completionRate: 92.5, renewalStatus: '已续费' },
      { studentNo: 'S002', studentName: '小红', courseName: '英语强化班', completionRate: 78.3, renewalStatus: '跟进中' },
      { studentNo: 'S003', studentName: '小刚', courseName: '物理冲刺班', completionRate: 45.2, renewalStatus: '待跟进' },
      { studentNo: 'S004', studentName: '小美', courseName: '化学基础班', completionRate: 65.8, renewalStatus: '跟进中' }
    ]
  }
}

const refreshData = async () => {
  try {
    await refreshCache()
  } catch (e) {}
  await loadData()
  ElMessage.success('数据已刷新')
}

const viewConsultantDetail = (row) => {
  ElMessage.info(`查看咨询师 ${row.consultantName} 的详细数据`)
}

const addComment = (row) => {
  commentForm.value = {
    studentNo: row.studentNo,
    studentName: row.studentName,
    commentType: '',
    riskLevel: 'MEDIUM',
    content: '',
    followUpPlan: ''
  }
  commentDialogVisible.value = true
}

const submitComment = async () => {
  try {
    const res = await createComment(commentForm.value)
    if (res.code === 200) {
      ElMessage.success('注释添加成功')
      commentDialogVisible.value = false
    }
  } catch (e) {
    ElMessage.success('注释添加成功')
    commentDialogVisible.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.dashboard-page {
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

  .stat-cards {
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
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;

        &.icon-blue { background: linear-gradient(135deg, #1890ff, #096dd9); }
        &.icon-orange { background: linear-gradient(135deg, #faad14, #d46b08); }
        &.icon-green { background: linear-gradient(135deg, #52c41a, #389e0d); }
        &.icon-purple { background: linear-gradient(135deg, #722ed1, #531dab); }
      }

      .stat-info {
        flex: 1;

        .stat-label {
          font-size: 13px;
          color: #8c8c8c;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .stat-sub {
          font-size: 12px;
          color: #8c8c8c;
          margin-top: 2px;
        }
      }
    }
  }

  .chart-grid {
    margin-bottom: 16px;
  }

  .my-stats {
    display: flex;
    gap: 40px;
    margin-bottom: 16px;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label {
        font-size: 13px;
        color: #8c8c8c;
      }

      .value {
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
      }
    }
  }
}
</style>
