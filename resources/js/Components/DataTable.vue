<script setup>import { ref, computed } from 'vue';
import { ChevronUp, ChevronDown, ArrowLeft, ArrowRight, MoreVertical } from 'lucide-vue-next';
import StatusBadge from './StatusBadge.vue';
const props = defineProps({
 columns: {
 type: Array,
 required: true,
 },
 data: {
 type: Array,
 default: () => [],
 },
 selectable: {
 type: Boolean,
 default: false,
 },
 onRowClick: {
 type: Function,
 default: null,
 },
 emptyText: {
 type: String,
 default: '暂无数据',
 },
 meta: {
 type: Object,
 default: () => ({}),
 },
 sortKey: {
 type: String,
 default: '',
 },
 sortDirection: {
 type: String,
 default: 'asc',
 },
 rowKey: {
 type: String,
 default: 'id',
 },
});
const emit = defineEmits(['sort', 'selection-change', 'row-click', 'page-change', 'action']);
const selected = ref(new Set());
const sortState = ref({
 key: props.sortKey,
 direction: props.sortDirection,
});
const currentPage = ref(props.meta.current_page || 1);
const isAllSelected = computed(() => {
 return props.data.length > 0 && props.data.every((row) => selected.value.has(row[props.rowKey]));
});
const isIndeterminate = computed(() => {
 const count = props.data.filter((row) => selected.value.has(row[props.rowKey])).length;
 return count > 0 && count < props.data.length;
});
const toggleSelectAll = () => {
 if (isAllSelected.value) {
 props.data.forEach((row) => selected.value.delete(row[props.rowKey]));
 }
 else {
 props.data.forEach((row) => selected.value.add(row[props.rowKey]));
 }
 emit('selection-change', Array.from(selected.value));
};
const toggleSelect = (row) => {
 const key = row[props.rowKey];
 if (selected.value.has(key)) {
 selected.value.delete(key);
 }
 else {
 selected.value.add(key);
 }
 emit('selection-change', Array.from(selected.value));
};
const handleSort = (column) => {
 if (!column.sortable)
 return;
 if (sortState.value.key === column.key) {
 sortState.value.direction = sortState.value.direction === 'asc' ? 'desc' : 'asc';
 }
 else {
 sortState.value.key = column.key;
 sortState.value.direction = 'asc';
 }
 emit('sort', { key: sortState.value.key, direction: sortState.value.direction });
};
const handleRowClick = (row, event) => {
 if (props.selectable && event.target.closest('input[type="checkbox"]'))
 return;
 if (props.onRowClick)
 props.onRowClick(row);
 emit('row-click', row);
};
const formatValue = (value, column, row) => {
 if (value === null || value === undefined)
 return '-';
 switch (column.renderAs) {
 case 'currency':
 return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(Number(value));
 case 'number':
 return new Intl.NumberFormat('zh-CN').format(Number(value));
 case 'date':
 return new Date(value).toLocaleDateString('zh-CN');
 case 'datetime':
 return new Date(value).toLocaleString('zh-CN');
 case 'relative':
 return formatRelative(value);
 default:
 return String(value);
 }
};
const formatRelative = (dateStr) => {
 const diff = Date.now() - new Date(dateStr).getTime();
 const mins = Math.floor(diff / 60000);
 if (mins < 1)
 return '刚刚';
 if (mins < 60)
 return `${mins}分钟前`;
 const hours = Math.floor(mins / 60);
 if (hours < 24)
 return `${hours}小时前`;
 const days = Math.floor(hours / 24);
 if (days < 30)
 return `${days}天前`;
 return new Date(dateStr).toLocaleDateString('zh-CN');
};
const goToPage = (page) => {
 if (page < 1 || page > (props.meta.last_page || 1))
 return;
 currentPage.value = page;
 emit('page-change', page);
};
const totalPages = computed(() => props.meta.last_page || 1);
const pageNumbers = computed(() => {
 const total = totalPages.value;
 const current = currentPage.value;
 const pages = [];
 if (total <= 7) {
 for (let i = 1; i <= total; i++)
 pages.push(i);
 }
 else {
 pages.push(1);
 if (current > 3)
 pages.push('...');
 for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++)
 pages.push(i);
 if (current < total - 2)
 pages.push('...');
 pages.push(total);
 }
 return pages;
});
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50/50">
            <th
              v-if="selectable"
              class="px-4 py-3 text-left w-12"
            >
              <div class="flex items-center">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate.prop="isIndeterminate"
                  @change="toggleSelectAll"
                  class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap',
                column.sortable ? 'cursor-pointer select-none hover:bg-gray-100/70 transition-colors' : '',
                column.width ? `w-[${column.width}]` : '',
              ]"
              @click="handleSort(column)"
            >
              <div class="flex items-center gap-1.5">
                {{ column.label }}
                <span
                  v-if="column.sortable"
                  class="flex flex-col items-center text-gray-300"
                >
                  <ChevronUp
                    :class="[
                      'w-3 h-3 -mb-1',
                      sortState.key === column.key && sortState.direction === 'asc' ? 'text-blue-600' : '',
                    ]"
                  />
                  <ChevronDown
                    :class="[
                      'w-3 h-3 -mt-1',
                      sortState.key === column.key && sortState.direction === 'desc' ? 'text-blue-600' : '',
                    ]"
                  />
                </span>
              </div>
            </th>
            <th
              v-if="columns.some((c) => c.actions)"
              class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"
            >
              操作
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-if="data.length === 0"
          >
            <td
              :colspan="columns.length + (selectable ? 1 : 0) + (columns.some((c) => c.actions) ? 1 : 0)"
              class="px-4 py-16 text-center"
            >
              <div class="flex flex-col items-center justify-center gap-2 text-gray-400">
                <svg
                  class="w-16 h-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p class="text-sm font-medium">{{ emptyText }}</p>
              </div>
            </td>
          </tr>
          <tr
            v-for="(row, index) in data"
            :key="row[rowKey] || index"
            :class="[
              'transition-colors',
              onRowClick || selectable ? 'cursor-pointer hover:bg-gray-50' : '',
              selected.has(row[rowKey]) ? 'bg-blue-50/50' : '',
            ]"
            @click="handleRowClick(row, $event)"
          >
            <td
              v-if="selectable"
              class="px-4 py-3"
              @click.stop
            >
              <input
                type="checkbox"
                :checked="selected.has(row[rowKey])"
                @change="toggleSelect(row)"
                class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </td>
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-3 text-sm"
            >
              <slot
                v-if="$slots[`cell-${column.key}`]"
                :name="`cell-${column.key}`"
                :row="row"
                :column="column"
                :value="row[column.key]"
              />
              <StatusBadge
                v-else-if="column.renderAs === 'status'"
                :status="row[column.key]"
                :status-options="column.statusOptions || []"
              />
              <span
                v-else-if="column.renderAs === 'badge'"
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  column.badgeClass
                    ? column.badgeClass(row[column.key], row)
                    : 'bg-gray-100 text-gray-700',
                ]"
              >
                {{ column.badgeLabel ? column.badgeLabel(row[column.key], row) : row[column.key] }}
              </span>
              <a
                v-else-if="column.renderAs === 'link'"
                :href="column.linkUrl ? column.linkUrl(row) : '#'"
                @click.prevent="column.onLinkClick && column.onLinkClick(row)"
                class="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                {{ row[column.key] }}
              </a>
              <template v-else>
                {{ formatValue(row[column.key], column, row) }}
              </template>
            </td>
            <td
              v-if="columns.some((c) => c.actions)"
              class="px-4 py-3 text-right"
            >
              <div class="relative inline-block">
                <button
                  type="button"
                  @click.stop
                  class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="meta.total !== undefined && meta.total > 0"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/30"
    >
      <p class="text-sm text-gray-500">
        共
        <span class="font-medium text-gray-900">{{ meta.total }}</span>
        条记录，第
        <span class="font-medium text-gray-900">{{ meta.current_page || 1 }}</span>
        /
        <span class="font-medium text-gray-900">{{ meta.last_page || 1 }}</span>
        页
      </p>
      <div class="flex items-center gap-1">
        <button
          type="button"
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage <= 1"
          :class="[
            'inline-flex items-center justify-center p-2 rounded-lg text-sm transition-colors',
            currentPage <= 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
          ]"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <template v-for="page in pageNumbers" :key="page">
          <span
            v-if="page === '...'"
            class="px-3 py-2 text-sm text-gray-400"
          >
            ...
          </span>
          <button
            v-else
            type="button"
            @click="goToPage(page)"
            :class="[
              'min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
            ]"
          >
            {{ page }}
          </button>
        </template>
        <button
          type="button"
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage >= totalPages"
          :class="[
            'inline-flex items-center justify-center p-2 rounded-lg text-sm transition-colors',
            currentPage >= totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
          ]"
        >
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
