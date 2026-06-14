<template>
  <div class="followup-detail-page">
    <div class="page-header">
      <n-button text @click="goBack">
        <template #icon><ArrowBackOutline /></template>
        返回列表
      </n-button>
      <n-space>
        <n-button v-if="followUp?.status === 'pending'" type="primary" @click="handleStart">
          开始跟进
        </n-button>
        <n-button v-if="followUp?.status === 'in_progress'" type="success" @click="handleRenewed">
          标记已续费
        </n-button>
        <n-button v-if="followUp?.status === 'in_progress'" @click="handleClose">
          关闭跟进
        </n-button>
      </n-space>
    </div>

    <n-card class="info-card" :bordered="false">
      <n-grid :cols="4" :x-gap="20">
        <n-grid-item>
          <div class="info-item">
            <div class="info-label">学员姓名</div>
            <div class="info-value">{{ followUp?.student_name }}</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="info-item">
            <div class="info-label">课程</div>
            <div class="info-value">{{ followUp?.course_name }}</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="info-item">
            <div class="info-label">咨询师</div>
            <div class="info-value">{{ followUp?.counselor_name || '-' }}</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="info-item">
            <div class="info-label">状态</div>
            <n-tag :type="statusTagType(followUp?.status)">{{ statusLabel(followUp?.status) }}</n-tag>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="info-item">
            <div class="info-label">优先级</div>
            <n-tag :type="priorityTagType(followUp?.priority)">{{ priorityLabel(followUp?.priority) }}</n-tag>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="info-item">
            <div class="info-label">学习进度</div>
            <div class="progress-wrapper">
              <n-progress
                type="line"
                :percentage="followUp?.progress || 0"
                size="small"
                :status="progressStatus"
              />
            </div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="info-item">
            <div class="info-label">续费到期日</div>
            <div class="info-value">{{ formatDate(followUp?.renewal_due_date) }}</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="info-item">
            <div class="info-label">触发规则</div>
            <div class="info-value">{{ followUp?.reminder_rule_name || '-' }}</div>
          </div>
        </n-grid-item>
      </n-grid>
      <n-divider />
      <div class="info-item">
        <div class="info-label">跟进原因</div>
        <div class="info-value">{{ followUp?.reason || '-' }}</div>
      </div>
    </n-card>

    <n-tabs v-model:value="activeTab" type="line" size="large" class="detail-tabs">
      <n-tab-pane name="records" tab="跟进记录">
        <div class="tab-content">
          <div class="tab-actions">
            <n-button type="primary" size="small" @click="showRecordModal = true">
              <template #icon><AddOutline /></template>
              添加跟进记录
            </n-button>
          </div>
          <n-timeline v-if="records.length" :items="timelineItems" />
          <n-empty v-else description="暂无跟进记录" />
        </div>
      </n-tab-pane>

      <n-tab-pane name="score" tab="成绩反馈">
        <div class="tab-content">
          <div class="tab-actions">
            <n-button type="primary" size="small" @click="showFeedbackModal = true">
              <template #icon><AddOutline /></template>
              添加成绩反馈
            </n-button>
          </div>
          <n-list v-if="scoreFeedbacks.length" hoverable>
            <n-list-item v-for="item in scoreFeedbacks" :key="item.id">
              <template #prefix>
                <n-avatar round size="medium" :style="{ backgroundColor: '#1890ff' }">
                  {{ item.score || 'N/A' }}
                </n-avatar>
              </template>
              <div class="feedback-item">
                <div class="feedback-header">
                  <span class="feedback-score">分数: {{ item.score }}/{{ item.max_score }}</span>
                  <span class="feedback-date">{{ formatDate(item.feedback_date) }}</span>
                </div>
                <div v-if="item.feedback" class="feedback-content">
                  <strong>反馈:</strong> {{ item.feedback }}
                </div>
                <div v-if="item.teacher_comments" class="feedback-content">
                  <strong>老师评语:</strong> {{ item.teacher_comments }}
                </div>
                <div v-if="item.improvement_suggestions" class="feedback-content">
                  <strong>改进建议:</strong> {{ item.improvement_suggestions }}
                </div>
                <div class="feedback-footer">
                  记录人: {{ item.created_by_name }}
                </div>
              </div>
            </n-list-item>
          </n-list>
          <n-empty v-else description="暂无成绩反馈" />
        </div>
      </n-tab-pane>

      <n-tab-pane name="rules" tab="提醒规则">
        <div class="tab-content">
          <n-alert type="info" :show-icon="true" class="rules-alert">
            以下是系统中当前生效的提醒规则，当满足触发条件时会自动创建跟进任务。
          </n-alert>
          <n-space vertical size="medium" class="rules-list">
            <n-card v-for="rule in reminderRules" :key="rule.id" size="small" hoverable>
              <div class="rule-item">
                <div class="rule-header">
                  <n-tag :type="rule.is_active ? 'success' : 'default'" size="small">
                    {{ rule.is_active ? '启用' : '停用' }}
                  </n-tag>
                  <span class="rule-name">{{ rule.name }}</span>
                </div>
                <div class="rule-info">
                  <span>触发类型: {{ triggerTypeLabel(rule.trigger_type) }}</span>
                  <span v-if="rule.threshold">阈值: {{ rule.threshold }}</span>
                </div>
                <div v-if="rule.description" class="rule-desc">
                  {{ rule.description }}
                </div>
                <div class="rule-notify">
                  通知: {{ rule.notify_counselor ? '咨询师' : '' }}
                  {{ rule.notify_teacher ? '、老师' : '' }}
                </div>
              </div>
            </n-card>
          </n-space>
        </div>
      </n-tab-pane>

      <n-tab-pane name="chapters" tab="课程章节">
        <div class="tab-content">
          <n-collapse v-if="chapters.length">
            <n-collapse-item v-for="(chapter, index) in chapters" :key="chapter.id" :title="`第${index + 1}章 ${chapter.title}`">
              <div class="chapter-detail">
                <div v-if="chapter.description" class="chapter-desc">
                  <strong>简介:</strong> {{ chapter.description }}
                </div>
                <div class="chapter-meta">
                  <span>时长: {{ chapter.duration }}分钟</span>
                  <span>排序: {{ chapter.order }}</span>
                </div>
                <div v-if="chapter.content" class="chapter-content">
                  <strong>内容:</strong>
                  <div class="chapter-content-text">{{ chapter.content }}</div>
                </div>
              </div>
            </n-collapse-item>
          </n-collapse>
          <n-empty v-else description="暂无课程章节" />
        </div>
      </n-tab-pane>

      <n-tab-pane name="logs" tab="变更日志">
        <div class="tab-content">
          <n-alert type="warning" :show-icon="true" class="logs-alert">
            作业记录发生变更时，系统会自动记录前后值、原因和操作人，便于追溯。
          </n-alert>
          <n-data-table
            v-if="changeLogs.length"
            :columns="logColumns"
            :data="changeLogs"
            size="small"
            :pagination="false"
            :bordered="false"
          />
          <n-empty v-else description="暂无变更日志" />
        </div>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="showRecordModal" preset="card" title="添加跟进记录" style="width: 500px">
      <n-form :model="recordForm" label-placement="top">
        <n-form-item label="跟进方式">
          <n-select v-model:value="recordForm.method" :options="methodOptions" />
        </n-form-item>
        <n-form-item label="联系人">
          <n-input v-model:value="recordForm.contact_person" placeholder="请输入联系人姓名" />
        </n-form-item>
        <n-form-item label="跟进内容">
          <n-input v-model:value="recordForm.content" type="textarea" :rows="4" placeholder="请输入跟进内容" />
        </n-form-item>
        <n-form-item label="下次行动计划">
          <n-input v-model:value="recordForm.next_action" type="textarea" :rows="2" placeholder="请输入下次行动计划" />
        </n-form-item>
        <n-form-item label="下次跟进日期">
          <n-date-picker v-model:value="recordForm.next_date" type="date" style="width: 100%" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showRecordModal = false">取消</n-button>
          <n-button type="primary" @click="handleAddRecord">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showFeedbackModal" preset="card" title="添加成绩反馈" style="width: 500px">
      <n-form :model="feedbackForm" label-placement="top">
        <n-form-item label="分数">
          <n-input-number v-model:value="feedbackForm.score" :min="0" :max="100" style="width: 100%" />
        </n-form-item>
        <n-form-item label="反馈内容">
          <n-input v-model:value="feedbackForm.feedback" type="textarea" :rows="3" />
        </n-form-item>
        <n-form-item label="老师评语">
          <n-input v-model:value="feedbackForm.teacher_comments" type="textarea" :rows="2" />
        </n-form-item>
        <n-form-item label="改进建议">
          <n-input v-model:value="feedbackForm.improvement_suggestions" type="textarea" :rows="2" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showFeedbackModal = false">取消</n-button>
          <n-button type="primary" @click="handleAddFeedback">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  ArrowBackOutline,
  AddOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  TimeOutline,
} from '@vicons/ionicons5'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const id = computed(() => route.params.id as string)
const activeTab = ref('records')
const loading = ref(false)

const followUp = ref<any>(null)
const records = ref<any[]>([])
const scoreFeedbacks = ref<any[]>([])
const reminderRules = ref<any[]>([])
const chapters = ref<any[]>([])
const changeLogs = ref<any[]>([])

const showRecordModal = ref(false)
const showFeedbackModal = ref(false)

const recordForm = reactive({
  method: 'call',
  contact_person: '',
  content: '',
  next_action: '',
  next_date: null,
})

const feedbackForm = reactive({
  score: null,
  feedback: '',
  teacher_comments: '',
  improvement_suggestions: '',
})

const methodOptions = [
  { label: '电话', value: 'call' },
  { label: '微信', value: 'wechat' },
  { label: '家访', value: 'visit' },
  { label: '其他', value: 'other' },
]

const statusTagType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    renewed: 'success',
    closed: 'default',
  }
  return map[status] || 'default'
}

const priorityTagType = (priority: string) => {
  const map: Record<string, string> = {
    low: 'default',
    medium: 'info',
    high: 'warning',
    urgent: 'error',
  }
  return map[priority] || 'default'
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待跟进',
    in_progress: '跟进中',
    completed: '已完成',
    renewed: '已续费',
    closed: '已关闭',
  }
  return map[status] || status
}

const priorityLabel = (priority: string) => {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }
  return map[priority] || priority
}

const triggerTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    progress_behind: '进度落后',
    due_date: '续费到期',
    score_low: '成绩偏低',
    inactivity: '长期不活跃',
  }
  return map[type] || type
}

const progressStatus = computed(() => {
  const p = followUp.value?.progress || 0
  if (p < 30) return 'error'
  if (p < 60) return 'warning'
  return 'success'
})

const logColumns = [
  { title: '字段', key: 'field_name', width: 100 },
  { title: '变更类型', key: 'change_type', width: 100 },
  { title: '原值', key: 'old_value', width: 150 },
  { title: '新值', key: 'new_value', width: 150 },
  { title: '原因', key: 'reason', ellipsis: { tooltip: true } },
  { title: '操作人', key: 'changed_by_name', width: 100 },
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => formatDateTime(row.created_at) },
  {
    title: '状态',
    key: 'closed',
    width: 80,
    render: (row: any) => row.closed_at
      ? h('n-tag', { type: 'success', size: 'small' }, () => '已关闭')
      : h('n-tag', { type: 'warning', size: 'small' }, () => '待处理'),
  },
]

const timelineItems = computed(() => {
  return records.value.map((item, index) => ({
    title: `${methodLabel(item.method)} - ${item.created_by_name}`,
    content: h('div', { class: 'timeline-content' }, [
      h('div', { class: 'timeline-time' }, formatDateTime(item.created_at)),
      item.contact_person ? h('div', { class: 'timeline-contact' }, `联系人: ${item.contact_person}`) : null,
      h('div', { class: 'timeline-body' }, item.content),
      item.next_action ? h('div', { class: 'timeline-next' }, `下次行动: ${item.next_action}`) : null,
      item.next_date ? h('div', { class: 'timeline-next-date' }, `下次日期: ${formatDate(item.next_date)}`) : null,
    ]),
    type: index === 0 ? 'success' : 'default',
  }))
})

const methodLabel = (method: string) => {
  const map: Record<string, string> = {
    call: '电话',
    wechat: '微信',
    visit: '家访',
    other: '其他',
  }
  return map[method] || method
}

const formatDate = (date: any) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

const formatDateTime = (date: any) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const api = useApi()
    const response = await api.get(`/followups/follow-ups/${id.value}/`)
    followUp.value = response.data
    records.value = response.data.records || []
    scoreFeedbacks.value = response.data.score_feedbacks || []
    reminderRules.value = response.data.reminder_rules || []
    chapters.value = response.data.chapters || []
  } catch (e) {
    message.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const fetchChangeLogs = async () => {
  try {
    const api = useApi()
    const response = await api.get('/assignments/change-logs/', {
      params: { submission__student: followUp.value?.student },
    })
    changeLogs.value = response.data.results || []
  } catch (e) {
    console.error('获取变更日志失败', e)
  }
}

const handleStart = async () => {
  try {
    const api = useApi()
    await api.post(`/followups/follow-ups/${id.value}/start/`)
    message.success('已开始跟进')
    fetchDetail()
  } catch (e) {
    message.error('操作失败')
  }
}

const handleRenewed = async () => {
  try {
    const api = useApi()
    await api.post(`/followups/follow-ups/${id.value}/mark_renewed/`)
    message.success('已标记为已续费')
    fetchDetail()
  } catch (e) {
    message.error('操作失败')
  }
}

const handleClose = async () => {
  try {
    const api = useApi()
    await api.post(`/followups/follow-ups/${id.value}/close/`)
    message.success('已关闭跟进')
    fetchDetail()
  } catch (e) {
    message.error('操作失败')
  }
}

const handleAddRecord = async () => {
  if (!recordForm.content) {
    message.warning('请输入跟进内容')
    return
  }
  try {
    const api = useApi()
    await api.post('/followups/records/', {
      follow_up: id.value,
      ...recordForm,
    })
    message.success('添加成功')
    showRecordModal.value = false
    recordForm.method = 'call'
    recordForm.contact_person = ''
    recordForm.content = ''
    recordForm.next_action = ''
    recordForm.next_date = null
    fetchDetail()
  } catch (e) {
    message.error('添加失败')
  }
}

const handleAddFeedback = async () => {
  try {
    const api = useApi()
    await api.post('/followups/score-feedbacks/', {
      enrollment: followUp.value?.enrollment,
      student: followUp.value?.student,
      course: followUp.value?.enrollment?.course,
      ...feedbackForm,
    })
    message.success('添加成功')
    showFeedbackModal.value = false
    feedbackForm.score = null
    feedbackForm.feedback = ''
    feedbackForm.teacher_comments = ''
    feedbackForm.improvement_suggestions = ''
    fetchDetail()
  } catch (e) {
    message.error('添加失败')
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.followup-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-card :deep(.n-card__content) {
  padding: 20px;
}

.info-item {
  margin-bottom: 12px;
}

.info-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

.progress-wrapper {
  padding-right: 8px;
}

.detail-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 16px;
}

.tab-content {
  padding: 16px 0;
}

.tab-actions {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

.feedback-item {
  flex: 1;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.feedback-score {
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
}

.feedback-date {
  font-size: 12px;
  color: #bfbfbf;
}

.feedback-content {
  font-size: 13px;
  color: #595959;
  margin-bottom: 6px;
  line-height: 1.6;
}

.feedback-footer {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 8px;
}

.rules-alert {
  margin-bottom: 16px;
}

.rules-list {
  width: 100%;
}

.rule-item {
  padding: 8px 0;
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.rule-name {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.rule-info {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #595959;
  margin-bottom: 8px;
}

.rule-desc {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 8px;
  line-height: 1.6;
}

.rule-notify {
  font-size: 12px;
  color: #1890ff;
}

.chapter-detail {
  padding: 8px 0;
}

.chapter-desc {
  font-size: 13px;
  color: #595959;
  margin-bottom: 12px;
  line-height: 1.6;
}

.chapter-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 12px;
}

.chapter-content {
  font-size: 13px;
  color: #595959;
  line-height: 1.6;
}

.chapter-content-text {
  margin-top: 8px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.logs-alert {
  margin-bottom: 16px;
}

.timeline-content {
  padding: 4px 0 16px 0;
}

.timeline-time {
  font-size: 12px;
  color: #bfbfbf;
  margin-bottom: 8px;
}

.timeline-contact {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 6px;
}

.timeline-body {
  font-size: 14px;
  color: #262626;
  line-height: 1.6;
  margin-bottom: 8px;
}

.timeline-next {
  font-size: 13px;
  color: #1890ff;
  margin-bottom: 4px;
}

.timeline-next-date {
  font-size: 12px;
  color: #52c41a;
}
</style>
