<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { Search, Filter, RotateCcw, ChevronDown, ChevronUp, Plus, X } from 'lucide-vue-next'

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({}),
  },
  filterOptions: {
    type: Object,
    default: () => ({}),
  },
  searchPlaceholder: {
    type: String,
    default: '搜索...',
  },
  perPageOptions: {
    type: Array,
    default: () => [10, 20, 50, 100],
  },
  showAdvancedByDefault: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'reset'])

const localFilters = reactive({ ...props.filters })
const showAdvanced = ref(props.showAdvancedByDefault)

const quickFilters = computed(() => {
  const opts = props.filterOptions
  return Object.keys(opts).filter((key) => opts[key]?.quick !== false && opts[key]?.advanced !== true)
})

const advancedFilters = computed(() => {
  const opts = props.filterOptions
  return Object.keys(opts).filter((key) => opts[key]?.advanced === true)
})

watch(
  () => props.filters,
  (newVal) => {
    Object.assign(localFilters, newVal)
  },
  { deep: true }
)

const handleSubmit = () => {
  const cleaned = {}
  Object.keys(localFilters).forEach((key) => {
    const val = localFilters[key]
    if (val !== '' && val !== null && val !== undefined && val !== 'all') {
      cleaned[key] = val
    }
  })
  emit('submit', cleaned)
}

const handleReset = () => {
  Object.keys(localFilters).forEach((key) => {
    localFilters[key] = ''
  })
  localFilters.perPage = props.filters.perPage || 10
  emit('reset')
  emit('submit', { perPage: localFilters.perPage })
}

const clearFilter = (key) => {
  if (key === 'search') {
    localFilters.search = ''
  } else {
    localFilters[key] = ''
  }
  handleSubmit()
}

const activeFilters = computed(() => {
  const active = []
  if (localFilters.search) active.push({ key: 'search', label: '关键词', value: localFilters.search })
  Object.keys(localFilters).forEach((key) => {
    if (key === 'search' || key === 'perPage' || key === 'page') return
    const val = localFilters[key]
    if (val && val !== '' && val !== 'all') {
      const opt = props.filterOptions[key]?.options?.find((o) => o.value === val)
      active.push({ key, label: props.filterOptions[key]?.label || key, value: opt?.label || val })
    }
  })
  return active
})

const getFieldType = (key) => {
  const opt = props.filterOptions[key]
  if (opt?.type) return opt.type
  if (opt?.options) return 'select'
  return 'text'
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
    <div class="p-4 border-b border-gray-100">
      <div class="flex flex-col lg:flex-row lg:items-center gap-3">
        <div class="relative flex-1 max-w-xl">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="localFilters.search"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            @keyup.enter="handleSubmit"
          />
          <button
            v-if="localFilters.search"
            type="button"
            @click="clearFilter('search')"
            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div
            v-for="key in quickFilters"
            :key="key"
            class="relative"
          >
            <select
              v-if="getFieldType(key) === 'select'"
              v-model="localFilters[key]"
              class="appearance-none pl-3 pr-9 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none cursor-pointer"
            >
              <option value="">全部 {{ filterOptions[key].label }}</option>
              <option
                v-for="opt in filterOptions[key].options"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
            <input
              v-else-if="getFieldType(key) === 'date'"
              v-model="localFilters[key]"
              type="date"
              class="pl-3 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
            <input
              v-else
              v-model="localFilters[key]"
              type="text"
              :placeholder="filterOptions[key]?.label || ''"
              class="pl-3 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>
        </div>

        <div class="flex items-center gap-2 ml-auto">
          <button
            v-if="advancedFilters.length > 0"
            type="button"
            @click="showAdvanced = !showAdvanced"
            class="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Filter class="w-4 h-4" />
            高级筛选
            <ChevronDown v-if="!showAdvanced" class="w-4 h-4" />
            <ChevronUp v-else class="w-4 h-4" />
          </button>

          <div class="relative">
            <select
              v-model="localFilters.perPage"
              class="appearance-none pl-3 pr-9 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none cursor-pointer"
            >
              <option
                v-for="n in perPageOptions"
                :key="n"
                :value="n"
              >
                {{ n }} 条/页
              </option>
            </select>
          </div>

          <button
            type="button"
            @click="handleSubmit"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus class="w-4 h-4" />
            应用筛选
          </button>

          <button
            type="button"
            @click="handleReset"
            class="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <RotateCcw class="w-4 h-4" />
            重置
          </button>
        </div>
      </div>

      <Transition name="slide">
        <div
          v-if="showAdvanced && advancedFilters.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100"
        >
          <div
            v-for="key in advancedFilters"
            :key="key"
            class="flex flex-col gap-1"
          >
            <label class="text-xs font-medium text-gray-500">
              {{ filterOptions[key]?.label || key }}
            </label>
            <select
              v-if="getFieldType(key) === 'select'"
              v-model="localFilters[key]"
              class="appearance-none pl-3 pr-9 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none cursor-pointer"
            >
              <option value="">全部</option>
              <option
                v-for="opt in filterOptions[key].options"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
            <input
              v-else-if="getFieldType(key) === 'date'"
              v-model="localFilters[key]"
              type="date"
              class="pl-3 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
            <input
              v-else
              v-model="localFilters[key]"
              type="text"
              class="pl-3 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>
        </div>
      </Transition>
    </div>

    <div
      v-if="activeFilters.length > 0"
      class="flex flex-wrap items-center gap-2 px-4 py-3 bg-gray-50/50 border-b border-gray-100"
    >
      <span class="text-xs font-medium text-gray-500 mr-1">当前筛选:</span>
      <div
        v-for="f in activeFilters"
        :key="f.key"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 rounded-full bg-blue-50 border border-blue-200"
      >
        <span class="text-blue-600/70">{{ f.label }}:</span>
        <span>{{ f.value }}</span>
        <button
          type="button"
          @click="clearFilter(f.key)"
          class="p-0.5 -mr-1 rounded text-blue-600/70 hover:text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <X class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
  border-top-width: 0;
}
.slide-enter-from > *,
.slide-leave-to > * {
  transform: translateY(-8px);
}
</style>
