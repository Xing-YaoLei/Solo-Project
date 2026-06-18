<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { router } from '@inertiajs/vue3'
import { MessageSquare, Plus, Edit3, Trash2, Send, UserCircle, Clock, Check, X, AlertTriangle, Info, CheckCircle2 } from 'lucide-vue-next'

const props = defineProps({
  notes: {
    type: Array,
    default: () => [],
  },
  notableType: {
    type: String,
    default: '',
  },
  notableId: {
    type: [String, Number],
    default: null,
  },
  canEdit: {
    type: Boolean,
    default: true,
  },
  canDelete: {
    type: Boolean,
    default: true,
  },
  noteTypes: {
    type: Array,
    default: () => [
      { value: 'general', label: '一般', color: 'info' },
      { value: 'followup', label: '跟进', color: 'primary' },
      { value: 'warning', label: '警示', color: 'warning' },
      { value: 'important', label: '重要', color: 'danger' },
    ],
  },
})

const emit = defineEmits(['created', 'updated', 'deleted'])

const newContent = ref('')
const newType = ref('general')
const newIsInternal = ref(true)
const isSubmitting = ref(false)
const editingId = ref(null)
const editContent = ref('')
const editType = ref('general')
const editIsInternal = ref(true)
const inputRef = ref(null)

const getTypeColor = (type) => {
  const found = props.noteTypes.find((t) => t.value === type)
  return found?.color || 'gray'
}

const getTypeLabel = (type) => {
  const found = props.noteTypes.find((t) => t.value === type)
  return found?.label || type
}

const typeColorClasses = {
  primary: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  secondary: 'bg-purple-50 text-purple-700 border-purple-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
}

const getTypeIcon = (type) => {
  const map = {
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertTriangle,
    info: Info,
  }
  return map[type] || MessageSquare
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

const handleSubmit = () => {
  if (!newContent.value.trim() || isSubmitting.value) return
  isSubmitting.value = true
  const formData = {
    content: newContent.value.trim(),
    type: newType.value,
    is_internal: newIsInternal.value,
  }
  if (props.notableType) formData.notable_type = props.notableType
  if (props.notableId) formData.notable_id = props.notableId

  router.post(route('notes.store'), formData, {
    preserveScroll: true,
    onFinish: () => {
      isSubmitting.value = false
    },
    onSuccess: (res) => {
      newContent.value = ''
      newType.value = 'general'
      emit('created', res.props)
    },
  })
}

const startEdit = (note) => {
  editingId.value = note.id
  editContent.value = note.content
  editType.value = note.type || 'general'
  editIsInternal.value = note.is_internal ?? true
  nextTick(() => inputRef.value?.focus())
}

const cancelEdit = () => {
  editingId.value = null
  editContent.value = ''
}

const handleUpdate = (note) => {
  if (!editContent.value.trim()) return
  router.put(route('notes.update', note.id), {
    content: editContent.value.trim(),
    type: editType.value,
    is_internal: editIsInternal.value,
  }, {
    onSuccess: (res) => {
      editingId.value = null
      emit('updated', res.props)
    },
  })
}

const handleDelete = (note) => {
  if (!confirm('确定要删除这条备注吗？')) return
  router.delete(route('notes.destroy', note.id), {
    onSuccess: (res) => {
      emit('deleted', res.props)
    },
  })
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div class="flex items-center gap-2">
        <MessageSquare class="w-5 h-5 text-gray-400" />
        <h3 class="font-semibold text-gray-900">备注</h3>
        <span class="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
          {{ notes.length }}
        </span>
      </div>
    </div>

    <div class="p-4 border-b border-gray-100 bg-gray-50/30">
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <select
            v-model="newType"
            class="appearance-none px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
          >
            <option
              v-for="t in noteTypes"
              :key="t.value"
              :value="t.value"
            >
              {{ t.label }}
            </option>
          </select>
          <label class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border cursor-pointer transition-colors" :class="newIsInternal ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'">
            <input type="checkbox" v-model="newIsInternal" class="sr-only">
            内部
          </label>
        </div>
        <div class="relative">
          <textarea
            v-model="newContent"
            rows="3"
            placeholder="添加备注..."
            class="w-full px-4 py-3 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none placeholder:text-gray-400"
            @keydown.meta.enter="handleSubmit"
            @keydown.ctrl.enter="handleSubmit"
          />
        </div>
        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-400">按 ⌘/Ctrl + Enter 快速提交</p>
          <button
            type="button"
            @click="handleSubmit"
            :disabled="!newContent.trim() || isSubmitting"
            :class="[
              'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              !newContent.trim() || isSubmitting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20',
            ]"
          >
            <Send class="w-4 h-4" />
            提交备注
          </button>
        </div>
      </div>
    </div>

    <div v-if="notes.length === 0" class="p-12 text-center">
      <MessageSquare class="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p class="text-sm font-medium text-gray-500">暂无备注</p>
      <p class="text-xs text-gray-400 mt-1">添加第一条备注开始记录</p>
    </div>

    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="note in notes"
        :key="note.id"
        class="p-4 hover:bg-gray-50/50 transition-colors group"
      >
        <div v-if="editingId === note.id" class="space-y-3">
          <div class="flex items-center gap-2">
            <select
              v-model="editType"
              class="appearance-none px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white outline-none cursor-pointer"
            >
              <option
                v-for="t in noteTypes"
                :key="t.value"
                :value="t.value"
              >
                {{ t.label }}
              </option>
            </select>
            <label class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border cursor-pointer" :class="editIsInternal ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-600'">
              <input type="checkbox" v-model="editIsInternal" class="sr-only">
              内部
            </label>
          </div>
          <textarea
            ref="inputRef"
            v-model="editContent"
            rows="3"
            class="w-full px-4 py-3 text-sm rounded-lg border border-blue-200 bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
          />
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              @click="cancelEdit"
              class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <X class="w-4 h-4" />
              取消
            </button>
            <button
              type="button"
              @click="handleUpdate(note)"
              :disabled="!editContent.trim()"
              :class="[
                'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                !editContent.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700',
              ]"
            >
              <Check class="w-4 h-4" />
              保存
            </button>
          </div>
        </div>

        <div v-else class="flex items-start gap-3">
          <div class="shrink-0">
            <div v-if="note.creator?.avatar" class="w-9 h-9 rounded-full overflow-hidden bg-gray-100">
              <img :src="note.creator.avatar" :alt="note.creator.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <UserCircle class="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1.5">
              <span class="text-sm font-semibold text-gray-900">{{ note.creator?.name || '系统' }}</span>
              <span class="text-xs text-gray-400 flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ formatRelative(note.created_at) }}
              </span>
              <span :class="['inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border', typeColorClasses[getTypeColor(note.type)] || typeColorClasses.gray]">
                <component :is="getTypeIcon(getTypeColor(note.type))" class="w-3 h-3" />
                {{ getTypeLabel(note.type) }}
              </span>
              <span v-if="note.is_internal" class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border border-orange-200 bg-orange-50 text-orange-700">
                内部
              </span>
              <span v-else class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600">
                外部
              </span>
            </div>
            <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{{ note.content }}</p>
          </div>
          <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              v-if="canEdit"
              type="button"
              @click="startEdit(note)"
              class="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="编辑"
            >
              <Edit3 class="w-4 h-4" />
            </button>
            <button
              v-if="canDelete"
              type="button"
              @click="handleDelete(note)"
              class="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="删除"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
