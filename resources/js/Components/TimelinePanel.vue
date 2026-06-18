<script setup>
import { computed } from 'vue'
import { History, UserCircle, Link2, Smartphone, Monitor, Target, TrendingUp, CheckCircle2, AlertTriangle, XCircle, Info, FileText, MessageSquare, Users, Edit3, Trash2, Plus } from 'lucide-vue-next'

const props = defineProps({
  timelines: {
    type: Array,
    default: () => [],
  },
})

const categoryConfig = {
  created: { label: '创建', color: 'bg-green-500', ring: 'ring-green-200', icon: Plus, bg: 'bg-green-50' },
  updated: { label: '更新', color: 'bg-blue-500', ring: 'ring-blue-200', icon: Edit3, bg: 'bg-blue-50' },
  deleted: { label: '删除', color: 'bg-red-500', ring: 'ring-red-200', icon: Trash2, bg: 'bg-red-50' },
  status_changed: { label: '状态变更', color: 'bg-purple-500', ring: 'ring-purple-200', icon: Target, bg: 'bg-purple-50' },
  assigned: { label: '分配', color: 'bg-orange-500', ring: 'ring-orange-200', icon: Users, bg: 'bg-orange-50' },
  commented: { label: '评论', color: 'bg-cyan-500', ring: 'ring-cyan-200', icon: MessageSquare, bg: 'bg-cyan-50' },
  attached: { label: '附件', color: 'bg-pink-500', ring: 'ring-pink-200', icon: FileText, bg: 'bg-pink-50' },
  completed: { label: '完成', color: 'bg-emerald-500', ring: 'ring-emerald-200', icon: CheckCircle2, bg: 'bg-emerald-50' },
  default: { label: '操作', color: 'bg-gray-500', ring: 'ring-gray-200', icon: History, bg: 'bg-gray-50' },
}

const getCategory = (category) => {
  return categoryConfig[category] || categoryConfig.default
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
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}

const formatAbsolute = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const hasChanges = (item) => {
  return item.changes && Object.keys(item.changes).length > 0
}

const formatChangeValue = (val) => {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? '是' : '否'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div class="flex items-center gap-2">
        <History class="w-5 h-5 text-gray-400" />
        <h3 class="font-semibold text-gray-900">操作日志</h3>
        <span class="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
          {{ timelines.length }}
        </span>
      </div>
    </div>

    <div v-if="timelines.length === 0" class="p-12 text-center">
      <History class="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p class="text-sm font-medium text-gray-500">暂无操作记录</p>
    </div>

    <div v-else class="relative px-5 py-4">
      <div class="absolute left-8 top-6 bottom-6 w-px bg-gray-100" aria-hidden="true" />

      <div class="space-y-5">
        <div
          v-for="(item, index) in timelines"
          :key="item.id || index"
          class="relative flex items-start gap-4"
        >
          <div
            :class="[
              'relative z-10 shrink-0 w-7 h-7 rounded-full flex items-center justify-center ring-4',
              getCategory(item.category).color,
              getCategory(item.category).ring,
            ]"
          >
            <component :is="getCategory(item.category).icon" class="w-3.5 h-3.5 text-white" />
          </div>

          <div class="flex-1 min-w-0">
            <div :class="['rounded-xl border border-gray-100 overflow-hidden', getCategory(item.category).bg.replace('50', '50/30')]">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 bg-white/60 border-b border-gray-100">
                <span :class="['inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md', getCategory(item.category).bg, getCategory(item.category).color.replace('bg-', 'text-').replace('-500', '-700')]">
                  {{ getCategory(item.category).label }}
                </span>
                <span class="text-sm font-semibold text-gray-900">{{ item.action || item.title }}</span>
                <span class="text-xs text-gray-400 flex items-center gap-1">
                  <UserCircle class="w-3 h-3" />
                  {{ item.user?.name || item.operator || '系统' }}
                </span>
                <span v-if="item.ip" class="text-xs text-gray-400">
                  IP: {{ item.ip }}
                </span>
                <span
                  v-if="item.device === 'mobile'"
                  class="inline-flex items-center gap-1 text-xs text-gray-400"
                  title="移动端"
                >
                  <Smartphone class="w-3 h-3" />
                  移动端
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 text-xs text-gray-400"
                  title="桌面端"
                >
                  <Monitor class="w-3 h-3" />
                  桌面端
                </span>
              </div>

              <div class="px-4 py-3">
                <p v-if="item.description" class="text-sm text-gray-700 leading-relaxed mb-3">
                  {{ item.description }}
                </p>

                <div
                  v-if="hasChanges(item)"
                  class="rounded-lg border border-gray-100 bg-white overflow-hidden"
                >
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">字段</th>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">变更前</th>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">变更后</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                      <tr v-for="(change, field) in item.changes" :key="field">
                        <td class="px-3 py-2 font-medium text-gray-900 align-top">{{ change.label || field }}</td>
                        <td class="px-3 py-2 align-top">
                          <span v-if="change.before !== undefined" class="inline-block px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-mono">
                            {{ formatChangeValue(change.before) }}
                          </span>
                          <span v-else class="text-xs text-gray-400">—</span>
                        </td>
                        <td class="px-3 py-2 align-top">
                          <span v-if="change.after !== undefined" class="inline-block px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-mono">
                            {{ formatChangeValue(change.after) }}
                          </span>
                          <span v-else class="text-xs text-gray-400">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div v-if="item.review_url || item.review_id" class="mt-3">
                  <a
                    :href="item.review_url || route('reviews.show', item.review_id)"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    <Link2 class="w-3.5 h-3.5" />
                    查看关联复盘材料 #{{ item.review_id }}
                  </a>
                </div>
              </div>

              <div class="px-4 py-2 bg-white/40 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-3">
                <span class="font-medium text-gray-600">{{ formatRelative(item.created_at) }}</span>
                <span class="text-gray-300">·</span>
                <span>{{ formatAbsolute(item.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
