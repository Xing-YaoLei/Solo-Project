<template>
    <AppLayout title="编辑预约">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
                <Link :href="route('bookings.show', booking.id)" class="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                    ← 返回详情
                </Link>
                <h1 class="text-2xl font-bold text-gray-900">编辑预约</h1>
                <p class="text-gray-500 text-sm mt-1">单号: {{ booking.booking_no }}</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold">基本信息</h2>
                        </div>
                        <div class="card-body">
                            <form @submit.prevent="submitForm">
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label class="label">学员姓名 <span class="text-red-500">*</span></label>
                                        <input v-model="form.student_name" type="text" class="input-field" />
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
                                        <input v-model.number="form.age" type="number" min="3" max="18" class="input-field" />
                                    </div>
                                    <div>
                                        <label class="label">家长姓名</label>
                                        <input v-model="form.parent_name" type="text" class="input-field" />
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label class="label">联系电话 <span class="text-red-500">*</span></label>
                                        <input v-model="form.phone" type="tel" class="input-field" />
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
                                        <input v-model="form.source_detail" type="text" class="input-field" />
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

                                <div class="mb-4">
                                    <label class="label">备注</label>
                                    <textarea v-model="form.remark" rows="3" class="input-field"></textarea>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold">试听时间</h2>
                        </div>
                        <div class="card-body">
                            <div class="mb-4">
                                <label class="label">试听日期</label>
                                <input v-model="form.trial_date" type="date" class="input-field" @change="loadCapacityInfo" />
                            </div>

                            <div v-if="capacityInfo.length > 0" class="space-y-2">
                                <label class="label">选择时段</label>
                                <div
                                    v-for="slot in capacityInfo"
                                    :key="slot.id"
                                    @click="selectTimeSlot(slot)"
                                    :class="[
                                        'p-3 rounded-lg border-2 cursor-pointer transition-all',
                                        form.time_slot_id === slot.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300',
                                        slot.is_full ? 'opacity-50' : ''
                                    ]"
                                >
                                    <div class="flex justify-between items-center">
                                        <div>
                                            <div class="font-medium">{{ slot.name }}</div>
                                            <div class="text-sm text-gray-500">{{ slot.start_time }} - {{ slot.end_time }}</div>
                                        </div>
                                        <div class="text-right">
                                            <div :class="['text-sm font-medium', slot.is_full ? 'text-red-600' : 'text-green-600']">
                                                {{ slot.booked_count }}/{{ slot.max_capacity }}
                                            </div>
                                            <div class="text-xs text-gray-400">
                                                剩余 {{ slot.available_count }} 个
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="detectedConflicts.length > 0" class="card border-red-200">
                        <div class="card-header bg-red-50 border-red-200">
                            <div class="flex items-center gap-2">
                                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h2 class="text-lg font-semibold text-red-800">冲突检测</h2>
                                <span class="badge badge-danger">{{ detectedConflicts.length }} 个</span>
                            </div>
                        </div>
                        <div class="card-body space-y-3">
                            <div v-for="(conflict, index) in detectedConflicts" :key="index" class="p-3 bg-red-50 rounded-lg border border-red-100">
                                <span class="font-medium text-red-800 text-sm">{{ getConflictTypeLabel(conflict.type) }}</span>
                                <p class="text-sm text-red-600 mt-1">{{ conflict.description }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body space-y-3">
                            <button @click="submitForm" class="w-full btn-primary justify-center">
                                保存修改
                            </button>
                            <Link :href="route('bookings.show', booking.id)" class="w-full btn-secondary justify-center flex">
                                取消
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { Link, usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage();
const props = page.props;

const booking = props.booking;
const courses = props.courses || [];
const timeSlots = props.timeSlots || [];
const users = props.users || [];
const sourceChannels = props.sourceChannels || [];
const initialCapacityInfo = props.capacityInfo || [];

const form = reactive({
    student_name: booking.student_name,
    age: booking.age,
    gender: booking.gender,
    parent_name: booking.parent_name || '',
    phone: booking.phone,
    source_channel: booking.source_channel || '',
    source_detail: booking.source_detail || '',
    course_id: booking.course_id,
    time_slot_id: booking.time_slot_id,
    trial_date: booking.trial_date,
    remark: booking.remark || '',
    assigned_to: booking.assigned_to,
});

const capacityInfo = ref(initialCapacityInfo);
const detectedConflicts = ref([]);

const selectTimeSlot = (slot) => {
    if (slot.is_full) {
        return;
    }
    form.time_slot_id = slot.id;
    checkConflicts();
};

const loadCapacityInfo = () => {
    if (!form.trial_date) return;
    checkConflicts();
};

const checkConflicts = async () => {
    if (!form.time_slot_id || !form.trial_date) {
        detectedConflicts.value = [];
        return;
    }

    try {
        const response = await fetch(route('bookings.check-conflicts') + '?' + new URLSearchParams({
            time_slot_id: form.time_slot_id,
            trial_date: form.trial_date,
            student_name: form.student_name,
            phone: form.phone,
            booking_id: booking.id,
        }));
        const data = await response.json();
        detectedConflicts.value = data.conflicts || [];
    } catch (e) {
        console.error('检查冲突失败', e);
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
        if (!confirm(`检测到 ${detectedConflicts.value.length} 个冲突，确定要继续保存吗？`)) {
            return;
        }
    }

    router.put(route('bookings.update', booking.id), form);
};

watch(() => form.student_name, () => {
    if (form.time_slot_id && form.trial_date) {
        checkConflicts();
    }
});

watch(() => form.phone, () => {
    if (form.time_slot_id && form.trial_date) {
        checkConflicts();
    }
});

watch(() => form.time_slot_id, () => {
    checkConflicts();
});

onMounted(() => {
    if (form.trial_date && form.time_slot_id) {
        checkConflicts();
    }
});
</script>
