<template>
  <div class="review-material">
    <h2 class="page-title">复查素材</h2>

    <el-card shadow="never" class="generate-card">
      <template #header>
        <span class="section-title">生成复查素材</span>
      </template>
      <div class="generate-form">
        <div class="form-row">
          <span class="form-label">统计周期：</span>
          <el-date-picker
            v-model="periodRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            size="large"
            style="width: 360px"
          />
        </div>
        <div class="form-row">
          <span class="form-label">创建人：</span>
          <el-input v-model="createdBy" placeholder="请输入创建人" size="large" style="width: 200px" />
        </div>
        <el-button type="primary" size="large" @click="generateReview" :loading="generating">
          生成素材
        </el-button>
      </div>
    </el-card>

    <div class="filter-bar">
      <el-tabs v-model="statusFilter" type="card" @tab-change="fetchReviews">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="草稿" name="draft" />
        <el-tab-pane label="已发布" name="published" />
      </el-tabs>
    </div>

    <div class="review-list">
      <el-card
        v-for="item in reviews"
        :key="item.id"
        shadow="hover"
        class="review-card"
      >
        <div class="review-summary" @click="toggleExpand(item.id)">
          <div class="summary-main">
            <div class="review-title">{{ item.title }}</div>
            <div class="review-period">{{ item.periodStart }} 至 {{ item.periodEnd }}</div>
          </div>
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-value">{{ item.totalEnrollments }}</span>
              <span class="stat-label">总报名</span>
            </div>
            <div class="stat-item">
              <span class="stat-value stat-value--renewed">{{ item.renewedCount }}</span>
              <span class="stat-label">已续费</span>
            </div>
            <div class="stat-item">
              <span class="stat-value stat-value--lost">{{ item.lostCount }}</span>
              <span class="stat-label">已流失</span>
            </div>
            <div class="stat-item">
              <span class="stat-value stat-value--rate">{{ item.overallCompletionRate }}%</span>
              <span class="stat-label">完课率</span>
            </div>
          </div>
          <div class="expand-hint">
            <el-icon :class="{ 'is-expanded': expandedIds.has(item.id) }">
              <ArrowRight />
            </el-icon>
          </div>
        </div>

        <el-collapse-transition>
          <div v-show="expandedIds.has(item.id)" class="review-detail">
            <el-divider />

            <div class="detail-section">
              <h4 class="detail-heading">关键发现</h4>
              <div class="detail-text">{{ item.keyFindings }}</div>
            </div>

            <div class="detail-section">
              <h4 class="detail-heading">行动建议</h4>
              <div class="detail-text">{{ item.actionItems }}</div>
            </div>

            <div class="detail-section">
              <h4 class="detail-heading">异常摘要</h4>
              <div v-if="parseJson(item.anomalySummary).length" class="anomaly-list">
                <div
                  v-for="(anomaly, idx) in parseJson(item.anomalySummary)"
                  :key="idx"
                  class="anomaly-item"
                >
                  <el-tag type="warning" size="small">规则{{ anomaly.ruleId }}</el-tag>
                  <span class="anomaly-desc">
                    学员#{{ anomaly.enrollmentId }} 实际值{{ anomaly.actualValue }}
                    <template v-if="anomaly.remark"> — 备注: {{ anomaly.remark }}</template>
                    <template v-if="anomaly.operator"> ({{ anomaly.operator }})</template>
                  </span>
                </div>
              </div>
              <div v-else class="detail-text">{{ item.anomalySummary }}</div>
            </div>

            <div class="detail-section">
              <h4 class="detail-heading">漏斗摘要</h4>
              <div v-if="parseJson(item.funnelSummary).length" class="funnel-list">
                <div
                  v-for="(step, idx) in parseJson(item.funnelSummary)"
                  :key="idx"
                  class="funnel-step"
                >
                  <span class="funnel-stage">{{ step.stage || step.name || `阶段${idx + 1}` }}</span>
                  <span class="funnel-count">{{ step.count || step.value || '-' }}</span>
                  <span v-if="step.rate || step.conversionRate" class="funnel-rate">
                    转化率 {{ step.rate || step.conversionRate }}%
                  </span>
                </div>
              </div>
              <div v-else class="detail-text">{{ item.funnelSummary }}</div>
            </div>

            <div v-if="item.status === 'draft'" class="detail-actions">
              <el-button type="success" @click="publishReview(item)">
                发布
              </el-button>
            </div>
          </div>
        </el-collapse-transition>
      </el-card>

      <el-empty v-if="!reviews.length" description="暂无复查素材" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import request from '../api/index.js'

const periodRange = ref(null)
const createdBy = ref('')
const generating = ref(false)
const statusFilter = ref('all')
const reviews = ref([])
const expandedIds = ref(new Set())

const toggleExpand = (id) => {
  const next = new Set(expandedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  expandedIds.value = next
}

const parseJson = (val) => {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed
      if (parsed.details && Array.isArray(parsed.details)) return parsed.details
      if (typeof parsed === 'object' && parsed !== null) return Object.entries(parsed).map(([key, value]) => ({ stage: key, count: value }))
      return []
    } catch {
      return []
    }
  }
  return []
}

const fetchReviews = async () => {
  try {
    const params = {}
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }
    const res = await request.get('/review', { params })
    reviews.value = res || []
  } catch (e) {
    ElMessage.error('获取复查素材失败')
  }
}

const generateReview = async () => {
  if (!periodRange.value || !periodRange.value.length) {
    ElMessage.warning('请选择统计周期')
    return
  }
  generating.value = true
  try {
    await request.post('/review/generate', {
      periodStart: periodRange.value[0],
      periodEnd: periodRange.value[1],
      createdBy: createdBy.value,
    })
    ElMessage.success('素材生成成功')
    fetchReviews()
  } catch (e) {
    ElMessage.error('素材生成失败')
  } finally {
    generating.value = false
  }
}

const publishReview = async (item) => {
  try {
    await request.post(`/review/${item.id}/publish`)
    ElMessage.success('发布成功')
    fetchReviews()
  } catch (e) {
    ElMessage.error('发布失败')
  }
}

onMounted(() => {
  fetchReviews()
})
</script>

<style scoped>
.review-material {
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 20px;
}

.generate-card {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.generate-form {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-label {
  font-size: 15px;
  color: #606266;
  white-space: nowrap;
}

.filter-bar {
  margin-bottom: 20px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  cursor: pointer;
}

.review-summary {
  display: flex;
  align-items: center;
  gap: 24px;
}

.summary-main {
  flex: 1;
  min-width: 0;
}

.review-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.review-period {
  font-size: 14px;
  color: #909399;
}

.summary-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.stat-value--renewed {
  color: #67C23A;
}

.stat-value--lost {
  color: #F56C6C;
}

.stat-value--rate {
  color: #409EFF;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.expand-hint {
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.expand-hint .el-icon {
  transition: transform 0.3s;
  color: #C0C4CC;
  font-size: 16px;
}

.expand-hint .is-expanded {
  transform: rotate(90deg);
}

.review-detail {
  padding-top: 4px;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-heading {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
}

.detail-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.7;
  white-space: pre-wrap;
}

.anomaly-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.anomaly-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.anomaly-desc {
  font-size: 14px;
  color: #606266;
}

.funnel-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.funnel-step {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #606266;
}

.funnel-stage {
  min-width: 80px;
  font-weight: 500;
}

.funnel-count {
  min-width: 50px;
}

.funnel-rate {
  color: #409EFF;
  font-weight: 500;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}
</style>
