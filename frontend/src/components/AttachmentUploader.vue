<template>
  <div class="attachment-uploader">
    <el-upload
      :action="uploadUrl"
      :headers="uploadHeaders"
      :on-success="handleSuccess"
      :on-error="handleError"
      :before-upload="beforeUpload"
      :file-list="fileList"
      :on-remove="handleRemove"
      drag
      multiple
    >
      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
      <div class="el-upload__text">拖拽文件到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">支持 jpg/png/pdf/doc 等格式，单文件不超过 10MB</div>
      </template>
    </el-upload>
    <el-table v-if="attachmentList.length" :data="attachmentList" size="small" class="attachment-table">
      <el-table-column prop="fileName" label="文件名" min-width="200" />
      <el-table-column prop="fileSize" label="大小" width="100">
        <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="上传时间" width="160" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDownload(row)">下载</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { attachmentApi } from '@/api/attachment'

const props = defineProps({
  appointmentId: { type: [Number, String], required: true }
})

const attachmentList = ref([])
const fileList = ref([])

const uploadUrl = computed(() => `/api/appointments/${props.appointmentId}/attachments`)
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

onMounted(() => {
  loadAttachments()
})

async function loadAttachments() {
  try {
    const res = await attachmentApi.getByAppointment(props.appointmentId)
    attachmentList.value = res.data || []
  } catch { /* ignore */ }
}

function beforeUpload(file) {
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

function handleSuccess(response) {
  if (response.code && response.code !== 200) {
    ElMessage.error(response.message || '上传失败')
    return
  }
  ElMessage.success('上传成功')
  loadAttachments()
}

function handleError() {
  ElMessage.error('上传失败')
}

function handleRemove() {
  loadAttachments()
}

async function handleDownload(row) {
  try {
    const res = await attachmentApi.download(row.id)
    const blob = new Blob([res])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = row.fileName
    link.click()
    window.URL.revokeObjectURL(url)
  } catch {
    ElMessage.error('下载失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定删除该附件？', '提示', { type: 'warning' })
    await attachmentApi.delete(row.id)
    ElMessage.success('删除成功')
    loadAttachments()
  } catch { /* ignore cancel */ }
}

function formatSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.attachment-uploader {
  margin-top: 12px;
}
.attachment-table {
  margin-top: 12px;
}
</style>
