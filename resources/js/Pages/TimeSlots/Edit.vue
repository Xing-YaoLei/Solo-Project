<template>
    <AppLayout title="编辑时段">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
                <Link :href="route('time-slots.index')" class="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                    ← 返回时段列表
                </Link>
                <h1 class="text-2xl font-bold text-gray-900">编辑时段</h1>
            </div>

            <div class="card mb-6">
                <div class="card-header">
                    <h2 class="text-lg font-semibold">基本信息</h2>
                </div>
                <div class="card-body">
                    <form @submit.prevent="submitForm">
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="label">时段名称</label>
                                <input v-model="form.name" type="text" class="input-field" placeholder="如：上午第一场" />
                            </div>
                            <div>
                                <label class="label">默认容量</label>
                                <input v-model.number="form.default_capacity" type="number" min="1" class="input-field" />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="label">开始时间</label>
                                <input v-model="form.start_time" type="time" class="input-field" />
                            </div>
                            <div>
                                <label class="label">结束时间</label>
                                <input v-model="form.end_time" type="time" class="input-field" />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="label">适用星期</label>
                                <select v-model="form.day_of_week" class="select-field">
                                    <option :value="null">每天</option>
                                    <option :value="0">周日</option>
                                    <option :value="1">周一</option>
                                    <option :value="2">周二</option>
                                    <option :value="3">周三</option>
                                    <option :value="4">周四</option>
                                    <option :value="5">周五</option>
                                    <option :value="6">周六</option>
                                </select>
                            </div>
                            <div>
                                <label class="label">状态</label>
                                <select v-model="form.is_active" class="select-field">
                                    <option :value="true">启用</option>
                                    <option :value="false">停用</option>
                                </select>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="label">备注</label>
                            <textarea v-model="form.remark" rows="2" class="input-field"></textarea>
                        </div>

                        <div class="flex justify-end gap-3">
                            <Link :href="route('time-slots.index')" class="btn-secondary">
                                取消
                            </Link>
                            <button type="submit" class="btn-primary">
                                保存
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card">
                <div class="card-header flex justify-between items-center">
                    <h2 class="text-lg font-semibold">容量规则</h2>
                    <button @click="showAddRuleModal = true" class="btn-secondary text-sm">
                        添加规则
                    </button>
                </div>
                <div class="card-body">
                    <div v-if="timeSlot.capacity_rules && timeSlot.capacity_rules.length > 0" class="space-y-3">
                        <div v-for="rule in timeSlot.capacity_rules" :key="rule.id" class="p-3 bg-gray-50 rounded-lg">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="font-medium">{{ rule.name }}</div>
                                    <div class="text-sm text-gray-500 mt-1">
                                        <span :class="rule.is_active ? 'text-green-600' : 'text-gray-400'">
                                            {{ rule.is_active ? '启用' : '停用' }}
                                        </span>
                                        <span class="mx-2">·</span>
                                        <span>{{ getRuleTypeLabel(rule.rule_type) }}</span>
                                        <span class="mx-2">·</span>
                                        <span v-if="rule.apply_date">{{ rule.apply_date }}</span>
                                        <span v-else-if="rule.day_of_week !== null">每周{{ getWeekdayLabel(rule.day_of_week) }}</span>
                                        <span v-else>默认规则</span>
                                    </div>
                                    <div class="text-sm text-gray-600 mt-1">
                                        最大容量: {{ rule.max_capacity }} 人
                                        <span v-if="rule.warn_capacity > 0">
                                            · 预警容量: {{ rule.warn_capacity }} 人
                                        </span>
                                    </div>
                                </div>
                                <button @click="deleteRule(rule)" class="text-red-600 hover:text-red-800 text-sm">
                                    删除
                                </button>
                            </div>
                            <p v-if="rule.remark" class="text-xs text-gray-400 mt-2">{{ rule.remark }}</p>
                        </div>
                    </div>
                    <div v-else class="text-center py-8 text-gray-500">
                        暂无容量规则
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showAddRuleModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg max-w-md w-full mx-4">
                <div class="px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold">添加容量规则</h3>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="label">规则名称</label>
                        <input v-model="ruleForm.name" type="text" class="input-field" placeholder="如：暑期高峰" />
                    </div>
                    <div>
                        <label class="label">规则类型</label>
                        <select v-model="ruleForm.rule_type" class="select-field">
                            <option value="default">默认</option>
                            <option value="special">特殊日期</option>
                            <option value="holiday">节假日</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">适用日期</label>
                        <input v-model="ruleForm.apply_date" type="date" class="input-field" />
                        <p class="text-xs text-gray-400 mt-1">留空则按星期规则</p>
                    </div>
                    <div>
                        <label class="label">适用星期</label>
                        <select v-model="ruleForm.day_of_week" class="select-field">
                            <option :value="null">全部</option>
                            <option :value="0">周日</option>
                            <option :value="1">周一</option>
                            <option :value="2">周二</option>
                            <option :value="3">周三</option>
                            <option :value="4">周四</option>
                            <option :value="5">周五</option>
                            <option :value="6">周六</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="label">最大容量</label>
                            <input v-model.number="ruleForm.max_capacity" type="number" min="1" class="input-field" />
                        </div>
                        <div>
                            <label class="label">预警容量</label>
                            <input v-model.number="ruleForm.warn_capacity" type="number" min="0" class="input-field" />
                        </div>
                    </div>
                    <div>
                        <label class="label">状态</label>
                        <select v-model="ruleForm.is_active" class="select-field">
                            <option :value="true">启用</option>
                            <option :value="false">停用</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">备注</label>
                        <textarea v-model="ruleForm.remark" rows="2" class="input-field"></textarea>
                    </div>
                </div>
                <div class="px-6 py-4 border-t flex justify-end gap-3">
                    <button @click="showAddRuleModal = false" class="btn-secondary">取消</button>
                    <button @click="addRule" class="btn-primary">添加</button>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { Link, usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage();
const props = page.props;

const timeSlot = props.timeSlot;

const form = reactive({
    name: timeSlot.name,
    start_time: timeSlot.start_time,
    end_time: timeSlot.end_time,
    default_capacity: timeSlot.default_capacity,
    day_of_week: timeSlot.day_of_week,
    is_active: timeSlot.is_active,
    remark: timeSlot.remark || '',
});

const showAddRuleModal = ref(false);
const ruleForm = reactive({
    name: '',
    rule_type: 'default',
    apply_date: '',
    day_of_week: null,
    max_capacity: timeSlot.default_capacity,
    warn_capacity: 0,
    is_active: true,
    remark: '',
});

const submitForm = () => {
    if (!form.name) {
        alert('请输入时段名称');
        return;
    }
    router.put(route('time-slots.update', timeSlot.id), form);
};

const addRule = () => {
    if (!ruleForm.name) {
        alert('请输入规则名称');
        return;
    }
    if (!ruleForm.max_capacity || ruleForm.max_capacity < 1) {
        alert('请输入有效的最大容量');
        return;
    }

    router.post(route('time-slots.rules.store', timeSlot.id), ruleForm, {
        onSuccess: () => {
            showAddRuleModal.value = false;
            ruleForm.name = '';
            ruleForm.rule_type = 'default';
            ruleForm.apply_date = '';
            ruleForm.day_of_week = null;
            ruleForm.max_capacity = timeSlot.default_capacity;
            ruleForm.warn_capacity = 0;
            ruleForm.is_active = true;
            ruleForm.remark = '';
        },
    });
};

const deleteRule = (rule) => {
    if (confirm('确定要删除这条容量规则吗？')) {
        router.delete(route('time-slots.rules.destroy', rule.id), {
            preserveState: true,
        });
    }
};

const getRuleTypeLabel = (type) => {
    const labels = {
        default: '默认',
        special: '特殊日期',
        holiday: '节假日',
    };
    return labels[type] || type;
};

const getWeekdayLabel = (day) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[day] || '';
};
</script>
