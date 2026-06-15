<template>
    <AppLayout :title="`预约详情 - ${booking.booking_no}`">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
                <div class="flex items-center justify-between">
                    <div>
                        <Link :href="route('dashboard')" class="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                            ← 返回工作台
                        </Link>
                        <div class="flex items-center gap-3">
                            <h1 class="text-2xl font-bold text-gray-900">预约详情</h1>
                            <span :class="['badge', getStatusBadgeClass(booking.status)]">
                                {{ getStatusLabel(booking.status) }}
                            </span>
                        </div>
                        <p class="text-gray-500 mt-1">预约编号：{{ booking.booking_no }}</p>
                    </div>
                    <div class="flex gap-2">
                        <Link :href="route('bookings.edit', booking.id)" class="btn-secondary">
                            编辑
                        </Link>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div class="lg:col-span-8 space-y-6">
                    <div class="card">
                        <div class="card-header flex justify-between items-center">
                            <h2 class="text-lg font-semibold">基本信息</h2>
                            <span class="text-sm text-gray-400">
                                状态分组：{{ getGroupLabel(booking.status) }}
                            </span>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-2 gap-6">
                                <div>
                                    <label class="text-sm text-gray-500">学员姓名</label>
                                    <p class="text-lg font-medium mt-1">{{ booking.student_name }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-gray-500">性别</label>
                                    <p class="mt-1">{{ getGenderLabel(booking.gender) }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-gray-500">年龄</label>
                                    <p class="mt-1">{{ booking.age ? booking.age + '岁' : '-' }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-gray-500">家长姓名</label>
                                    <p class="mt-1">{{ booking.parent_name || '-' }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-gray-500">联系电话</label>
                                    <p class="mt-1 font-medium">{{ booking.phone }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-gray-500">试听课程</label>
                                    <p class="mt-1">{{ booking.course ? booking.course.name : '-' }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-gray-500">试听日期</label>
                                    <p class="mt-1 font-medium text-blue-600">{{ booking.trial_date }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-gray-500">试听时段</label>
                                    <p class="mt-1 font-medium text-blue-600">
                                        {{ booking.time_slot ? booking.time_slot.name : '-' }}
                                        <span v-if="booking.time_slot" class="text-gray-400 font-normal ml-1">
                                            ({{ booking.time_slot.start_time }} - {{ booking.time_slot.end_time }})
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label class="text-sm text-gray-500">来源渠道</label>
                                    <p class="mt-1">{{ booking.source_channel || '-' }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-gray-500">来源详情</label>
                                    <p class="mt-1">{{ booking.source_detail || '-' }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-gray-500">责任人</label>
                                    <p class="mt-1">{{ booking.assigned_to ? booking.assignedTo.name : '未分配' }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-gray-500">创建人</label>
                                    <p class="mt-1">{{ booking.created_by ? booking.createdBy.name : '-' }}</p>
                                </div>
                            </div>

                            <div v-if="booking.remark" class="mt-6 pt-6 border-t border-gray-100">
                                <label class="text-sm text-gray-500">备注</label>
                                <p class="mt-2 text-gray-700">{{ booking.remark }}</p>
                            </div>
                        </div>
                    </div>

                    <div v-if="booking.conflicts && booking.conflicts.length > 0" class="card border-yellow-300">
                        <div class="card-header bg-yellow-50 border-yellow-200">
                            <div class="flex items-center gap-2">
                                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h2 class="text-lg font-semibold text-yellow-800">冲突记录</h2>
                                <span class="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                    {{ booking.conflicts.length }} 条
                                </span>
                            </div>
                        </div>
                        <div class="card-body space-y-3">
                            <div
                                v-for="conflict in booking.conflicts"
                                :key="conflict.id"
                                :class="[
                                    'p-4 rounded-lg border',
                                    conflict.is_resolved
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-yellow-50 border-yellow-200'
                                ]"
                            >
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2">
                                            <span :class="['badge', conflict.is_resolved ? 'badge-success' : 'badge-warning']">
                                                {{ getConflictTypeLabel(conflict.conflict_type) }}
                                            </span>
                                            <span v-if="conflict.is_resolved" class="text-xs text-green-600">
                                                ✓ 已解决
                                            </span>
                                        </div>
                                        <p class="text-sm text-gray-700 mt-2">{{ conflict.description }}</p>
                                        <p v-if="conflict.resolution_note" class="text-sm text-green-700 mt-2">
                                            解决说明：{{ conflict.resolution_note }}
                                        </p>
                                        <p class="text-xs text-gray-400 mt-2">
                                            检测时间：{{ formatDate(conflict.detected_at) }}
                                        </p>
                                    </div>
                                    <div v-if="!conflict.is_resolved && booking.status !== 'closed'" class="ml-4">
                                        <button
                                            @click="resolveConflict(conflict)"
                                            class="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            解决冲突
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold">跟进记录</h2>
                        </div>
                        <div class="card-body">
                            <div v-if="booking.followUps && booking.followUps.length > 0" class="space-y-4">
                                <div
                                    v-for="(followUp, index) in booking.followUps"
                                    :key="followUp.id"
                                    class="relative pl-8 pb-6"
                                    :class="index === booking.followUps.length - 1 ? 'pb-0' : ''"
                                >
                                    <div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                        </svg>
                                    </div>
                                    <div v-if="index < booking.followUps.length - 1" class="absolute left-2.5 top-7 w-0.5 h-full bg-gray-200"></div>

                                    <div class="flex items-center gap-2 text-sm text-gray-500">
                                        <span class="font-medium text-gray-700">{{ followUp.createdBy?.name || '系统' }}</span>
                                        <span>{{ getFollowUpTypeLabel(followUp.type) }}</span>
                                        <span>·</span>
                                        <span>{{ formatDate(followUp.follow_up_at) }}</span>
                                    </div>
                                    <p class="text-gray-700 mt-2">{{ followUp.content }}</p>
                                    <div v-if="followUp.next_follow_up_at" class="text-xs text-orange-600 mt-1">
                                        下次跟进：{{ formatDate(followUp.next_follow_up_at) }}
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-center py-8 text-gray-400">
                                暂无跟进记录
                            </div>

                            <div v-if="booking.status !== 'closed'" class="mt-6 pt-6 border-t border-gray-100">
                                <h3 class="text-sm font-medium text-gray-700 mb-3">添加跟进</h3>
                                <form @submit.prevent="addFollowUp">
                                    <div class="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <label class="label text-xs">跟进类型</label>
                                            <select v-model="followUpForm.type" class="select-field text-sm py-2">
                                                <option value="call">电话</option>
                                                <option value="wechat">微信</option>
                                                <option value="visit">现场</option>
                                                <option value="other">其他</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="label text-xs">下次跟进时间</label>
                                            <input v-model="followUpForm.next_follow_up_at" type="datetime-local" class="input-field text-sm py-2" />
                                        </div>
                                    </div>
                                    <textarea
                                        v-model="followUpForm.content"
                                        rows="2"
                                        class="input-field text-sm"
                                        placeholder="跟进内容..."
                                    ></textarea>
                                    <div class="mt-3 text-right">
                                        <button type="submit" class="btn-primary text-sm">
                                            添加跟进
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold">复盘信息</h2>
                        </div>
                        <div class="card-body">
                            <div v-if="booking.status === 'completed' || booking.reviewed_at" class="space-y-4">
                                <div class="grid grid-cols-2 gap-6">
                                    <div>
                                        <label class="text-sm text-gray-500">是否到场</label>
                                        <p class="mt-1">
                                            <span v-if="booking.attended" class="text-green-600 font-medium">已到场</span>
                                            <span v-else class="text-red-500 font-medium">未到场</span>
                                        </p>
                                    </div>
                                    <div>
                                        <label class="text-sm text-gray-500">到场时间</label>
                                        <p class="mt-1">{{ booking.attended_at || '-' }}</p>
                                    </div>
                                    <div>
                                        <label class="text-sm text-gray-500">试听体验</label>
                                        <p class="mt-1">{{ booking.trial_feedback || '-' }}</p>
                                    </div>
                                    <div>
                                        <label class="text-sm text-gray-500">报名意向</label>
                                        <p class="mt-1">{{ getIntentLabel(booking.signup_intent) }}</p>
                                    </div>
                                </div>

                                <div v-if="booking.review_tags && booking.review_tags.length > 0">
                                    <label class="text-sm text-gray-500">复盘标签</label>
                                    <div class="flex flex-wrap gap-2 mt-2">
                                        <span
                                            v-for="tag in booking.review_tags"
                                            :key="tag"
                                            class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                        >
                                            {{ tag }}
                                        </span>
                                    </div>
                                </div>

                                <div v-if="booking.review_note">
                                    <label class="text-sm text-gray-500">复盘备注</label>
                                    <p class="mt-2 text-gray-700">{{ booking.review_note }}</p>
                                </div>
                            </div>

                            <div v-else class="text-center py-6 text-gray-400">
                                待试听完成后进行复盘
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div class="flex items-center justify-between">
                                <h2 class="text-lg font-semibold">操作日志 <span class="text-sm font-normal text-gray-400">（复核依据）</span></h2>
                                <span class="text-xs text-gray-400">共 {{ auditLogs.length }} 条记录</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="space-y-3 max-h-96 overflow-y-auto">
                                <div
                                    v-for="log in auditLogs"
                                    :key="log.id"
                                    class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                >
                                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between">
                                            <span class="font-medium text-gray-700 text-sm">
                                                {{ getAuditActionLabel(log.action) }}
                                            </span>
                                            <span class="text-xs text-gray-400">
                                                {{ formatDate(log.created_at) }}
                                            </span>
                                        </div>
                                        <p class="text-sm text-gray-500 mt-1">
                                            操作人：{{ log.user?.name || '系统' }}
                                        </p>
                                        <div v-if="log.details" class="mt-2 text-xs text-gray-500 bg-white rounded p-2 border border-gray-100">
                                            <pre class="whitespace-pre-wrap font-mono">{{ JSON.stringify(log.details, null, 2) }}</pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-if="auditLogs.length === 0" class="text-center py-8 text-gray-400">
                                暂无操作日志
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-4 space-y-6">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold">操作面板</h2>
                        </div>
                        <div class="card-body space-y-3">
                            <div v-if="availableTransitions.length > 0 && booking.status !== 'closed'" class="space-y-2">
                                <p class="text-sm text-gray-500 mb-2">可执行的状态变更：</p>
                                <button
                                    v-for="transition in availableTransitions"
                                    :key="transition.status"
                                    @click="changeStatus(transition.status)"
                                    :class="['w-full justify-center', getButtonClassByStatus(transition.status)]"
                                    class="btn-primary"
                                >
                                    {{ transition.label }}
                                </button>
                            </div>

                            <div v-if="booking.status === 'closed'" class="text-center py-4">
                                <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <p class="text-gray-500 text-sm">该预约已关闭</p>
                                <p class="text-gray-400 text-xs mt-1">关闭后仍可查看详情和操作日志进行核对</p>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold">状态流转</h2>
                        </div>
                        <div class="card-body">
                            <div class="space-y-3">
                                <div
                                    v-for="(group, groupKey) in statusGroups"
                                    :key="groupKey"
                                    :class="[
                                        'p-3 rounded-lg border-2 transition-all',
                                        isCurrentGroup(groupKey)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-100 bg-gray-50'
                                    ]"
                                >
                                    <div class="flex items-center justify-between">
                                        <span class="font-medium text-sm">{{ getGroupLabelByKey(groupKey) }}</span>
                                        <span v-if="isCurrentGroup(groupKey)" class="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                            当前
                                        </span>
                                    </div>
                                    <div class="flex flex-wrap gap-1 mt-2">
                                        <span
                                            v-for="status in group"
                                            :key="status"
                                            :class="[
                                                'text-xs px-2 py-0.5 rounded',
                                                booking.status === status
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 text-gray-600'
                                            ]"
                                        >
                                            {{ getStatusLabel(status) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold">创建信息</h2>
                        </div>
                        <div class="card-body text-sm space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-500">创建时间</span>
                                <span>{{ formatDate(booking.created_at) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">创建人</span>
                                <span>{{ booking.createdBy?.name || '-' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">更新时间</span>
                                <span>{{ formatDate(booking.updated_at) }}</span>
                            </div>
                            <div v-if="booking.closed_at" class="flex justify-between">
                                <span class="text-gray-500">关闭时间</span>
                                <span>{{ formatDate(booking.closed_at) }}</span>
                            </div>
                            <div v-if="booking.closedBy" class="flex justify-between">
                                <span class="text-gray-500">关闭人</span>
                                <span>{{ booking.closedBy?.name || '-' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Link, router, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage();
const props = page.props;

const booking = props.booking || {};
const auditLogs = props.auditLogs || [];
const availableTransitions = props.availableTransitions || [];

const followUpForm = ref({
    type: 'phone',
    content: '',
    follow_up_at: '',
    next_follow_up_at: '',
    next_action: '',
    result: '',
});

const statusGroups = computed(() => ({
    'to_handle': ['pending', 'confirmed'],
    'need_info': ['need_info'],
    'escalated': ['escalated'],
    'completed': ['completed', 'cancelled'],
    'closed': ['closed'],
}));

const isCurrentGroup = (groupKey) => {
    const statuses = statusGroups.value[groupKey] || [];
    return statuses.includes(booking.status);
};

const getGroupLabel = (status) => {
    const groups = statusGroups.value;
    for (const [key, statuses] of Object.entries(groups)) {
        if (statuses.includes(status)) {
            return getGroupLabelByKey(key);
        }
    }
    return '未知';
};

const getGroupLabelByKey = (key) => {
    const labels = {
        'to_handle': '待处理池',
        'need_info': '补资料池',
        'escalated': '升级复核池',
        'completed': '已完成池',
        'closed': '已关闭池',
    };
    return labels[key] || key;
};

const getStatusLabel = (status) => {
    const labels = {
        'pending': '待确认',
        'confirmed': '已确认',
        'need_info': '待补资料',
        'escalated': '升级复核',
        'completed': '已完成',
        'cancelled': '已取消',
        'closed': '已关闭',
    };
    return labels[status] || status;
};

const getStatusBadgeClass = (status) => {
    const classes = {
        'pending': 'badge-warning',
        'confirmed': 'badge-info',
        'need_info': 'badge-warning',
        'escalated': 'badge-danger',
        'completed': 'badge-success',
        'cancelled': 'badge-gray',
        'closed': 'badge-gray',
    };
    return classes[status] || 'badge-gray';
};

const getGenderLabel = (gender) => {
    const labels = {
        'male': '男',
        'female': '女',
        'unknown': '未知',
    };
    return labels[gender] || '未知';
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

const getFollowUpTypeLabel = (type) => {
    const labels = {
        'phone': '电话跟进',
        'wechat': '微信跟进',
        'onsite': '现场跟进',
        'other': '其他跟进',
    };
    return labels[type] || type;
};

const getIntentLabel = (intent) => {
    const labels = {
        'high': '高',
        'medium': '中',
        'low': '低',
        'none': '无意向',
    };
    return labels[intent] || '-';
};

const getAuditActionLabel = (action) => {
    const labels = {
        'created': '创建预约',
        'updated': '更新预约',
        'status_changed': '状态变更',
        'follow_up_added': '添加跟进',
        'conflict_detected': '检测到冲突',
        'conflict_resolved': '冲突解决',
        'escalated': '升级复核',
        'reviewed': '完成复盘',
        'completed': '预约完成',
        'cancelled': '预约取消',
        'closed': '预约关闭',
    };
    return labels[action] || action;
};

const getButtonClassByStatus = (status) => {
    const classes = {
        'confirmed': 'btn-success',
        'need_info': 'btn-warning',
        'escalated': 'btn-danger',
        'completed': 'btn-success',
        'cancelled': 'btn-secondary',
        'closed': 'btn-secondary',
    };
    return classes[status] || 'btn-primary';
};

const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const changeStatus = (status) => {
    if (!confirm(`确定要将状态变更为「${getStatusLabel(status)}」吗？`)) {
        return;
    }
    router.post(route('bookings.change-status', booking.id), { status }, {
        preserveScroll: true,
    });
};

const addFollowUp = () => {
    if (!followUpForm.value.content.trim()) {
        alert('请输入跟进内容');
        return;
    }
    router.post(route('bookings.follow-up.store', booking.id), followUpForm.value, {
        preserveScroll: true,
        onSuccess: () => {
            followUpForm.value.content = '';
            followUpForm.value.next_follow_up_at = '';
            followUpForm.value.result = '';
            followUpForm.value.next_action = '';
        },
    });
};

const resolveConflict = (conflict) => {
    const note = prompt('请输入解决说明：');
    if (!note) return;

    router.post(route('bookings.conflicts.resolve', [booking.id, conflict.id]), {
        resolution_note: note,
    }, {
        preserveScroll: true,
    });
};

onMounted(() => {
});
</script>
