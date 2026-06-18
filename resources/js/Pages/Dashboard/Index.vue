<script setup>
import { computed, ref } from 'vue'
import { usePage, Head, Link } from '@inertiajs/vue3'
import {
    CalendarCheck, Clock, CheckCircle2, UserX, Users, Target,
    MessageSquare, Car, Plus, UserPlus, TrendingUp, TrendingDown,
    AlertTriangle, ArrowRight, Phone, User, Wrench
} from 'lucide-vue-next'

const page = usePage()

const stats = computed(() => page.props.stats || {
    todayAppointments: 0,
    pendingConfirm: 0,
    monthlyCompleted: 0,
    monthlyNoShowRate: 0,
    monthlyNewCustomers: 0,
    highIntent: 0,
    pendingFollowup: 0,
    availableVehicles: 0,
})

const noShowRate = computed(() => page.props.noShowRate || { value: 0, trend: 0, threshold: 5 })
const trendData = computed(() => page.props.trendData || [])
const conversionFunnel = computed(() => page.props.conversionFunnel || { leads: 0, appointments: 0, completed: 0, highIntent: 0 })
const upcomingAppointments = computed(() => page.props.upcomingAppointments || [])
const noShowRecent = computed(() => page.props.noShowRecent || [])
const statusOptions = computed(() => page.props.statusOptions || [])

const today = computed(() => new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
}))

const statusColors = {
    pending: 'badge-warning',
    confirmed: 'badge-info',
    in_progress: 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-gray',
    no_show: 'badge-danger',
}

const maxTrendValue = computed(() => {
    if (!trendData.value.length) return 1
    return Math.max(...trendData.value.map(d => Math.max(d.appointments || 0, d.completed || 0, d.no_show || 0)), 1)
})

const funneSteps = computed(() => {
    const f = conversionFunnel.value
    const steps = [
        { label: '总线索', value: f.leads || 0, color: 'bg-slate-500' },
        { label: '已预约', value: f.appointments || 0, color: 'bg-indigo-500' },
        { label: '已完成', value: f.completed || 0, color: 'bg-emerald-500' },
        { label: '高意向', value: f.highIntent || 0, color: 'bg-amber-500' },
    ]
    const maxVal = Math.max(...steps.map(s => s.value), 1)
    return steps.map(s => ({ ...s, width: (s.value / maxVal) * 100 }))
})
</script>

<template>
    <Head title="仪表盘" />

    <div class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                    欢迎回来，{{ page.props.auth?.user?.name || '管理员' }}
                </h1>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ today }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
                <Link :href="route('test-drives.create')" class="btn-primary">
                    <Plus class="w-4 h-4" />
                    新建试驾
                </Link>
                <Link :href="route('customers.create')" class="btn-secondary">
                    <UserPlus class="w-4 h-4" />
                    新增客户
                </Link>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                        <CalendarCheck class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
                <div class="mt-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400">今日预约</p>
                    <p class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {{ $filters.number(stats.todayAppointments) }}
                    </p>
                    <p class="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp class="w-3 h-3" />
                        环比 +12%
                    </p>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                        <Clock class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                </div>
                <div class="mt-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400">待确认</p>
                    <p class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {{ $filters.number(stats.pendingConfirm) }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">需要您处理</p>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </div>
                <div class="mt-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400">本月完成</p>
                    <p class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {{ $filters.number(stats.monthlyCompleted) }}
                    </p>
                    <p class="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp class="w-3 h-3" />
                        环比 +8%
                    </p>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                        <UserX class="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                </div>
                <div class="mt-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400">本月爽约率</p>
                    <p class="mt-1 text-2xl font-bold" :class="noShowRate.value > noShowRate.threshold ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'">
                        {{ noShowRate.value }}%
                    </p>
                    <p class="mt-1 text-xs flex items-center gap-1" :class="noShowRate.trend > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">
                        <component :is="noShowRate.trend > 0 ? TrendingUp : TrendingDown" class="w-3 h-3" />
                        {{ noShowRate.trend > 0 ? '+' : '' }}{{ noShowRate.trend }}%
                    </p>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div class="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center">
                        <Users class="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </div>
                </div>
                <div class="mt-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400">本月新客</p>
                    <p class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {{ $filters.number(stats.monthlyNewCustomers) }}
                    </p>
                    <p class="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp class="w-3 h-3" />
                        环比 +15%
                    </p>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                        <Target class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                </div>
                <div class="mt-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400">高意向</p>
                    <p class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {{ $filters.number(stats.highIntent) }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">重点跟进客户</p>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                        <MessageSquare class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                </div>
                <div class="mt-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400">待跟进</p>
                    <p class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {{ $filters.number(stats.pendingFollowup) }}
                    </p>
                    <p class="mt-1 text-xs text-amber-600 dark:text-amber-400">超期 2 条</p>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div class="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
                        <Car class="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                </div>
                <div class="mt-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400">可用试驾车辆</p>
                    <p class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {{ $filters.number(stats.availableVehicles) }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">台在线</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div class="space-y-6 lg:col-span-6">
                <div class="card">
                    <div class="card-header flex items-center justify-between">
                        <h3 class="font-semibold text-slate-900 dark:text-white">30天试驾趋势</h3>
                        <div class="flex items-center gap-4 text-xs">
                            <span class="flex items-center gap-1.5">
                                <span class="w-3 h-3 rounded-sm bg-indigo-500"></span>
                                <span class="text-slate-600 dark:text-slate-400">预约</span>
                            </span>
                            <span class="flex items-center gap-1.5">
                                <span class="w-3 h-3 rounded-sm bg-emerald-500"></span>
                                <span class="text-slate-600 dark:text-slate-400">完成</span>
                            </span>
                            <span class="flex items-center gap-1.5">
                                <span class="w-3 h-3 rounded-sm bg-red-500"></span>
                                <span class="text-slate-600 dark:text-slate-400">爽约</span>
                            </span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="relative h-64">
                            <svg class="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                                <defs>
                                    <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 50 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="0.5" class="text-slate-100 dark:text-slate-700"/>
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                                <g v-if="trendData.length">
                                    <template v-for="(day, idx) in trendData" :key="idx">
                                        <rect
                                            :x="20 + idx * (560 / trendData.length) - 6"
                                            :y="180 - (day.appointments || 0) / maxTrendValue * 160"
                                            width="6"
                                            :height="(day.appointments || 0) / maxTrendValue * 160"
                                            fill="#6366F1"
                                            rx="1"
                                        />
                                        <rect
                                            :x="20 + idx * (560 / trendData.length) + 1"
                                            :y="180 - (day.completed || 0) / maxTrendValue * 160"
                                            width="6"
                                            :height="(day.completed || 0) / maxTrendValue * 160"
                                            fill="#10B981"
                                            rx="1"
                                        />
                                        <rect
                                            :x="20 + idx * (560 / trendData.length) + 8"
                                            :y="180 - (day.no_show || 0) / maxTrendValue * 160"
                                            width="6"
                                            :height="(day.no_show || 0) / maxTrendValue * 160"
                                            fill="#EF4444"
                                            rx="1"
                                        />
                                    </template>
                                    <polyline
                                        :points="trendData.map((d, i) => `${20 + i * (560 / trendData.length) + 10},${180 - (d.appointments || 0) / maxTrendValue * 160}`).join(' ')"
                                        fill="none"
                                        stroke="#6366F1"
                                        stroke-width="1.5"
                                        stroke-dasharray="2 2"
                                        opacity="0.5"
                                    />
                                </g>
                                <line x1="20" y1="180" x2="580" y2="180" stroke="currentColor" stroke-width="1" class="text-slate-200 dark:text-slate-600"/>
                            </svg>
                            <div class="flex justify-between px-4 mt-2 text-xs text-slate-400">
                                <span>30天前</span>
                                <span>今天</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="font-semibold text-slate-900 dark:text-white">试驾转化漏斗</h3>
                    </div>
                    <div class="card-body space-y-4">
                        <div v-for="(step, idx) in funneSteps" :key="idx" class="space-y-2">
                            <div class="flex items-center justify-between text-sm">
                                <span class="font-medium text-slate-700 dark:text-slate-300">{{ step.label }}</span>
                                <div class="flex items-center gap-2">
                                    <span class="font-bold text-slate-900 dark:text-white">{{ $filters.number(step.value) }}</span>
                                    <span v-if="idx < funneSteps.length - 1" class="text-xs text-slate-500">
                                        ({{ step.value ? ((funneSteps[idx + 1].value / step.value) * 100).toFixed(1) : 0 }}%)
                                    </span>
                                </div>
                            </div>
                            <div class="h-8 rounded-lg bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                                <div
                                    class="h-full rounded-lg transition-all duration-500"
                                    :class="step.color"
                                    :style="{ width: step.width + '%', opacity: 0.85 - idx * 0.1 }"
                                ></div>
                            </div>
                            <div v-if="idx < funneSteps.length - 1" class="flex justify-center">
                                <ArrowRight class="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-6 lg:col-span-6">
                <div class="card">
                    <div class="card-header flex items-center justify-between">
                        <h3 class="font-semibold text-slate-900 dark:text-white">未来7天预约</h3>
                        <Link :href="route('test-drives.index')" class="btn-link text-xs">
                            查看全部
                            <ArrowRight class="w-3 h-3" />
                        </Link>
                    </div>
                    <div class="card-body p-0">
                        <div v-if="upcomingAppointments.length" class="divide-y divide-slate-100 dark:divide-slate-700/50">
                            <Link
                                v-for="apt in upcomingAppointments"
                                :key="apt.id"
                                :href="route('test-drives.show', apt.id)"
                                class="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                            >
                                <div class="w-12 text-center">
                                    <div class="text-xs text-slate-500 dark:text-slate-400">
                                        {{ $filters.date(apt.scheduled_start, 'MM月') }}
                                    </div>
                                    <div class="text-lg font-bold text-slate-900 dark:text-white">
                                        {{ $filters.date(apt.scheduled_start, 'DD') }}
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium text-slate-900 dark:text-white truncate">
                                            {{ apt.customer?.name || '-' }}
                                        </span>
                                        <span :class="statusColors[apt.status] || 'badge-gray'">
                                            {{ apt.status_label || statusOptions.find(s => s.value === apt.status)?.label || apt.status }}
                                        </span>
                                    </div>
                                    <div class="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {{ apt.vehicle?.brand || '' }} {{ apt.vehicle?.model || '' }} · {{ apt.vehicle?.plate_number || '' }}
                                    </div>
                                </div>
                                <div class="text-right shrink-0">
                                    <div class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {{ $filters.date(apt.scheduled_start, 'HH:mm') }}
                                    </div>
                                    <div class="text-xs text-slate-500 dark:text-slate-400">
                                        {{ apt.sales_user?.name || '-' }}
                                    </div>
                                </div>
                            </Link>
                        </div>
                        <div v-else class="px-5 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                            暂无预约记录
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <AlertTriangle class="w-5 h-5 text-red-500" />
                            <h3 class="font-semibold text-slate-900 dark:text-white">爽约待处理</h3>
                        </div>
                        <Link :href="route('test-drives.index', { is_no_show: 1 })" class="btn-link text-xs">
                            处理全部
                            <ArrowRight class="w-3 h-3" />
                        </Link>
                    </div>
                    <div class="card-body space-y-3">
                        <div
                            v-for="item in noShowRecent"
                            :key="item.id"
                            class="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/10 p-4"
                        >
                            <div class="flex items-start gap-3">
                                <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                                    <AlertTriangle class="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-start justify-between gap-2">
                                        <div>
                                            <div class="flex items-center gap-2">
                                                <User class="w-4 h-4 text-slate-500" />
                                                <span class="font-medium text-slate-900 dark:text-white">
                                                    {{ item.customer?.name || '-' }}
                                                </span>
                                                <a
                                                    v-if="item.customer?.phone"
                                                    :href="'tel:' + item.customer.phone"
                                                    class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                                >
                                                    <Phone class="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                            <div class="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                <Car class="w-3.5 h-3.5" />
                                                <span>{{ item.vehicle?.brand || '' }} {{ item.vehicle?.model || '' }} · {{ item.vehicle?.plate_number || '' }}</span>
                                            </div>
                                            <div class="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                <Wrench class="w-3.5 h-3.5" />
                                                <span>责任：{{ item.assigned_user?.name || (item.sales_user?.name || '未分配') }}</span>
                                            </div>
                                        </div>
                                        <span class="badge-danger shrink-0">爽约</span>
                                    </div>
                                    <div class="mt-3 flex gap-2">
                                        <Link
                                            :href="route('test-drives.show', item.id)"
                                            class="btn-danger px-3 py-1.5 text-xs"
                                        >
                                            立即处理
                                        </Link>
                                        <button class="btn-secondary px-3 py-1.5 text-xs">
                                            联系客户
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-if="!noShowRecent.length" class="text-center py-4 text-sm text-slate-500 dark:text-slate-400">
                            暂无待处理爽约
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
