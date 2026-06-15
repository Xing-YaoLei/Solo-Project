<template>
  <div class="funnel-dashboard">
    <div class="summary-section">
      <el-card class="summary-card" shadow="hover">
        <div class="card-value">{{ summary.totalEnrollments }}</div>
        <div class="card-label">总报名数</div>
      </el-card>
      <el-card class="summary-card" shadow="hover">
        <div class="card-value card-value--renewed">{{ summary.renewedCount }}</div>
        <div class="card-label">已续费</div>
      </el-card>
      <el-card class="summary-card" shadow="hover">
        <div class="card-value card-value--lost">{{ summary.lostCount }}</div>
        <div class="card-label">已流失</div>
      </el-card>
      <el-card class="summary-card" shadow="hover">
        <div class="card-value card-value--rate">{{ summary.renewalRate }}%</div>
        <div class="card-label">续费率</div>
      </el-card>
      <el-card class="summary-card" shadow="hover">
        <div class="card-value card-value--rate">{{ summary.completionRate }}%</div>
        <div class="card-label">完课率</div>
      </el-card>
    </div>

    <div class="chart-section">
      <el-card shadow="never">
        <template #header>
          <span class="section-title">续费漏斗</span>
        </template>
        <div ref="funnelRef" class="funnel-chart-container"></div>
      </el-card>
    </div>

    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="报名明细" name="details">
        <el-card shadow="never">
          <template #header>
            <div class="detail-header">
              <span class="section-title">报名明细</span>
              <el-select
                v-model="selectedStage"
                placeholder="筛选阶段"
                clearable
                style="width: 180px"
                @change="fetchDetails"
              >
                <el-option
                  v-for="(label, key) in stageLabels"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </div>
          </template>
          <el-table :data="details" stripe style="width: 100%">
            <el-table-column prop="studentName" label="学员姓名" />
            <el-table-column prop="courseName" label="课程名称" />
            <el-table-column prop="currentStage" label="当前阶段">
              <template #default="{ row }">
                <el-tag :type="stageTagType(row.currentStage)">
                  {{ stageLabels[row.currentStage] || row.currentStage }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="completionRate" label="完课率">
              <template #default="{ row }">
                {{ row.completionRate }}%
              </template>
            </el-table-column>
            <el-table-column prop="daysToExpire" label="距到期天数">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.daysToExpire <= 7 }">{{ row.daysToExpire }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="latestScore" label="最近成绩" />
            <el-table-column label="成绩趋势" width="100">
              <template #default="{ row }">
                <el-button size="small" type="primary" link @click="showScoreChart(row.enrollmentId)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="成绩反馈" name="score">
        <el-card shadow="never" v-if="selectedEnrollmentId">
          <template #header>
            <div class="detail-header">
              <span class="section-title">成绩趋势</span>
              <el-button size="small" @click="selectedEnrollmentId = null">关闭</el-button>
            </div>
          </template>
          <ScoreChart :enrollment-id="selectedEnrollmentId" />
        </el-card>
        <el-empty v-else description="请在报名明细中点击[查看]查看学员成绩趋势" />
      </el-tab-pane>

      <el-tab-pane label="提醒规则" name="reminder">
        <ReminderRulePanel />
      </el-tab-pane>

      <el-tab-pane label="课程章节" name="chapter">
        <ChapterProgressChart />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as d3 from 'd3'
import request from '../api/index.js'
import ScoreChart from '../components/ScoreChart.vue'
import ReminderRulePanel from '../components/ReminderRulePanel.vue'
import ChapterProgressChart from '../components/ChapterProgressChart.vue'

const stageLabels = {
  in_course: '在课中',
  near_expire: '即将到期',
  reminded: '已提醒',
  negotiating: '沟通中',
  renewed: '已续费',
  lost: '已流失',
}

const funnelRef = ref(null)
const summary = ref({
  totalEnrollments: 0,
  renewedCount: 0,
  lostCount: 0,
  renewalRate: 0,
  completionRate: 0,
})
const stages = ref([])
const details = ref([])
const selectedStage = ref('')
const activeTab = ref('details')
const selectedEnrollmentId = ref(null)

const stageTagType = (stage) => {
  const map = {
    in_course: '',
    near_expire: 'warning',
    reminded: 'danger',
    negotiating: 'warning',
    renewed: 'success',
    lost: 'danger',
  }
  return map[stage] || 'info'
}

const showScoreChart = (enrollmentId) => {
  selectedEnrollmentId.value = enrollmentId
  activeTab.value = 'score'
}

const fetchDashboard = async () => {
  try {
    const res = await request.get('/funnel/dashboard')
    summary.value = res.summary
    stages.value = res.stages
    await nextTick()
    renderFunnel()
  } catch (e) {
    console.error(e)
  }
}

const fetchDetails = async () => {
  try {
    const params = {}
    if (selectedStage.value) {
      params.stage = selectedStage.value
    }
    const res = await request.get('/funnel/details', { params })
    details.value = res
  } catch (e) {
    console.error(e)
  }
}

const renderFunnel = () => {
  if (!funnelRef.value || !stages.value.length) return

  d3.select(funnelRef.value).selectAll('*').remove()

  const containerWidth = funnelRef.value.clientWidth
  const barHeight = 52
  const gap = 12
  const labelWidth = 90
  const margin = { top: 10, right: 40, bottom: 10, left: labelWidth }
  const width = containerWidth - margin.left - margin.right
  const height = stages.value.length * (barHeight + gap)

  const maxCount = d3.max(stages.value, (d) => d.count) || 1

  const colorScale = d3
    .scaleLinear()
    .domain([0, stages.value.length - 1])
    .range(['#409EFF', '#F56C6C'])

  const svg = d3
    .select(funnelRef.value)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const xScale = d3.scaleLinear().domain([0, maxCount]).range([0, width])

  const barGroup = svg
    .selectAll('.bar-group')
    .data(stages.value)
    .enter()
    .append('g')
    .attr('class', 'bar-group')
    .attr('transform', (d, i) => `translate(0,${i * (barHeight + gap)})`)

  barGroup
    .append('text')
    .attr('x', -10)
    .attr('y', barHeight / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#303133')
    .attr('font-size', '13px')
    .text((d) => stageLabels[d.stage] || d.stage)

  barGroup
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', (d) => xScale(d.count))
    .attr('height', barHeight)
    .attr('rx', 6)
    .attr('fill', (d, i) => colorScale(i))

  barGroup
    .append('text')
    .attr('x', (d) => xScale(d.count) + 8)
    .attr('y', barHeight / 2 - 8)
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#606266')
    .attr('font-size', '13px')
    .attr('font-weight', '600')
    .text((d) => d.count)

  barGroup
    .append('text')
    .attr('x', (d) => xScale(d.count) + 8)
    .attr('y', barHeight / 2 + 10)
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#909399')
    .attr('font-size', '12px')
    .text((d, i) => {
      if (i === 0) return ''
      const prev = stages.value[i - 1].count
      if (prev === 0) return ''
      const rate = ((d.count / prev) * 100).toFixed(1)
      return `转化率 ${rate}%`
    })
}

onMounted(() => {
  fetchDashboard()
  fetchDetails()
})
</script>

<style scoped>
.funnel-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.summary-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.summary-card {
  flex: 1;
  min-width: 140px;
  text-align: center;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.card-value--renewed {
  color: #67C23A;
}

.card-value--lost {
  color: #F56C6C;
}

.card-value--rate {
  color: #409EFF;
}

.card-label {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

.chart-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.funnel-chart-container {
  width: 100%;
  min-height: 200px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-danger {
  color: #F56C6C;
  font-weight: 600;
}

.detail-tabs {
  margin-top: 16px;
}

.detail-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}
</style>
