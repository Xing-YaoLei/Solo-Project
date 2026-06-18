<script setup>
import { computed, ref } from 'vue'
import { usePage, useForm, router, Head, Link } from '@inertiajs/vue3'
import {
    Search, Filter, ChevronDown, ChevronUp, Plus, Download,
    CheckCircle2, XCircle, UserCheck, Star, Calendar, Clock,
    Eye, Edit3, FileText, User, Car, Phone, Trash2,
    SlidersHorizontal, LayoutGrid, Users, AlertTriangle, X
} from 'lucide-vue-next'

const page = usePage()

const testDrives = computed(() => page.props.testDrives || { data: [], links: [] })
const filters = computed(() => page.props.filters || {})
const aggregates = computed(() => page.props.aggregates || { total: 0, pending: 0, completed: 0, no_show: 0 })
const filterOptions = computed(() => page.props.filterOptions || {
    statuses: [], stores: [], salesUsers: [], assignedUsers: [], responsibilityRoles: []
})

const showAdvanced = ref(false)
const selectedIds = ref([])
const showAssignModal = ref(false)

const form = useForm({
    search: filters.value.search || '',
    status: filters.value.status || '',
    store_id: filters.value.store_id || '',
    sales_user_id: filters.value.sales_user_id || '',
    assigned_user_id: filters.value.assigned_user_id || '',
    date_from: filters.value.date_from || '',
    date_to: filters.value.date_to || '',
    is_no_show: filters.value.is_no_show ?? '',
    responsibility_role: filters.value.responsibility_role || '',
})

const assignForm = useForm({
    assigned_user_id: '',
})

const statusColors = {
    pending: 'badge-warning',
    confirmed: 'badge-info',
    in_progress: 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-gray',
    no_show: 'badge-danger',
}

const allSelected = computed(() => {
    return testDrives.value.data.length > 0 && selectedIds.value.length === testDrives.value.data.length
})

const partialSelected = computed(() => {
    return selectedIds.value.length > 0 && selectedIds.value.length < testDrives.value.data.length
})

function toggleAll() {
    if (allSelected.value) {
        selectedIds.value = []
    } else {
        selectedIds.value = testDrives.value.data.map(t => t.id)
    }
}

function toggleOne(id) {
    const idx = selectedIds.value.indexOf(id)
    if (idx >= 0) {
        selectedIds.value.splice(idx, 1)
    } else {
        selectedIds.value.push(id)
    }
}

function submitFilters() {
    router.get(route('test-drives.index'), form.data(), { preserveState: true, replace: true })
}

function setStatusFilter(status) {
    form.status = status
    submitFilters()
}

function resetFilters() {
    form.reset()
    form.is_no_show = ''
    router.get(route('test-drives.index'), {}, { preserveState: true, replace: true })
}

function batchConfirm() {
    if (!selectedIds.value.length) return
    router.post(route('test-drives.batch-confirm'), { ids: selectedIds.value }, {
        onSuccess: () => { selectedIds.value = [] }
    })
}

function batchClose() {
    if (!selectedIds.value.length) return
    if (confirm('确定要批量关闭选中的预约吗？')) {
        router.post(route('test-drives.batch-close'), { ids: selectedIds.value }, {
            onSuccess: () => { selectedIds.value = [] }
        })
    }
}

function openAssignModal() {
    assignForm.reset()
    showAssignModal.value = true
}

function submitAssign() {
    if (!selectedIds.value.length || !assignForm.assigned_user_id) return
    router.post(route('test-drives.batch-assign'), {
        ids: selectedIds.value,
        assigned_user_id: assignForm.assigned_user_id,
    }, {
        onSuccess: () => {
            selectedIds.value = []
            showAssignModal.value = false
        }
    })
}

function exportData() {
    router.get(route('test-drives.export'), form.data())
}

function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) => i < (rating || 0))
}
</script>

<template>
    <Head title="试驾预约列表" />

    <div class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-white">试驾预约管理</h1>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    管理所有试驾预约，支持批量操作与多维度筛选
                </p>
            </div>
            <div class="flex flex-wrap gap-2">
                <button @click="exportData" class="btn-secondary">
                    <Download class="w-4 h-4" />
                    导出
                </button>
                <Link :href="route('test-drives.create')" class="btn-primary">
                    <Plus class="w-4 h-4" />
                    新增试驾
                </Link>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
                @click="setStatusFilter('')"
                class="stat-card text-left transition-all hover:ring-2 hover:ring-indigo-500"
                :class="!form.status ? 'ring-2 ring-indigo-500' : ''"
            >
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <LayoutGrid class="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                        <p class="text-xs text-slate-500 dark:text-slate-400">总数</p>
                        <p class="text-xl font-bold text-slate-900 dark:text-white">{{ $filters.number(aggregates.total) }}</p>
                    </div>
                </div>
            </button>
            <button
                @click="setStatusFilter('pending')"
                class="stat-card text-left transition-all hover:ring-2 hover:ring-amber-500"
                :class="form.status === 'pending' ? 'ring-2 ring-amber-500' : ''"
            >
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                        <Clock class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p class="text-xs text-slate-500 dark:text-slate-400">待确认</p>
                        <p class="text-xl font-bold text-amber-600 dark:text-amber-400">{{ $filters.number(aggregates.pending) }}</p>
                    </div>
                </div>
            </button>
            <button
                @click="setStatusFilter('completed')"
                class="stat-card text-left transition-all hover:ring-2 hover:ring-emerald-500"
                :class="form.status === 'completed' ? 'ring-2 ring-emerald-500' : ''"
            >
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p class="text-xs text-slate-500 dark:text-slate-400">已完成</p>
                        <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{{ $filters.number(aggregates.completed) }}</p>
                    </div>
                </div>
            </button>
            <button
                @click="() => { form.is_no_show = form.is_no_show === 1 ? '' : 1; submitFilters() }"
                class="stat-card text-left transition-all hover:ring-2 hover:ring-red-500"
                :class="form.is_no_show === 1 ? 'ring-2 ring-red-500' : ''"
            >
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle class="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <p class="text-xs text-slate-500 dark:text-slate-400">爽约</p>
                        <p class="text-xl font-bold text-red-600 dark:text-red-400">{{ $filters.number(aggregates.no_show) }}</p>
                    </div>
                </div>
            </button>
        </div>

        <div class="card">
            <div class="card-body space-y-4">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div class="lg:col-span-2">
                        <label class="label">搜索</label>
                        <div class="relative">
                            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                v-model="form.search"
                                type="text"
                                class="input pl-10"
                                placeholder="搜索编号、客户姓名、电话、车牌..."
                                @keyup.enter="submitFilters"
                            />
                        </div>
                    </div>
                    <div>
                        <label class="label">状态</label>
                        <select v-model="form.status" class="select" @change="submitFilters">
                            <option value="">全部状态</option>
                            <option v-for="opt in filterOptions.statuses" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="label">门店</label>
                        <select v-model="form.store_id" class="select" @change="submitFilters">
                            <option value="">全部门店</option>
                            <option v-for="opt in filterOptions.stores" :key="opt.id" :value="opt.id">
                                {{ opt.name }}
                            </option>
                        </select>
                    </div>
                </div>

                <div v-show="showAdvanced" class="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2 lg:grid-cols-4 border-t border-slate-100 dark:border-slate-700/50">
                    <div>
                        <label class="label">销售顾问</label>
                        <select v-model="form.sales_user_id" class="select" @change="submitFilters">
                            <option value="">全部销售</option>
                            <option v-for="opt in filterOptions.salesUsers" :key="opt.id" :value="opt.id">
                                {{ opt.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="label">处理人</label>
                        <select v-model="form.assigned_user_id" class="select" @change="submitFilters">
                            <option value="">全部处理人</option>
                            <option v-for="opt in filterOptions.assignedUsers" :key="opt.id" :value="opt.id">
                                {{ opt.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="label">责任角色</label>
                        <select v-model="form.responsibility_role" class="select" @change="submitFilters">
                            <option value="">全部角色</option>
                            <option v-for="opt in filterOptions.responsibilityRoles" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="label">仅爽约</label>
                        <div class="flex gap-4 pt-2">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" v-model="form.is_no_show" :value="''" @change="submitFilters" class="w-4 h-4 text-indigo-600" />
                                <span class="text-sm text-slate-700 dark:text-slate-300">全部</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" v-model="form.is_no_show" :value="1" @change="submitFilters" class="w-4 h-4 text-indigo-600" />
                                <span class="text-sm text-slate-700 dark:text-slate-300">仅爽约</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" v-model="form.is_no_show" :value="0" @change="submitFilters" class="w-4 h-4 text-indigo-600" />
                                <span class="text-sm text-slate-700 dark:text-slate-300">非爽约</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label class="label">预约开始日期</label>
                        <input v-model="form.date_from" type="date" class="input" @change="submitFilters" />
                    </div>
                    <div>
                        <label class="label">预约结束日期</label>
                        <input v-model="form.date_to" type="date" class="input" @change="submitFilters" />
                    </div>
                </div>

                <div class="flex items-center justify-between pt-2">
                    <button @click="showAdvanced = !showAdvanced" class="btn-link text-xs">
                        <SlidersHorizontal class="w-3.5 h-3.5" />
                        {{ showAdvanced ? '收起高级筛选' : '展开高级筛选' }}
                        <component :is="showAdvanced ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
                    </button>
                    <div class="flex gap-2">
                        <button @click="resetFilters" class="btn-ghost text-sm">重置</button>
                        <button @click="submitFilters" class="btn-primary text-sm">
                            <Filter class="w-4 h-4" />
                            应用筛选
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div v-if="selectedIds.length > 0" class="card-header bg-indigo-50/50 dark:bg-indigo-500/10 border-b border-indigo-100 dark:border-indigo-500/20">
                <div class="flex flex-wrap items-center gap-3">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" :checked="allSelected" :indeterminate="partialSelected" @change="toggleAll" class="w-4 h-4 text-indigo-600 rounded" />
                        <span class="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                            已选择 {{ selectedIds.length }} 条
                        </span>
                    </label>
                    <div class="h-4 w-px bg-indigo-200 dark:bg-indigo-500/30"></div>
                    <button @click="batchConfirm" class="btn-success text-sm px-3 py-1.5">
                        <CheckCircle2 class="w-4 h-4" />
                        批量确认
                    </button>
                    <button @click="batchClose" class="btn-warning text-sm px-3 py-1.5">
                        <XCircle class="w-4 h-4" />
                        批量关闭
                    </button>
                    <button @click="openAssignModal" class="btn-secondary text-sm px-3 py-1.5">
                        <UserCheck class="w-4 h-4" />
                        批量分配
                    </button>
                    <button @click="selectedIds = []" class="btn-ghost text-sm ml-auto">
                        <X class="w-4 h-4" />
                        取消选择
                    </button>
                </div>
            </div>

            <div class="scroll-x">
                <table class="table">
                    <thead>
                        <tr>
                            <th class="w-10">
                                <input
                                    v-if="testDrives.data.length"
                                    type="checkbox"
                                    :checked="allSelected"
                                    :indeterminate="partialSelected"
                                    @change="toggleAll"
                                    class="w-4 h-4 text-indigo-600 rounded"
                                />
                            </th>
                            <th>编号</th>
                            <th>客户</th>
                            <th>车辆</th>
                            <th>预约时间</th>
                            <th>状态</th>
                            <th>销售顾问</th>
                            <th>处理人</th>
                            <th>爽约</th>
                            <th>满意度</th>
                            <th class="text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-if="testDrives.data.length">
                            <tr v-for="td in testDrives.data" :key="td.id">
                                <td>
                                    <input
                                        type="checkbox"
                                        :checked="selectedIds.includes(td.id)"
                                        @change="toggleOne(td.id)"
                                        class="w-4 h-4 text-indigo-600 rounded"
                                    />
                                </td>
                                <td>
                                    <Link :href="route('test-drives.show', td.id)" class="font-mono text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                                        {{ td.code }}
                                    </Link>
                                </td>
                                <td>
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                            <User class="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div class="min-w-0">
                                            <div class="font-medium text-slate-900 dark:text-white text-sm truncate max-w-[120px]">
                                                {{ td.customer?.name || '-' }}
                                            </div>
                                            <a v-if="td.customer?.phone" :href="'tel:' + td.customer.phone" class="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                                                {{ td.customer.phone }}
                                            </a>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="flex items-center gap-2">
                                        <Car class="w-4 h-4 text-slate-400 shrink-0" />
                                        <div class="min-w-0">
                                            <div class="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                                                {{ td.vehicle?.brand || '' }} {{ td.vehicle?.model || '' }}
                                            </div>
                                            <div class="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                {{ td.vehicle?.plate_number || '-' }}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="flex items-center gap-2">
                                        <Calendar class="w-4 h-4 text-slate-400 shrink-0" />
                                        <div>
                                            <div class="text-sm text-slate-700 dark:text-slate-300">
                                                {{ $filters.date(td.scheduled_start, 'YYYY-MM-DD') }}
                                            </div>
                                            <div class="text-xs text-slate-500 dark:text-slate-400">
                                                {{ $filters.date(td.scheduled_start, 'HH:mm') }} - {{ $filters.date(td.scheduled_end, 'HH:mm') }}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span :class="statusColors[td.status] || 'badge-gray'">
                                        {{ td.status_label || filterOptions.statuses.find(s => s.value === td.status)?.label || td.status }}
                                    </span>
                                </td>
                                <td>
                                    <div v-if="td.sales_user" class="flex items-center gap-1.5">
                                        <Users class="w-3.5 h-3.5 text-slate-400" />
                                        <span class="text-sm text-slate-700 dark:text-slate-300">{{ td.sales_user.name }}</span>
                                    </div>
                                    <span v-else class="text-xs text-slate-400">-</span>
                                </td>
                                <td>
                                    <div v-if="td.assigned_user" class="flex items-center gap-1.5">
                                        <UserCheck class="w-3.5 h-3.5 text-slate-400" />
                                        <span class="text-sm text-slate-700 dark:text-slate-300">{{ td.assigned_user.name }}</span>
                                    </div>
                                    <span v-else class="text-xs text-slate-400">-</span>
                                </td>
                                <td>
                                    <span v-if="td.is_no_show" class="badge-danger">
                                        <AlertTriangle class="w-3 h-3" />
                                        爽约
                                    </span>
                                    <span v-else class="text-xs text-slate-400">-</span>
                                </td>
                                <td>
                                    <div v-if="td.satisfaction" class="flex items-center gap-0.5">
                                        <Star
                                            v-for="(filled, i) in renderStars(td.satisfaction)"
                                            :key="i"
                                            class="w-3.5 h-3.5"
                                            :class="filled ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-600'"
                                        />
                                    </div>
                                    <span v-else class="text-xs text-slate-400">-</span>
                                </td>
                                <td class="text-right">
                                    <div class="flex items-center justify-end gap-1">
                                        <Link :href="route('test-drives.show', td.id)" class="btn-ghost p-1.5" title="查看">
                                            <Eye class="w-4 h-4" />
                                        </Link>
                                        <Link
                                            v-if="td.status === 'pending'"
                                            :href="route('test-drives.show', td.id) + '#confirm'"
                                            class="btn-ghost p-1.5 text-emerald-600 hover:text-emerald-700"
                                            title="确认"
                                        >
                                            <CheckCircle2 class="w-4 h-4" />
                                        </Link>
                                        <button
                                            v-if="td.status === 'completed' && !td.satisfaction"
                                            class="btn-ghost p-1.5 text-indigo-600 hover:text-indigo-700"
                                            title="补充信息"
                                        >
                                            <Edit3 class="w-4 h-4" />
                                        </button>
                                        <button
                                            v-if="['pending', 'confirmed', 'in_progress'].includes(td.status)"
                                            class="btn-ghost p-1.5 text-red-600 hover:text-red-700"
                                            title="关闭"
                                        >
                                            <XCircle class="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </template>
                        <tr v-else>
                            <td colspan="11" class="text-center py-12 text-slate-500 dark:text-slate-400">
                                <FileText class="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                                <p>暂无试驾预约数据</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="testDrives.links && testDrives.links.length > 1" class="card-footer">
                <nav class="flex items-center justify-between">
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                        第 {{ testDrives.current_page }} 页，共 {{ testDrives.last_page }} 页
                    </p>
                    <div class="flex gap-1">
                        <template v-for="link in testDrives.links" :key="link.url || 'nav-' + link.label">
                            <button
                                v-if="link.url"
                                @click="router.get(link.url, {}, { preserveState: true })"
                                v-html="link.label"
                                :class="link.active ? 'btn-primary text-sm px-3 py-1.5' : 'btn-secondary text-sm px-3 py-1.5'"
                            ></button>
                            <span
                                v-else
                                v-html="link.label"
                                class="btn-secondary text-sm px-3 py-1.5 opacity-50 cursor-not-allowed"
                            ></span>
                        </template>
                    </div>
                </nav>
            </div>
        </div>
    </div>

    <Teleport to="body">
        <div v-if="showAssignModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div class="card w-full max-w-md">
                <div class="card-header flex items-center justify-between">
                    <h3 class="font-semibold text-slate-900 dark:text-white">批量分配处理人</h3>
                    <button @click="showAssignModal = false" class="btn-ghost p-1">
                        <X class="w-5 h-5" />
                    </button>
                </div>
                <div class="card-body space-y-4">
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                        将为已选中的 <span class="font-semibold text-indigo-600">{{ selectedIds.length }}</span> 条预约分配处理人
                    </p>
                    <div>
                        <label class="label">选择处理人 <span class="text-red-500">*</span></label>
                        <select v-model="assignForm.assigned_user_id" class="select">
                            <option value="">请选择处理人</option>
                            <option v-for="opt in filterOptions.assignedUsers" :key="opt.id" :value="opt.id">
                                {{ opt.name }}
                            </option>
                        </select>
                    </div>
                </div>
                <div class="card-footer flex justify-end gap-2">
                    <button @click="showAssignModal = false" class="btn-secondary">取消</button>
                    <button @click="submitAssign" :disabled="!assignForm.assigned_user_id" class="btn-primary">
                        确认分配
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
