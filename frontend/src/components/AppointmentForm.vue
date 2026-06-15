<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑预约' : '新建预约'"
    width="600px"
    destroy-on-close
    @close="resetForm"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="学生姓名" prop="studentName">
        <el-input v-model="form.studentName" placeholder="请输入学生姓名" />
      </el-form-item>
      <el-form-item label="联系电话" prop="studentPhone">
        <el-input v-model="form.studentPhone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="科目" prop="subject">
        <el-select v-model="form.subject" placeholder="请选择科目" style="width: 100%">
          <el-option v-for="s in dictStore.subjectOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="试听日期" prop="trialDate">
        <el-date-picker v-model="form.trialDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="时段" prop="timeSlot">
        <el-select v-model="form.timeSlot" placeholder="请选择时段" style="width: 100%">
          <el-option v-for="slot in timeSlotOptions" :key="slot" :label="slot" :value="slot" />
        </el-select>
      </el-form-item>
      <el-form-item label="老师" prop="teacherId">
        <el-select v-model="form.teacherId" placeholder="请选择老师" style="width: 100%">
          <el-option v-for="t in teacherList" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="校区" prop="campus">
        <el-select v-model="form.campus" placeholder="请选择校区" style="width: 100%">
          <el-option v-for="c in dictStore.campusOptions" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="备注信息" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useDictStore } from '@/stores/dict'
import { appointmentApi } from '@/api/appointment'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editData: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'success'])

const dictStore = useDictStore()
const formRef = ref(null)
const submitting = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.editData?.id)

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

const form = ref(getDefaultForm())

function getDefaultForm() {
  return {
    studentName: '',
    studentPhone: '',
    subject: '',
    trialDate: '',
    timeSlot: '',
    teacherId: '',
    campus: '',
    remark: ''
  }
}

const rules = {
  studentName: [{ required: true, message: '请输入学生姓名', trigger: 'blur' }],
  subject: [{ required: true, message: '请选择科目', trigger: 'change' }],
  trialDate: [{ required: true, message: '请选择试听日期', trigger: 'change' }],
  timeSlot: [{ required: true, message: '请选择时段', trigger: 'change' }],
  teacherId: [{ required: true, message: '请选择老师', trigger: 'change' }],
  campus: [{ required: true, message: '请选择校区', trigger: 'change' }]
}

watch(() => props.editData, (val) => {
  if (val) {
    form.value = { ...getDefaultForm(), ...val }
  }
}, { immediate: true })

function resetForm() {
  form.value = getDefaultForm()
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
    if (isEdit.value) {
      await appointmentApi.update(props.editData.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await appointmentApi.create(form.value)
      ElMessage.success('创建成功')
    }
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
