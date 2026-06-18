<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { usePage, useForm, Head, Link } from '@inertiajs/vue3';
import {
    Users, UserPlus, TrendingUp, Clock, AlertTriangle, Filter, Search,
    ChevronLeft, ChevronRight, MoreHorizontal, Eye, ArrowRight, Target,
    BarChart3, PieChart, Funnel, X, CheckCircle2, UserCog
} from 'lucide-vue-next';

const { proxy } = getCurrentInstance();
const page = usePage();

const props = defineProps({
    customers: Object,
    filters: Object,
    aggregates: Object,
    conversionStats: Object,
    filterOptions: Object,
});

const selectedIds = ref([]);
const showAssignModal = ref(false);

const form = useForm({
    search: props.filters.search || '',
    intent_level: props.filters.intent_level || '',
    store_id: props.filters.store_id || '',
    assigned_user_id: props.filters.assigned_user_id || '',
    channel: props.filters.channel || '',
});

const batchForm = useForm({
    assigned_user_id: '',
    customer_ids: [],
});

const allSelected = computed(() => {
    return props.customers.data.length > 0 && selectedIds.value.length === props.customers.data.length;
});

const toggleSelectAll = () => {
    if (allSelected.value) {
        selectedIds.value = [];
    } else {
        selectedIds.value = props.customers.data.map(c => c.id);
    }
};

const toggleSelect = (id) => {
    const idx = selectedIds.value.indexOf(id);
    if (idx > -1) {
        selectedIds.value.splice(idx, 1);
    } else {
        selectedIds.value.push(id);
    }
};

const handleFilter = () => {
    router.get(route('customers.index'), form.data(), { preserveState: true, replace: true });
};

const resetFilters = () => {
    form.reset();
    router.get(route('customers.index'), {}, { preserveState: true, replace: true });
};

const openAssignModal = () => {
    batchForm.customer_ids = [...selectedIds.value];
    showAssignModal.value = true;
};

const submitBatchAssign = () => {
    router.post(route('customers.batch-assign'), batchForm.data(), {
        onSuccess: () => {
            showAssignModal.value = false;
            selectedIds.value = [];
            batchForm.reset();
        }
    });
};

const intentBadgeClass = (level) => {
    const map = {
        'low': 'badge-gray',
        'medium': 'badge-info',
        'high': 'badge-primary',
        'very_high': 'badge-warning',
        'ordered': 'badge-success',
    };
    return map[level] || 'badge-secondary';
};

const intentLabel = (level) => {
    const map = {
        'low': '低意向',
        'medium': '中意向',
        'high': '高意向',
        'very_high': '极高意向',
        'ordered': '已订车',
    };
    return map[level] || level;
};

const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
};

const maxIntentCount = computed(() => {
    return Math.max(...props.conversionStats.by_intent.map(i => i.count), 1);
});

const maxChannelCount = computed(() => {
    return Math.max(...props.conversionStats.by_channel.map(i => i.count), 1);
});
</script>

<template>
    <Head title="客户线索" />

    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">客户线索管理</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">管理所有客户线索，跟踪转化情况</p>
            </div>
            <Link :href="route('customers.create')" class="btn-primary">
                <UserPlus class="w-4 h-4" />
                新增客户
            </Link>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">线索总数</p>
                        <p class="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{{ proxy.$filters.number(aggregates.total) }}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                        <Users class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">高意向客户</p>
                        <p class="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{{ proxy.$filters.number(aggregates.high_intent) }}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                        <Target class="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">已试驾</p>
                        <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{{ proxy.$filters.number(aggregates.with_test_drive) }}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">跟进遗漏</p>
                        <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{{ proxy.$filters.number(aggregates.without_followup) }}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle class="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div class="lg:col-span-8 space-y-4">
                <div class="card p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                        <div class="lg:col-span-2">
                            <div class="relative">
                                <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input v-model="form.search" type="text" placeholder="搜索姓名/手机号..." class="input pl-9" @keyup.enter="handleFilter" />
                            </div>
                        </div>
                        <select v-model="form.intent_level" class="select" @change="handleFilter">
                            <option value="">全部意向等级</option>
                            <option v-for="opt in filterOptions.intentLevels" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                        <select v-model="form.store_id" class="select" @change="handleFilter">
                            <option value="">全部门店</option>
                            <option v-for="store in filterOptions.stores" :key="store.id" :value="store.id">{{ store.name }}</option>
                        </select>
                        <select v-model="form.assigned_user_id" class="select" @change="handleFilter">
                            <option value="">全部销售</option>
                            <option v-for="user in filterOptions.assignedUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
                        </select>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        <button @click="handleFilter" class="btn-secondary">
                            <Filter class="w-4 h-4" />
                            应用筛选
                        </button>
                        <button @click="resetFilters" class="btn-ghost">
                            <X class="w-4 h-4" />
                            重置
                        </button>
                        <div class="flex-1"></div>
                        <button
                            v-if="selectedIds.length > 0"
                            @click="openAssignModal"
                            class="btn-secondary"
                        >
                            <UserCog class="w-4 h-4" />
                            批量分配 ({{ selectedIds.length }})
                        </button>
                    </div>
                </div>

                <div class="card overflow-hidden">
                    <div class="scroll-x">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th class="w-10">
                                        <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                    </th>
                                    <th>姓名</th>
                                    <th>手机号</th>
                                    <th>意向等级</th>
                                    <th>来源渠道</th>
                                    <th>所在地区</th>
                                    <th>分配销售</th>
                                    <th>试驾次数</th>
                                    <th>下次跟进</th>
                                    <th>最后跟进</th>
                                    <th class="w-20">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="customer in customers.data" :key="customer.id">
                                    <td>
                                        <input type="checkbox" :checked="selectedIds.includes(customer.id)" @change="toggleSelect(customer.id)" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                    </td>
                                    <td>
                                        <Link :href="route('customers.show', customer.id)" class="font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400">
                                            {{ customer.name }}
                                        </Link>
                                    </td>
                                    <td>{{ customer.phone }}</td>
                                    <td>
                                        <span :class="intentBadgeClass(customer.intent_level)">{{ intentLabel(customer.intent_level) }}</span>
                                    </td>
                                    <td>{{ customer.channel || '-' }}</td>
                                    <td>{{ [customer.city, customer.district].filter(Boolean).join(' ') || '-' }}</td>
                                    <td>{{ customer.assigned_user?.name || '-' }}</td>
                                    <td>{{ proxy.$filters.number(customer.test_drives_count || 0) }}</td>
                                    <td>
                                        <span :class="isOverdue(customer.next_followup_at) ? 'text-red-600 dark:text-red-400 font-medium' : ''">
                                            {{ proxy.$filters.date(customer.next_followup_at) }}
                                        </span>
                                    </td>
                                    <td>{{ proxy.$filters.relative(customer.last_followup_at) }}</td>
                                    <td>
                                        <Link :href="route('customers.show', customer.id)" class="btn-ghost p-1.5">
                                            <Eye class="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                                <tr v-if="customers.data.length === 0">
                                    <td colspan="11" class="text-center py-12 text-slate-500 dark:text-slate-400">
                                        暂无客户数据
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div v-if="customers.links && customers.links.length > 3" class="flex items-center justify-between">
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                        显示 {{ customers.from }} - {{ customers.to }} 条，共 {{ customers.total }} 条
                    </p>
                    <div class="flex items-center gap-1">
                        <Link
                            v-if="customers.prev_page_url"
                            :href="customers.prev_page_url"
                            class="btn-secondary px-3 py-1.5"
                        >
                            <ChevronLeft class="w-4 h-4" />
                        </Link>
                        <span v-else class="btn-secondary px-3 py-1.5 opacity-50 cursor-not-allowed">
                            <ChevronLeft class="w-4 h-4" />
                        </span>
                        <span class="px-3 py-1.5 text-sm">第 {{ customers.current_page }} / {{ customers.last_page }} 页</span>
                        <Link
                            v-if="customers.next_page_url"
                            :href="customers.next_page_url"
                            class="btn-secondary px-3 py-1.5"
                        >
                            <ChevronRight class="w-4 h-4" />
                        </Link>
                        <span v-else class="btn-secondary px-3 py-1.5 opacity-50 cursor-not-allowed">
                            <ChevronRight class="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-4 space-y-4">
                <div class="card">
                    <div class="card-header flex items-center gap-2">
                        <BarChart3 class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100">意向等级分布</h3>
                    </div>
                    <div class="card-body space-y-3">
                        <div v-for="item in conversionStats.by_intent" :key="item.level" class="space-y-1">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-slate-600 dark:text-slate-300">{{ item.label }}</span>
                                <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.count }}</span>
                            </div>
                            <div class="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    class="h-full rounded-full transition-all"
                                    :class="{
                                        'bg-slate-400': item.level === 'low',
                                        'bg-sky-500': item.level === 'medium',
                                        'bg-indigo-500': item.level === 'high',
                                        'bg-amber-500': item.level === 'very_high',
                                        'bg-emerald-500': item.level === 'ordered',
                                    }"
                                    :style="{ width: `${(item.count / maxIntentCount) * 100}%` }"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header flex items-center gap-2">
                        <PieChart class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100">TOP 来源渠道</h3>
                    </div>
                    <div class="card-body space-y-3">
                        <div v-for="(item, idx) in conversionStats.by_channel.slice(0, 5)" :key="item.channel" class="space-y-1">
                            <div class="flex items-center justify-between text-sm">
                                <span class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <span class="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400">{{ idx + 1 }}</span>
                                    {{ item.channel || '未知' }}
                                </span>
                                <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.count }}</span>
                            </div>
                            <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div class="h-full bg-emerald-500 rounded-full" :style="{ width: `${(item.count / maxChannelCount) * 100}%` }"></div>
                            </div>
                        </div>
                        <div v-if="conversionStats.by_channel.length === 0" class="text-center py-4 text-sm text-slate-500 dark:text-slate-400">
                            暂无渠道数据
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header flex items-center gap-2">
                        <Funnel class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100">试驾转化漏斗</h3>
                    </div>
                    <div class="card-body">
                        <div class="space-y-3">
                            <div class="relative">
                                <div class="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                                    <div>
                                        <p class="text-xs text-indigo-600 dark:text-indigo-400">总线索</p>
                                        <p class="text-lg font-bold text-indigo-900 dark:text-indigo-200">{{ proxy.$filters.number(conversionStats.test_drive_conversion.total) }}</p>
                                    </div>
                                    <ArrowRight class="w-5 h-5 text-indigo-400" />
                                </div>
                            </div>
                            <div class="relative pl-6">
                                <div class="absolute left-3 top-0 bottom-0 w-px border-l-2 border-dashed border-slate-200 dark:border-slate-700"></div>
                                <div class="flex items-center justify-between p-3 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20">
                                    <div>
                                        <p class="text-xs text-sky-600 dark:text-sky-400">已预约试驾</p>
                                        <p class="text-lg font-bold text-sky-900 dark:text-sky-200">{{ proxy.$filters.number(conversionStats.test_drive_conversion.booked) }}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-xs text-slate-500 dark:text-slate-400">预约率</p>
                                        <p class="text-sm font-semibold text-sky-600 dark:text-sky-400">{{ conversionStats.test_drive_conversion.booking_rate }}%</p>
                                    </div>
                                </div>
                            </div>
                            <div class="relative pl-12">
                                <div class="absolute left-9 top-0 bottom-0 w-px border-l-2 border-dashed border-slate-200 dark:border-slate-700"></div>
                                <div class="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                                    <div>
                                        <p class="text-xs text-emerald-600 dark:text-emerald-400">已完成试驾</p>
                                        <p class="text-lg font-bold text-emerald-900 dark:text-emerald-200">{{ proxy.$filters.number(conversionStats.test_drive_conversion.completed) }}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-xs text-slate-500 dark:text-slate-400">完成率</p>
                                        <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{{ conversionStats.test_drive_conversion.completion_rate }}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="showAssignModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="showAssignModal = false"></div>
        <div class="relative card w-full max-w-md mx-4">
            <div class="card-header flex items-center justify-between">
                <h3 class="font-semibold text-slate-900 dark:text-slate-100">批量分配销售</h3>
                <button @click="showAssignModal = false" class="btn-ghost p-1.5">
                    <X class="w-5 h-5" />
                </button>
            </div>
            <div class="card-body space-y-4">
                <p class="text-sm text-slate-500 dark:text-slate-400">已选择 {{ batchForm.customer_ids.length }} 位客户</p>
                <div>
                    <label class="label">分配给销售</label>
                    <select v-model="batchForm.assigned_user_id" class="select">
                        <option value="">请选择销售</option>
                        <option v-for="user in filterOptions.assignedUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
                    </select>
                </div>
            </div>
            <div class="card-footer flex justify-end gap-2">
                <button @click="showAssignModal = false" class="btn-secondary">取消</button>
                <button @click="submitBatchAssign" class="btn-primary" :disabled="!batchForm.assigned_user_id">确认分配</button>
            </div>
        </div>
    </div>
</template>
