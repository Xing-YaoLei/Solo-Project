<script setup>
import { ref, getCurrentInstance, onMounted } from 'vue';
import { usePage, useForm, Head, Link, router } from '@inertiajs/vue3';
import {
    ArrowLeft, Save, MessageSquare, User, Car, Building2,
    Calendar, Target, HelpCircle, AlertCircle, Lightbulb
} from 'lucide-vue-next';

const { proxy } = getCurrentInstance();
const page = usePage();

const props = defineProps({
    customers: Array,
    testDrives: Array,
    vehicles: Array,
    stores: Array,
    users: Array,
    typeOptions: Array,
    channelOptions: Array,
    intentOptions: Array,
    preselected: Object,
});

const form = useForm({
    customer_id: props.preselected?.customer_id || '',
    test_drive_id: props.preselected?.test_drive_id || '',
    vehicle_id: props.preselected?.vehicle_id || '',
    store_id: '',
    user_id: '',
    type: '',
    channel: '',
    followed_at: '',
    next_followup_at: '',
    intent_level_change: '',
    summary: '',
    content: '',
    customer_questions: '',
    objections: '',
    solutions: '',
    remark: '',
});

const submit = () => {
    form.post(route('followups.store'), {
        onSuccess: () => {},
    });
};

const getCustomerTestDrives = () => {
    if (!form.customer_id) return [];
    return props.testDrives.filter(td => td.customer_id == form.customer_id);
};
</script>

<template>
    <Head title="新增跟进" />

    <div class="space-y-6">
        <div class="flex items-center gap-4">
            <Link :href="route('followups.index')" class="btn-ghost p-2">
                <ArrowLeft class="w-5 h-5" />
            </Link>
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">新增跟进记录</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">记录与客户的沟通情况</p>
            </div>
        </div>

        <form @submit.prevent="submit" class="space-y-6">
            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <User class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        关联信息
                    </h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label class="label"><span class="text-red-500">*</span> 客户</label>
                            <select v-model="form.customer_id" class="select" required>
                                <option value="">请选择客户</option>
                                <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} - {{ c.phone }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">关联试驾</label>
                            <select v-model="form.test_drive_id" class="select">
                                <option value="">请选择试驾（可选）</option>
                                <option v-for="td in getCustomerTestDrives()" :key="td.id" :value="td.id">{{ td.code }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">关联车辆</label>
                            <select v-model="form.vehicle_id" class="select">
                                <option value="">请选择车辆（可选）</option>
                                <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.brand }} {{ v.series }} {{ v.model }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">门店</label>
                            <select v-model="form.store_id" class="select">
                                <option value="">请选择门店</option>
                                <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">跟进人</label>
                            <select v-model="form.user_id" class="select">
                                <option value="">请选择跟进人</option>
                                <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        跟进详情
                    </h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label class="label">跟进类型</label>
                            <select v-model="form.type" class="select">
                                <option value="">请选择类型</option>
                                <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">沟通渠道</label>
                            <select v-model="form.channel" class="select">
                                <option value="">请选择渠道</option>
                                <option v-for="c in channelOptions" :key="c" :value="c">{{ c }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label"><span class="text-red-500">*</span> 跟进时间</label>
                            <input v-model="form.followed_at" type="datetime-local" class="input" required />
                        </div>
                        <div>
                            <label class="label">下次跟进时间</label>
                            <input v-model="form.next_followup_at" type="datetime-local" class="input" />
                        </div>
                        <div class="md:col-span-2">
                            <label class="label">意向变更</label>
                            <select v-model="form.intent_level_change" class="select">
                                <option value="">无变更</option>
                                <option v-for="opt in intentOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <MessageSquare class="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        沟通内容
                    </h3>
                </div>
                <div class="card-body space-y-5">
                    <div>
                        <label class="label flex items-center gap-1">
                            <Target class="w-3 h-3" />
                            内容摘要
                        </label>
                        <textarea v-model="form.summary" class="textarea" rows="2" placeholder="简要概括本次沟通要点..."></textarea>
                    </div>
                    <div>
                        <label class="label flex items-center gap-1">
                            <MessageSquare class="w-3 h-3" />
                            内容详情
                        </label>
                        <textarea v-model="form.content" class="textarea" rows="4" placeholder="详细记录沟通内容..."></textarea>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                            <HelpCircle class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            客户疑问
                        </h3>
                    </div>
                    <div class="card-body">
                        <textarea v-model="form.customer_questions" class="textarea" rows="5" placeholder="记录客户提出的问题..."></textarea>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                            <AlertCircle class="w-4 h-4 text-red-600 dark:text-red-400" />
                            异议点
                        </h3>
                    </div>
                    <div class="card-body">
                        <textarea v-model="form.objections" class="textarea" rows="5" placeholder="记录客户的顾虑和异议..."></textarea>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                            <Lightbulb class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            解决方案
                        </h3>
                    </div>
                    <div class="card-body">
                        <textarea v-model="form.solutions" class="textarea" rows="5" placeholder="针对异议的解决方案..."></textarea>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100">备注</h3>
                </div>
                <div class="card-body">
                    <textarea v-model="form.remark" class="textarea" rows="3" placeholder="其他补充说明..."></textarea>
                </div>
            </div>

            <div class="flex items-center justify-end gap-3">
                <Link :href="route('followups.index')" class="btn-secondary">取消</Link>
                <button type="submit" class="btn-primary" :disabled="form.processing">
                    <Save class="w-4 h-4" />
                    保存跟进
                </button>
            </div>
        </form>
    </div>
</template>
