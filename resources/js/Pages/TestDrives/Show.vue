<script setup>
import { computed, ref } from 'vue'
import { usePage, useForm, router, Head, Link } from '@inertiajs/vue3'
import {
    ArrowLeft, Phone, User, Car, Building2, Users, UserCheck,
    Clock, Calendar, Gauge, Fuel, Star, AlertTriangle, FileText,
    Edit3, CheckCircle2, XCircle, MessageSquare, Paperclip,
    MessageCircle, Clock3, Plus, X, Save, Tag, AlertOctagon,
    Wrench, MapPin, Route, ChevronRight, UserX, Eye
} from 'lucide-vue-next'

const page = usePage()

const testDrive = computed(() => page.props.testDrive || {})
const statusOptions = computed(() => page.props.statusOptions || [])
const responsibilityOptions = computed(() => page.props.responsibilityOptions || [])
const canEdit = computed(() => page.props.canEdit ?? true)
const canAdjustResponsibility = computed(() => page.props.canAdjustResponsibility ?? true)
const canClose = computed(() => page.props.canClose ?? true)
const isMobile = computed(() => page.props.isMobile ?? false)

const activeTab = ref('details')
const showNoShowModal = ref(false)
const showAdjustModal = ref(false)
const isEditing = ref(false)

const editForm = useForm({
    scheduled_start: testDrive.value.scheduled_start || '',
    scheduled_end: testDrive.value.scheduled_end || '',
    vehicle_id: testDrive.value.vehicle_id || '',
    sales_user_id: testDrive.value.sales_user_id || '',
    companion_user_id: testDrive.value.companion_user_id || '',
    assigned_user_id: testDrive.value.assigned_user_id || '',
    test_drive_type: testDrive.value.test_drive_type || 'standard',
    pickup_location: testDrive.value.pickup_location || '',
    return_location: testDrive.value.return_location || '',
    planned_route: testDrive.value.planned_route || '',
    remarks: testDrive.value.remarks || '',
})

const noShowForm = useForm({
    reason: '',
    impact_scope: '',
    note: '',
})

const adjustForm = useForm({
    new_responsibility_role: '',
    new_assigned_user_id: '',
    reason: '',
    impact_scope: '',
    additional_note: '',
    link_review_material: '',
})

const timelineSteps = [
    { key: 'pending', label: '预约', desc: '已创建预约' },
    { key: 'confirmed', label: '确认', desc: '已确认到店' },
    { key: 'in_progress', label: '试驾中', desc: '正在试驾' },
    { key: 'completed', label: '完成', desc: '试驾已完成' },
]

const statusColors = {
    pending: 'badge-warning',
    confirmed: 'badge-info',
    in_progress: 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-gray',
    no_show: 'badge-danger',
}

const statusBgColors = {
    pending: 'bg-amber-500',
    confirmed: 'bg-sky-500',
    in_progress: 'bg-indigo-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-slate-500',
    no_show: 'bg-red-500',
}

const currentStepIndex = computed(() => {
    const idx = timelineSteps.findIndex(s => s.key === testDrive.value.status)
    return testDrive.value.is_no_show ? -1 : (idx >= 0 ? idx : 0)
})

const tabs = [
    { key: 'details', label: '详情', icon: FileText },
    { key: 'followups', label: '跟进记录', icon: MessageSquare },
    { key: 'reviews', label: '复盘材料', icon: AlertOctagon },
    { key: 'attachments', label: '附件', icon: Paperclip },
    { key: 'notes', label: '备注', icon: MessageCircle },
    { key: 'timeline', label: '时间线', icon: Clock3 },
]

const renderStars = (rating) => Array.from({ length: 5 }, (_, i) => i < (rating || 0))

function saveEdit() {
    router.put(route('test-drives.update', testDrive.value.id), editForm.data(), {
        onSuccess: () => { isEditing.value = false }
    })
}

function markNoShow() {
    router.post(route('test-drives.mark-no-show', testDrive.value.id), noShowForm.data(), {
        onSuccess: () => {
            showNoShowModal.value = false
            noShowForm.reset()
        }
    })
}

function submitAdjust() {
    router.post(route('test-drives.adjust-responsibility', testDrive.value.id), adjustForm.data(), {
        onSuccess: () => {
            showAdjustModal.value = false
            adjustForm.reset()
        }
    })
}

function confirmAppointment() {
    router.post(route('test-drives.confirm', testDrive.value.id), {}, {})
}

function closeAppointment() {
    if (confirm('确定要关闭此试驾预约吗？')) {
        router.post(route('test-drives.close', testDrive.value.id), {}, {})
    }
}
</script>

<template>
    <Head :title="'试驾详情 - ' + (testDrive.code || '')" />

    <div class="space-y-6 lg:pr-0 xl:pr-56">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
                <Link :href="route('test-drives.index')" class="btn-ghost p-2">
                    <ArrowLeft class="w-5 h-5" />
                </Link>
                <div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-mono text-sm text-slate-500">{{ testDrive.code }}</span>
                        <span
                            :class="statusColors[testDrive.status] || 'badge-gray'"
                            class="text-sm px-3 py-1"
                        >
                            {{ testDrive.status_label || statusOptions.find(s => s.value === testDrive.status)?.label || testDrive.status }}
                        </span>
                        <span v-if="testDrive.is_no_show" class="badge-danger text-sm px-3 py-1">
                            <AlertTriangle class="w-3.5 h-3.5" />
                            已爽约
                        </span>
                    </div>
                    <h1 class="mt-1 text-xl font-bold text-slate-900 dark:text-white">试驾预约详情</h1>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div class="space-y-4 lg:col-span-4">
                        <div>
                            <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">客户</p>
                            <div class="mt-2 flex items-start gap-3">
                                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                    {{ testDrive.customer?.name?.charAt?.(0) || '?' }}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="font-semibold text-slate-900 dark:text-white truncate">
                                        {{ testDrive.customer?.name || '-' }}
                                    </p>
                                    <a
                                        v-if="testDrive.customer?.phone"
                                        :href="'tel:' + testDrive.customer.phone"
                                        class="inline-flex items-center gap-1 mt-0.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                    >
                                        <Phone class="w-3.5 h-3.5" />
                                        {{ testDrive.customer.phone }}
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">车辆</p>
                            <div class="mt-2 flex items-start gap-3">
                                <div class="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
                                    <Car class="w-6 h-6 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="font-semibold text-slate-900 dark:text-white truncate">
                                        {{ testDrive.vehicle?.brand || '' }} {{ testDrive.vehicle?.model || '-' }}
                                    </p>
                                    <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400 font-mono">
                                        {{ testDrive.vehicle?.plate_number || '-' }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="lg:col-span-5">
                        <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">状态时间线</p>
                        <div class="relative">
                            <div v-if="testDrive.is_no_show" class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                                <div class="flex items-center gap-2 text-red-700 dark:text-red-300">
                                    <UserX class="w-5 h-5" />
                                    <span class="font-semibold text-sm">客户爽约</span>
                                </div>
                                <p class="mt-1 text-xs text-red-600 dark:text-red-400">
                                    {{ testDrive.no_show_reason || '需要您处理相关后续事宜' }}
                                </p>
                            </div>
                            <div class="relative">
                                <div class="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-200 dark:bg-slate-700">
                                    <div
                                        class="w-full transition-all duration-500"
                                        :class="currentStepIndex >= 0 ? 'bg-indigo-500 h-' + Math.max(0, Math.min(100, (currentStepIndex / 3) * 100)) : 'bg-transparent h-0'"
                                        :style="{ height: currentStepIndex >= 0 ? ((currentStepIndex / 3) * 100) + '%' : '0%' }"
                                    ></div>
                                </div>
                                <div class="space-y-4 relative">
                                    <div
                                        v-for="(step, idx) in timelineSteps"
                                        :key="step.key"
                                        class="flex items-start gap-4"
                                    >
                                        <div
                                            class="relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all"
                                            :class="[
                                                idx <= currentStepIndex
                                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                                            ]"
                                        >
                                            <CheckCircle2 v-if="idx < currentStepIndex" class="w-5 h-5" />
                                            <span v-else class="font-semibold text-sm">{{ idx + 1 }}</span>
                                        </div>
                                        <div class="pt-1.5">
                                            <p
                                                class="font-semibold text-sm"
                                                :class="idx <= currentStepIndex ? 'text-slate-900 dark:text-white' : 'text-slate-400'"
                                            >
                                                {{ step.label }}
                                            </p>
                                            <p class="text-xs text-slate-500 dark:text-slate-400">{{ step.desc }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4 lg:col-span-3">
                        <div>
                            <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">门店</p>
                            <div class="mt-2 flex items-center gap-2">
                                <Building2 class="w-4 h-4 text-slate-400" />
                                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {{ testDrive.store?.name || '-' }}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">销售顾问</p>
                            <div class="mt-2 flex items-center gap-2">
                                <Users class="w-4 h-4 text-slate-400" />
                                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {{ testDrive.sales_user?.name || '-' }}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">陪同人员</p>
                            <div class="mt-2 flex items-center gap-2">
                                <User class="w-4 h-4 text-slate-400" />
                                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {{ testDrive.companion_user?.name || '无' }}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">处理人</p>
                            <div class="mt-2 flex items-center gap-2">
                                <UserCheck class="w-4 h-4 text-slate-400" />
                                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {{ testDrive.assigned_user?.name || '未分配' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <div class="stat-card">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar class="w-4 h-4" />
                    <span class="text-xs">预约时间</span>
                </div>
                <p class="mt-2 font-semibold text-sm text-slate-900 dark:text-white">
                    {{ $filters.date(testDrive.scheduled_start, 'MM-DD') }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ $filters.date(testDrive.scheduled_start, 'HH:mm') }} - {{ $filters.date(testDrive.scheduled_end, 'HH:mm') }}
                </p>
            </div>
            <div class="stat-card">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Clock class="w-4 h-4" />
                    <span class="text-xs">实际时间</span>
                </div>
                <p class="mt-2 font-semibold text-sm text-slate-900 dark:text-white">
                    {{ testDrive.actual_start ? $filters.date(testDrive.actual_start, 'MM-DD') : '-' }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ testDrive.actual_start ? $filters.date(testDrive.actual_start, 'HH:mm') + ' - ' + $filters.date(testDrive.actual_end, 'HH:mm') : '未开始' }}
                </p>
            </div>
            <div class="stat-card">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Gauge class="w-4 h-4" />
                    <span class="text-xs">里程（km）</span>
                </div>
                <div class="mt-2 flex items-baseline gap-1">
                    <span class="font-semibold text-sm text-slate-900 dark:text-white">{{ $filters.number(testDrive.start_mileage || 0) }}</span>
                    <span class="text-slate-400 text-xs">→</span>
                    <span class="font-semibold text-sm text-slate-900 dark:text-white">{{ $filters.number(testDrive.end_mileage || 0) }}</span>
                </div>
                <p class="text-xs text-emerald-600 dark:text-emerald-400">
                    行驶 {{ $filters.number((testDrive.end_mileage || 0) - (testDrive.start_mileage || 0)) }}km
                </p>
            </div>
            <div class="stat-card">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Fuel class="w-4 h-4" />
                    <span class="text-xs">油位</span>
                </div>
                <div class="mt-2 flex items-baseline gap-1">
                    <span class="font-semibold text-sm text-slate-900 dark:text-white">{{ testDrive.start_fuel || 0 }}%</span>
                    <span class="text-slate-400 text-xs">→</span>
                    <span class="font-semibold text-sm text-slate-900 dark:text-white">{{ testDrive.end_fuel || 0 }}%</span>
                </div>
                <p :class="['text-xs', (testDrive.end_fuel ?? 100) < (testDrive.start_fuel ?? 100) ? 'text-amber-600' : 'text-slate-500']">
                    {{ (testDrive.end_fuel ?? 0) < (testDrive.start_fuel ?? 0) ? '需加油' : '正常' }}
                </p>
            </div>
            <div class="stat-card">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Star class="w-4 h-4" />
                    <span class="text-xs">满意度</span>
                </div>
                <div class="mt-2 flex gap-0.5">
                    <Star
                        v-for="(filled, i) in renderStars(testDrive.satisfaction)"
                        :key="i"
                        class="w-4 h-4"
                        :class="filled ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-600'"
                    />
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ testDrive.satisfaction ? testDrive.satisfaction + '分' : '未评价' }}
                </p>
            </div>
            <div class="stat-card">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <AlertTriangle class="w-4 h-4" />
                    <span class="text-xs">异常记录</span>
                </div>
                <p class="mt-2 font-semibold text-sm">
                    <span :class="(testDrive.has_accident || testDrive.has_violation) ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">
                        {{ (testDrive.has_accident || testDrive.has_violation) ? '有异常' : '无异常' }}
                    </span>
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    事故: {{ testDrive.has_accident ? '是' : '否' }} · 违章: {{ testDrive.has_violation ? '是' : '否' }}
                </p>
            </div>
        </div>

        <div class="card">
            <div class="card-header px-5 py-0 overflow-x-auto -mx-5">
                <div class="flex min-w-max">
                    <button
                        v-for="tab in tabs"
                        :key="tab.key"
                        @click="activeTab = tab.key"
                        :class="activeTab === tab.key ? 'tab-active' : 'tab-inactive'"
                    >
                        <component :is="tab.icon" class="w-4 h-4" />
                        {{ tab.label }}
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div v-if="activeTab === 'details'" class="space-y-6">
                    <div v-if="testDrive.is_no_show" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-5">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                                <AlertOctagon class="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div class="flex-1 space-y-3">
                                <div>
                                    <h4 class="font-semibold text-red-800 dark:text-red-300">爽约处理</h4>
                                    <p class="mt-1 text-sm text-red-700 dark:text-red-400">
                                        此预约已被标记为客户爽约，请完成后续责任认定与跟进处理
                                    </p>
                                </div>
                                <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <p class="text-xs text-red-600 dark:text-red-400 font-medium">爽约原因</p>
                                        <p class="mt-1 text-sm text-slate-700 dark:text-slate-300">{{ testDrive.no_show_reason || '待填写' }}</p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-red-600 dark:text-red-400 font-medium">影响范围</p>
                                        <p class="mt-1 text-sm text-slate-700 dark:text-slate-300">{{ testDrive.no_show_impact || '待评估' }}</p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-red-600 dark:text-red-400 font-medium">当前责任归属</p>
                                        <p class="mt-1 text-sm text-slate-700 dark:text-slate-300">
                                            {{ responsibilityOptions.find(r => r.value === testDrive.responsibility_role)?.label || testDrive.responsibility_role || '待认定' }}
                                            · {{ testDrive.assigned_user?.name || '未分配' }}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-2 pt-2">
                                    <button
                                        v-if="!testDrive.is_no_show"
                                        @click="showNoShowModal = true"
                                        class="btn-danger text-sm"
                                    >
                                        <UserX class="w-4 h-4" />
                                        标记爽约
                                    </button>
                                    <button
                                        v-if="canAdjustResponsibility"
                                        @click="showAdjustModal = true"
                                        class="btn-warning text-sm"
                                    >
                                        <Wrench class="w-4 h-4" />
                                        调整责任归属
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div class="space-y-5">
                            <div v-if="isEditing">
                                <label class="label">客户</label>
                                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 text-sm text-slate-700 dark:text-slate-300">
                                    {{ testDrive.customer?.name || '-' }} ({{ testDrive.customer?.phone || '-' }})
                                </div>
                            </div>
                            <div>
                                <label class="label">试驾类型</label>
                                <select v-if="isEditing" v-model="editForm.test_drive_type" class="select">
                                    <option value="standard">标准试驾</option>
                                    <option value="extended">深度试驾</option>
                                    <option value="comparison">对比试驾</option>
                                    <option value="family">家庭试驾</option>
                                </select>
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300">
                                    {{ testDrive.test_drive_type_label || editForm.test_drive_type === 'standard' ? '标准试驾' : editForm.test_drive_type }}
                                </p>
                            </div>
                            <div>
                                <label class="label">预约开始时间</label>
                                <input v-if="isEditing" v-model="editForm.scheduled_start" type="datetime-local" class="input" />
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300">
                                    {{ $filters.date(testDrive.scheduled_start, 'YYYY-MM-DD HH:mm') }}
                                </p>
                            </div>
                            <div>
                                <label class="label">预约结束时间</label>
                                <input v-if="isEditing" v-model="editForm.scheduled_end" type="datetime-local" class="input" />
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300">
                                    {{ $filters.date(testDrive.scheduled_end, 'YYYY-MM-DD HH:mm') }}
                                </p>
                            </div>
                            <div>
                                <label class="label flex items-center gap-1.5">
                                    <MapPin class="w-4 h-4" />
                                    取车地点
                                </label>
                                <input v-if="isEditing" v-model="editForm.pickup_location" type="text" class="input" />
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300">{{ testDrive.pickup_location || '-' }}</p>
                            </div>
                            <div>
                                <label class="label flex items-center gap-1.5">
                                    <Route class="w-4 h-4" />
                                    计划路线
                                </label>
                                <textarea v-if="isEditing" v-model="editForm.planned_route" class="textarea" rows="2"></textarea>
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ testDrive.planned_route || '-' }}</p>
                            </div>
                        </div>
                        <div class="space-y-5">
                            <div>
                                <label class="label">销售顾问</label>
                                <select v-if="isEditing" v-model="editForm.sales_user_id" class="select">
                                    <option value="">请选择</option>
                                    <option v-for="u in (page.props.options?.salesUsers || [])" :key="u.id" :value="u.id">{{ u.name }}</option>
                                </select>
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300">{{ testDrive.sales_user?.name || '-' }}</p>
                            </div>
                            <div>
                                <label class="label">陪同人员</label>
                                <select v-if="isEditing" v-model="editForm.companion_user_id" class="select">
                                    <option value="">无</option>
                                    <option v-for="u in (page.props.options?.salesUsers || [])" :key="'c' + u.id" :value="u.id">{{ u.name }}</option>
                                </select>
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300">{{ testDrive.companion_user?.name || '无' }}</p>
                            </div>
                            <div>
                                <label class="label">处理人</label>
                                <select v-if="isEditing" v-model="editForm.assigned_user_id" class="select">
                                    <option value="">请选择</option>
                                    <option v-for="u in (page.props.options?.salesUsers || [])" :key="'a' + u.id" :value="u.id">{{ u.name }}</option>
                                </select>
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300">{{ testDrive.assigned_user?.name || '未分配' }}</p>
                            </div>
                            <div>
                                <label class="label flex items-center gap-1.5">
                                    <MapPin class="w-4 h-4" />
                                    还车地点
                                </label>
                                <input v-if="isEditing" v-model="editForm.return_location" type="text" class="input" />
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300">{{ testDrive.return_location || '-' }}</p>
                            </div>
                            <div>
                                <label class="label">备注</label>
                                <textarea v-if="isEditing" v-model="editForm.remarks" class="textarea" rows="3"></textarea>
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ testDrive.remarks || '-' }}</p>
                            </div>
                        </div>
                    </div>

                    <div v-if="isEditing" class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        <button @click="isEditing = false; editForm.reset()" class="btn-secondary">
                            <X class="w-4 h-4" />
                            取消编辑
                        </button>
                        <button @click="saveEdit" :disabled="editForm.processing" class="btn-primary">
                            <Save class="w-4 h-4" />
                            {{ editForm.processing ? '保存中...' : '保存修改' }}
                        </button>
                    </div>
                </div>

                <div v-else-if="activeTab === 'followups'" class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-slate-900 dark:text-white">跟进记录</h3>
                        <Link
                            :href="route('followups.create', { test_drive_id: testDrive.id, customer_id: testDrive.customer_id })"
                            class="btn-primary text-sm"
                        >
                            <Plus class="w-4 h-4" />
                            新增跟进
                        </Link>
                    </div>
                    <div v-if="testDrive.followups?.length" class="space-y-3">
                        <div
                            v-for="f in testDrive.followups"
                            :key="f.id"
                            class="p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 transition-colors"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                                        <User class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p class="text-sm font-medium text-slate-900 dark:text-white">{{ f.user?.name || '未知' }}</p>
                                        <p class="text-xs text-slate-500 dark:text-slate-400">{{ $filters.relative(f.created_at) }}</p>
                                    </div>
                                </div>
                                <span :class="'badge-' + (f.level === 'urgent' ? 'danger' : f.level === 'important' ? 'warning' : 'info')">
                                    {{ f.level_label || f.level || '普通' }}
                                </span>
                            </div>
                            <p class="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ f.content }}</p>
                            <div v-if="f.next_follow_at" class="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                <Clock class="w-3.5 h-3.5" />
                                下次跟进：{{ $filters.date(f.next_follow_at, 'YYYY-MM-DD HH:mm') }}
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-12">
                        <MessageSquare class="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p class="text-slate-500 dark:text-slate-400 text-sm">暂无跟进记录</p>
                    </div>
                </div>

                <div v-else-if="activeTab === 'reviews'" class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-slate-900 dark:text-white">关联复盘材料</h3>
                        <Link
                            :href="route('review-materials.create', { test_drive_id: testDrive.id })"
                            class="btn-primary text-sm"
                        >
                            <Plus class="w-4 h-4" />
                            创建复盘
                        </Link>
                    </div>
                    <div v-if="testDrive.review_materials?.length" class="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div
                            v-for="r in testDrive.review_materials"
                            :key="r.id"
                            class="p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-indigo-200 transition-colors"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0 flex-1">
                                    <h4 class="font-medium text-slate-900 dark:text-white truncate">{{ r.title }}</h4>
                                    <div class="mt-1.5 flex flex-wrap gap-1.5">
                                        <span class="chip">{{ r.type_label || r.type || '-' }}</span>
                                        <span :class="'badge-' + (r.level === 'critical' ? 'danger' : r.level === 'major' ? 'warning' : 'secondary')">
                                            {{ r.level_label || r.level || '-' }}
                                        </span>
                                        <span :class="'badge-' + (r.status === 'resolved' ? 'success' : r.status === 'pending' ? 'warning' : 'info')">
                                            {{ r.status_label || r.status || '-' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span class="flex items-center gap-1">
                                    <User class="w-3.5 h-3.5" />
                                    {{ r.creator?.name || '-' }}
                                </span>
                                <span>{{ $filters.relative(r.created_at) }}</span>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-12">
                        <AlertOctagon class="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p class="text-slate-500 dark:text-slate-400 text-sm">暂无复盘材料</p>
                    </div>
                </div>

                <div v-else-if="activeTab === 'attachments'" class="space-y-4">
                    <h3 class="font-semibold text-slate-900 dark:text-white">附件</h3>
                    <div v-if="testDrive.attachments?.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div
                            v-for="a in testDrive.attachments"
                            :key="a.id"
                            class="group p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-indigo-200 transition-colors"
                        >
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                    <Paperclip class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-slate-900 dark:text-white truncate">{{ a.name || a.file_name }}</p>
                                    <p class="text-xs text-slate-500 dark:text-slate-400">{{ $filters.number(a.size / 1024, 1) }} KB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-12">
                        <Paperclip class="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p class="text-slate-500 dark:text-slate-400 text-sm">暂无附件</p>
                    </div>
                </div>

                <div v-else-if="activeTab === 'notes'" class="space-y-4">
                    <h3 class="font-semibold text-slate-900 dark:text-white">备注</h3>
                    <div v-if="testDrive.notes?.length" class="space-y-3">
                        <div
                            v-for="n in testDrive.notes"
                            :key="n.id"
                            class="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <User class="w-3.5 h-3.5" />
                                    {{ n.user?.name || '-' }}
                                </span>
                                <span class="text-xs text-slate-500 dark:text-slate-400">{{ $filters.relative(n.created_at) }}</span>
                            </div>
                            <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ n.content }}</p>
                        </div>
                    </div>
                    <div v-else class="text-center py-12">
                        <MessageCircle class="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p class="text-slate-500 dark:text-slate-400 text-sm">暂无备注</p>
                    </div>
                </div>

                <div v-else-if="activeTab === 'timeline'" class="space-y-4">
                    <h3 class="font-semibold text-slate-900 dark:text-white">操作时间线</h3>
                    <div v-if="testDrive.timelines?.length" class="relative pl-6">
                        <div class="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                        <div class="space-y-4">
                            <div
                                v-for="t in testDrive.timelines"
                                :key="t.id"
                                class="relative"
                            >
                                <div
                                    class="absolute -left-[22px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800"
                                    :class="statusBgColors[t.category] || 'bg-slate-400'"
                                ></div>
                                <div class="flex items-start justify-between gap-4">
                                    <div>
                                        <p class="text-sm font-medium text-slate-900 dark:text-white">{{ t.title }}</p>
                                        <p v-if="t.description" class="mt-1 text-sm text-slate-600 dark:text-slate-400">{{ t.description }}</p>
                                        <div class="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <User class="w-3.5 h-3.5" />
                                            <span>{{ t.user?.name || '-' }}</span>
                                        </div>
                                    </div>
                                    <span class="text-xs text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap">
                                        {{ $filters.relative(t.created_at) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-12">
                        <Clock3 class="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p class="text-slate-500 dark:text-slate-400 text-sm">暂无操作记录</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div
        v-if="!isMobile"
        class="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-40 w-44"
    >
        <div class="card p-2 space-y-2">
            <button
                v-if="canEdit && !isEditing"
                @click="isEditing = true"
                class="w-full btn-secondary text-sm justify-start"
            >
                <Edit3 class="w-4 h-4" />
                编辑信息
            </button>
            <button
                v-if="testDrive.status === 'pending'"
                @click="confirmAppointment"
                class="w-full btn-success text-sm justify-start"
            >
                <CheckCircle2 class="w-4 h-4" />
                确认预约
            </button>
            <button
                v-if="['pending', 'confirmed'].includes(testDrive.status)"
                class="w-full btn-primary text-sm justify-start"
            >
                <Plus class="w-4 h-4" />
                补充信息
            </button>
            <button
                v-if="!testDrive.is_no_show && ['pending', 'confirmed', 'in_progress'].includes(testDrive.status)"
                @click="showNoShowModal = true"
                class="w-full btn-danger text-sm justify-start"
            >
                <UserX class="w-4 h-4" />
                标记爽约
            </button>
            <button
                v-if="canClose && ['pending', 'confirmed', 'in_progress'].includes(testDrive.status)"
                @click="closeAppointment"
                class="w-full btn-warning text-sm justify-start"
            >
                <XCircle class="w-4 h-4" />
                关闭预约
            </button>
        </div>
    </div>

    <div
        v-if="isMobile"
        class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 pb-safe"
    >
        <div class="grid grid-cols-3 gap-2 max-w-lg mx-auto">
            <button
                v-if="testDrive.status === 'pending'"
                @click="confirmAppointment"
                class="btn-success text-sm py-3"
            >
                <CheckCircle2 class="w-5 h-5 mx-auto" />
                <span class="block text-xs mt-1">确认</span>
            </button>
            <button
                v-if="['pending', 'confirmed'].includes(testDrive.status)"
                class="btn-primary text-sm py-3"
            >
                <Edit3 class="w-5 h-5 mx-auto" />
                <span class="block text-xs mt-1">补充</span>
            </button>
            <button
                v-if="canClose && ['pending', 'confirmed', 'in_progress'].includes(testDrive.status)"
                @click="closeAppointment"
                class="btn-warning text-sm py-3"
            >
                <XCircle class="w-5 h-5 mx-auto" />
                <span class="block text-xs mt-1">关闭</span>
            </button>
            <template v-if="!['pending', 'confirmed', 'in_progress'].includes(testDrive.status) && !['pending', 'confirmed'].includes(testDrive.status)">
                <button
                    v-if="canEdit"
                    @click="isEditing = true"
                    class="btn-secondary text-sm py-3 col-span-3"
                >
                    <Edit3 class="w-5 h-5 mx-auto" />
                    <span class="block text-xs mt-1">编辑信息</span>
                </button>
            </template>
        </div>
    </div>

    <Teleport to="body">
        <div v-if="showNoShowModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div class="card w-full max-w-lg">
                <div class="card-header flex items-center justify-between bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/20">
                    <div class="flex items-center gap-2 text-red-700 dark:text-red-300">
                        <UserX class="w-5 h-5" />
                        <h3 class="font-semibold">标记爽约</h3>
                    </div>
                    <button @click="showNoShowModal = false" class="btn-ghost p-1">
                        <X class="w-5 h-5" />
                    </button>
                </div>
                <form @submit.prevent="markNoShow" class="card-body space-y-4">
                    <div>
                        <label class="label">爽约原因 <span class="text-red-500">*</span></label>
                        <textarea v-model="noShowForm.reason" class="textarea" rows="3" placeholder="请描述客户爽约的原因..." required></textarea>
                    </div>
                    <div>
                        <label class="label">影响范围</label>
                        <select v-model="noShowForm.impact_scope" class="select">
                            <option value="">请选择影响范围</option>
                            <option value="low">低（仅影响单个时段）</option>
                            <option value="medium">中（影响半天排班）</option>
                            <option value="high">高（影响整天及其他客户）</option>
                            <option value="critical">严重（造成经济损失）</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">补充说明</label>
                        <textarea v-model="noShowForm.note" class="textarea" rows="2" placeholder="其他需要备注的信息..."></textarea>
                    </div>
                </form>
                <div class="card-footer flex justify-end gap-2">
                    <button @click="showNoShowModal = false" class="btn-secondary">取消</button>
                    <button @click="markNoShow" :disabled="!noShowForm.reason || noShowForm.processing" class="btn-danger">
                        {{ noShowForm.processing ? '处理中...' : '确认标记爽约' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <Teleport to="body">
        <div v-if="showAdjustModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div class="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div class="card-header flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800">
                    <div class="flex items-center gap-2">
                        <Wrench class="w-5 h-5 text-amber-600" />
                        <h3 class="font-semibold text-slate-900 dark:text-white">调整责任归属</h3>
                    </div>
                    <button @click="showAdjustModal = false" class="btn-ghost p-1">
                        <X class="w-5 h-5" />
                    </button>
                </div>
                <form @submit.prevent="submitAdjust" class="card-body space-y-4">
                    <div>
                        <label class="label">新责任角色 <span class="text-red-500">*</span></label>
                        <select v-model="adjustForm.new_responsibility_role" class="select" required>
                            <option value="">请选择责任角色</option>
                            <option v-for="opt in responsibilityOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="label">新处理人 <span class="text-red-500">*</span></label>
                        <select v-model="adjustForm.new_assigned_user_id" class="select" required>
                            <option value="">请选择处理人</option>
                            <option v-for="u in (page.props.options?.salesUsers || [])" :key="'adj' + u.id" :value="u.id">
                                {{ u.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="label">调整原因 <span class="text-red-500">*</span></label>
                        <textarea v-model="adjustForm.reason" class="textarea" rows="3" placeholder="请详细说明调整责任归属的原因..." required></textarea>
                    </div>
                    <div>
                        <label class="label">影响范围</label>
                        <select v-model="adjustForm.impact_scope" class="select">
                            <option value="">请选择影响范围</option>
                            <option value="self">仅本次预约</option>
                            <option value="customer">此客户所有关联</option>
                            <option value="team">团队内部调整</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">补充说明</label>
                        <textarea v-model="adjustForm.additional_note" class="textarea" rows="2" placeholder="其他补充说明..."></textarea>
                    </div>
                    <div>
                        <label class="label">关联复盘材料（可选）</label>
                        <select v-model="adjustForm.link_review_material" class="select">
                            <option value="">不关联</option>
                            <option v-for="r in (testDrive.review_materials || [])" :key="'rv' + r.id" :value="r.id">
                                {{ r.title }}
                            </option>
                        </select>
                    </div>
                </form>
                <div class="card-footer flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-slate-800">
                    <button @click="showAdjustModal = false" class="btn-secondary">取消</button>
                    <button
                        @click="submitAdjust"
                        :disabled="!adjustForm.new_responsibility_role || !adjustForm.new_assigned_user_id || !adjustForm.reason || adjustForm.processing"
                        class="btn-primary"
                    >
                        {{ adjustForm.processing ? '提交中...' : '确认调整' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
