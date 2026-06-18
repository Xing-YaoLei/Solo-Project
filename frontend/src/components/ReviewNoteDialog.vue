<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="anomalyInfo" class="anomaly-info mb-20">
      <el-alert
        :title="anomalyInfo.config?.label || '异常'"
        :type="alertType"
        :description="anomalyInfo.details || anomalyInfo.config?.description"
        show-icon
        :closable="false"
      />
    </div>

    <div v-if="existingNotes.length > 0" class="notes-section mb-20">
      <div class="section-title">
        <el-icon><ChatLineRound /></el-icon>
        <span>历史备注 ({{ existingNotes.length }})</span>
      </div>
      <div class="notes-list">
        <div v-for="note in existingNotes" :key="note.id" class="note-item">
          <div class="note-header">
            <span class="note-author">{{ note.author || '当前用户' }}</span>
            <span class="note-time">{{ formatTime(note.createdAt) }}</span>
          </div>
          <div class="note-content">{{ note.content }}</div>
        </div>
      </div>
    </div>

    <el-form :model="form" ref="formRef" label-width="80px">
      <el-form-item label="备注内容" prop="content" :rules="rules.content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="4"
          placeholder="请输入复盘备注内容，描述异常原因、处理方案等..."
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="严重程度">
        <el-radio-group v-model="form.severity">
          <el-radio value="low">低</el-radio>
          <el-radio value="medium">中</el-radio>
          <el-radio value="high">高</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="处理建议">
        <el-select v-model="form.action" placeholder="请选择处理建议">
          <el-option label="持续观察" value="observe" />
          <el-option label="需要介入" value="intervene" />
          <el-option label="已处理" value="resolved" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存备注</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { useFunnelStore } from '@/stores/funnel'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  anomalyId: String,
  anomalyInfo: Object
})

const emit = defineEmits(['update:modelValue', 'saved'])

const funnelStore = useFunnelStore()
const userStore = useUserStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const submitting = ref(false)
const form = reactive({
  content: '',
  severity: 'medium',
  action: 'observe',
  author: userStore.userName
})

const rules = {
  content: [{ required: true, message: '请输入备注内容', trigger: 'blur' }]
}

const dialogTitle = computed(() => {
  return props.anomalyInfo?.config?.label
    ? `复盘备注 - ${props.anomalyInfo.config.label}`
    : '复盘备注'
})

const alertType = computed(() => {
  switch (props.anomalyInfo?.type) {
    case 'LIBRARY_DELAY': return 'error'
    case 'DETECTOR_MISSING': return 'warning'
    default: return 'info'
  }
})

const existingNotes = computed(() => {
  if (!props.anomalyId) return []
  return funnelStore.getReviewNotesByAnomaly(props.anomalyId)
})

watch(visible, (val) => {
  if (val) {
    form.content = ''
    form.severity = 'medium'
    form.action = 'observe'
  }
})

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true
    const anomalyId = props.anomalyId || `anomaly-${Date.now()}`
    await funnelStore.saveReviewNote(anomalyId, { ...form })
    ElMessage.success('备注保存成功')
    emit('saved', { anomalyId, note: { ...form, createdAt: new Date().toISOString() } })
    visible.value = false
  } catch (e) {
    if (e !== false) {
      ElMessage.error('保存失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  visible.value = false
}
</script>

<style lang="scss" scoped>
.anomaly-info {
  margin-bottom: 20px;
}

.notes-section {
  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }

  .notes-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #ebeef5;
    border-radius: 6px;
  }

  .note-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f2f6fc;

    &:last-child {
      border-bottom: none;
    }

    .note-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;

      .note-author {
        font-size: 13px;
        font-weight: 500;
        color: #409eff;
      }

      .note-time {
        font-size: 12px;
        color: #909399;
      }
    }

    .note-content {
      font-size: 13px;
      color: #606266;
      line-height: 1.6;
    }
  }
}
</style>
