<script setup>
import { getCurrentInstance } from 'vue';
import { usePage, useForm, Head, Link } from '@inertiajs/vue3';
import {
    ArrowLeft, Save, UserPlus, X
} from 'lucide-vue-next';

const { proxy } = getCurrentInstance();
const page = usePage();

const props = defineProps({
    intentOptions: Array,
    tagOptions: Array,
    stores: Array,
    users: Array,
});

const form = useForm({
    name: '',
    phone: '',
    phone_backup: '',
    gender: '',
    age: '',
    occupation: '',
    city: '',
    district: '',
    channel: '',
    intent_level: '',
    tags: [],
    store_id: '',
    assigned_user_id: '',
    remark: '',
});

const toggleTag = (tag) => {
    const idx = form.tags.indexOf(tag);
    if (idx > -1) {
        form.tags.splice(idx, 1);
    } else {
        form.tags.push(tag);
    }
};

const submit = () => {
    form.post(route('customers.store'), {
        onSuccess: () => {},
    });
};
</script>

<template>
    <Head title="新增客户" />

    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                <Link :href="route('customers.index')" class="btn-ghost p-2">
                    <ArrowLeft class="w-5 h-5" />
                </Link>
                <div>
                    <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">新增客户</h1>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">填写客户基本信息创建新线索</p>
                </div>
            </div>
        </div>

        <form @submit.prevent="submit" class="space-y-6">
            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100">基本信息</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label class="label"><span class="text-red-500">*</span> 姓名</label>
                            <input v-model="form.name" type="text" class="input" placeholder="请输入客户姓名" required />
                        </div>
                        <div>
                            <label class="label"><span class="text-red-500">*</span> 手机号码</label>
                            <input v-model="form.phone" type="tel" class="input" placeholder="请输入手机号码" required />
                        </div>
                        <div>
                            <label class="label">备用手机</label>
                            <input v-model="form.phone_backup" type="tel" class="input" placeholder="请输入备用手机号码" />
                        </div>
                        <div>
                            <label class="label">性别</label>
                            <select v-model="form.gender" class="select">
                                <option value="">请选择</option>
                                <option value="male">男</option>
                                <option value="female">女</option>
                                <option value="other">其他</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">年龄</label>
                            <input v-model="form.age" type="number" min="0" max="150" class="input" placeholder="请输入年龄" />
                        </div>
                        <div>
                            <label class="label">职业</label>
                            <input v-model="form.occupation" type="text" class="input" placeholder="请输入职业" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100">地区与来源</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label class="label">城市</label>
                            <input v-model="form.city" type="text" class="input" placeholder="请输入所在城市" />
                        </div>
                        <div>
                            <label class="label">区县</label>
                            <input v-model="form.district" type="text" class="input" placeholder="请输入所在区县" />
                        </div>
                        <div>
                            <label class="label">来源渠道</label>
                            <input v-model="form.channel" type="text" class="input" placeholder="如：抖音、朋友介绍、线下门店等" />
                        </div>
                        <div>
                            <label class="label">意向等级</label>
                            <select v-model="form.intent_level" class="select">
                                <option value="">请选择意向等级</option>
                                <option v-for="opt in intentOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100">标签</h3>
                </div>
                <div class="card-body">
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="tag in tagOptions"
                            :key="tag"
                            type="button"
                            @click="toggleTag(tag)"
                            :class="[
                                'chip cursor-pointer transition-all border',
                                form.tags.includes(tag)
                                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40'
                                    : 'hover:bg-slate-200 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600'
                            ]"
                        >
                            <X v-if="form.tags.includes(tag)" class="w-3 h-3" />
                            {{ tag }}
                        </button>
                        <p v-if="tagOptions.length === 0" class="text-sm text-slate-500 dark:text-slate-400">暂无可用标签</p>
                    </div>
                    <div v-if="form.tags.length > 0" class="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        已选择 {{ form.tags.length }} 个标签
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100">分配信息</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label class="label">门店</label>
                            <select v-model="form.store_id" class="select">
                                <option value="">请选择门店</option>
                                <option v-for="store in stores" :key="store.id" :value="store.id">{{ store.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">分配销售</label>
                            <select v-model="form.assigned_user_id" class="select">
                                <option value="">请选择销售</option>
                                <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100">备注</h3>
                </div>
                <div class="card-body">
                    <textarea v-model="form.remark" class="textarea" rows="4" placeholder="补充说明客户的其他信息..."></textarea>
                </div>
            </div>

            <div class="flex items-center justify-end gap-3">
                <Link :href="route('customers.index')" class="btn-secondary">取消</Link>
                <button type="submit" class="btn-primary" :disabled="form.processing">
                    <Save class="w-4 h-4" />
                    保存客户
                </button>
            </div>
        </form>
    </div>
</template>
