<template>
  <el-dialog
    v-model="visible"
    title="改约"
    width="650px"
    destroy-on-close
    @close="resetForm"
  >
    <el-alert type="warning" :closable="false" class="reschedule-tip">
      改约将改变预约时间和/或老师，系统会自动检测新时段是否存在冲突
    </el-alert>

    <div class="compare-section">
      <el-descriptions title="原预约信息" :column="2" size="small" border>
        <el-descriptions-item label="学生">{{ originalData.studentName }}</el-descriptions-item>
        <el-descriptions-item label="科目">{{ originalData.subject }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ originalData.trialDate }}</el-descriptions-item>
        <el-descriptions-item label="时段">{{ originalData.timeSlot }}</el-descriptions-item>
        <el-descriptions-item label="老师">{{ originalData.teacherName }}</el-descriptions-item>
        <el-descriptions-item label="校区">{{ originalData.campus }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" class="new-form">
      <el-divider>新预约信息</el-divider>
      <el-form-item label="试听日期" prop="trialDate">
        <el-date-picker v-model="form.trialDate" type="date" placeholder="选择新日期" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="时段" prop="timeSlot">
        <el-select v-model="form.timeSlot" placeholder="选择新时段" style="width: 100%">
          <el-option v-for="slot in timeSlotOptions" :key="slot" :label="slot" :value="slot" />
        </el-select>
      </el-form-item>
      <el-form-item label="老师" prop="teacherId">
        <el-select v-model="form.teacherId" placeholder="选择新老师" style="width: 100%">
          <el-option v-for="t in teacherList" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="改约原因" prop="reason">
        <el-input v-model="form.reason" type="textarea" :rows="2" placeholder="请填写改约原因" />
      </el-form-item>
    </el-form>

    <ConflictAlert
      v-if="conflictResult.length"
      :conflicts="conflictResult"
      class="conflict-result"
    />

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="conflictResult.length > 0" @click="handleSubmit">
        确认改约
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { appointmentApi } from '@/api/appointment'
import ConflictAlert from './ConflictAlert.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  originalData: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const submitting = ref(false)
const conflictResult = ref([])

const timeSlotOptions = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00',
  '17:00-18:00', '19:00-20:00'
]

const teacherList = ref([
  { id: 1, name: '王老师' },
  { id: 2, name: '李老师' },
  { id: 3, name: '张老师' },
  { id: 4, name: '赵老师' },
  { id: 5, name: '陈老师' }
])

const form = ref({ trialDate: '', timeSlot: '', teacherId: '', reason: '' })

const rules = {
  trialDate: [{ required: true, message: '请选择新日期', trigger: 'change' }],
  timeSlot: [{ required: true, message: '请选择新时段', trigger: 'change' }],
  teacherId: [{ required: true, message: '请选择新老师', trigger: 'change' }],
  reason: [{ required: true, message: '请填写改约原因', trigger: 'blur' }]
}

watch(() => [form.value.trialDate, form.value.timeSlot, form.value.teacherId], async () => {
  if (form.value.trialDate && form.value.timeSlot && form.value.teacherId) {
    await checkConflict()
  } else {
    conflictResult.value = []
  }
})

async function checkConflict() {
  try {
    const res = await appointmentApi.getConflicts({
      date: form.value.trialDate,
      timeSlot: form.value.timeSlot,
      teacherId: form.value.teacherId,
      excludeId: props.originalData.id
    })
    conflictResult.value = res.data || []
  } catch {
    conflictResult.value = []
  }
}

function resetForm() {
  form.value = { trialDate: '', timeSlot: '', teacherId: '', reason: '' }
  conflictResult.value = []
  formRef.value?.resetFields()
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    await appointmentApi.reschedule(props.originalData.id, form.value)
    ElMessage.success('改约成功')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.reschedule-tip {
  margin-bottom: 16px;
}
.compare-section {
  margin-bottom: 16px;
}
.new-form {
  margin-top: 8px;
}
.conflict-result {
  margin-top: 12px;
}
</style>
