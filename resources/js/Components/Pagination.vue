<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, Home } from 'lucide-vue-next'

const props = defineProps({
  links: {
    type: Array,
    default: () => [],
  },
  meta: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['page-change'])

const currentPage = computed(() => props.meta.current_page || 1)
const lastPage = computed(() => props.meta.last_page || 1)
const total = computed(() => props.meta.total || 0)
const perPage = computed(() => props.meta.per_page || 10)
const from = computed(() => total.value === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1)
const to = computed(() => Math.min(currentPage.value * perPage.value, total.value))

const pageNumbers = computed(() => {
  const totalP = lastPage.value
  const current = currentPage.value
  const pages = []
  if (totalP <= 7) {
    for (let i = 1; i <= totalP; i++) pages.push({ num: i, active: i === current })
  } else {
    pages.push({ num: 1, active: current === 1 })
    if (current > 3) pages.push({ num: '...' })
    for (let i = Math.max(2, current - 1); i <= Math.min(totalP - 1, current + 1); i++) {
      pages.push({ num: i, active: i === current })
    }
    if (current < totalP - 2) pages.push({ num: '...' })
    pages.push({ num: totalP, active: current === totalP })
  }
  return pages
})

const goToPage = (page) => {
  if (page === '...' || page < 1 || page > lastPage.value) return
  emit('page-change', page)
}
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
    <div class="flex items-center gap-4">
      <p class="text-sm text-gray-600">
        显示第
        <span class="font-semibold text-gray-900">{{ from }}</span>
        至
        <span class="font-semibold text-gray-900">{{ to }}</span>
        条，共
        <span class="font-semibold text-gray-900">{{ total }}</span>
        条记录
      </p>
    </div>

    <div class="flex items-center gap-1">
      <button
        type="button"
        @click="goToPage(1)"
        :disabled="currentPage <= 1"
        :class="[
          'inline-flex items-center justify-center p-2 rounded-lg text-sm border transition-all',
          currentPage <= 1
            ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-white'
            : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white',
        ]"
        title="首页"
      >
        <Home class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage <= 1"
        :class="[
          'inline-flex items-center justify-center p-2 rounded-lg text-sm border transition-all',
          currentPage <= 1
            ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-white'
            : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white',
        ]"
        title="上一页"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <template v-for="(page, idx) in pageNumbers" :key="idx">
        <span
          v-if="page.num === '...'"
          class="px-2 py-2 text-sm text-gray-400"
        >
          ...
        </span>
        <button
          v-else
          type="button"
          @click="goToPage(page.num)"
          :class="[
            'min-w-[38px] h-9 px-3 rounded-lg text-sm font-semibold border transition-all',
            page.active
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20'
              : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50',
          ]"
        >
          {{ page.num }}
        </button>
      </template>

      <button
        type="button"
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage >= lastPage"
        :class="[
          'inline-flex items-center justify-center p-2 rounded-lg text-sm border transition-all',
          currentPage >= lastPage
            ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-white'
            : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white',
        ]"
        title="下一页"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="goToPage(lastPage)"
        :disabled="currentPage >= lastPage"
        :class="[
          'inline-flex items-center justify-center p-2 rounded-lg text-sm border transition-all',
          currentPage >= lastPage
            ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-white'
            : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white',
        ]"
        title="末页"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
        </svg>
      </button>
    </div>
  </div>
</template>
