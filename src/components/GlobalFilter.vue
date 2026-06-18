<template>
  <div class="bg-primary border-b border-white/5 px-6 py-4">
    <div class="flex items-end gap-4 flex-wrap">
      <div class="flex-1 min-w-[140px]">
        <label class="block text-xs font-sans text-ivory/40 mb-1">门店</label>
        <select
          v-model="localFilters.storeIds"
          multiple
          class="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-sm font-sans text-ivory focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          <option v-for="s in storeOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <div class="flex-1 min-w-[140px]">
        <label class="block text-xs font-sans text-ivory/40 mb-1">开始日期</label>
        <input
          v-model="localFilters.dateRange.start"
          type="date"
          class="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-sm font-mono text-ivory focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      <div class="flex-1 min-w-[140px]">
        <label class="block text-xs font-sans text-ivory/40 mb-1">结束日期</label>
        <input
          v-model="localFilters.dateRange.end"
          type="date"
          class="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-sm font-mono text-ivory focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      <div class="flex-1 min-w-[140px]">
        <label class="block text-xs font-sans text-ivory/40 mb-1">品牌</label>
        <select
          v-model="localFilters.brands"
          multiple
          class="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-sm font-sans text-ivory focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          <option v-for="b in brandOptions" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>

      <div class="flex-1 min-w-[140px]">
        <label class="block text-xs font-sans text-ivory/40 mb-1">来源类型</label>
        <select
          v-model="localFilters.sourceTypes"
          multiple
          class="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-sm font-sans text-ivory focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          <option v-for="st in sourceTypeOptions" :key="st.value" :value="st.value">{{ st.label }}</option>
        </select>
      </div>

      <div class="flex-1 min-w-[140px]">
        <label class="block text-xs font-sans text-ivory/40 mb-1">车况</label>
        <select
          v-model="localFilters.vehicleCondition"
          multiple
          class="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-sm font-sans text-ivory focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          <option v-for="c in conditionOptions" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <div class="flex items-end gap-2 shrink-0">
        <button
          @click="$emit('open-views')"
          class="h-9 px-4 rounded-lg border border-white/10 text-ivory/80 text-sm font-sans flex items-center gap-1.5 hover:bg-white/5 hover:text-ivory transition-colors"
        >
          <Bookmark class="w-4 h-4" />
          视图
        </button>
        <button
          @click="handleSaveView"
          class="h-9 px-4 rounded-lg border border-accent/50 text-accent text-sm font-sans flex items-center gap-1.5 hover:bg-accent/10 transition-colors"
        >
          <Save class="w-4 h-4" />
          保存
        </button>
        <button
          @click="handleSearch"
          class="h-9 px-4 rounded-lg bg-accent text-primary-dark text-sm font-sans font-medium flex items-center gap-1.5 hover:bg-accent-light transition-colors"
        >
          <Search class="w-4 h-4" />
          查询
        </button>
      </div>
    </div>

    <div v-if="activeTags.length || store.activeFilterView" class="mt-3 flex items-center gap-2 flex-wrap">
      <span
        v-for="tag in activeTags"
        :key="tag.key"
        class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent-light text-xs font-sans"
      >
        {{ tag.label }}
        <X class="w-3 h-3 cursor-pointer hover:text-danger" @click="removeTag(tag)" />
      </span>
      <span
        v-if="store.activeFilterView"
        class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warning/15 text-warning text-xs font-sans font-medium"
      >
        <Bookmark class="w-3 h-3" />
        {{ store.activeFilterView.name }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { Save, Search, X, Bookmark } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { storeOptions, brandOptions, sourceTypeOptions, conditionOptions } from '@/mock/data'
import type { FilterState } from '@/types'

const store = useDashboardStore()

defineEmits<{
  'open-views': []
}>()

const localFilters = reactive<FilterState>({
  storeIds: [...store.filters.storeIds],
  dateRange: { ...store.filters.dateRange },
  brands: [...store.filters.brands],
  sourceTypes: [...store.filters.sourceTypes],
  vehicleCondition: [...store.filters.vehicleCondition],
})

const sourceLabelMap = Object.fromEntries(sourceTypeOptions.map((s) => [s.value, s.label]))

interface FilterTag {
  key: string
  label: string
  type: 'storeId' | 'brand' | 'sourceType' | 'condition'
  value: string
}

const activeTags = computed<FilterTag[]>(() => {
  const tags: FilterTag[] = []
  localFilters.storeIds.forEach((id) => tags.push({ key: `store-${id}`, label: id, type: 'storeId', value: id }))
  localFilters.brands.forEach((b) => tags.push({ key: `brand-${b}`, label: b, type: 'brand', value: b }))
  localFilters.sourceTypes.forEach((s) =>
    tags.push({ key: `source-${s}`, label: sourceLabelMap[s] ?? s, type: 'sourceType', value: s })
  )
  localFilters.vehicleCondition.forEach((c) =>
    tags.push({ key: `cond-${c}`, label: c, type: 'condition', value: c })
  )
  return tags
})

function removeTag(tag: FilterTag) {
  if (tag.type === 'storeId') {
    localFilters.storeIds = localFilters.storeIds.filter((v) => v !== tag.value)
  } else if (tag.type === 'brand') {
    localFilters.brands = localFilters.brands.filter((v) => v !== tag.value)
  } else if (tag.type === 'sourceType') {
    localFilters.sourceTypes = localFilters.sourceTypes.filter((v) => v !== tag.value)
  } else if (tag.type === 'condition') {
    localFilters.vehicleCondition = localFilters.vehicleCondition.filter((v) => v !== tag.value)
  }
}

function handleSearch() {
  store.applyFilters({
    storeIds: [...localFilters.storeIds],
    dateRange: { ...localFilters.dateRange },
    brands: [...localFilters.brands],
    sourceTypes: [...localFilters.sourceTypes],
    vehicleCondition: [...localFilters.vehicleCondition],
  })
}

function handleSaveView() {
  store.saveCurrentView(store.activeFilterView?.name ?? '自定义视图')
}
</script>
