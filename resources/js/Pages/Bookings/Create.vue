<template>
    <AppLayout title="新建预约">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
                <Link :href="route('dashboard')" class="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                    ← 返回工作台
                </Link>
                <h1 class="text-2xl font-bold text-gray-900">新建试听预约</h1>
                <p class="text-gray-600 mt-1">同一屏完成信息填报、时段选择、容量查看和冲突检测</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div class="lg:col-span-7 space-y-6">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold flex items-center gap-2">
                                <span class="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
                                学员基本信息
                            </h2>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="label">学员姓名 <span class="text-red-500">*</span></label>
                                    <input
                                        v-model="form.student_name"
                                        type="text"
                                        class="input-field"
                                        placeholder="请输入学员姓名"
                                        @blur="checkConflicts"
                                    />
                                </div>
                                <div>
                                    <label class="label">性别</label>
                                    <select v-model="form.gender" class="select-field">
                                        <option value="unknown">未知</option>
                                        <option value="male">男</option>
                                        <option value="female">女</option>
                                    </select>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="label">年龄</label>
                                    <input v-model.number="form.age" type="number" min="3" max="18" class="input-field" placeholder="岁" />
                                </div>
                                <div>
                                    <label class="label">家长姓名</label>
                                    <input v-model="form.parent_name" type="text" class="input-field" placeholder="请输入家长姓名" />
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="label">联系电话 <span class="text-red-500">*</span></label>
                                    <input
                                        v-model="form.phone"
                                        type="tel"
                                        class="input-field"
                                        placeholder="请输入手机号"
                                        @blur="checkConflicts"
                                    />
                                </div>
                                <div>
                                    <label class="label">试听课程</label>
                                    <select v-model="form.course_id" class="select-field">
                                        <option :value="null">请选择课程</option>
                                        <option v-for="course in courses" :key="course.id" :value="course.id">
                                            {{ course.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="label">来源渠道</label>
                                    <select v-model="form.source_channel" class="select-field">
                                        <option value="">请选择</option>
                                        <option v-for="channel in sourceChannels" :key="channel" :value="channel">
                                            {{ channel }}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label class="label">来源详情</label>
                                    <input v-model="form.source_detail" type="text" class="input-field" placeholder="如：具体平台/介绍人等" />
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="label">责任人</label>
                                    <select v-model="form.assigned_to" class="select-field">
                                        <option :value="null">请选择</option>
                                        <option v-for="user in users" :key="user.id" :value="user.id">
                                            {{ user.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label class="label">备注</label>
                                <textarea v-model="form.remark" rows="3" class="input-field" placeholder="请输入备注信息..."></textarea>
                            </div>
                        </div>
                    </div>

                    <div v-if="detectedConflicts.length > 0" class="card border-red-300">
                        <div class="card-header bg-red-50 border-red-200">
                            <div class="flex items-center gap-2">
                                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h2 class="text-lg font-semibold text-red-800">冲突检测提醒</h2>
                                <span class="badge badge-danger">{{ detectedConflicts.length }} 个冲突</span>
                            </div>
                        </div>
                        <div class="card-body space-y-3">
                            <div
                                v-for="(conflict, index) in detectedConflicts"
                                :key="index"
                                class="p-4 bg-red-50 rounded-lg border border-red-200"
                            >
                                <div class="flex items-start justify-between">
                                    <div>
                                        <div class="flex items-center gap-2">
                                            <span class="badge badge-danger">{{ getConflictTypeLabel(conflict.type) }}</span>
                                        </div>
                                        <p class="text-sm text-red-700 mt-2">{{ conflict.description }}</p>
                                        <div v-if="conflict.data && conflict.data.duplicate_ids" class="mt-2">
                                            <p class="text-xs text-red-600">关联预约：</p>
                                            <div class="flex flex-wrap gap-1 mt-1">
                                                <span
                                                    v-for="(name, idx) in conflict.data.duplicate_student_names || []"
                                                    :key="idx"
                                                    class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded"
                                                >
                                                    {{ name }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-5 space-y-6">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold flex items-center gap-2">
                                <span class="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">2</span>
                                选择时段
                            </h2>
                        </div>
                        <div class="card-body">
                            <div class="mb-4">
                                <label class="label">试听日期 <span class="text-red-500">*</span></label>
                                <div class="flex gap-2">
                                    <input
                                        v-model="form.trial_date"
                                        type="date"
                                        class="input-field flex-1"
                                        @change="loadCapacityInfo"
                                    />
                                    <button
                                        @click="setToday"
                                        class="btn-secondary text-sm px-3 whitespace-nowrap"
                                        type="button"
                                    >
                                        今天
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label class="label">选择时段 <span class="text-red-500">*</span></label>
                                <div v-if="capacityInfo.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
                                    <div
                                        v-for="slot in capacityInfo"
                                        :key="slot.id"
                                        @click="selectTimeSlot(slot)"
                                        :class="[
                                            'p-3 rounded-xl border-2 cursor-pointer transition-all',
                                            form.time_slot_id === slot.id
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                                            slot.is_full ? 'opacity-60' : ''
                                        ]"
                                    >
                                        <div class="flex justify-between items-start">
                                            <div>
                                                <div class="font-semibold text-gray-900">{{ slot.name }}</div>
                                                <div class="text-sm text-gray-500 mt-0.5">
                                                    {{ slot.start_time }} - {{ slot.end_time }}
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <div :class="['text-lg font-bold', getCapacityTextClass(slot)]">
                                                    {{ slot.booked_count }}/{{ slot.max_capacity }}
                                                </div>
                                                <div class="text-xs text-gray-400 mt-0.5">
                                                    剩余 {{ slot.available_count }} 个名额
                                                </div>
                                            </div>
                                        </div>

                                        <div class="mt-3">
                                            <div class="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    :class="[
                                                        'h-2 rounded-full transition-all duration-300',
                                                        slot.is_full ? 'bg-red-500' : slot.is_warning ? 'bg-yellow-500' : 'bg-green-500'
                                                    ]"
                                                    :style="{ width: getCapacityPercent(slot) + '%' }"
                                                />
                                            </div>
                                            <div class="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>0</span>
                                                <span v-if="slot.warn_capacity > 0">预警: {{ slot.warn_capacity }}</span>
                                                <span>上限: {{ slot.max_capacity }}</span>
                                            </div>
                                        </div>

                                        <div class="mt-2 flex items-center gap-2">
                                            <span v-if="slot.is_full" class="badge badge-danger">已满</span>
                                            <span v-else-if="slot.is_warning" class="badge badge-warning">即将满员</span>
                                            <span v-else class="badge badge-success">名额充足</span>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="text-center py-8 text-gray-400">
                                    请先选择日期
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold">容量规则说明</h2>
                        </div>
                        <div class="card-body space-y-3 text-sm">
                            <div class="flex items-start gap-2">
                                <div class="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                                <div>
                                    <div class="font-medium text-gray-700">默认容量</div>
                                    <div class="text-gray-500">平时时段的标准容量配置</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-2">
                                <div class="w-2 h-2 rounded-full bg-yellow-500 mt-1.5"></div>
                                <div>
                                    <div class="font-medium text-gray-700">周末加开</div>
                                    <div class="text-gray-500">周六日根据需求增加容量</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-2">
                                <div class="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                                <div>
                                    <div class="font-medium text-gray-700">节假日/特殊日</div>
                                    <div class="text-gray-500">节假日特殊容量调整</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card bg-blue-50 border-blue-200">
                        <div class="card-body">
                            <div class="flex items-start gap-3">
                                <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div class="text-sm text-blue-800">
                                    <p class="font-medium mb-1">预约须知</p>
                                    <ul class="space-y-1 text-blue-700">
                                        <li>• 请提前15分钟到达场地</li>
                                        <li>• 如需取消请提前24小时</li>
                                        <li>• 每位学员首次试听免费</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <button
                            @click="submitForm"
                            :disabled="isSubmitting"
                            class="w-full btn-primary justify-center py-3 text-base"
                        >
                            <span v-if="isSubmitting">提交中...</span>
                            <span v-else>创建预约</span>
                        </button>
                        <Link :href="route('dashboard')" class="w-full btn-secondary justify-center flex py-3">
                            取消
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Link, router, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage();
const props = page.props;

const courses = props.courses || [];
const timeSlots = props.timeSlots || [];
const users = props.users || [];
const sourceChannels = props.sourceChannels || [];
const initialCapacityInfo = props.capacityInfo || [];
const selectedDate = props.selectedDate || new Date().toISOString().split('T')[0];
const selectedTimeSlot = props.selectedTimeSlot || null;

const form = reactive({
    student_name: '',
    age: null,
    gender: 'unknown',
    parent_name: '',
    phone: '',
    source_channel: '',
    source_detail: '',
    course_id: null,
    time_slot_id: selectedTimeSlot ? parseInt(selectedTimeSlot) : null,
    trial_date: selectedDate,
    remark: '',
    assigned_to: null,
});

const capacityInfo = ref(initialCapacityInfo);
const detectedConflicts = ref([]);
const isSubmitting = ref(false);
const isCheckingConflicts = ref(false);

const selectTimeSlot = (slot) => {
    if (slot.is_full) {
        alert('该时段已满，请选择其他时段');
        return;
    }
    form.time_slot_id = slot.id;
    checkConflicts();
};

const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    form.trial_date = today;
    loadCapacityInfo();
};

const loadCapacityInfo = async () => {
    if (!form.trial_date) return;

    try {
        const response = await fetch(route('bookings.capacity-all') + '?' + new URLSearchParams({
            date: form.trial_date,
        }));
        const data = await response.json();

        capacityInfo.value = data.slots || [];

        if (form.time_slot_id) {
            checkConflicts();
        }
    } catch (e) {
        console.error('加载容量信息失败', e);
    }
};

const checkConflicts = async () => {
    if (!form.time_slot_id || !form.trial_date) {
        detectedConflicts.value = [];
        return;
    }

    isCheckingConflicts.value = true;

    try {
        const params = new URLSearchParams({
            time_slot_id: form.time_slot_id,
            trial_date: form.trial_date,
            student_name: form.student_name || '',
            phone: form.phone || '',
        });

        const response = await fetch(route('bookings.check-conflicts') + '?' + params);
        const data = await response.json();

        detectedConflicts.value = data.conflicts || [];

        if (data.capacity) {
            const slotIndex = capacityInfo.value.findIndex(s => s.id === data.capacity.id);
            if (slotIndex > -1) {
                capacityInfo.value[slotIndex] = data.capacity;
            } else {
                capacityInfo.value = [data.capacity];
            }
        }
    } catch (e) {
        console.error('检查冲突失败', e);
    } finally {
        isCheckingConflicts.value = false;
    }
};

const getConflictTypeLabel = (type) => {
    const labels = {
        'capacity_full': '容量已满',
        'time_overlap': '时间重叠',
        'student_duplicate': '学员重复',
        'phone_duplicate': '手机号重复',
        'other': '其他冲突',
    };
    return labels[type] || type;
};

const getCapacityPercent = (slot) => {
    if (!slot.max_capacity) return 0;
    return Math.min(100, Math.round((slot.booked_count / slot.max_capacity) * 100));
};

const getCapacityTextClass = (slot) => {
    if (slot.is_full) return 'text-red-600';
    if (slot.is_warning) return 'text-yellow-600';
    return 'text-green-600';
};

const submitForm = () => {
    if (!form.student_name) {
        alert('请输入学员姓名');
        return;
    }
    if (!form.phone) {
        alert('请输入联系电话');
        return;
    }
    if (!form.time_slot_id) {
        alert('请选择时段');
        return;
    }
    if (!form.trial_date) {
        alert('请选择试听日期');
        return;
    }

    if (detectedConflicts.value.length > 0) {
        if (!confirm(`检测到 ${detectedConflicts.value.length} 个冲突，确定要继续创建吗？`)) {
            return;
        }
    }

    isSubmitting.value = true;
    router.post(route('bookings.store'), form, {
        onFinish: () => {
            isSubmitting.value = false;
        },
    });
};

onMounted(() => {
    if (form.trial_date && capacityInfo.value.length === 0) {
        loadCapacityInfo();
    }
    if (form.trial_date && form.time_slot_id) {
        checkConflicts();
    }
});
</script>
