<template>
  <div class="analysis-page">
    <div class="page-header">
      <h2 class="page-title">数据分析区</h2>
      <el-radio-group v-model="activeTab" size="default">
        <el-radio-button value="tags">题目标签分布</el-radio-button>
        <el-radio-button value="funnel">学习进度漏斗</el-radio-button>
        <el-radio-button value="ranking">成绩反馈排行</el-radio-button>
        <el-radio-button value="rules">提醒规则变化</el-radio-button>
      </el-radio-group>
    </div>

    <div class="analysis-content">
      <div v-if="activeTab === 'tags'" class="tag-analysis">
        <div class="grid-2">
          <div class="card">
            <div class="card-title">
              <el-icon><PieChart /></el-icon>
              课程标签分布
            </div>
            <TagPieChart :data="tagDistribution" />
          </div>

          <div class="card">
            <div class="card-title">
              <el-icon><Histogram /></el-icon>
              各标签学员人数
            </div>
            <el-table :data="tagDistribution" stripe>
              <el-table-column prop="tag" label="标签" width="150" />
              <el-table-column prop="count" label="人数" width="120" />
              <el-table-column label="占比">
                <template #default="{ row }">
                  <el-progress
                    :percentage="getTagPercent(row.count)"
                    :show-text="false"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="card">
          <div class="card-title">
            <el-icon><TrendCharts /></el-icon>
            各标签平均完成率
          </div>
          <RankingBarChart
            :data="tagCompletionData"
            label-key="tag"
            value-key="completionRate"
            rank-key="rank"
            type="desc"
          />
        </div>
      </div>

      <div v-if="activeTab === 'funnel'" class="funnel-analysis">
        <div class="card">
          <div class="card-title">
            <el-icon><TrendCharts /></el-icon>
            学习进度漏斗分析
          </div>
          <ProgressFunnelChart :data="progressFunnel" />
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-title">
              <el-icon><Warning /></el-icon>
              进度落后学员 TOP20
            </div>
            <RankingBarChart
              :data="bottomProgress"
              label-key="studentNo"
              value-key="avgProgress"
              rank-key="rank"
              type="asc"
            />
          </div>

          <div class="card">
            <div class="card-title">
              <el-icon><UserFilled /></el-icon>
              各年级进度分布
            </div>
            <el-table :data="gradeProgressData" stripe>
              <el-table-column prop="grade" label="年级" width="120" />
              <el-table-column prop="count" label="人数" width="100" />
              <el-table-column label="平均完成率" width="200">
                <template #default="{ row }">
                  <el-progress
                    :percentage="Number(row.avgCompletion).toFixed(1)"
                    :color="getProgressColor(Number(row.avgCompletion))"
                  />
                </template>
              </el-table-column>
              <el-table-column label="落后占比">
                <el-tag type="danger" size="small">
                  {{ row.lowPercent?.toFixed?.(1) || 0 }}%
                </el-tag>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'ranking'" class="ranking-analysis">
        <div class="grid-2">
          <div class="card">
            <div class="card-title">
              <el-icon><Trophy /></el-icon>
              成绩排行榜 TOP20
            </div>
            <RankingBarChart
              :data="scoreRanking"
              label-key="studentNo"
              value-key="avgScore"
              rank-key="rank"
              type="desc"
            />
          </div>

          <div class="card">
            <div class="card-title">
              <el-icon><Bottom /></el-icon>
              进度落后榜 TOP20
            </div>
            <RankingBarChart
              :data="bottomProgress"
              label-key="studentNo"
              value-key="avgProgress"
              rank-key="rank"
              type="asc"
            />
          </div>
        </div>

        <div class="card">
          <div class="card-title">
            <el-icon><ChatDotRound /></el-icon>
            家长反馈情绪分布
          </div>
          <div class="feedback-stats grid-4">
            <div class="feedback-item">
              <div class="feedback-icon positive">😊</div>
              <div class="feedback-info">
                <div class="count">{{ feedbackStats.positive || 0 }}</div>
                <div class="label">正面反馈</div>
              </div>
            </div>
            <div class="feedback-item">
              <div class="feedback-icon neutral">😐</div>
              <div class="feedback-info">
                <div class="count">{{ feedbackStats.neutral || 0 }}</div>
                <div class="label">中性反馈</div>
              </div>
            </div>
            <div class="feedback-item">
              <div class="feedback-icon negative">😟</div>
              <div class="feedback-info">
                <div class="count">{{ feedbackStats.negative || 0 }}</div>
                <div class="label">负面反馈</div>
              </div>
            </div>
            <div class="feedback-item">
              <div class="feedback-icon pending">⏳</div>
              <div class="feedback-info">
                <div class="count">{{ feedbackStats.pending || 0 }}</div>
                <div class="label">待处理</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'rules'" class="rules-analysis">
        <div class="card">
          <div class="card-title">
            <el-icon><Clock /></el-icon>
            提醒规则变更时间线
          </div>
          <RuleChangeChart :data="ruleChanges" />
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-title">
              <el-icon><Setting /></el-icon>
              规则类型分布
            </div>
            <TagPieChart
              :data="ruleTypeStats"
              label-key="type"
              value-key="count"
            />
          </div>

          <div class="card">
            <div class="card-title">
              <el-icon><List /></el-icon>
              近期规则变更
            </div>
            <el-table :data="recentRuleChanges" size="small">
              <el-table-column prop="ruleName" label="规则名称" width="150" />
              <el-table-column prop="ruleType" label="类型" width="100" />
              <el-table-column prop="version" label="版本" width="140" />
              <el-table-column prop="operatorName" label="操作人" width="100" />
              <el-table-column prop="changeReason" label="变更原因" show-overflow-tooltip />
            </el-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PieChart, Histogram, TrendCharts, Warning, UserFilled,
         Trophy, Bottom, ChatDotRound, Clock, Setting, List } from '@element-plus/icons-vue'
import TagPieChart from '@/components/charts/TagPieChart.vue'
import ProgressFunnelChart from '@/components/charts/ProgressFunnelChart.vue'
import RankingBarChart from '@/components/charts/RankingBarChart.vue'
import RuleChangeChart from '@/components/charts/RuleChangeChart.vue'
import {
  getTagDistribution, getProgressFunnel, getScoreRanking, getBottomProgress
} from '@/api/dashboard'
import { getRecentChanges, getRuleTypeStats } from '@/api/rule'

const activeTab = ref('tags')

const tagDistribution = ref([])
const progressFunnel = ref([])
const scoreRanking = ref([])
const bottomProgress = ref([])
const ruleChanges = ref([])
const ruleTypeStats = ref([])
const recentRuleChanges = ref([])

const feedbackStats = ref({
  positive: 68,
  neutral: 24,
  negative: 12,
  pending: 15
})

const gradeProgressData = ref([
  { grade: '初一', count: 56, avgCompletion: 78.5, lowPercent: 12.5 },
  { grade: '初二', count: 62, avgCompletion: 72.3, lowPercent: 18.2 },
  { grade: '初三', count: 48, avgCompletion: 68.9, lowPercent: 22.8 },
  { grade: '高一', count: 55, avgCompletion: 75.6, lowPercent: 15.3 },
  { grade: '高二', count: 52, avgCompletion: 71.2, lowPercent: 19.6 },
  { grade: '高三', count: 45, avgCompletion: 65.8, lowPercent: 26.7 }
])

const tagTotal = computed(() => {
  return tagDistribution.value.reduce((sum, item) => sum + (item.count || 0), 0)
})

const tagCompletionData = computed(() => {
  const rates = {
    '数学': 78.5,
    '英语': 82.3,
    '物理': 71.6,
    '化学': 75.2,
    '语文': 85.7
  }
  return tagDistribution.value.map((item, index) => ({
    tag: item.tag,
    completionRate: rates[item.tag] || 70,
    rank: index + 1
  })).sort((a, b) => b.completionRate - a.completionRate)
    .map((item, index) => ({ ...item, rank: index + 1 }))
})

const getTagPercent = (count) => {
  if (!tagTotal.value) return 0
  return Number((count / tagTotal.value * 100).toFixed(1))
}

const getProgressColor = (rate) => {
  if (rate >= 90) return '#52c41a'
  if (rate >= 70) return '#1890ff'
  if (rate >= 50) return '#faad14'
  return '#f5222d'
}

const loadData = async () => {
  try {
    const [tagRes, funnelRes, scoreRes, bottomRes] = await Promise.all([
      getTagDistribution(),
      getProgressFunnel(),
      getScoreRanking(20),
      getBottomProgress(20)
    ])

    if (tagRes.code === 200) tagDistribution.value = tagRes.data
    if (funnelRes.code === 200) progressFunnel.value = funnelRes.data
    if (scoreRes.code === 200) scoreRanking.value = scoreRes.data
    if (bottomRes.code === 200) bottomProgress.value = bottomRes.data
  } catch (e) {
    console.warn('加载数据失败，使用模拟数据')
    loadMockData()
  }

  try {
    const [changesRes, typeRes] = await Promise.all([
      getRecentChanges(10),
      getRuleTypeStats()
    ])
    if (changesRes.code === 200) {
      recentRuleChanges.value = changesRes.data
      ruleChanges.value = changesRes.data
    }
    if (typeRes.code === 200) ruleTypeStats.value = typeRes.data
  } catch (e) {
    loadMockRuleData()
  }
}

const loadMockData = () => {
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

  scoreRanking.value = Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1,
    studentNo: `S${String(i + 1).padStart(3, '0')}`,
    avgScore: 95 - i * 1.5
  }))

  bottomProgress.value = Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1,
    studentNo: `S${String(100 + i).padStart(3, '0')}`,
    avgProgress: 45 + i * 1.2
  }))
}

const loadMockRuleData = () => {
  ruleChanges.value = [
    { id: 1, ruleName: '到期前30天提醒', ruleType: 'RENEWAL', version: '20240115.103000',
      operatorName: '系统管理员', changeReason: '优化提醒时机', createTime: '2024-01-15T10:30:00' },
    { id: 2, ruleName: '进度低于60%预警', ruleType: 'PROGRESS', version: '20240112.150000',
      operatorName: '李总监', changeReason: '调整阈值从70%到60%', createTime: '2024-01-12T15:00:00' },
    { id: 3, ruleName: '成绩下降提醒', ruleType: 'SCORE', version: '20240110.092000',
      operatorName: '王老师', changeReason: '新增成绩下降提醒规则', createTime: '2024-01-10T09:20:00' },
    { id: 4, ruleName: '家长负面反馈跟进', ruleType: 'FEEDBACK', version: '20240108.140000',
      operatorName: '张老师', changeReason: '新增负面反馈自动转工单', createTime: '2024-01-08T14:00:00' },
    { id: 5, ruleName: '到期前7天加急提醒', ruleType: 'RENEWAL', version: '20240105.110000',
      operatorName: '系统管理员', changeReason: '新增加急提醒规则', createTime: '2024-01-05T11:00:00' }
  ]

  ruleTypeStats.value = [
    { type: 'RENEWAL', count: 5 },
    { type: 'PROGRESS', count: 3 },
    { type: 'SCORE', count: 2 },
    { type: 'FEEDBACK', count: 2 }
  ]

  recentRuleChanges.value = ruleChanges.value
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.analysis-page {
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

  .analysis-content {
    .card {
      margin-bottom: 16px;
    }
  }

  .feedback-stats {
    padding: 20px 0;

    .feedback-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;

      .feedback-icon {
        font-size: 36px;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .feedback-info {
        .count {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .label {
          font-size: 13px;
          color: #8c8c8c;
        }
      }
    }
  }
}
</style>
