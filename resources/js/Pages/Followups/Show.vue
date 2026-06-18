<script setup>
import { ref, getCurrentInstance } from 'vue';
import { usePage, useForm, Head, Link, router } from '@inertiajs/vue3';
import {
    ArrowLeft, MessageSquare, User, Car, Calendar, Clock,
    FileText, Paperclip, Edit, History, Check, AlertTriangle,
    HelpCircle, AlertCircle, Lightbulb, ChevronRight, Target
} from 'lucide-vue-next';

const { proxy } = getCurrentInstance();
const page = usePage();

const props = defineProps({
    followup: Object,
});

const activeTab = ref('attachments');

const tabs = [
    { key: 'attachments', label: '附件', icon: Paperclip },
    { key: 'notes', label: '备注', icon: Edit },
    { key: 'timelines', label: '时间线', icon: History },
];

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
    <Head :title="followup.code" />

    <div class="space-y-6">
        <div class="flex items-center gap-4">
            <Link :href="route('followups.index')" class="btn-ghost p-2">
                <ArrowLeft class="w-5 h-5" />
            </Link>
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ followup.code }}</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">跟进详情</p>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div class="space-y-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ followup.code }}</h2>
                            <span v-if="followup.type" class="badge-info">{{ followup.type }}</span>
                            <span v-if="followup.channel" class="badge-primary">{{ followup.channel }}</span>
                            <span :class="statusBadgeClass(followup.status)">{{ statusLabel(followup.status) }}</span>
                        </div>
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <span class="flex items-center gap-1">
                                <User class="w-4 h-4" />
                                {{ followup.user?.name || '未知' }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                        <h4 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                            <User class="w-4 h-4" />
                            关联客户
                        </h4>
                        <div v-if="followup.customer" class="space-y-1">
                            <Link :href="route('customers.show', followup.customer.id)" class="font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1">
                                {{ followup.customer.name }}
                                <ChevronRight class="w-3 h-3" />
                            </Link>
                            <p class="text-sm text-slate-500 dark:text-slate-400">{{ followup.customer.phone }}</p>
                        </div>
                        <p v-else class="text-sm text-slate-500 dark:text-slate-400">未关联</p>
                    </div>

                    <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                        <h4 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                            <Car class="w-4 h-4" />
                            关联试驾
                        </h4>
                        <div v-if="followup.test_drive" class="space-y-1">
                            <Link :href="route('test-drives.show', followup.test_drive.id)" class="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                {{ followup.test_drive.code }}
                                <ChevronRight class="w-3 h-3" />
                            </Link>
                            <p v-if="followup.vehicle" class="text-sm text-slate-500 dark:text-slate-400">
                                {{ followup.vehicle.brand }} {{ followup.vehicle.series }}
                            </p>
                        </div>
                        <p v-else class="text-sm text-slate-500 dark:text-slate-400">未关联</p>
                    </div>

                    <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                        <h4 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                            <Calendar class="w-4 h-4" />
                            跟进时间
                        </h4>
                        <p class="font-medium text-slate-900 dark:text-slate-100">{{ proxy.$filters.date(followup.followed_at, 'YYYY-MM-DD HH:mm') }}</p>
                    </div>

                    <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                        <h4 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                            <Clock class="w-4 h-4" />
                            下次跟进
                        </h4>
                        <p :class="followup.next_followup_at && new Date(followup.next_followup_at) < new Date() ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-900 dark:text-slate-100 font-medium'">
                            {{ proxy.$filters.date(followup.next_followup_at, 'YYYY-MM-DD HH:mm') }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <div v-if="followup.summary" class="card border-l-4 border-l-amber-500">
                <div class="card-body">
                    <h4 class="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                        <Target class="w-4 h-4" />
                        内容摘要
                    </h4>
                    <p class="text-slate-800 dark:text-slate-200 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg">
                        {{ followup.summary }}
                    </p>
                </div>
            </div>

            <div v-if="followup.content" class="card">
                <div class="card-body">
                    <h4 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                        <MessageSquare class="w-4 h-4" />
                        内容详情
                    </h4>
                    <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ followup.content }}</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div v-if="followup.customer_questions" class="card">
                    <div class="card-body">
                        <h4 class="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                            <HelpCircle class="w-4 h-4" />
                            客户疑问
                        </h4>
                        <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm">{{ followup.customer_questions }}</p>
                    </div>
                </div>

                <div v-if="followup.objections" class="card">
                    <div class="card-body">
                        <h4 class="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                            <AlertCircle class="w-4 h-4" />
                            异议点
                        </h4>
                        <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm">{{ followup.objections }}</p>
                    </div>
                </div>

                <div v-if="followup.solutions" class="card">
                    <div class="card-body">
                        <h4 class="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                            <Lightbulb class="w-4 h-4" />
                            解决方案
                        </h4>
                        <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm">{{ followup.solutions }}</p>
                    </div>
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
                <div v-show="activeTab === 'attachments'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">附件列表</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div v-for="a in followup.attachments" :key="a.id" class="p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/70 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <Paperclip class="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{{ a.name }}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400">{{ proxy.$filters.date(a.created_at) }}</p>
                            </div>
                        </div>
                        <p v-if="!followup.attachments || followup.attachments.length === 0" class="col-span-full text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无附件
                        </p>
                    </div>
                </div>

                <div v-show="activeTab === 'notes'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">备注记录</h3>
                    <div class="space-y-3">
                        <div v-for="n in followup.notes" :key="n.id" class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ n.user?.name || '未知' }}</span>
                                <span class="text-xs text-slate-500 dark:text-slate-400">{{ proxy.$filters.date(n.created_at) }}</span>
                            </div>
                            <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ n.content }}</p>
                        </div>
                        <p v-if="!followup.notes || followup.notes.length === 0" class="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无备注
                        </p>
                    </div>
                </div>

                <div v-show="activeTab === 'timelines'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">活动时间线</h3>
                    <div class="relative pl-8 space-y-6">
                        <div class="absolute left-3 top-1 bottom-1 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div v-for="(t, idx) in followup.timelines" :key="t.id" class="relative">
                            <div class="absolute -left-8 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-sky-500 flex items-center justify-center">
                                <div class="w-2 h-2 rounded-full bg-sky-500"></div>
                            </div>
                            <div class="p-4 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ t.action }}</span>
                                    <span class="text-xs text-slate-500 dark:text-slate-400">{{ proxy.$filters.relative(t.created_at) }}</span>
                                </div>
                                <p v-if="t.content" class="text-sm text-slate-700 dark:text-slate-300">{{ t.content }}</p>
                            </div>
                        </div>
                        <p v-if="!followup.timelines || followup.timelines.length === 0" class="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无活动记录
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
