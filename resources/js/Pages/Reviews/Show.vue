<script setup>
import { ref } from 'vue';
import { Head, Link, router } from '@inertiajs/vue3';
import {
    ArrowLeft, User, Calendar, Link2, AlertTriangle,
    Lightbulb, BookOpen, ClipboardList, Check, Paperclip, Edit,
    History, ChevronRight, Plus, Unlink, Building2,
    Target, Info, Car, Clock
} from 'lucide-vue-next';

const props = defineProps({
    review: Object,
    linkedSources: Array,
    availableTimelines: Array,
});

const activeTab = ref('linkedRecords');
const selectedTimelineIds = ref([]);

const tabs = [
    { key: 'linkedRecords', label: '关联处理记录', icon: Link2 },
    { key: 'basicInfo', label: '基本信息', icon: Info },
    { key: 'attachments', label: '附件', icon: Paperclip },
    { key: 'notes', label: '备注', icon: Edit },
    { key: 'timelines', label: '时间线', icon: History },
];

const typeLabel = (type) => {
    const map = {
        1: '爽约复盘',
        2: '投诉处理',
        3: '事故复盘',
        4: '优秀案例',
        5: '日常复盘',
        9: '其他',
    };
    return map[type] || '其他';
};

const levelBadgeClass = (level) => {
    const map = {
        1: 'badge-secondary',
        2: 'badge-info',
        3: 'badge-warning',
        4: 'badge-danger',
    };
    return map[level] || 'badge-secondary';
};

const levelLabel = (level) => {
    const map = {
        1: '一般',
        2: '重要',
        3: '紧急',
        4: '重大',
    };
    return map[level] || '一般';
};

const statusBadgeClass = (status) => {
    const map = {
        1: 'badge-gray',
        2: 'badge-warning',
        3: 'badge-success',
        4: 'badge-secondary',
    };
    return map[status] || 'badge-gray';
};

const statusLabel = (status) => {
    const map = {
        1: '草稿',
        2: '待审核',
        3: '已审核',
        4: '已归档',
    };
    return map[status] || '未知';
};

const unlinkTimeline = (timelineId) => {
    router.delete(route('reviews.unlink-timeline', [props.review.id, timelineId]), {
        preserveState: true,
    });
};

const toggleTimelineSelect = (id) => {
    const idx = selectedTimelineIds.value.indexOf(id);
    if (idx > -1) {
        selectedTimelineIds.value.splice(idx, 1);
    } else {
        selectedTimelineIds.value.push(id);
    }
};

const linkTimelines = () => {
    if (selectedTimelineIds.value.length === 0) return;
    const ids = [...selectedTimelineIds.value];
    selectedTimelineIds.value = [];
    ids.forEach(id => {
        router.post(route('reviews.link-timeline', props.review.id), {
            timeline_id: id,
            relation_type: 1,
            relation_note: '',
        }, { preserveState: true });
    });
};

const categoryBadgeClass = (category) => {
    const map = {
        1: 'badge-warning',
        2: 'badge-info',
        3: 'badge-secondary',
        4: 'badge-primary',
        5: 'badge-primary',
        6: 'badge-danger',
        7: 'badge-info',
        8: 'badge-success',
        9: 'badge-gray',
    };
    return map[category] || 'badge-secondary';
};

const categoryLabel = (category) => {
    const map = {
        1: '状态变更',
        2: '字段修改',
        3: '备注',
        4: '分配',
        5: '附件',
        6: '责任',
        7: '复盘',
        8: '客户',
        9: '系统',
    };
    return map[category] || '其他';
};
</script>

<template>
    <Head :title="review.title" />

    <div class="space-y-6">
        <div class="flex items-center gap-4">
            <Link :href="route('reviews.index')" class="btn-ghost p-2">
                <ArrowLeft class="w-5 h-5" />
            </Link>
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ review.code }}</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">复盘详情</p>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div class="space-y-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">{{ review.code }}</span>
                            <span v-if="review.type" class="badge-info">{{ typeLabel(review.type) }}</span>
                            <span :class="levelBadgeClass(review.level)">{{ levelLabel(review.level) }}级别</span>
                            <span :class="statusBadgeClass(review.status)">{{ statusLabel(review.status) }}</span>
                        </div>
                        <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ review.title }}</h2>
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <span v-if="review.store" class="flex items-center gap-1">
                                <Building2 class="w-4 h-4" />
                                {{ review.store.name }}
                            </span>
                            <span class="flex items-center gap-1">
                                <User class="w-4 h-4" />
                                创建人: {{ review.creator?.name || '未知' }}
                            </span>
                            <span v-if="review.reviewer" class="flex items-center gap-1">
                                <Check class="w-4 h-4" />
                                审核: {{ review.reviewer.name }}
                            </span>
                            <span class="flex items-center gap-1">
                                <Calendar class="w-4 h-4" />
                                {{ $filters.date(review.created_at) }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="p-4 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-500/10 dark:to-indigo-500/10 border border-sky-100 dark:border-sky-500/20">
                    <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <Link2 class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        追溯来源 <span class="text-xs text-slate-500 dark:text-slate-400 font-normal">(双向追溯：从源记录也可跳转回本复盘)</span>
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div v-for="source in linkedSources" :key="`${source.type}-${source.id}`" class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70">
                            <div class="flex items-center gap-3 min-w-0">
                                <div :class="[
                                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                                    source.type === 'test_drive' ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-indigo-100 dark:bg-indigo-500/20'
                                ]">
                                    <Car v-if="source.type === 'test_drive'" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    <User v-else class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div class="min-w-0">
                                    <div class="flex items-center gap-2">
                                        <span class="chip text-xs">{{ source.label }}</span>
                                    </div>
                                    <Link
                                        :href="source.url"
                                        class="font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 mt-0.5"
                                    >
                                        <span class="truncate">{{ source.code }}</span>
                                        <ChevronRight class="w-3 h-3 flex-shrink-0" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <p v-if="linkedSources.length === 0" class="col-span-2 text-center py-4 text-sm text-slate-500 dark:text-slate-400">
                            暂无追溯来源
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <div v-if="review.summary" class="card border-l-4 border-l-amber-500">
                <div class="card-body">
                    <h4 class="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                        <Target class="w-4 h-4" />
                        摘要
                    </h4>
                    <p class="text-slate-800 dark:text-slate-200 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg">
                        {{ review.summary }}
                    </p>
                </div>
            </div>

            <div v-if="review.background" class="card">
                <div class="card-body">
                    <h4 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                        <BookOpen class="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        背景
                    </h4>
                    <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ review.background }}</p>
                </div>
            </div>

            <div v-if="review.process_description" class="card">
                <div class="card-body">
                    <h4 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                        <ClipboardList class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        过程描述
                    </h4>
                    <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ review.process_description }}</p>
                </div>
            </div>

            <div v-if="review.problem_analysis" class="card">
                <div class="card-body">
                    <h4 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                        <AlertTriangle class="w-4 h-4 text-red-600 dark:text-red-400" />
                        问题分析
                    </h4>
                    <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ review.problem_analysis }}</p>
                </div>
            </div>

            <div v-if="review.improvement_measures" class="card">
                <div class="card-body">
                    <h4 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                        <Lightbulb class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        改进措施
                    </h4>
                    <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ review.improvement_measures }}</p>
                </div>
            </div>

            <div v-if="review.lessons_learned" class="card">
                <div class="card-body">
                    <h4 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                        <BookOpen class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        经验教训
                    </h4>
                    <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ review.lessons_learned }}</p>
                </div>
            </div>

            <div v-if="review.action_items && review.action_items.length > 0" class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Check class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        行动计划
                    </h3>
                </div>
                <div class="card-body">
                    <div class="space-y-3">
                        <div v-for="(item, idx) in review.action_items" :key="idx" class="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                            <div class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span class="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{{ idx + 1 }}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-medium text-slate-900 dark:text-slate-100">{{ item.content }}</p>
                                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span v-if="item.assignee" class="flex items-center gap-1">
                                        <User class="w-3 h-3" />
                                        {{ item.assignee }}
                                    </span>
                                    <span v-if="item.due_date" class="flex items-center gap-1">
                                        <Calendar class="w-3 h-3" />
                                        {{ $filters.date(item.due_date) }}
                                    </span>
                                </div>
                            </div>
                        </div>
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
                <div v-show="activeTab === 'linkedRecords'">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <Link2 class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    已关联处理记录
                                </h3>
                                <span class="badge-info">{{ $filters.number(review.timelinesLinked?.length || 0) }}</span>
                            </div>
                            <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                <div
                                    v-for="t in review.timelinesLinked"
                                    :key="t.id"
                                    class="p-4 rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-700/20"
                                >
                                    <div class="flex items-start justify-between gap-3 mb-2">
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <span :class="categoryBadgeClass(t.category)">{{ categoryLabel(t.category) }}</span>
                                            <span class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ t.action_name }}</span>
                                        </div>
                                        <button
                                            @click="unlinkTimeline(t.id)"
                                            class="btn-ghost p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex-shrink-0"
                                            title="取消关联"
                                        >
                                            <Unlink class="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p v-if="t.content" class="text-sm text-slate-600 dark:text-slate-300 mb-2 line-clamp-3">{{ t.content }}</p>
                                    <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                        <span class="flex items-center gap-1">
                                            <User class="w-3 h-3" />
                                            {{ t.user?.name || '未知' }}
                                        </span>
                                        <span class="flex items-center gap-1">
                                            <Clock class="w-3 h-3" />
                                            {{ $filters.relative(t.created_at) }}
                                        </span>
                                    </div>
                                </div>
                                <p v-if="!review.timelinesLinked || review.timelinesLinked.length === 0" class="text-center py-12 text-sm text-slate-500 dark:text-slate-400 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                                    暂无关联的处理记录
                                </p>
                            </div>
                        </div>

                        <div>
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <Plus class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    添加关联记录
                                </h3>
                                <button
                                    v-if="selectedTimelineIds.length > 0"
                                    @click="linkTimelines"
                                    class="btn-primary text-sm py-1.5 px-3"
                                >
                                    <Link2 class="w-4 h-4" />
                                    关联 ({{ selectedTimelineIds.length }})
                                </button>
                            </div>
                            <div class="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                <label
                                    v-for="t in availableTimelines"
                                    :key="t.id"
                                    class="flex items-start gap-3 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        :checked="selectedTimelineIds.includes(t.id)"
                                        @change="toggleTimelineSelect(t.id)"
                                        class="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2 flex-wrap mb-1">
                                            <span :class="categoryBadgeClass(t.category)">{{ categoryLabel(t.category) }}</span>
                                            <span class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ t.action_name }}</span>
                                        </div>
                                        <p v-if="t.content" class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{{ t.content }}</p>
                                        <div class="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                            <span>{{ t.user?.name || '未知' }}</span>
                                            <span>{{ $filters.date(t.created_at, 'MM-DD HH:mm') }}</span>
                                        </div>
                                    </div>
                                </label>
                                <p v-if="!availableTimelines || availableTimelines.length === 0" class="text-center py-12 text-sm text-slate-500 dark:text-slate-400 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                                    暂无可关联的处理记录
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-show="activeTab === 'basicInfo'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">基本信息</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                            <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">复盘编号</p>
                            <p class="font-medium text-slate-900 dark:text-slate-100 font-mono">{{ review.code }}</p>
                        </div>
                        <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                            <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">创建时间</p>
                            <p class="font-medium text-slate-900 dark:text-slate-100">{{ $filters.date(review.created_at, 'YYYY-MM-DD HH:mm') }}</p>
                        </div>
                        <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                            <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">创建人</p>
                            <p class="font-medium text-slate-900 dark:text-slate-100">{{ review.creator?.name || '-' }}</p>
                        </div>
                        <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                            <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">审核人</p>
                            <p class="font-medium text-slate-900 dark:text-slate-100">{{ review.reviewer?.name || '-' }}</p>
                        </div>
                        <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                            <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">门店</p>
                            <p class="font-medium text-slate-900 dark:text-slate-100">{{ review.store?.name || '-' }}</p>
                        </div>
                        <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                            <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">更新时间</p>
                            <p class="font-medium text-slate-900 dark:text-slate-100">{{ $filters.date(review.updated_at, 'YYYY-MM-DD HH:mm') }}</p>
                        </div>
                    </div>
                </div>

                <div v-show="activeTab === 'attachments'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">附件列表</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div v-for="a in review.attachments" :key="a.id" class="p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/70 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <Paperclip class="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{{ a.name }}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400">{{ $filters.date(a.created_at) }}</p>
                            </div>
                        </div>
                        <p v-if="!review.attachments || review.attachments.length === 0" class="col-span-full text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无附件
                        </p>
                    </div>
                </div>

                <div v-show="activeTab === 'notes'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">备注记录</h3>
                    <div class="space-y-3">
                        <div v-for="n in review.notes" :key="n.id" class="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ n.creator?.name || '未知' }}</span>
                                <span class="text-xs text-slate-500 dark:text-slate-400">{{ $filters.date(n.created_at) }}</span>
                            </div>
                            <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ n.content }}</p>
                        </div>
                        <p v-if="!review.notes || review.notes.length === 0" class="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无备注
                        </p>
                    </div>
                </div>

                <div v-show="activeTab === 'timelines'">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">复盘活动时间线</h3>
                    <div class="relative pl-8 space-y-6">
                        <div class="absolute left-3 top-1 bottom-1 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div v-for="(t, idx) in review.timelines" :key="t.id" class="relative">
                            <div class="absolute -left-8 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-purple-500 flex items-center justify-center">
                                <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                            </div>
                            <div class="p-4 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-2">
                                        <span v-if="t.category" :class="categoryBadgeClass(t.category)">{{ categoryLabel(t.category) }}</span>
                                        <span class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ t.action_name }}</span>
                                    </div>
                                    <span class="text-xs text-slate-500 dark:text-slate-400">{{ $filters.relative(t.created_at) }}</span>
                                </div>
                                <p v-if="t.content" class="text-sm text-slate-700 dark:text-slate-300">{{ t.content }}</p>
                            </div>
                        </div>
                        <p v-if="!review.timelines || review.timelines.length === 0" class="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                            暂无活动记录
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
