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
const showSupplementModal = ref(false)
const isEditing = ref(false)

const editForm = useForm({
    appointment_at: testDrive.value.appointment_at || '',
    appointment_end_at: testDrive.value.appointment_end_at || '',
    type: testDrive.value.type || 1,
    sales_user_id: testDrive.value.sales_user_id || '',
    companion_user_id: testDrive.value.companion_user_id || '',
    assigned_user_id: testDrive.value.assigned_user_id || '',
    pickup_location: testDrive.value.pickup_location || '',
    return_location: testDrive.value.return_location || '',
    planned_route: testDrive.value.planned_route || '',
    remark: testDrive.value.remark || '',
})

const noShowForm = useForm({
    no_show_reason: '',
    no_show_impact_scope: '',
    responsibility_role: '',
    responsibility_note: '',
})

const adjustForm = useForm({
    new_responsibility_role: '',
    new_assigned_user_id: '',
    reason: '',
    impacted_areas: '',
    supplement_note: '',
    review_material_id: '',
})

const supplementForm = useForm({
    pickup_location: testDrive.value.pickup_location || '',
    return_location: testDrive.value.return_location || '',
    planned_route: testDrive.value.planned_route || '',
    remark: testDrive.value.remark || '',
    companion_user_id: testDrive.value.companion_user_id || '',
})

const noShowReasonOptions = [
    { value: 1, label: '客户未到店' },
    { value: 2, label: '客户取消' },
    { value: 3, label: '无法联系' },
    { value: 4, label: '天气原因' },
    { value: 5, label: '其他' },
]

const typeOptions = [
    { value: 1, label: '标准试驾' },
    { value: 2, label: '深度试驾' },
    { value: 3, label: '对比试驾' },
    { value: 4, label: '家庭试驾' },
]

const STATUS = {
    PENDING: 10,
    CONFIRMED: 20,
    IN_PROGRESS: 30,
    COMPLETED: 40,
    CANCELLED: 50,
    NO_SHOW: 60,
    CLOSED: 70,
}

const timelineSteps = [
    { key: STATUS.PENDING, label: '预约', desc: '已创建预约' },
    { key: STATUS.CONFIRMED, label: '确认', desc: '已确认到店' },
    { key: STATUS.IN_PROGRESS, label: '试驾中', desc: '正在试驾' },
    { key: STATUS.COMPLETED, label: '完成', desc: '试驾已完成' },
]

const statusColors = {
    [STATUS.PENDING]: 'badge-warning',
    [STATUS.CONFIRMED]: 'badge-info',
    [STATUS.IN_PROGRESS]: 'badge-primary',
    [STATUS.COMPLETED]: 'badge-success',
    [STATUS.CANCELLED]: 'badge-gray',
    [STATUS.NO_SHOW]: 'badge-danger',
    [STATUS.CLOSED]: 'badge-gray',
}

const statusBgColors = {
    [STATUS.PENDING]: 'bg-amber-500',
    [STATUS.CONFIRMED]: 'bg-sky-500',
    [STATUS.IN_PROGRESS]: 'bg-indigo-500',
    [STATUS.COMPLETED]: 'bg-emerald-500',
    [STATUS.CANCELLED]: 'bg-slate-500',
    [STATUS.NO_SHOW]: 'bg-red-500',
    [STATUS.CLOSED]: 'bg-slate-500',
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

function getTypeLabel(type) {
    const opt = typeOptions.find(o => o.value === Number(type))
    return opt ? opt.label : '标准试驾'
}

function getNoShowReasonLabel(reason) {
    const opt = noShowReasonOptions.find(o => o.value === Number(reason))
    return opt ? opt.label : reason || '待填写'
}

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

function submitSupplement() {
    router.post(route('test-drives.supplement', testDrive.value.id), supplementForm.data(), {
        onSuccess: () => {
            showSupplementModal.value = false
            supplementForm.reset()
        }
    })
}

function confirmAppointment() {
    router.post(route('test-drives.confirm', testDrive.value.id), {}, {})
}

const closeNote = ref('')
function closeAppointment() {
    if (confirm('确定要关闭此试驾预约吗？')) {
        router.post(route('test-drives.close', testDrive.value.id), { close_note: closeNote.value || '' }, {
            onSuccess: () => { closeNote.value = '' }
        })
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
                                    {{ getNoShowReasonLabel(testDrive.no_show_reason) }}
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
                    {{ $filters.date(testDrive.appointment_at, 'MM-DD') }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ $filters.date(testDrive.appointment_at, 'HH:mm') }} - {{ $filters.date(testDrive.appointment_end_at, 'HH:mm') }}
                </p>
            </div>
            <div class="stat-card">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Clock class="w-4 h-4" />
                    <span class="text-xs">实际时间</span>
                </div>
                <p class="mt-2 font-semibold text-sm text-slate-900 dark:text-white">
                    {{ testDrive.actual_start_at ? $filters.date(testDrive.actual_start_at, 'MM-DD') : '-' }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ testDrive.actual_start_at ? $filters.date(testDrive.actual_start_at, 'HH:mm') + ' - ' + $filters.date(testDrive.actual_end_at, 'HH:mm') : '未开始' }}
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
                    <span class="font-semibold text-sm text-slate-900 dark:text-white">{{ testDrive.start_fuel_level || 0 }}%</span>
                    <span class="text-slate-400 text-xs">→</span>
                    <span class="font-semibold text-sm text-slate-900 dark:text-white">{{ testDrive.end_fuel_level || 0 }}%</span>
                </div>
                <p :class="['text-xs', (testDrive.end_fuel_level ?? 100) < (testDrive.start_fuel_level ?? 100) ? 'text-amber-600' : 'text-slate-500']">
                    {{ (testDrive.end_fuel_level ?? 0) < (testDrive.start_fuel_level ?? 0) ? '需加油' : '正常' }}
                </p>
            </div>
            <div class="stat-card">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Star class="w-4 h-4" />
                    <span class="text-xs">满意度</span>
                </div>
                <div class="mt-2 flex gap-0.5">
                    <Star
                        v-for="(filled, i) in renderStars(testDrive.customer_satisfaction)"
                        :key="i"
                        class="w-4 h-4"
                        :class="filled ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-600'"
                    />
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ testDrive.customer_satisfaction ? testDrive.customer_satisfaction + '分' : '未评价' }}
                </p>
            </div>
            <div class="stat-card">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <AlertTriangle class="w-4 h-4" />
                    <span class="text-xs">异常记录</span>
                </div>
                <p class="mt-2 font-semibold text-sm">
                    <span :class="(testDrive.accident_record || testDrive.violation_record) ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">
                        {{ (testDrive.accident_record || testDrive.violation_record) ? '有异常' : '无异常' }}
                    </span>
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    事故: {{ testDrive.accident_record || '无' }} · 违章: {{ testDrive.violation_record || '无' }}
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
                                        <p class="mt-1 text-sm text-slate-700 dark:text-slate-300">{{ getNoShowReasonLabel(testDrive.no_show_reason) }}</p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-red-600 dark:text-red-400 font-medium">影响范围</p>
                                        <p class="mt-1 text-sm text-slate-700 dark:text-slate-300">{{ testDrive.no_show_impact_scope || '待评估' }}</p>
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
                                <select v-if="isEditing" v-model="editForm.type" class="select">
                                    <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                                </select>
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300">
                                    {{ testDrive.test_drive_type_label || getTypeLabel(testDrive.type) }}
                                </p>
                            </div>
                            <div>
                                <label class="label">预约开始时间</label>
                                <input v-if="isEditing" v-model="editForm.appointment_at" type="datetime-local" class="input" />
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300">
                                    {{ $filters.date(testDrive.appointment_at, 'YYYY-MM-DD HH:mm') }}
                                </p>
                            </div>
                            <div>
                                <label class="label">预约结束时间</label>
                                <input v-if="isEditing" v-model="editForm.appointment_end_at" type="datetime-local" class="input" />
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300">
                                    {{ $filters.date(testDrive.appointment_end_at, 'YYYY-MM-DD HH:mm') }}
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
                                <textarea v-if="isEditing" v-model="editForm.remark" class="textarea" rows="3"></textarea>
                                <p v-else class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ testDrive.remark || '-' }}</p>
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
                            :href="route('reviews.create', { test_drive_id: testDrive.id })"
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
                v-if="testDrive.status === STATUS.PENDING"
                @click="confirmAppointment"
                class="w-full btn-success text-sm justify-start"
            >
                <CheckCircle2 class="w-4 h-4" />
                确认预约
            </button>
            <button
                v-if="[STATUS.PENDING, STATUS.CONFIRMED].includes(testDrive.status)"
                @click="showSupplementModal = true"
                class="w-full btn-primary text-sm justify-start"
            >
                <Plus class="w-4 h-4" />
                补充信息
            </button>
            <button
                v-if="!testDrive.is_no_show && [STATUS.PENDING, STATUS.CONFIRMED, STATUS.IN_PROGRESS].includes(testDrive.status)"
                @click="showNoShowModal = true"
                class="w-full btn-danger text-sm justify-start"
            >
                <UserX class="w-4 h-4" />
                标记爽约
            </button>
            <button
                v-if="canClose && [STATUS.PENDING, STATUS.CONFIRMED, STATUS.IN_PROGRESS].includes(testDrive.status)"
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
                v-if="testDrive.status === STATUS.PENDING"
                @click="confirmAppointment"
                class="btn-success text-sm py-3"
            >
                <CheckCircle2 class="w-5 h-5 mx-auto" />
                <span class="block text-xs mt-1">确认</span>
            </button>
            <button
                v-if="[STATUS.PENDING, STATUS.CONFIRMED].includes(testDrive.status)"
                @click="showSupplementModal = true"
                class="btn-primary text-sm py-3"
            >
                <Edit3 class="w-5 h-5 mx-auto" />
                <span class="block text-xs mt-1">补充</span>
            </button>
            <button
                v-if="canClose && [STATUS.PENDING, STATUS.CONFIRMED, STATUS.IN_PROGRESS].includes(testDrive.status)"
                @click="closeAppointment"
                class="btn-warning text-sm py-3"
            >
                <XCircle class="w-5 h-5 mx-auto" />
                <span class="block text-xs mt-1">关闭</span>
            </button>
            <template v-if="![STATUS.PENDING, STATUS.CONFIRMED, STATUS.IN_PROGRESS].includes(testDrive.status)">
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
                        <select v-model="noShowForm.no_show_reason" class="select" required>
                            <option value="">请选择爽约原因</option>
                            <option v-for="opt in noShowReasonOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="label">影响范围</label>
                        <textarea v-model="noShowForm.no_show_impact_scope" class="textarea" rows="3" placeholder="请描述影响范围..."></textarea>
                    </div>
                    <div>
                        <label class="label">责任角色</label>
                        <select v-model="noShowForm.responsibility_role" class="select">
                            <option value="">请选择责任角色</option>
                            <option v-for="opt in responsibilityOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="label">责任说明</label>
                        <textarea v-model="noShowForm.responsibility_note" class="textarea" rows="2" placeholder="其他需要备注的信息..."></textarea>
                    </div>
                </form>
                <div class="card-footer flex justify-end gap-2">
                    <button @click="showNoShowModal = false" class="btn-secondary">取消</button>
                    <button @click="markNoShow" :disabled="!noShowForm.no_show_reason || noShowForm.processing" class="btn-danger">
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
                        <textarea v-model="adjustForm.reason" class="textarea" rows="3" placeholder="请详细说明调整责任归属的原因（至少5个字）..." required></textarea>
                    </div>
                    <div>
                        <label class="label">影响范围</label>
                        <textarea v-model="adjustForm.impacted_areas" class="textarea" rows="2" placeholder="请描述影响范围..."></textarea>
                    </div>
                    <div>
                        <label class="label">补充说明</label>
                        <textarea v-model="adjustForm.supplement_note" class="textarea" rows="2" placeholder="其他补充说明..."></textarea>
                    </div>
                    <div>
                        <label class="label">关联复盘材料（可选）</label>
                        <select v-model="adjustForm.review_material_id" class="select">
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

    <Teleport to="body">
        <div v-if="showSupplementModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div class="card w-full max-w-lg">
                <div class="card-header flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Plus class="w-5 h-5 text-indigo-600" />
                        <h3 class="font-semibold text-slate-900 dark:text-white">补充信息</h3>
                    </div>
                    <button @click="showSupplementModal = false" class="btn-ghost p-1">
                        <X class="w-5 h-5" />
                    </button>
                </div>
                <form @submit.prevent="submitSupplement" class="card-body space-y-4">
                    <div>
                        <label class="label flex items-center gap-1.5">
                            <MapPin class="w-4 h-4" />
                            取车地点
                        </label>
                        <input v-model="supplementForm.pickup_location" type="text" class="input" placeholder="请输入取车地点" />
                    </div>
                    <div>
                        <label class="label flex items-center gap-1.5">
                            <MapPin class="w-4 h-4" />
                            还车地点
                        </label>
                        <input v-model="supplementForm.return_location" type="text" class="input" placeholder="请输入还车地点" />
                    </div>
                    <div>
                        <label class="label flex items-center gap-1.5">
                            <Route class="w-4 h-4" />
                            计划路线
                        </label>
                        <textarea v-model="supplementForm.planned_route" class="textarea" rows="2" placeholder="请输入计划路线"></textarea>
                    </div>
                    <div>
                        <label class="label">备注</label>
                        <textarea v-model="supplementForm.remark" class="textarea" rows="3" placeholder="请输入备注信息"></textarea>
                    </div>
                    <div>
                        <label class="label">陪同人员</label>
                        <select v-model="supplementForm.companion_user_id" class="select">
                            <option value="">无</option>
                            <option v-for="u in (page.props.options?.salesUsers || [])" :key="'sp' + u.id" :value="u.id">{{ u.name }}</option>
                        </select>
                    </div>
                </form>
                <div class="card-footer flex justify-end gap-2">
                    <button @click="showSupplementModal = false" class="btn-secondary">取消</button>
                    <button @click="submitSupplement" :disabled="supplementForm.processing" class="btn-primary">
                        {{ supplementForm.processing ? '提交中...' : '确认补充' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
