<script setup>
import { ref, getCurrentInstance } from 'vue';
import { usePage, useForm, Head, Link, router } from '@inertiajs/vue3';
import {
    ArrowLeft, Phone, User, Calendar, Car, MessageSquare, FileText,
    Paperclip, Clock, Edit, Plus, ChevronRight, CheckCircle, MapPin,
    Building2, Tag, History, Star, X, Eye
} from 'lucide-vue-next';

const { proxy } = getCurrentInstance();
const page = usePage();

const props = defineProps({
    customer: Object,
    intentOptions: Array,
    statusOptions: Array,
});

const activeTab = ref('followups');

const tabs = [
    { key: 'followups', label: '跟进记录', icon: MessageSquare },
    { key: 'testDrives', label: '试驾记录', icon: Car },
    { key: 'reviews', label: '复盘', icon: FileText },
    { key: 'attachments', label: '附件', icon: Paperclip },
    { key: 'notes', label: '备注', icon: Edit },
    { key: 'timelines', label: '时间线', icon: History },
];

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

const statusBadgeClass = (status) => {
    const map = {
        'active': 'badge-success',
        'inactive': 'badge-gray',
        'lost': 'badge-danger',
        'converted': 'badge-primary',
    };
    return map[status] || 'badge-secondary';
};

const statusLabel = (status) => {
    const map = {
        'active': '有效',
        'inactive': '无效',
        'lost': '流失',
        'converted': '已转化',
    };
    return map[status] || status;
};
</script>

<template>
    <Head :title="customer.name" />

    <div class="space-y-6">
        <div class="flex items-center gap-4">
            <Link :href="route('customers.index')" class="btn-ghost p-2">
                <ArrowLeft class="w-5 h-5" />
            </Link>
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ customer.name }}</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">客户详情</p>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="flex items-start gap-4">
                        <div class="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <User class="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div class="space-y-2">
                            <div class="flex flex-wrap items-center gap-2">
                                <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ customer.name }}</h2>
                                <span :class="intentBadgeClass(customer.intent_level)">{{ intentLabel(customer.intent_level) }}</span>
                                <span :class="statusBadgeClass(customer.status)">{{ statusLabel(customer.status) }}</span>
                            </div>
                            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                                <span class="flex items-center gap-1">
                                    <Phone class="w-4 h-4" />
                                    {{ customer.phone }}
                                </span>
                                <span v-if="customer.phone_backup" class="flex items-center gap-1">
                                    <Phone class="w-4 h-4 text-slate-400" />
                                    {{ customer.phone_backup }}
                                </span>
                                <span v-if="customer.store" class="flex items-center gap-1">
                                    <Building2 class="w-4 h-4" />
                                    {{ customer.store.name }}
                                </span>
                                <span v-if="customer.assigned_user" class="flex items-center gap-1">
                                    <User class="w-4 h-4" />
                                    {{ customer.assigned_user.name }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <Link :href="route('followups.create', { customer_id: customer.id })" class="btn-primary">
                            <Plus class="w-4 h-4" />
                            新增跟进
                        </Link>
                        <Link :href="route('test-drives.create', { customer_id: customer.id })" class="btn-secondary">
                            <Car class="w-4 h-4" />
                            新增试驾
                        </Link>
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/70 dark:border-slate-700/70">
                    <div class="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                        <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ proxy.$filters.number(customer.test_drives_count || 0) }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                            <Car class="w-3 h-3" />
                            试驾次数
                        </p>
                    </div>
                    <div class="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                        <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ proxy.$filters.number(customer.followups_count || 0) }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                            <MessageSquare class="w-3 h-3" />
                            跟进次数
                        </p>
                    </div>
                    <div class="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                        <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ proxy.$filters.number(customer.review_materials_count || 0) }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                            <FileText class="w-3 h-3" />
                            关联复盘数
                        </p>
                    </div>
                    <div class="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                        <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ proxy.$filters.number(customer.attachments_count || 0) }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                            <Paperclip class="w-3 h-3" />
                            附件数
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <User class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        个人信息
                    </h3>
                </div>
                <div class="card-body space-y-3 text-sm">
                    <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-400">性别</span>
                        <span class="text-slate-900 dark:text-slate-100">{{ customer.gender === 'male' ? '男' : customer.gender === 'female' ? '女' : customer.gender || '-' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-400">年龄</span>
                        <span class="text-slate-900 dark:text-slate-100">{{ customer.age ? customer.age + '岁' : '-' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-400">职业</span>
                        <span class="text-slate-900 dark:text-slate-100">{{ customer.occupation || '-' }}</span>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <MapPin class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        地区信息
                    </h3>
                </div>
                <div class="card-body space-y-3 text-sm">
                    <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-400">来源渠道</span>
                        <span class="text-slate-900 dark:text-slate-100">{{ customer.channel || '-' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-400">城市</span>
                        <span class="text-slate-900 dark:text-slate-100">{{ customer.city || '-' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-400">区县</span>
                        <span class="text-slate-900 dark:text-slate-100">{{ customer.district || '-' }}</span>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Tag class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        客户标签
                    </h3>
                </div>
                <div class="card-body">
                    <div v-if="customer.tags && customer.tags.length > 0" class="flex flex-wrap gap-2">
                        <span v-for="tag in customer.tags" :key="tag" class="chip">{{ tag }}</span>
                    </div>
                    <p v-else class="text-sm text-slate-500 dark:text-slate-400">暂无标签</p>
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
                <div v-show="activeTab === 'followups'">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100">跟进记录</h3>
                        <Link :href="route('followups.create', { customer_id: customer.id })" class="btn-primary text-sm py-1.5 px-3">
                            <Plus class="w-4 h-4" />
                            新增跟进
                        </Link>
                    </div>
                    <div class="space-y-3">
                        <div v-for="f in customer.followups" :key="f.id" class="p-4 rounded-lg border border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 text-sm">
                                        <span class="font-medium text-slate-900 dark:text-slate-100">{{ f.user?.name || '未知' }}</span>
                                        <span class="text-slate-400">·</span>
                                        <span class="text-slate-500 dark:text-slate-400">{{ proxy.$filters.relative(f.followed_at) }}</span>
                                        <span v-if="f.type" class="badge-info">{{ f.type }}</span>
                                    </div>
                                    <p class="mt-2 text-sm text-slate-700 dark:text-slate-300">{{ f.summary || '无内容摘要' }}</p>
                                </div>
                                <Link :href="route('followups.show', f.id)" class="btn-ghost p-1.5 flex-shrink-0">
                                    <Eye class="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                        <p v-if="!customer.followups || customer.followups.length === 0" class="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无跟进记录
                        </p>
                    </div>
                </div>

                <div v-show="activeTab === 'testDrives'">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100">试驾记录</h3>
                        <Link :href="route('test-drives.create', { customer_id: customer.id })" class="btn-primary text-sm py-1.5 px-3">
                            <Plus class="w-4 h-4" />
                            新增试驾
                        </Link>
                    </div>
                    <div class="scroll-x -mx-5 px-5">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>试驾编号</th>
                                    <th>车辆</th>
                                    <th>状态</th>
                                    <th>预约时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="td in customer.testDrives" :key="td.id">
                                    <td class="font-medium text-indigo-600 dark:text-indigo-400">{{ td.code }}</td>
                                    <td>{{ td.vehicle?.brand }} {{ td.vehicle?.series }} {{ td.vehicle?.model }}</td>
                                    <td>
                                        <span :class="{
                                            'badge-info': td.status === 'scheduled',
                                            'badge-warning': td.status === 'in_progress',
                                            'badge-success': td.status === 'completed',
                                            'badge-danger': td.status === 'cancelled',
                                            'badge-secondary': true
                                        }[td.status] || 'badge-secondary'">
                                            {{ td.status === 'scheduled' ? '已预约' : td.status === 'in_progress' ? '进行中' : td.status === 'completed' ? '已完成' : td.status === 'cancelled' ? '已取消' : td.status }}
                                        </span>
                                    </td>
                                    <td>{{ proxy.$filters.date(td.scheduled_at) }}</td>
                                    <td>
                                        <Link :href="route('test-drives.show', td.id)" class="btn-link">
                                            查看
                                            <ChevronRight class="w-3 h-3" />
                                        </Link>
                                    </td>
                                </tr>
                                <tr v-if="!customer.testDrives || customer.testDrives.length === 0">
                                    <td colspan="5" class="text-center py-8 text-slate-500 dark:text-slate-400">
                                        暂无试驾记录
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div v-show="activeTab === 'reviews'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">关联复盘材料</h3>
                    <div class="space-y-3">
                        <div v-for="r in customer.reviewMaterials" :key="r.id" class="p-4 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium text-slate-900 dark:text-slate-100">{{ r.title }}</span>
                                        <span v-if="r.level" :class="{
                                            'badge-danger': r.level === 'critical',
                                            'badge-warning': r.level === 'high',
                                            'badge-info': r.level === 'medium',
                                            'badge-secondary': r.level === 'low',
                                        }[r.level] || 'badge-secondary'">
                                            {{ r.level === 'critical' ? '严重' : r.level === 'high' ? '高' : r.level === 'medium' ? '中' : r.level === 'low' ? '低' : r.level }}
                                        </span>
                                    </div>
                                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ proxy.$filters.date(r.created_at) }}</p>
                                </div>
                                <Link :href="route('reviews.show', r.id)" class="btn-link">查看</Link>
                            </div>
                        </div>
                        <p v-if="!customer.reviewMaterials || customer.reviewMaterials.length === 0" class="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无关联复盘
                        </p>
                    </div>
                </div>

                <div v-show="activeTab === 'attachments'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">附件列表</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div v-for="a in customer.attachments" :key="a.id" class="p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/70 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <Paperclip class="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{{ a.name }}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400">{{ proxy.$filters.date(a.created_at) }}</p>
                            </div>
                        </div>
                        <p v-if="!customer.attachments || customer.attachments.length === 0" class="col-span-full text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无附件
                        </p>
                    </div>
                </div>

                <div v-show="activeTab === 'notes'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">备注记录</h3>
                    <div class="space-y-3">
                        <div v-for="n in customer.notes" :key="n.id" class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ n.user?.name || '未知' }}</span>
                                <span class="text-xs text-slate-500 dark:text-slate-400">{{ proxy.$filters.date(n.created_at) }}</span>
                            </div>
                            <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ n.content }}</p>
                        </div>
                        <p v-if="!customer.notes || customer.notes.length === 0" class="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无备注
                        </p>
                    </div>
                </div>

                <div v-show="activeTab === 'timelines'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">活动时间线</h3>
                    <div class="relative pl-8 space-y-6">
                        <div class="absolute left-3 top-1 bottom-1 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div v-for="(t, idx) in customer.timelines" :key="t.id" class="relative">
                            <div class="absolute -left-8 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 flex items-center justify-center">
                                <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
                            </div>
                            <div class="p-4 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ t.action }}</span>
                                    <span class="text-xs text-slate-500 dark:text-slate-400">{{ proxy.$filters.relative(t.created_at) }}</span>
                                </div>
                                <p v-if="t.content" class="text-sm text-slate-700 dark:text-slate-300">{{ t.content }}</p>
                            </div>
                        </div>
                        <p v-if="!customer.timelines || customer.timelines.length === 0" class="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无活动记录
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
