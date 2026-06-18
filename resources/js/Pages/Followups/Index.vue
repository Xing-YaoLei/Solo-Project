<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { usePage, useForm, Head, Link, router } from '@inertiajs/vue3';
import {
    MessageSquare, Plus, Download, Filter, Search, ChevronLeft, ChevronRight,
    Eye, Check, Calendar, Clock, AlertTriangle, User, Car, Phone,
    MessageCircle, CheckCircle2, X, CalendarRange, AlertOctagon, Zap
} from 'lucide-vue-next';

const { proxy } = getCurrentInstance();
const page = usePage();

const props = defineProps({
    followups: Object,
    filters: Object,
    aggregates: Object,
    filterOptions: Object,
});

const selectedIds = ref([]);

const form = useForm({
    search: props.filters.search || '',
    status: props.filters.status || '',
    user_id: props.filters.user_id || '',
    type: props.filters.type || '',
    channel: props.filters.channel || '',
    date_from: props.filters.date_from || '',
    date_to: props.filters.date_to || '',
    is_overdue: props.filters.is_overdue || '',
    upcoming_3days: props.filters.upcoming_3days || '',
});

const allSelected = computed(() => {
    return props.followups.data.length > 0 && selectedIds.value.length === props.followups.data.length;
});

const toggleSelectAll = () => {
    if (allSelected.value) {
        selectedIds.value = [];
    } else {
        selectedIds.value = props.followups.data.map(f => f.id);
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
    router.get(route('followups.index'), form.data(), { preserveState: true, replace: true });
};

const resetFilters = () => {
    form.reset();
    router.get(route('followups.index'), {}, { preserveState: true, replace: true });
};

const batchComplete = () => {
    if (selectedIds.value.length === 0) return;
    router.post(route('followups.batch-complete'), { ids: selectedIds.value }, {
        onSuccess: () => {
            selectedIds.value = [];
        }
    });
};

const exportFollowups = () => {
    router.get(route('followups.export'), form.data());
};

const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
};

const isUpcoming3Days = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    const diff = d - now;
    return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
};

const statusBadgeClass = (status) => {
    const map = {
        'pending': 'badge-warning',
        'completed': 'badge-success',
        'cancelled': 'badge-danger',
    };
    return map[status] || 'badge-secondary';
};

const statusLabel = (status) => {
    const map = {
        'pending': '待跟进',
        'completed': '已完成',
        'cancelled': '已取消',
    };
    return map[status] || status;
};
</script>

<template>
    <Head title="销售跟进" />

    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">销售跟进管理</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">跟踪客户跟进记录，确保跟进及时性</p>
            </div>
            <div class="flex items-center gap-2">
                <button @click="exportFollowups" class="btn-secondary">
                    <Download class="w-4 h-4" />
                    导出
                </button>
                <Link :href="route('followups.create')" class="btn-primary">
                    <Plus class="w-4 h-4" />
                    新增跟进
                </Link>
            </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">跟进总数</p>
                        <p class="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{{ proxy.$filters.number(aggregates.total) }}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                        <MessageSquare class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">今日跟进</p>
                        <p class="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">{{ proxy.$filters.number(aggregates.today) }}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center">
                        <Calendar class="w-6 h-6 text-sky-600 dark:text-sky-400" />
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">已逾期</p>
                        <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{{ proxy.$filters.number(aggregates.overdue) }}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle class="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">即将跟进</p>
                        <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{{ proxy.$filters.number(aggregates.upcoming) }}</p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                        <Clock class="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                </div>
            </div>
        </div>

        <div class="card p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                <div class="lg:col-span-2">
                    <div class="relative">
                        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input v-model="form.search" type="text" placeholder="搜索客户/内容..." class="input pl-9" @keyup.enter="handleFilter" />
                    </div>
                </div>
                <select v-model="form.status" class="select" @change="handleFilter">
                    <option value="">全部状态</option>
                    <option value="pending">待跟进</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                </select>
                <select v-model="form.user_id" class="select" @change="handleFilter">
                    <option value="">全部跟进人</option>
                    <option v-for="u in filterOptions.users" :key="u.id" :value="u.id">{{ u.name }}</option>
                </select>
                <select v-model="form.type" class="select" @change="handleFilter">
                    <option value="">全部类型</option>
                    <option v-for="t in filterOptions.types" :key="t" :value="t">{{ t }}</option>
                </select>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                <select v-model="form.channel" class="select" @change="handleFilter">
                    <option value="">全部渠道</option>
                    <option v-for="c in filterOptions.channels" :key="c" :value="c">{{ c }}</option>
                </select>
                <div class="flex items-center gap-1">
                    <CalendarRange class="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input v-model="form.date_from" type="date" class="input flex-1" @change="handleFilter" />
                </div>
                <div class="flex items-center gap-1">
                    <span class="text-slate-400">-</span>
                    <input v-model="form.date_to" type="date" class="input flex-1" @change="handleFilter" />
                </div>
                <select v-model="form.is_overdue" class="select" @change="handleFilter">
                    <option value="">是否逾期</option>
                    <option value="1">已逾期</option>
                    <option value="0">未逾期</option>
                </select>
                <select v-model="form.upcoming_3days" class="select" @change="handleFilter">
                    <option value="">3天内需跟进</option>
                    <option value="1">是</option>
                    <option value="0">否</option>
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
                    @click="batchComplete"
                    class="btn-success"
                >
                    <CheckCircle2 class="w-4 h-4" />
                    批量完成 ({{ selectedIds.length }})
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
                            <th>编号</th>
                            <th>客户</th>
                            <th>关联试驾</th>
                            <th>车辆</th>
                            <th>类型</th>
                            <th>渠道</th>
                            <th>跟进时间</th>
                            <th>下次跟进</th>
                            <th>内容摘要</th>
                            <th>跟进人</th>
                            <th>状态</th>
                            <th class="w-20">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="f in followups.data" :key="f.id">
                            <td>
                                <input type="checkbox" :checked="selectedIds.includes(f.id)" @change="toggleSelect(f.id)" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            </td>
                            <td class="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">{{ f.code }}</td>
                            <td>
                                <Link v-if="f.customer" :href="route('customers.show', f.customer.id)" class="font-medium hover:text-indigo-600 dark:hover:text-indigo-400">
                                    {{ f.customer.name }}
                                </Link>
                                <span v-else>-</span>
                            </td>
                            <td>
                                <Link v-if="f.test_drive" :href="route('test-drives.show', f.test_drive.id)" class="text-sky-600 dark:text-sky-400 hover:underline text-xs">
                                    {{ f.test_drive.code }}
                                </Link>
                                <span v-else>-</span>
                            </td>
                            <td>
                                <span v-if="f.vehicle">{{ f.vehicle.brand }} {{ f.vehicle.series }}</span>
                                <span v-else>-</span>
                            </td>
                            <td>
                                <span v-if="f.type" class="badge-info">{{ f.type }}</span>
                                <span v-else>-</span>
                            </td>
                            <td>{{ f.channel || '-' }}</td>
                            <td>{{ proxy.$filters.date(f.followed_at, 'YYYY-MM-DD HH:mm') }}</td>
                            <td>
                                <span :class="[
                                    isOverdue(f.next_followup_at) ? 'text-red-600 dark:text-red-400 font-medium' : '',
                                    isUpcoming3Days(f.next_followup_at) && !isOverdue(f.next_followup_at) ? 'text-amber-600 dark:text-amber-400' : ''
                                ]">
                                    {{ proxy.$filters.date(f.next_followup_at, 'YYYY-MM-DD HH:mm') }}
                                </span>
                            </td>
                            <td class="max-w-xs truncate" :title="f.summary">{{ f.summary || '-' }}</td>
                            <td>{{ f.user?.name || '-' }}</td>
                            <td>
                                <span :class="statusBadgeClass(f.status)">{{ statusLabel(f.status) }}</span>
                            </td>
                            <td>
                                <Link :href="route('followups.show', f.id)" class="btn-ghost p-1.5">
                                    <Eye class="w-4 h-4" />
                                </Link>
                            </td>
                        </tr>
                        <tr v-if="followups.data.length === 0">
                            <td colspan="13" class="text-center py-12 text-slate-500 dark:text-slate-400">
                                暂无跟进记录
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="followups.links && followups.links.length > 3" class="flex items-center justify-between">
            <p class="text-sm text-slate-500 dark:text-slate-400">
                显示 {{ followups.from }} - {{ followups.to }} 条，共 {{ followups.total }} 条
            </p>
            <div class="flex items-center gap-1">
                <Link
                    v-if="followups.prev_page_url"
                    :href="followups.prev_page_url"
                    class="btn-secondary px-3 py-1.5"
                >
                    <ChevronLeft class="w-4 h-4" />
                </Link>
                <span v-else class="btn-secondary px-3 py-1.5 opacity-50 cursor-not-allowed">
                    <ChevronLeft class="w-4 h-4" />
                </span>
                <span class="px-3 py-1.5 text-sm">第 {{ followups.current_page }} / {{ followups.last_page }} 页</span>
                <Link
                    v-if="followups.next_page_url"
                    :href="followups.next_page_url"
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
</template>
