<template>
    <AppLayout title="预约管理">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-900">预约管理</h1>
            </div>

            <div class="card mb-6">
                <div class="card-body">
                    <div class="flex flex-wrap gap-4 items-end">
                        <div>
                            <label class="label">搜索</label>
                            <input v-model="filters.search" type="text" class="input-field" placeholder="姓名/手机号/单号" @keyup.enter="applyFilters" />
                        </div>
                        <div>
                            <label class="label">状态</label>
                            <select v-model="filters.status" class="select-field" @change="applyFilters">
                                <option value="">全部</option>
                                <option value="pending">待跟进</option>
                                <option value="confirmed">已确认</option>
                                <option value="need_info">补资料</option>
                                <option value="escalated">升级复核</option>
                                <option value="completed">已完成</option>
                                <option value="cancelled">已取消</option>
                                <option value="closed">已关闭</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">状态分组</label>
                            <select v-model="filters.group" class="select-field" @change="applyFilters">
                                <option value="">全部</option>
                                <option value="to_handle">待处理</option>
                                <option value="need_info">补资料</option>
                                <option value="escalated">升级复核</option>
                                <option value="completed">已完成</option>
                                <option value="closed">已关闭</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">开始日期</label>
                            <input v-model="filters.trial_date_from" type="date" class="input-field" @change="applyFilters" />
                        </div>
                        <div>
                            <label class="label">结束日期</label>
                            <input v-model="filters.trial_date_to" type="date" class="input-field" @change="applyFilters" />
                        </div>
                        <button @click="resetFilters" class="btn-secondary">
                            重置
                        </button>
                        <Link :href="route('bookings.create')" class="btn-primary">
                            新建预约
                        </Link>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单号</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学员信息</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">试听时间</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">课程</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任人</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
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
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900">{{ booking.trial_date }}</div>
                                    <div class="text-sm text-gray-500">{{ booking.time_slot?.name }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ booking.course?.name || '-' }}
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
import { reactive } from 'vue';
import { Link, usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage();
const props = page.props;

const bookings = props.bookings;
const filters = reactive({
    search: props.filters?.search || '',
    status: props.filters?.status || '',
    group: props.filters?.group || '',
    trial_date_from: props.filters?.trial_date_from || '',
    trial_date_to: props.filters?.trial_date_to || '',
});

const applyFilters = () => {
    router.get(route('bookings.index'), filters, { preserveState: true });
};

const resetFilters = () => {
    filters.search = '';
    filters.status = '';
    filters.group = '';
    filters.trial_date_from = '';
    filters.trial_date_to = '';
    applyFilters();
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
