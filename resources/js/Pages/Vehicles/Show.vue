<script setup>
import { ref, getCurrentInstance } from 'vue';
import { usePage, useForm, Head, Link, router } from '@inertiajs/vue3';
import {
    ArrowLeft, Car, User, Calendar, FileText, Paperclip, History,
    Tag, Gauge, Fuel, Settings, Edit, Star, Check, Clock,
    Building2, DollarSign, Eye, ChevronRight
} from 'lucide-vue-next';

const { proxy } = getCurrentInstance();
const page = usePage();

const props = defineProps({
    vehicle: Object,
});

const activeTab = ref('testDrives');

const tabs = [
    { key: 'testDrives', label: '试驾历史', icon: Car },
    { key: 'attachments', label: '附件', icon: Paperclip },
    { key: 'notes', label: '备注', icon: Edit },
    { key: 'timelines', label: '时间线', icon: History },
];
</script>

<template>
    <Head :title="`${vehicle.brand} ${vehicle.series} ${vehicle.model}`" />

    <div class="space-y-6">
        <div class="flex items-center gap-4">
            <Link :href="route('vehicles.index')" class="btn-ghost p-2">
                <ArrowLeft class="w-5 h-5" />
            </Link>
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ vehicle.brand }} {{ vehicle.series }} {{ vehicle.model }}</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">车辆详情</p>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="flex items-start gap-4">
                        <div class="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Car class="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div class="space-y-2">
                            <div class="flex flex-wrap items-center gap-2">
                                <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                    {{ vehicle.brand }} {{ vehicle.series }} {{ vehicle.model }}
                                    <span class="text-slate-400 font-normal text-base">{{ vehicle.year }}款</span>
                                </h2>
                                <span v-if="vehicle.plate_number" class="badge-info font-mono">{{ vehicle.plate_number }}</span>
                                <span :class="vehicle.status === 'active' ? 'badge-success' : 'badge-gray'">
                                    {{ vehicle.status === 'active' ? '已上架' : '已下架' }}
                                </span>
                                <span v-if="vehicle.test_drive_available" class="badge-success flex items-center gap-1">
                                    <Check class="w-3 h-3" />
                                    可试驾
                                </span>
                            </div>
                            <div class="flex items-center gap-4 text-sm">
                                <span class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ proxy.$filters.currency(vehicle.price) }}</span>
                                <span v-if="vehicle.store" class="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                    <Building2 class="w-4 h-4" />
                                    {{ vehicle.store.name }}
                                </span>
                                <span class="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
                                    VIN: {{ vehicle.vin }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div class="stat-card p-4">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Calendar class="w-3 h-3" />
                    年款
                </div>
                <p class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ vehicle.year }}</p>
            </div>
            <div class="stat-card p-4">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Tag class="w-3 h-3" />
                    颜色
                </div>
                <p class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ vehicle.color || '-' }}</p>
            </div>
            <div class="stat-card p-4">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Gauge class="w-3 h-3" />
                    里程(KM)
                </div>
                <p class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ proxy.$filters.number(vehicle.mileage) }}</p>
            </div>
            <div class="stat-card p-4">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Settings class="w-3 h-3" />
                    变速箱
                </div>
                <p class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ vehicle.transmission || '-' }}</p>
            </div>
            <div class="stat-card p-4">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Fuel class="w-3 h-3" />
                    燃油
                </div>
                <p class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ vehicle.fuel_type || '-' }}</p>
            </div>
            <div class="stat-card p-4">
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Car class="w-3 h-3" />
                    试驾次数
                </div>
                <p class="text-lg font-bold text-indigo-600 dark:text-indigo-400">{{ proxy.$filters.number(vehicle.test_drives_count || 0) }}</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileText class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        技术参数
                    </h3>
                </div>
                <div class="card-body grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-slate-500 dark:text-slate-400 text-xs mb-0.5">排量</p>
                        <p class="font-medium text-slate-900 dark:text-slate-100">{{ vehicle.displacement || '-' }}</p>
                    </div>
                    <div>
                        <p class="text-slate-500 dark:text-slate-400 text-xs mb-0.5">座位数</p>
                        <p class="font-medium text-slate-900 dark:text-slate-100">{{ vehicle.seats ? vehicle.seats + '座' : '-' }}</p>
                    </div>
                    <div>
                        <p class="text-slate-500 dark:text-slate-400 text-xs mb-0.5">排放标准</p>
                        <p class="font-medium text-slate-900 dark:text-slate-100">{{ vehicle.emission_standard || '-' }}</p>
                    </div>
                    <div>
                        <p class="text-slate-500 dark:text-slate-400 text-xs mb-0.5">车况等级</p>
                        <p class="font-medium text-slate-900 dark:text-slate-100">{{ vehicle.condition_level || '-' }}</p>
                    </div>
                    <div class="col-span-2">
                        <p class="text-slate-500 dark:text-slate-400 text-xs mb-0.5">首次上牌日期</p>
                        <p class="font-medium text-slate-900 dark:text-slate-100">{{ proxy.$filters.date(vehicle.first_register_date) }}</p>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Star class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        车辆配置
                    </h3>
                </div>
                <div class="card-body">
                    <div v-if="vehicle.features && vehicle.features.length > 0" class="flex flex-wrap gap-2">
                        <span v-for="feature in vehicle.features" :key="feature" class="chip bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                            {{ feature }}
                        </span>
                    </div>
                    <p v-else class="text-sm text-slate-500 dark:text-slate-400">暂无配置信息</p>
                </div>
            </div>
        </div>

        <div class="card overflow-hidden">
            <div class="card-header border-b border-slate-200/70 dark:border-slate-700/70">
                <div class="scroll-x -mx-5 px-5">
                    <div class="flex gap-1">
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
            </div>

            <div class="card-body">
                <div v-show="activeTab === 'testDrives'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">试驾历史</h3>
                    <div class="scroll-x -mx-5 px-5">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>试驾编号</th>
                                    <th>客户</th>
                                    <th>状态</th>
                                    <th>预约时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="td in vehicle.testDrives" :key="td.id">
                                    <td class="font-medium text-indigo-600 dark:text-indigo-400">{{ td.code }}</td>
                                    <td>
                                        <Link v-if="td.customer" :href="route('customers.show', td.customer.id)" class="hover:text-indigo-600 dark:hover:text-indigo-400">
                                            {{ td.customer.name }}
                                        </Link>
                                        <span v-else>-</span>
                                    </td>
                                    <td>
                                        <span :class="{
                                            'badge-info': td.status === 'scheduled',
                                            'badge-warning': td.status === 'in_progress',
                                            'badge-success': td.status === 'completed',
                                            'badge-danger': td.status === 'cancelled',
                                        }[td.status] || 'badge-secondary'">
                                            {{ td.status === 'scheduled' ? '已预约' : td.status === 'in_progress' ? '进行中' : td.status === 'completed' ? '已完成' : td.status === 'cancelled' ? '已取消' : td.status }}
                                        </span>
                                    </td>
                                    <td>{{ proxy.$filters.date(td.scheduled_at, 'YYYY-MM-DD HH:mm') }}</td>
                                    <td>
                                        <Link :href="route('test-drives.show', td.id)" class="btn-link">
                                            查看
                                            <ChevronRight class="w-3 h-3" />
                                        </Link>
                                    </td>
                                </tr>
                                <tr v-if="!vehicle.testDrives || vehicle.testDrives.length === 0">
                                    <td colspan="5" class="text-center py-8 text-slate-500 dark:text-slate-400">
                                        暂无试驾记录
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div v-show="activeTab === 'attachments'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">附件列表</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div v-for="a in vehicle.attachments" :key="a.id" class="p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/70 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <Paperclip class="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{{ a.name }}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400">{{ proxy.$filters.date(a.created_at) }}</p>
                            </div>
                        </div>
                        <p v-if="!vehicle.attachments || vehicle.attachments.length === 0" class="col-span-full text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无附件
                        </p>
                    </div>
                </div>

                <div v-show="activeTab === 'notes'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">备注记录</h3>
                    <div class="space-y-3">
                        <div v-for="n in vehicle.notes" :key="n.id" class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ n.user?.name || '未知' }}</span>
                                <span class="text-xs text-slate-500 dark:text-slate-400">{{ proxy.$filters.date(n.created_at) }}</span>
                            </div>
                            <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ n.content }}</p>
                        </div>
                        <p v-if="!vehicle.notes || vehicle.notes.length === 0" class="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无备注
                        </p>
                    </div>
                </div>

                <div v-show="activeTab === 'timelines'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">活动时间线</h3>
                    <div class="relative pl-8 space-y-6">
                        <div class="absolute left-3 top-1 bottom-1 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div v-for="(t, idx) in vehicle.timelines" :key="t.id" class="relative">
                            <div class="absolute -left-8 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-emerald-500 flex items-center justify-center">
                                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                            </div>
                            <div class="p-4 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ t.action }}</span>
                                    <span class="text-xs text-slate-500 dark:text-slate-400">{{ proxy.$filters.relative(t.created_at) }}</span>
                                </div>
                                <p v-if="t.content" class="text-sm text-slate-700 dark:text-slate-300">{{ t.content }}</p>
                            </div>
                        </div>
                        <p v-if="!vehicle.timelines || vehicle.timelines.length === 0" class="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无活动记录
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
