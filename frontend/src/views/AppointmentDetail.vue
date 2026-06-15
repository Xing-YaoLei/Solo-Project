<template>
  <div class="page-container">
    <div class="detail-header">
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
      <h3>预约单详情</h3>
    </div>

    <div v-loading="loading">
      <el-row :gutter="16">
        <el-col :span="16">
          <div class="table-card">
            <div class="section-title">基本信息</div>
            <el-descriptions :column="2" border size="default">
              <el-descriptions-item label="学生姓名">{{ detail.studentName }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ detail.studentPhone }}</el-descriptions-item>
              <el-descriptions-item label="科目">{{ detail.subject }}</el-descriptions-item>
              <el-descriptions-item label="校区">{{ detail.campus }}</el-descriptions-item>
              <el-descriptions-item label="试听日期">{{ detail.trialDate }}</el-descriptions-item>
              <el-descriptions-item label="时段">{{ detail.timeSlot }}</el-descriptions-item>
              <el-descriptions-item label="老师">{{ detail.teacherName }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <StatusTag :status="detail.status" />
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
            </el-descriptions>

            <div class="section-actions">
              <el-button v-permission="['ADMIN', 'RECEPTIONIST']" v-if="detail.status === 'PENDING'" type="success" @click="handleConfirm">确认预约</el-button>
              <el-button v-permission="['ADMIN', 'RECEPTIONIST']" v-if="['PENDING', 'CONFIRMED'].includes(detail.status)" type="warning" @click="showReschedule = true">改约</el-button>
              <el-button v-permission="['ADMIN', 'RECEPTIONIST']" v-if="detail.status !== 'CANCELLED' && detail.status !== 'COMPLETED'" type="danger" @click="handleCancel">取消预约</el-button>
              <el-button v-permission="['ADMIN', 'RECEPTIONIST']" v-if="detail.status === 'CONFIRMED' && !detail.attendanceStatus" type="success" @click="handleCheckIn">到场签到</el-button>
            </div>
          </div>

          <div class="table-card" style="margin-top: 16px">
            <div class="section-title">变更记录</div>
            <ChangeLogTimeline :logs="changeLogs" @view-source="handleViewSource" />
          </div>
        </el-col>

        <el-col :span="8">
          <div class="table-card">
            <div class="section-title">到场记录</div>
            <el-descriptions v-if="detail.attendanceStatus" :column="1" border size="small">
              <el-descriptions-item label="到场状态">
                <el-tag :type="detail.attendanceStatus === 'CHECKED_IN' ? 'success' : detail.attendanceStatus === 'LATE' ? 'warning' : 'danger'">
                  {{ attendanceLabel }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="签到时间">{{ detail.checkInTime || '-' }}</el-descriptions-item>
            </el-descriptions>
            <el-empty v-else description="暂无到场记录" :image-size="60" />
          </div>

          <div class="table-card" style="margin-top: 16px">
            <div class="section-title">提醒记录</div>
            <el-table :data="reminderList" size="small" v-if="reminderList.length">
              <el-table-column prop="type" label="类型" width="60" />
              <el-table-column prop="status" label="状态" width="60" />
              <el-table-column prop="sentAt" label="发送时间" />
            </el-table>
            <el-empty v-else description="暂无提醒记录" :image-size="60" />
          </div>

          <div class="table-card" style="margin-top: 16px">
            <div class="section-title">附件</div>
            <AttachmentUploader v-if="detail.id" :appointment-id="detail.id" />
          </div>
        </el-col>
      </el-row>
    </div>

    <RescheduleDialog v-model="showReschedule" :original-data="detail" @success="loadDetail" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { appointmentApi } from '@/api/appointment'
import { attendanceApi } from '@/api/attendance'
import { reminderApi } from '@/api/reminder'
import StatusTag from '@/components/StatusTag.vue'
import ChangeLogTimeline from '@/components/ChangeLogTimeline.vue'
import AttachmentUploader from '@/components/AttachmentUploader.vue'
import RescheduleDialog from '@/components/RescheduleDialog.vue'

const route = useRoute()
const loading = ref(false)
const detail = ref({})
const changeLogs = ref([])
const reminderList = ref([])
const showReschedule = ref(false)

const attendanceLabel = computed(() => {
  const map = { CHECKED_IN: '已签到', LATE: '迟到', NO_SHOW: '未到' }
  return map[detail.value.attendanceStatus] || detail.value.attendanceStatus
})

onMounted(() => {
  loadDetail()
})

async function loadDetail() {
  loading.value = true
  try {
    const id = route.params.id
    const [detailRes, logRes, reminderRes] = await Promise.all([
      appointmentApi.getById(id),
      appointmentApi.getChangeLog(id),
      reminderApi.getList({ appointmentId: id, page: 1, pageSize: 50 })
    ])
    detail.value = detailRes.data
    changeLogs.value = logRes.data || []
    reminderList.value = reminderRes.data.records || []
  } finally {
    loading.value = false
  }
}

async function handleConfirm() {
  try {
    await appointmentApi.update(detail.value.id, { status: 'CONFIRMED' })
    ElMessage.success('确认成功')
    loadDetail()
  } catch { /* ignore */ }
}

async function handleCancel() {
  try {
    await ElMessageBox.confirm('确认取消该预约？', '取消预约', { type: 'warning' })
    await appointmentApi.update(detail.value.id, { status: 'CANCELLED' })
    ElMessage.success('取消成功')
    loadDetail()
  } catch { /* ignore cancel */ }
}

async function handleCheckIn() {
  try {
    await attendanceApi.checkIn(detail.value.id, { status: 'CHECKED_IN' })
    ElMessage.success('签到成功')
    loadDetail()
  } catch { /* ignore */ }
}

function handleViewSource(sourceId) {
  if (sourceId && sourceId !== detail.value.id) {
    window.open(`/appointments/${sourceId}`, '_blank')
  }
}
</script>

<style scoped>
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.detail-header h3 {
  font-size: 18px;
  color: var(--text-primary);
}
.section-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid var(--edu-blue);
}
.section-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}
</style>
