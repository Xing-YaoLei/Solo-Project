<template>
    <AppLayout title="工作台">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-gray-900">试听预约工作台</h1>
                <p class="text-gray-600 mt-1">青少年培训试听预约日常填报、跟进和复盘协同台</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="card">
                    <div class="flex items-center">
                        <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-500">今日预约</p>
                            <p class="text-2xl font-bold text-gray-900">{{ stats.today_count || 0 }}</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="flex items-center">
                        <div class="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-500">待处理</p>
                            <p class="text-2xl font-bold text-yellow-600">{{ stats.pending_count || 0 }}</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="flex items-center">
                        <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-500">已完成</p>
                            <p class="text-2xl font-bold text-green-600">{{ stats.completed_count || 0 }}</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="flex items-center">
                        <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-500">本周到场率</p>
                            <p class="text-2xl font-bold text-purple-600">{{ stats.attendance_rate || '0%' }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-semibold text-gray-900">预约状态分池</h2>
                    <div class="flex gap-2">
                        <Link :href="route('bookings.create')" class="btn-primary">
                            + 新建预约
                        </Link>
                        <Link :href="route('calendar')" class="btn-secondary">
                            日历视图
                        </Link>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div
                        v-for="(group, groupKey) in statusGroupCounts"
                        :key="groupKey"
                        :class="[
                            'p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md',
                            activeGroup === groupKey
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                        ]"
                        @click="switchGroup(groupKey)"
                    >
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-medium text-gray-700">{{ getGroupLabel(groupKey) }}</span>
                            <span
                                :class="[
                                    'text-xl font-bold',
                                    getGroupCountColor(groupKey)
                                ]"
                            >
                                {{ group.count }}
                            </span>
                        </div>
                        <div class="text-xs text-gray-400">
                            {{ group.description }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header flex justify-between items-center">
                    <h2 class="text-lg font-semibold">
                        {{ getGroupLabel(activeGroup) }} · 预约列表
                    </h2>
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <input
                                v-model="searchQuery"
                                type="text"
                                placeholder="搜索学员/电话..."
                                class="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                                @input="debouncedSearch"
                            />
                            <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <select
                            v-model="filterDate"
                            class="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            @change="loadBookings"
                        >
                            <option value="all">全部日期</option>
                            <option value="today">今天</option>
                            <option value="week">本周</option>
                            <option value="month">本月</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        预约编号
                                    </th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        学员信息
                                    </th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        课程/时段
                                    </th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        状态
                                    </th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        来源
                                    </th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        责任人
                                    </th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        创建时间
                                    </th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="booking in bookings" :key="booking.id" class="hover:bg-gray-50">
                                    <td class="px-4 py-4 whitespace-nowrap">
                                        <span class="text-sm font-medium text-blue-600">{{ booking.booking_no }}</span>
                                    </td>
                                    <td class="px-4 py-4 whitespace-nowrap">
                                        <div>
                                            <div class="text-sm font-medium text-gray-900">{{ booking.student_name }}</div>
                                            <div class="text-xs text-gray-500">{{ booking.phone }}</div>
                                            <div v-if="booking.age" class="text-xs text-gray-400">{{ booking.age }}岁 · {{ getGenderLabel(booking.gender) }}</div>
                                        </div>
                                    </td>
                                    <td class="px-4 py-4 whitespace-nowrap">
                                        <div>
                                            <div class="text-sm text-gray-900">{{ booking.course?.name || '-' }}</div>
                                            <div class="text-xs text-gray-500">
                                                {{ booking.trial_date }}
                                                <span v-if="booking.time_slot" class="text-blue-500 ml-1">
                                                    {{ booking.time_slot.name }}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-4 py-4 whitespace-nowrap">
                                        <span :class="['badge', getStatusBadgeClass(booking.status)]">
                                            {{ getStatusLabel(booking.status) }}
                                        </span>
                                        <div v-if="booking.conflicts && booking.conflicts.length > 0" class="mt-1">
                                            <span class="text-xs text-red-500 flex items-center gap-1">
                                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                                </svg>
                                                {{ booking.conflicts.length }} 个冲突
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ booking.source_channel || '-' }}
                                    </td>
                                    <td class="px-4 py-4 whitespace-nowrap">
                                        <span class="text-sm text-gray-500">
                                            {{ booking.assignedTo?.name || '未分配' }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ formatDate(booking.created_at) }}
                                    </td>
                                    <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link :href="route('bookings.show', booking.id)" class="text-blue-600 hover:text-blue-900 mr-3">
                                            详情
                                        </Link>
                                        <Link v-if="booking.status !== 'closed'" :href="route('bookings.edit', booking.id)" class="text-gray-600 hover:text-gray-900">
                                            编辑
                                        </Link>
                                    </td>
                                </tr>
                                <tr v-if="bookings.length === 0">
                                    <td colspan="8" class="px-4 py-12 text-center text-gray-400">
                                        <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p>暂无{{ getGroupLabel(activeGroup) }}的预约</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-if="pagination && pagination.total > pagination.per_page" class="mt-6 flex items-center justify-between">
                        <p class="text-sm text-gray-500">
                            共 {{ pagination.total }} 条记录
                        </p>
                        <div class="flex gap-1">
                            <button
                                v-for="page in Math.min(5, pagination.last_page)"
                                :key="page"
                                @click="changePage(page)"
                                :class="[
                                    'px-3 py-1 text-sm rounded',
                                    currentPage === page
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                ]"
                            >
                                {{ page }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div class="card">
                    <div class="card-header">
                        <h2 class="text-lg font-semibold">今日时段预约情况</h2>
                    </div>
                    <div class="card-body">
                        <div class="space-y-3">
                            <div
                                v-for="slot in todayTimeSlots"
                                :key="slot.id"
                                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div>
                                    <div class="font-medium text-gray-700">{{ slot.name }}</div>
                                    <div class="text-xs text-gray-400">{{ slot.start_time }} - {{ slot.end_time }}</div>
                                </div>
                                <div class="text-right">
                                    <div :class="['font-bold', getCapacityTextClass(slot)]">
                                        {{ slot.booked_count || 0 }}/{{ slot.max_capacity || 0 }}
                                    </div>
                                    <div class="text-xs text-gray-400">
                                        剩余 {{ slot.available_count || 0 }} 位
                                    </div>
                                </div>
                            </div>
                            <div v-if="todayTimeSlots.length === 0" class="text-center py-6 text-gray-400">
                                暂无时段数据
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2 class="text-lg font-semibold">最近操作日志</h2>
                    </div>
                    <div class="card-body">
                        <div class="space-y-3">
                            <div
                                v-for="log in recentLogs"
                                :key="log.id"
                                class="flex items-start gap-3"
                            >
                                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm font-medium text-gray-700 truncate">
                                            {{ getAuditActionLabel(log.action) }}
                                        </span>
                                        <span class="text-xs text-gray-400 flex-shrink-0 ml-2">
                                            {{ formatDate(log.created_at) }}
                                        </span>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1 truncate">
                                        {{ log.user?.name || '系统' }}
                                        <span v-if="log.details">· {{ JSON.stringify(log.details).substring(0, 30) }}</span>
                                    </p>
                                </div>
                            </div>
                            <div v-if="recentLogs.length === 0" class="text-center py-6 text-gray-400">
                                暂无操作日志
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
import { Link, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage();
const props = page.props;

const stats = props.stats || {};
const bookings = ref(props.bookings?.data || []);
const pagination = ref(props.bookings || {});
const currentPage = ref(1);
const activeGroup = ref('to_handle');
const searchQuery = ref('');
const filterDate = ref('all');
const todayTimeSlots = ref(props.todayTimeSlots || []);
const recentLogs = ref(props.recentLogs || []);

const statusGroupCounts = computed(() => ({
    'to_handle': {
        count: props.groupCounts?.to_handle || 0,
        description: '待确认、已确认预约',
    },
    'need_info': {
        count: props.groupCounts?.need_info || 0,
        description: '需要补充资料',
    },
    'escalated': {
        count: props.groupCounts?.escalated || 0,
        description: '升级复核处理中',
    },
    'completed': {
        count: props.groupCounts?.completed || 0,
        description: '已完成、已取消',
    },
    'closed': {
        count: props.groupCounts?.closed || 0,
        description: '已关闭归档',
    },
}));

const getGroupLabel = (key) => {
    const labels = {
        'to_handle': '待处理池',
        'need_info': '补资料池',
        'escalated': '升级复核池',
        'completed': '已完成池',
        'closed': '已关闭池',
    };
    return labels[key] || key;
};

const getGroupCountColor = (key) => {
    const colors = {
        'to_handle': 'text-yellow-600',
        'need_info': 'text-orange-600',
        'escalated': 'text-red-600',
        'completed': 'text-green-600',
        'closed': 'text-gray-500',
    };
    return colors[key] || 'text-gray-600';
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

const getCapacityTextClass = (slot) => {
    if (slot.is_full) return 'text-red-600';
    if (slot.is_warning) return 'text-yellow-600';
    return 'text-green-600';
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

let searchTimeout = null;
const debouncedSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadBookings();
    }, 300);
};

const switchGroup = (group) => {
    activeGroup.value = group;
    currentPage.value = 1;
    loadBookings();
};

const loadBookings = async () => {
    try {
        const params = new URLSearchParams({
            group: activeGroup.value,
            page: currentPage.value,
            search: searchQuery.value,
            date_filter: filterDate.value,
        });

        const response = await fetch(route('dashboard') + '?' + params, {
            headers: {
                'X-Inertia': 'true',
                'X-Inertia-Partial-Component': 'Dashboard/Index',
            },
        });

        const data = await response.json();
        if (data.props) {
            bookings.value = data.props.bookings?.data || [];
            pagination.value = data.props.bookings || {};
        }
    } catch (e) {
        console.error('加载预约列表失败', e);
    }
};

const changePage = (pageNum) => {
    currentPage.value = pageNum;
    loadBookings();
};

onMounted(() => {
});
</script>
