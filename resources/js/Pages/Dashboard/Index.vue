<template>
    <AppLayout title="工作台">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-900">试听预约协同台</h1>
                <p class="text-gray-600 mt-1">统一管理日常填报、跟进和复盘</p>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="card card-body">
                    <div class="text-sm text-gray-500">本月预约</div>
                    <div class="text-2xl font-bold text-gray-900 mt-1">{{ stats.total_bookings }}</div>
                </div>
                <div class="card card-body">
                    <div class="text-sm text-gray-500">到场率</div>
                    <div class="text-2xl font-bold text-green-600 mt-1">{{ stats.attendance_rate }}%</div>
                </div>
                <div class="card card-body">
                    <div class="text-sm text-gray-500">待处理</div>
                    <div class="text-2xl font-bold text-yellow-600 mt-1">{{ statusGroups.to_handle.count }}</div>
                </div>
                <div class="card card-body">
                    <div class="text-sm text-gray-500">升级复核</div>
                    <div class="text-2xl font-bold text-red-600 mt-1">{{ statusGroups.escalated.count }}</div>
                </div>
            </div>

            <div class="flex flex-wrap gap-2 mb-4">
                <button
                    v-for="(group, key) in statusGroups"
                    :key="key"
                    @click="filterByGroup(key)"
                    :class="[
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        currentGroup === key
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    ]"
                >
                    {{ group.label }}
                    <span class="ml-1 px-2 py-0.5 text-xs rounded-full" :class="currentGroup === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'">
                        {{ group.count }}
                    </span>
                </button>
            </div>

            <div class="card mb-6">
                <div class="card-header flex justify-between items-center">
                    <h2 class="text-lg font-semibold">预约列表</h2>
                    <div class="flex gap-3">
                        <div class="relative">
                            <input
                                v-model="search"
                                type="text"
                                placeholder="搜索姓名/手机号/单号"
                                class="input-field pl-10 pr-4 py-2 text-sm"
                                @keyup.enter="applyFilters"
                            />
                            <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <Link :href="route('bookings.create')" class="btn-primary">
                            新建预约
                        </Link>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单号</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学员信息</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">试听时间</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任人</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">冲突</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="booking in bookings.data" :key="booking.id" class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                    {{ booking.booking_no }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">{{ booking.student_name }}</div>
                                    <div class="text-sm text-gray-500">{{ booking.phone }}</div>
                                    <div v-if="booking.parent_name" class="text-xs text-gray-400">家长: {{ booking.parent_name }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900">{{ booking.trial_date }}</div>
                                    <div class="text-sm text-gray-500">{{ booking.time_slot?.name }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ booking.source_channel || '-' }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ booking.assigned_to?.name || '未分配' }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span :class="getStatusBadgeClass(booking.status)">
                                        {{ getStatusLabel(booking.status) }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span v-if="booking.conflicts_count > 0" class="badge badge-danger">
                                        {{ booking.conflicts_count }} 个
                                    </span>
                                    <span v-else class="text-gray-400 text-sm">-</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link :href="route('bookings.show', booking.id)" class="text-blue-600 hover:text-blue-900">
                                        详情
                                    </Link>
                                </td>
                            </tr>
                            <tr v-if="bookings.data.length === 0">
                                <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                                    暂无预约数据
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="bookings.links" class="px-6 py-4 border-t border-gray-200">
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-500">
                            共 {{ bookings.total }} 条记录
                        </div>
                        <div class="flex gap-2">
                            <button
                                v-for="link in bookings.links"
                                :key="link.url"
                                @click="link.url && router.get(link.url)"
                                :disabled="!link.url"
                                :class="[
                                    'px-3 py-1 rounded text-sm',
                                    link.active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
                                    !link.url && 'opacity-50 cursor-not-allowed'
                                ]"
                                v-html="link.label"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Link, usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage();
const props = page.props;

const bookings = props.bookings;
const stats = props.stats;
const statusGroups = props.statusGroups;
const currentGroup = ref(props.currentGroup || 'to_handle');
const search = ref(props.filters?.search || '');

const filterByGroup = (group) => {
    currentGroup.value = group;
    router.get(route('dashboard'), { group }, { preserveState: true });
};

const applyFilters = () => {
    router.get(route('dashboard'), {
        group: currentGroup.value,
        search: search.value,
    }, { preserveState: true });
};

const getStatusLabel = (status) => {
    const labels = {
        pending: '待跟进',
        confirmed: '已确认',
        need_info: '补资料',
        escalated: '升级复核',
        completed: '已完成',
        cancelled: '已取消',
        closed: '已关闭',
    };
    return labels[status] || status;
};

const getStatusBadgeClass = (status) => {
    const classes = {
        pending: 'badge badge-warning',
        confirmed: 'badge badge-info',
        need_info: 'badge badge-warning',
        escalated: 'badge badge-danger',
        completed: 'badge badge-success',
        cancelled: 'badge badge-gray',
        closed: 'badge badge-gray',
    };
    return classes[status] || 'badge badge-gray';
};
</script>
