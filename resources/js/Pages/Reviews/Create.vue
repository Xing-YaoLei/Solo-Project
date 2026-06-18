<script setup>
import { ref } from 'vue';
import { usePage, useForm, Head, Link } from '@inertiajs/vue3';
import {
    ArrowLeft, Save, FileText, Plus, Trash2, User,
    Calendar, Target, AlertTriangle, Lightbulb, BookOpen,
    ClipboardList, Link2, Check
} from 'lucide-vue-next';

const page = usePage();

const preselected = page.props.preselected || {};
const sourceTimelines = page.props.sourceTimelines || [];
const typeOptions = page.props.options?.types || [];
const levelOptions = page.props.options?.levels || [];
const storeOptions = page.props.options?.stores || [];

const form = useForm({
    title: '',
    type: '',
    level: '',
    summary: '',
    background: '',
    process_description: '',
    problem_analysis: '',
    improvement_measures: '',
    lessons_learned: '',
    test_drive_id: preselected.test_drive_id || '',
    customer_id: preselected.customer_id || '',
    store_id: preselected.store_id || '',
    action_items: [
        { content: '', assignee: '', due_date: '' }
    ],
    timeline_ids: [],
});

const addActionItem = () => {
    form.action_items.push({ content: '', assignee: '', due_date: '' });
};

const removeActionItem = (idx) => {
    if (form.action_items.length > 1) {
        form.action_items.splice(idx, 1);
    }
};

const toggleTimeline = (id) => {
    const idx = form.timeline_ids.indexOf(id);
    if (idx > -1) {
        form.timeline_ids.splice(idx, 1);
    } else {
        form.timeline_ids.push(id);
    }
};

const submit = () => {
    form.post(route('reviews.store'), {
        onSuccess: () => {},
    });
};

const categoryLabel = (category) => {
    const map = {
        1: '状态变更',
        2: '字段修改',
        3: '备注记录',
        4: '附件上传',
        5: '人员分配',
        6: '责任调整',
        7: '复盘相关',
        8: '客户交互',
        9: '系统操作',
    };
    return map[category] || '其他';
};

const categoryBadgeClass = (category) => {
    const map = {
        1: 'badge-warning',
        2: 'badge-info',
        3: 'badge-secondary',
        4: 'badge-primary',
        5: 'badge-info',
        6: 'badge-warning',
        7: 'badge-info',
        8: 'badge-success',
        9: 'badge-secondary',
    };
    return map[category] || 'badge-secondary';
};
</script>

<template>
    <Head title="新建复盘" />

    <div class="space-y-6">
        <div class="flex items-center gap-4">
            <Link :href="route('reviews.index')" class="btn-ghost p-2">
                <ArrowLeft class="w-5 h-5" />
            </Link>
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">新建复盘材料</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">记录案例复盘，沉淀经验教训</p>
            </div>
        </div>

        <form @submit.prevent="submit" class="space-y-6">
            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileText class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        基本信息
                    </h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div class="md:col-span-2">
                            <label class="label"><span class="text-red-500">*</span> 复盘标题</label>
                            <input v-model="form.title" type="text" class="input" placeholder="请输入复盘标题，简要概括案例" required />
                        </div>
                        <div>
                            <label class="label">复盘类型</label>
                            <select v-model="form.type" class="select">
                                <option value="">请选择类型</option>
                                <option v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">严重级别</label>
                            <select v-model="form.level" class="select">
                                <option value="">请选择级别</option>
                                <option v-for="l in levelOptions" :key="l.value" :value="l.value">{{ l.label }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">门店</label>
                            <select v-model="form.store_id" class="select">
                                <option value="">请选择门店</option>
                                <option v-for="s in storeOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
                            </select>
                        </div>
                        <div v-if="form.test_drive_id">
                            <label class="label">关联试驾</label>
                            <input type="text" class="input bg-slate-50 dark:bg-slate-700/40" :value="`试驾 #${form.test_drive_id}`" disabled />
                            <input type="hidden" v-model="form.test_drive_id" />
                        </div>
                        <div v-if="form.customer_id" class="md:col-span-2">
                            <label class="label">关联客户</label>
                            <input type="text" class="input bg-slate-50 dark:bg-slate-700/40" :value="`客户 #${form.customer_id}`" disabled />
                            <input type="hidden" v-model="form.customer_id" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Target class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            摘要
                        </h3>
                    </div>
                    <div class="card-body">
                        <textarea v-model="form.summary" class="textarea" rows="2" placeholder="简要概括复盘核心要点..."></textarea>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <BookOpen class="w-4 h-4 text-sky-600 dark:text-sky-400" />
                            背景
                        </h3>
                    </div>
                    <div class="card-body">
                        <textarea v-model="form.background" class="textarea" rows="3" placeholder="描述事件发生的背景、前置条件..."></textarea>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <ClipboardList class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            过程描述
                        </h3>
                    </div>
                    <div class="card-body">
                        <textarea v-model="form.process_description" class="textarea" rows="4" placeholder="按时间线详细描述事件过程..."></textarea>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <AlertTriangle class="w-4 h-4 text-red-600 dark:text-red-400" />
                            问题分析
                        </h3>
                    </div>
                    <div class="card-body">
                        <textarea v-model="form.problem_analysis" class="textarea" rows="4" placeholder="深入分析问题根因、影响因素..."></textarea>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Lightbulb class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            改进措施
                        </h3>
                    </div>
                    <div class="card-body">
                        <textarea v-model="form.improvement_measures" class="textarea" rows="3" placeholder="针对问题提出的改进方案..."></textarea>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <BookOpen class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            经验教训
                        </h3>
                    </div>
                    <div class="card-body">
                        <textarea v-model="form.lessons_learned" class="textarea" rows="3" placeholder="总结可沉淀的经验与教训..."></textarea>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header flex items-center justify-between">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Check class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        行动计划 Action Items
                    </h3>
                    <button type="button" @click="addActionItem" class="btn-secondary text-sm py-1.5 px-3">
                        <Plus class="w-4 h-4" />
                        添加行动
                    </button>
                </div>
                <div class="card-body space-y-3">
                    <div v-for="(item, idx) in form.action_items" :key="idx" class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                        <div class="md:col-span-6">
                            <label class="label text-xs mb-1">行动内容</label>
                            <input v-model="item.content" type="text" class="input text-sm" placeholder="需要执行的具体行动" />
                        </div>
                        <div class="md:col-span-3">
                            <label class="label text-xs mb-1">负责人</label>
                            <input v-model="item.assignee" type="text" class="input text-sm" placeholder="负责人姓名" />
                        </div>
                        <div class="md:col-span-2">
                            <label class="label text-xs mb-1">截止日期</label>
                            <input v-model="item.due_date" type="date" class="input text-sm" />
                        </div>
                        <div class="md:col-span-1 flex md:justify-end pt-5">
                            <button
                                type="button"
                                @click="removeActionItem(idx)"
                                :disabled="form.action_items.length === 1"
                                class="btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-30"
                            >
                                <Trash2 class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="sourceTimelines.length > 0" class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Link2 class="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        关联源时间线
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">勾选可追溯的相关处理记录</p>
                </div>
                <div class="card-body space-y-2 max-h-96 overflow-y-auto">
                    <label
                        v-for="t in sourceTimelines"
                        :key="t.id"
                        class="flex items-start gap-3 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer transition-colors"
                    >
                        <input
                            type="checkbox"
                            :checked="form.timeline_ids.includes(t.id)"
                            @change="toggleTimeline(t.id)"
                            class="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 text-sm">
                                <span v-if="t.category" :class="categoryBadgeClass(t.category)">{{ categoryLabel(t.category) }}</span>
                                <span class="font-medium text-slate-900 dark:text-slate-100">{{ t.action_name }}</span>
                            </div>
                            <p v-if="t.content" class="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{{ t.content }}</p>
                            <div class="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <span v-if="t.user_name">{{ t.user_name }}</span>
                                <span>{{ $filters.date(t.created_at, 'YYYY-MM-DD HH:mm') }}</span>
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            <div class="flex items-center justify-end gap-3">
                <Link :href="route('reviews.index')" class="btn-secondary">取消</Link>
                <button type="submit" class="btn-primary" :disabled="form.processing">
                    <Save class="w-4 h-4" />
                    保存复盘
                </button>
            </div>
        </form>
    </div>
</template>
