<template>
  <el-dialog :model-value="true" title="试驾反馈" width="700px" @close="emit('close')">
    <div v-if="!showChangeLog" class="feedback-form">
      <el-form :model="form" label-width="100px">
        <el-form-item label="满意度">
          <el-select v-model="form.satisfaction" placeholder="请选择">
            <el-option label="非常满意" value="VERY_SATISFIED" />
            <el-option label="满意" value="SATISFIED" />
            <el-option label="一般" value="NEUTRAL" />
            <el-option label="不满意" value="DISSATISFIED" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户意见">
          <el-input v-model="form.customerOpinion" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="购买意向">
          <el-select v-model="form.purchaseIntention" placeholder="请选择">
            <el-option label="意向强烈" value="STRONG" />
            <el-option label="有意向" value="INTERESTED" />
            <el-option label="观望中" value="HESITANT" />
            <el-option label="无意向" value="NOT_INTERESTED" />
          </el-select>
        </el-form-item>
        <el-form-item label="内部备注">
          <el-input v-model="form.internalNote" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="form.operator" />
        </el-form-item>
      </el-form>
      <div v-if="appointment.feedbackId" class="change-log-toggle">
        <el-button link type="primary" @click="showChangeLog = true">
          查看变更记录 (v{{ currentVersion }})
        </el-button>
      </div>
    </div>

    <FeedbackChangeLog
      v-else
      :feedback-id="appointment.feedbackId"
      @back="showChangeLog = false"
    />

    <template #footer>
      <el-button @click="emit('close')">取消</el-button>
      <el-button v-if="showChangeLog" @click="showChangeLog = false">返回编辑</el-button>
      <el-button v-else type="primary" @click="handleSave" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getFeedback, createFeedback, updateFeedback } from '../api/feedback'
import FeedbackChangeLog from './FeedbackChangeLog.vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  appointment: { type: Object, required: true }
})

const emit = defineEmits(['close', 'saved'])

const form = ref({
  satisfaction: '',
  customerOpinion: '',
  purchaseIntention: '',
  internalNote: '',
  operator: ''
})
const saving = ref(false)
const showChangeLog = ref(false)
const currentVersion = ref(1)

onMounted(async () => {
  if (props.appointment.feedbackId) {
    try {
      const fb = await getFeedback(props.appointment.feedbackId)
      form.value.satisfaction = fb.satisfaction || ''
      form.value.customerOpinion = fb.customerOpinion || ''
      form.value.purchaseIntention = fb.purchaseIntention || ''
      form.value.internalNote = fb.internalNote || ''
      currentVersion.value = fb.version
    } catch { /* ignore */ }
  }
})

async function handleSave() {
  saving.value = true
  try {
    if (props.appointment.feedbackId) {
      await updateFeedback({ ...form.value, feedbackId: props.appointment.feedbackId })
      ElMessage.success('反馈已更新（变更已记录）')
    } else {
      await createFeedback({
        appointmentId: props.appointment.appointmentId,
        vehicleId: props.appointment.vehicleId,
        ...form.value,
        filledBy: form.value.operator
      })
      ElMessage.success('反馈已创建')
    }
    emit('saved')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.change-log-toggle { margin-top: 8px; text-align: right; }
</style>
