<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/50" @click="$emit('close')" />

        <div class="relative w-[360px] h-full bg-graphite-dark flex flex-col shadow-2xl">
          <div class="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div class="flex items-center gap-2.5">
              <Bookmark class="w-5 h-5 text-accent" />
              <h2 class="text-lg font-serif text-ivory">筛选视图</h2>
            </div>
            <button
              class="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-ivory/60 hover:text-ivory"
              @click="$emit('close')"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div
              v-for="view in store.filterViews"
              :key="view.id"
              class="group rounded-xl border p-4 transition-all duration-200 hover:shadow-lg cursor-pointer"
              :class="
                store.activeFilterView?.id === view.id
                  ? 'border-accent bg-accent/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              "
              @click="handleLoad(view)"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-sans font-medium text-ivory truncate">{{ view.name }}</span>
                    <span
                      v-if="view.isDefault"
                      class="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-warning/20 text-warning"
                    >
                      默认
                    </span>
                  </div>
                  <p class="text-xs font-sans text-ivory/40 mt-1">{{ formatDate(view.createdAt) }}</p>
                </div>
              </div>

              <div class="flex items-center gap-1.5 mt-3">
                <button
                  class="p-1.5 rounded-lg hover:bg-accent/20 text-ivory/50 hover:text-accent transition-colors"
                  title="加载视图"
                  @click.stop="handleLoad(view)"
                >
                  <Play class="w-3.5 h-3.5" />
                </button>

                <button
                  class="p-1.5 rounded-lg transition-colors"
                  :class="
                    view.isDefault
                      ? 'text-warning hover:bg-warning/20'
                      : 'text-ivory/50 hover:bg-white/10 hover:text-ivory'
                  "
                  title="设为默认"
                  @click.stop="handleToggleDefault(view)"
                >
                  <Star class="w-3.5 h-3.5" :class="{ 'fill-current': view.isDefault }" />
                </button>

                <div class="flex-1" />

                <button
                  class="p-1.5 rounded-lg hover:bg-danger/20 text-ivory/50 hover:text-danger transition-colors"
                  title="删除视图"
                  @click.stop="handleDelete(view)"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div
              v-if="!store.filterViews.length"
              class="flex flex-col items-center justify-center py-12 text-ivory/30"
            >
              <Bookmark class="w-8 h-8 mb-2" />
              <p class="text-sm font-sans">暂无保存的视图</p>
            </div>
          </div>

          <div class="border-t border-white/10 px-4 py-4 space-y-3">
            <div class="flex gap-2">
              <input
                v-model="newViewName"
                type="text"
                placeholder="输入视图名称"
                class="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-sans text-ivory placeholder-ivory/30 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                @keyup.enter="handleSave"
              />
              <button
                :disabled="!newViewName.trim()"
                class="h-9 px-4 rounded-lg bg-accent text-primary-dark text-sm font-sans font-medium flex items-center gap-1.5 hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                @click="handleSave"
              >
                <Plus class="w-4 h-4" />
                保存当前筛选
              </button>
            </div>
          </div>
        </div>

        <Transition name="fade">
          <div
            v-if="confirmDeleteId"
            class="absolute inset-0 bg-black/60 flex items-center justify-center z-10"
          >
            <div class="bg-graphite rounded-xl p-5 w-72 shadow-xl border border-white/10">
              <h3 class="text-sm font-sans font-medium text-ivory mb-2">确认删除</h3>
              <p class="text-xs font-sans text-ivory/50 mb-4">删除后无法恢复，确定要删除该视图吗？</p>
              <div class="flex justify-end gap-2">
                <button
                  class="px-3 py-1.5 rounded-lg text-xs font-sans text-ivory/60 hover:bg-white/10 transition-colors"
                  @click="confirmDeleteId = null"
                >
                  取消
                </button>
                <button
                  class="px-3 py-1.5 rounded-lg text-xs font-sans bg-danger text-white hover:bg-danger-dark transition-colors"
                  @click="confirmDelete"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Bookmark, X, Play, Star, Trash2, Plus } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import type { FilterView } from '@/types'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [name: string]
}>()

const store = useDashboardStore()

const newViewName = ref('')
const confirmDeleteId = ref<string | null>(null)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

async function handleLoad(view: FilterView) {
  await store.loadFilterView(view)
  emit('close')
}

async function handleToggleDefault(view: FilterView) {
  const updated = { ...view, isDefault: !view.isDefault }
  if (updated.isDefault) {
    store.filterViews.forEach((v) => {
      if (v.id !== view.id && v.isDefault) {
        v.isDefault = false
      }
    })
  }
  Object.assign(view, updated)
}

function handleDelete(view: FilterView) {
  confirmDeleteId.value = view.id
}

async function confirmDelete() {
  if (!confirmDeleteId.value) return
  await store.removeFilterView(confirmDeleteId.value)
  confirmDeleteId.value = null
}

async function handleSave() {
  const name = newViewName.value.trim()
  if (!name) return
  emit('save', name)
  await store.saveCurrentView(name)
  newViewName.value = ''
}
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
.drawer-enter-to,
.drawer-leave-from {
  transform: translateX(0);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
