<template>
  <div class="page-container">
    <div class="risk-summary">
      <div class="summary-card" style="border-left: 4px solid #E74C3C;">
        <div class="summary-dot risk-dot risk-dot-high" />
        <div class="summary-info">
          <div class="summary-value" style="color: #E74C3C;">{{ riskStore.highRiskCount }}</div>
          <div class="summary-label">高风险</div>
        </div>
      </div>
      <div class="summary-card" style="border-left: 4px solid #F39C12;">
        <div class="summary-dot risk-dot risk-dot-medium" />
        <div class="summary-info">
          <div class="summary-value" style="color: #F39C12;">{{ riskStore.mediumRiskCount }}</div>
          <div class="summary-label">中风险</div>
        </div>
      </div>
      <div class="summary-card" style="border-left: 4px solid #F1C40F;">
        <div class="summary-dot risk-dot risk-dot-low" />
        <div class="summary-info">
          <div class="summary-value" style="color: #F1C40F;">{{ riskStore.lowRiskCount }}</div>
          <div class="summary-label">低风险</div>
        </div>
      </div>
    </div>

    <div class="card-section">
      <div class="filter-bar">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索学员、教材或原因"
          clearable
          style="width: 260px;"
          @update:value="onSearchChange"
        >
          <template #prefix>
            <span>🔍</span>
          </template>
        </n-input>
        <n-button-group>
          <n-button
            :type="levelFilter === null ? 'primary' : 'default'"
            @click="riskStore.setLevelFilter(null); riskStore.fetchRiskRecords()"
          >
            全部
          </n-button>
          <n-button
            :type="levelFilter === 'high' ? 'primary' : 'default'"
            @click="riskStore.setLevelFilter('high'); riskStore.fetchRiskRecords()"
          >
            <span class="risk-dot risk-dot-high" style="margin-right: 4px;" /> 高风险
          </n-button>
          <n-button
            :type="levelFilter === 'medium' ? 'primary' : 'default'"
            @click="riskStore.setLevelFilter('medium'); riskStore.fetchRiskRecords()"
          >
            <span class="risk-dot risk-dot-medium" style="margin-right: 4px;" /> 中风险
          </n-button>
          <n-button
            :type="levelFilter === 'low' ? 'primary' : 'default'"
            @click="riskStore.setLevelFilter('low'); riskStore.fetchRiskRecords()"
          >
            <span class="risk-dot risk-dot-low" style="margin-right: 4px;" /> 低风险
          </n-button>
        </n-button-group>
      </div>

      <n-spin v-if="riskStore.loading" style="display:flex;justify-content:center;padding:40px;" />

      <div v-else class="risk-list">
        <div
          v-for="record in riskStore.filteredRiskRecords"
          :key="record.id"
          class="risk-row"
          @click="openDrawer(record)"
        >
          <div class="risk-level-indicator">
            <span :class="getRiskDotClass(record.risk_level)" />
          </div>
          <div class="risk-main">
            <div class="risk-top-row">
              <span class="risk-student">{{ record.student_name }}</span>
              <n-tag :type="getLevelTagType(record.risk_level)" size="small">{{ record.risk_level_display }}</n-tag>
            </div>
            <div class="risk-material">{{ record.material_title }}</div>
            <div class="risk-reason">{{ record.reason }}</div>
          </div>
          <div class="risk-meta">
            <div class="risk-date">{{ formatDate(record.created_at) }}</div>
          </div>
        </div>
      </div>
      <n-empty v-if="riskStore.filteredRiskRecords.length === 0 && !riskStore.loading" description="暂无风险记录" />
    </div>

    <n-drawer
      v-model:show="showDrawer"
      :width="640"
      placement="right"
    >
      <n-drawer-content :title="riskStore.riskDetail ? `${riskStore.riskDetail.student_name || getStudentName()} - 风险详情` : '风险详情'">
        <n-spin v-if="riskStore.loading && !riskStore.riskDetail" style="display:flex;justify-content:center;padding:60px;" />
        <template v-if="riskStore.riskDetail">
          <div class="drawer-section">
            <div class="drawer-section-title">基本信息</div>
            <n-descriptions bordered :column="2" label-placement="left" size="small">
              <n-descriptions-item label="学员">{{ getStudentName() }}</n-descriptions-item>
              <n-descriptions-item label="教材">{{ getMaterialTitle() }}</n-descriptions-item>
              <n-descriptions-item label="风险等级">
                <div class="risk-badge">
                  <span :class="getRiskDotClass(riskStore.riskDetail.risk_level)" />
                  <span :style="{ color: getRiskColor(riskStore.riskDetail.risk_level) }">{{ riskStore.riskDetail.risk_level_display }}风险</span>
                </div>
              </n-descriptions-item>
              <n-descriptions-item label="发现日期">{{ formatDate(riskStore.riskDetail.created_at) }}</n-descriptions-item>
              <n-descriptions-item label="风险原因" :span="2">{{ riskStore.riskDetail.reason }}</n-descriptions-item>
            </n-descriptions>
          </div>

          <div class="drawer-section">
            <div class="drawer-section-title">沟通记录</div>
            <n-timeline v-if="riskStore.riskDetail.communications.length > 0">
              <n-timeline-item
                v-for="comm in riskStore.riskDetail.communications"
                :key="comm.id"
                :type="getCommTimelineType(comm.comm_type)"
                :title="`${comm.comm_type_display} - ID:${comm.created_by || '系统'}`"
              >
                <div class="comm-content">{{ comm.content }}</div>
                <div class="comm-date">{{ formatDateTime(comm.created_at) }}</div>
              </n-timeline-item>
            </n-timeline>
            <n-empty v-else description="暂无沟通记录" size="small" />

            <div class="add-form">
              <n-button size="small" type="primary" @click="showCommForm = !showCommForm">
                {{ showCommForm ? '收起' : '添加沟通记录' }}
              </n-button>
              <div v-if="showCommForm" class="form-content">
                <n-form :model="commForm" label-placement="left" label-width="80" size="small">
                  <n-form-item label="沟通方式">
                    <n-select v-model:value="commForm.commType" :options="commTypeOptions" />
                  </n-form-item>
                  <n-form-item label="沟通内容">
                    <n-input v-model:value="commForm.content" type="textarea" :rows="3" />
                  </n-form-item>
                  <n-button type="primary" size="small" :loading="submittingComm" @click="addCommunication">提交</n-button>
                </n-form>
              </div>
            </div>
          </div>

          <div class="drawer-section">
            <div class="drawer-section-title">复核结论</div>
            <div v-if="riskStore.riskDetail.review_conclusions.length > 0">
              <div
                v-for="review in riskStore.riskDetail.review_conclusions"
                :key="review.id"
                class="review-item"
              >
                <div class="review-header">
                  <span class="reviewer">{{ review.reviewer_name || '复核人' }}</span>
                  <span class="review-date">{{ formatDate(review.created_at) }}</span>
                </div>
                <div class="review-conclusion">{{ review.conclusion }}</div>
              </div>
            </div>
            <n-empty v-else description="暂无复核结论" size="small" />

            <div class="add-form">
              <n-button size="small" type="primary" @click="showReviewForm = !showReviewForm">
                {{ showReviewForm ? '收起' : '添加复核结论' }}
              </n-button>
              <div v-if="showReviewForm" class="form-content">
                <n-form :model="reviewForm" label-placement="left" label-width="80" size="small">
                  <n-form-item label="结论">
                    <n-input v-model:value="reviewForm.conclusion" type="textarea" :rows="3" />
                  </n-form-item>
                  <n-button type="primary" size="small" :loading="submittingReview" @click="addReviewConclusion">提交</n-button>
                </n-form>
              </div>
            </div>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import type { RiskRecordList, RiskLevel } from '~/types'

const riskStore = useRiskStore()

onMounted(async () => {
  await riskStore.init()
})

const searchQuery = computed({
  get: () => riskStore.searchQuery,
  set: (v: string) => riskStore.setSearchQuery(v),
})

const levelFilter = computed(() => riskStore.levelFilter)

const showDrawer = ref(false)
const showCommForm = ref(false)
const showReviewForm = ref(false)
const submittingComm = ref(false)
const submittingReview = ref(false)

const commForm = reactive({
  commType: 'phone' as 'phone' | 'email' | 'in_person' | 'online',
  content: '',
})

const reviewForm = reactive({
  conclusion: '',
})

const commTypeOptions = [
  { label: '电话', value: 'phone' },
  { label: '邮件', value: 'email' },
  { label: '面谈', value: 'in_person' },
  { label: '线上', value: 'online' },
]

function onSearchChange() {
  riskStore.fetchRiskRecords()
}

function formatDate(dateStr: string): string {
  return dateStr ? dateStr.split('T')[0] : '-'
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').slice(0, 16)
}

function getStudentName(): string {
  if (!riskStore.riskDetail) return '-'
  const dist = riskStore.riskDetail.distribution
  if (typeof dist === 'object' && dist !== null && 'student' in dist) {
    return (dist as any).student?.name || '-'
  }
  return '-'
}

function getMaterialTitle(): string {
  if (!riskStore.riskDetail) return '-'
  const dist = riskStore.riskDetail.distribution
  if (typeof dist === 'object' && dist !== null && 'material_title' in dist) {
    return (dist as any).material_title || '-'
  }
  return '-'
}

async function openDrawer(record: RiskRecordList) {
  showDrawer.value = true
  showCommForm.value = false
  showReviewForm.value = false
  await riskStore.fetchRiskDetail(record.id)
}

function getRiskDotClass(level: RiskLevel): string {
  if (level === 'high') return 'risk-dot risk-dot-high'
  if (level === 'medium') return 'risk-dot risk-dot-medium'
  return 'risk-dot risk-dot-low'
}

function getRiskColor(level: RiskLevel): string {
  if (level === 'high') return '#E74C3C'
  if (level === 'medium') return '#F39C12'
  return '#F1C40F'
}

function getLevelTagType(level: RiskLevel): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (level === 'high') return 'error'
  if (level === 'medium') return 'warning'
  return 'default'
}

function getCommTimelineType(type: string): 'default' | 'success' | 'error' | 'warning' | 'info' {
  if (type === 'phone') return 'info'
  if (type === 'online') return 'success'
  if (type === 'in_person') return 'warning'
  return 'default'
}

async function addCommunication() {
  if (!riskStore.riskDetail || !commForm.content.trim()) {
    window.$message?.warning('请填写沟通内容')
    return
  }
  submittingComm.value = true
  try {
    await riskStore.addCommunication(riskStore.riskDetail.id, commForm.content, commForm.commType)
    window.$message?.success('沟通记录已添加')
    commForm.content = ''
    showCommForm.value = false
  } catch (e) {
    window.$message?.error('添加失败')
  } finally {
    submittingComm.value = false
  }
}

async function addReviewConclusion() {
  if (!riskStore.riskDetail || !reviewForm.conclusion.trim()) {
    window.$message?.warning('请填写复核结论')
    return
  }
  submittingReview.value = true
  try {
    await riskStore.addReviewConclusion(riskStore.riskDetail.id, reviewForm.conclusion)
    window.$message?.success('复核结论已添加')
    reviewForm.conclusion = ''
    showReviewForm.value = false
  } catch (e) {
    window.$message?.error('添加失败')
  } finally {
    submittingReview.value = false
  }
}
</script>

<style scoped>
.risk-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  background: var(--color-bg-white);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.summary-info .summary-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.summary-info .summary-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.risk-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: var(--color-bg-white);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.risk-row:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-color: var(--color-primary);
}

.risk-level-indicator {
  flex-shrink: 0;
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.risk-level-indicator .risk-dot {
  width: 10px;
  height: 10px;
}

.risk-main {
  flex: 1;
  min-width: 0;
}

.risk-top-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.risk-student {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.risk-material {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 2px;
}

.risk-reason {
  font-size: 13px;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.risk-meta {
  flex-shrink: 0;
  text-align: right;
}

.risk-date {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.drawer-section {
  margin-bottom: 24px;
}

.drawer-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.add-form {
  margin-top: 12px;
}

.form-content {
  margin-top: 12px;
  padding: 12px;
  background: var(--color-bg);
  border-radius: 6px;
}

.comm-content {
  font-size: 13px;
  color: var(--color-text);
}

.comm-date {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.review-item {
  padding: 12px;
  background: var(--color-bg);
  border-radius: 6px;
  margin-bottom: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.reviewer {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
}

.review-date {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.review-conclusion {
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.6;
}
</style>
