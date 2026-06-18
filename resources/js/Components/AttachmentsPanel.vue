<script setup>
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'
import { Paperclip, Upload, Eye, Download, Trash2, Plus, X, FileText, Image, FileArchive, FileVideo } from 'lucide-vue-next'

const props = defineProps({
  attachments: {
    type: Array,
    default: () => [],
  },
  attachableType: {
    type: String,
    default: '',
  },
  attachableId: {
    type: [String, Number],
    default: null,
  },
  showUpload: {
    type: Boolean,
    default: true,
  },
  canDelete: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['uploaded', 'deleted'])

const isUploading = ref(false)
const fileInput = ref(null)
const dragOver = ref(false)

const getFileIcon = (attachment) => {
  const type = attachment.mime_type || ''
  const name = attachment.file_name || ''
  if (type.startsWith('image/') || name.match(/\.(png|jpe?g|gif|webp|svg)$/i)) return Image
  if (type.startsWith('video/')) return FileVideo
  if (type.includes('pdf') || name.match(/\.(zip|rar|7z|tar|gz)$/i)) return FileArchive
  return FileText
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = Number(bytes)
  let i = 0
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(size > 10 ? 0 : 1)} ${units[i]}`
}

const formatRelative = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files || [])
  if (files.length > 0) {
    uploadFiles(files)
  }
  if (fileInput.value) fileInput.value.value = ''
}

const handleDrop = (e) => {
  e.preventDefault()
  dragOver.value = false
  const files = Array.from(e.dataTransfer.files || [])
  if (files.length > 0) uploadFiles(files)
}

const uploadFiles = (files) => {
  isUploading.value = true
  const formData = new FormData()
  files.forEach((file, idx) => {
    formData.append(`files[${idx}]`, file)
  })
  if (props.attachableType) formData.append('attachable_type', props.attachableType)
  if (props.attachableId) formData.append('attachable_id', props.attachableId)

  router.post(route('attachments.upload'), formData, {
    forceFormData: true,
    onFinish: () => {
      isUploading.value = false
    },
    onSuccess: (res) => {
      emit('uploaded', res.props)
    },
  })
}

const handleDelete = (attachment) => {
  if (!confirm(`确定要删除附件 "${attachment.file_name}" 吗？`)) return
  router.delete(route('attachments.destroy', attachment.id), {
    onSuccess: (res) => {
      emit('deleted', res.props)
    },
  })
}

const handleDownload = (attachment) => {
  window.open(attachment.download_url || attachment.url, '_blank')
}

const handlePreview = (attachment) => {
  window.open(attachment.url, '_blank')
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div class="flex items-center gap-2">
        <Paperclip class="w-5 h-5 text-gray-400" />
        <h3 class="font-semibold text-gray-900">附件</h3>
        <span class="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
          {{ attachments.length }}
        </span>
      </div>
      <button
        v-if="showUpload"
        type="button"
        @click="triggerUpload"
        :disabled="isUploading"
        :class="[
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
          isUploading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
        ]"
      >
        <Plus class="w-4 h-4" />
        上传附件
      </button>
      <input
        ref="fileInput"
        type="file"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <div v-if="attachments.length === 0" class="p-8">
      <div
        :class="[
          'flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-colors cursor-pointer',
          dragOver
            ? 'border-blue-400 bg-blue-50/50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50',
        ]"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop="handleDrop"
        @click="showUpload && triggerUpload"
      >
        <Upload class="w-10 h-10 text-gray-300" />
        <div class="text-center">
          <p class="text-sm font-medium text-gray-600">暂无附件</p>
          <p class="text-xs text-gray-400 mt-1">点击或拖拽文件到此处上传</p>
        </div>
      </div>
    </div>

    <div v-else class="divide-y divide-gray-50">
      <div
        v-for="attachment in attachments"
        :key="attachment.id"
        class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 transition-colors group"
      >
        <div class="shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          <component
            :is="getFileIcon(attachment)"
            class="w-5 h-5 text-gray-500"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600" @click="handlePreview(attachment)">
            {{ attachment.file_name || attachment.original_name }}
          </p>
          <div class="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span>{{ formatFileSize(attachment.file_size) }}</span>
            <span class="text-gray-300">·</span>
            <span>{{ attachment.uploader?.name || '系统' }}</span>
            <span class="text-gray-300">·</span>
            <span>{{ formatRelative(attachment.created_at) }}</span>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button
            type="button"
            @click="handlePreview(attachment)"
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            title="预览"
          >
            <Eye class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="handleDownload(attachment)"
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            title="下载"
          >
            <Download class="w-4 h-4" />
          </button>
          <button
            v-if="canDelete"
            type="button"
            @click="handleDelete(attachment)"
            class="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            title="删除"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
