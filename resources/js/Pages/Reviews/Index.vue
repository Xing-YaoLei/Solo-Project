<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { usePage, useForm, Head, Link, router } from '@inertiajs/vue3';
import {
    FileText, Plus, Download, Filter, Search, ChevronLeft, ChevronRight,
    Eye, User, Calendar, Link2, AlertTriangle, AlertCircle, Info,
    X, TrendingUp, Clock
} from 'lucide-vue-next';

const { proxy } = getCurrentInstance();
const page = usePage();

const props = defineProps({
    reviews: Object,
    filters: Object,
    filterOptions: Object,
});

const form = useForm({
    search: props.filters.search || '',
    type: props.filters.type || '',
    level: props.filters.level || '',
    status: props.filters.status || '',
    store_id: props.filters.store_id || '',
    creator_id: props.filters.creator_id || '',
    date_from: props.filters.date_from || '',
    date_to: props.filters.date_to || '',
    test_drive_id: props.filters.test_drive_id || '',
    customer_id: props.filters.customer_id || '',
});

const handleFilter = () => {
    router.get(route('reviews.index'), form.data(), { preserveState: true, replace: true });
};

const resetFilters = () => {
    form.reset();
    router.get(route('reviews.index'), {}, { preserveState: true, replace: true });
};

const exportReviews = () => {
    router.get(route('reviews.export'), form.data());
};

const levelBadgeClass = (level) => {
    const map = {
        'low': 'badge-secondary',
        'medium': 'badge-info',
        'high': 'badge-warning',
        'critical': 'badge-danger',
    };
    return map[level] || 'badge-secondary';
};

const levelLabel = (level) => {
    const map = {
        'low': '低',
        'medium': '中',
        'high': '高',
        'critical': '严重',
    };
    return map[level] || level;
};

const statusBadgeClass = (status) => {
    const map = {
        'draft': 'badge-gray',
        'pending': 'badge-warning',
        'reviewing': 'badge-info',
        'approved': 'badge-success',
        'rejected': 'badge-danger',
        'closed': 'badge-secondary',
    };
    return map[status] || 'badge-secondary';
};

const statusLabel = (status) => {
    const map = {
        'draft': '草稿',
        'pending': '待审核',
        'reviewing': '审核中',
        'approved': '已通过',
        'rejected': '已驳回',
        'closed': '已关闭',
    };
    return map[status] || status;
};
</script>

<template>
    <Head title="复盘材料" />

    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">复盘材料管理</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">管理复盘记录，支持双向追溯关联试驾与客户</p>
            </div>
            <div class="flex items-center gap-2">
                <button @click="exportReviews" class="btn-secondary">
                    <Download class="w-4 h-4" />
                    导出
                </button>
                <Link :href="route('reviews.create')" class="btn-primary">
                    <Plus class="w-4 h-4" />
                    新增复盘
                </Link>
            </div>
        </div>

        <div class="card p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                <div class="lg:col-span-2">
                    <div class="relative">
                        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input v-model="form.search" type="text" placeholder="搜索标题/编号..." class="input pl-9" @keyup.enter="handleFilter" />
                    </div>
                </div>
                <select v-model="form.type" class="select" @change="handleFilter">
                    <option value="">全部类型</option>
                    <option v-for="t in filterOptions.types" :key="t" :value="t">{{ t }}</option>
                </select>
                <select v-model="form.level" class="select" @change="handleFilter">
                    <option value="">全部级别</option>
                    <option v-for="l in filterOptions.levels" :key="l.value" :value="l.value">{{ l.label }}</option>
                </select>
                <select v-model="form.status" class="select" @change="handleFilter">
                    <option value="">全部状态</option>
                    <option v-for="s in filterOptions.statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                <select v-model="form.store_id" class="select" @change="handleFilter">
                    <option value="">全部门店</option>
                    <option v-for="s in filterOptions.stores" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
                <select v-model="form.creator_id" class="select" @change="handleFilter">
                    <option value="">全部创建人</option>
                    <option v-for="c in filterOptions.creators" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <input v-model="form.date_from" type="date" class="input" @change="handleFilter" placeholder="创建日期起" />
                <input v-model="form.date_to" type="date" class="input" @change="handleFilter" placeholder="创建日期止" />
                <input v-model="form.test_drive_id" type="text" class="input" placeholder="试驾编号" @keyup.enter="handleFilter" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                <input v-model="form.customer_id" type="text" class="input" placeholder="客户ID" @keyup.enter="handleFilter" />
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
            </div>
        </div>

        <div class="card overflow-hidden">
            <div class="scroll-x">
                <table class="table">
                    <thead>
                        <tr>
                            <th>编号</th>
                            <th>标题</th>
                            <th>类型</th>
                            <th>级别</th>
                            <th>状态</th>
                            <th>关联试驾</th>
                            <th>关联客户</th>
                            <th>关联处理数</th>
                            <th>创建人</th>
                            <th>创建时间</th>
                            <th class="w-20">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="r in reviews.data" :key="r.id">
                            <td class="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                <Link :href="route('reviews.show', r.id)" class="hover:underline">
                                    {{ r.code }}
                                </Link>
                            </td>
                            <td class="font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate" :title="r.title">
                                <Link :href="route('reviews.show', r.id)" class="hover:text-indigo-600 dark:hover:text-indigo-400">
                                    {{ r.title }}
                                </Link>
                            </td>
                            <td>
                                <span v-if="r.type" class="badge-info">{{ r.type }}</span>
                                <span v-else>-</span>
                            </td>
                            <td>
                                <span :class="levelBadgeClass(r.level)">{{ levelLabel(r.level) }}</span>
                            </td>
                            <td>
                                <span :class="statusBadgeClass(r.status)">{{ statusLabel(r.status) }}</span>
                            </td>
                            <td>
                                <Link v-if="r.test_drive" :href="route('test-drives.show', r.test_drive.id)" class="text-sky-600 dark:text-sky-400 hover:underline text-xs font-medium flex items-center gap-1">
                                    <Link2 class="w-3 h-3" />
                                    {{ r.test_drive.code }}
                                </Link>
                                <span v-else>-</span>
                            </td>
                            <td>
                                <Link v-if="r.customer" :href="route('customers.show', r.customer.id)" class="hover:text-indigo-600 dark:hover:text-indigo-400">
                                    {{ r.customer.name }}
                                </Link>
                                <span v-else>-</span>
                            </td>
                            <td>
                                <span class="badge-primary">{{ proxy.$filters.number(r.timeline_links_count || 0) }}</span>
                            </td>
                            <td>{{ r.creator?.name || '-' }}</td>
                            <td>{{ proxy.$filters.date(r.created_at) }}</td>
                            <td>
                                <Link :href="route('reviews.show', r.id)" class="btn-ghost p-1.5">
                                    <Eye class="w-4 h-4" />
                                </Link>
                            </td>
                        </tr>
                        <tr v-if="reviews.data.length === 0">
                            <td colspan="11" class="text-center py-12 text-slate-500 dark:text-slate-400">
                                暂无复盘数据
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="reviews.links && reviews.links.length > 3" class="flex items-center justify-between">
            <p class="text-sm text-slate-500 dark:text-slate-400">
                显示 {{ reviews.from }} - {{ reviews.to }} 条，共 {{ reviews.total }} 条
            </p>
            <div class="flex items-center gap-1">
                <Link
                    v-if="reviews.prev_page_url"
                    :href="reviews.prev_page_url"
                    class="btn-secondary px-3 py-1.5"
                >
                    <ChevronLeft class="w-4 h-4" />
                </Link>
                <span v-else class="btn-secondary px-3 py-1.5 opacity-50 cursor-not-allowed">
                    <ChevronLeft class="w-4 h-4" />
                </span>
                <span class="px-3 py-1.5 text-sm">第 {{ reviews.current_page }} / {{ reviews.last_page }} 页</span>
                <Link
                    v-if="reviews.next_page_url"
                    :href="reviews.next_page_url"
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
