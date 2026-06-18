<template>
    <AppLayout title="异常处理">
        <div class="space-y-6">
            <div class="card">
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label class="label">搜索</label>
                            <input v-model="form.search" type="text" class="input-field" placeholder="标题/描述" @keyup.enter="handleSearch" />
                        </div>
                        <div>
                            <label class="label">状态</label>
                            <select v-model="form.status" class="select-field" @change="handleSearch">
                                <option value="">全部</option>
                                <option v-for="(label, value) in statuses" :key="value" :value="value">{{ label }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">类型</label>
                            <select v-model="form.type" class="select-field" @change="handleSearch">
                                <option value="">全部</option>
                                <option v-for="(label, value) in types" :key="value" :value="value">{{ label }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">严重程度</label>
                            <select v-model="form.severity" class="select-field" @change="handleSearch">
                                <option value="">全部</option>
                                <option v-for="(label, value) in severities" :key="value" :value="value">{{ label }}</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button type="button" @click="resetFilters" class="btn-secondary w-full">重置</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="text-lg font-medium text-gray-900">
                        异常列表
                        <span class="text-sm font-normal text-gray-500 ml-2">共 {{ anomalies.total }} 条</span>
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead class="table-head">
                            <tr>
                                <th class="table-th">ID</th>
                                <th class="table-th">车辆</th>
                                <th class="table-th">类型</th>
                                <th class="table-th">标题</th>
                                <th class="table-th">严重程度</th>
                                <th class="table-th">状态</th>
                                <th class="table-th">来源</th>
                                <th class="table-th">上报人</th>
                                <th class="table-th">处理人</th>
                                <th class="table-th">创建时间</th>
                                <th class="table-th">操作</th>
                            </tr>
                        </thead>
                        <tbody class="table-body">
                            <tr v-for="anomaly in anomalies.data" :key="anomaly.id">
                                <td class="table-td text-sm text-gray-500">#{{ anomaly.id }}</td>
                                <td class="table-td">
                                    <Link :href="route('vehicles.show', anomaly.vehicle?.id)" class="table-link">
                                        <div class="font-medium">{{ anomaly.vehicle?.brand }} {{ anomaly.vehicle?.model }}</div>
                                        <div class="text-xs text-gray-500">{{ anomaly.vehicle?.plate_no || anomaly.vehicle?.vin?.slice(-8) }}</div>
                                    </Link>
                                </td>
                                <td class="table-td"><span class="badge-blue">{{ anomaly.type_label }}</span></td>
                                <td class="table-td">
                                    <div class="font-medium">{{ anomaly.title }}</div>
                                    <div class="text-xs text-gray-500 line-clamp-1">{{ anomaly.description }}</div>
                                </td>
                                <td class="table-td">
                                    <span :class="getSeverityClass(anomaly.severity)">{{ anomaly.severity_label }}</span>
                                </td>
                                <td class="table-td">
                                    <span :class="getStatusClass(anomaly.status)">{{ anomaly.status_label }}</span>
                                </td>
                                <td class="table-td text-sm text-gray-600">{{ anomaly.source_label }}</td>
                                <td class="table-td text-sm">{{ anomaly.reporter?.name || '-' }}</td>
                                <td class="table-td text-sm">{{ anomaly.handler?.name || '-' }}</td>
                                <td class="table-td text-sm text-gray-500">{{ formatDateTime(anomaly.created_at) }}</td>
                                <td class="table-td">
                                    <Link :href="route('anomalies.show', anomaly.id)" class="table-link">处理</Link>
                                </td>
                            </tr>
                            <tr v-if="!anomalies.data?.length">
                                <td colspan="11" class="table-td text-center text-gray-500 py-8">暂无异常记录</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="px-6 py-3 border-t border-gray-200">
                    <Pagination :links="anomalies.links" />
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { reactive } from 'vue';
import { usePage, router, Link } from '@inertiajs/vue3';
import AppLayout from '@/Components/AppLayout.vue';
import Pagination from '@/Components/Pagination.vue';

const props = defineProps({
    anomalies: Object,
    filters: Object,
    statuses: Object,
    types: Object,
    severities: Object,
    can: Object,
});

const form = reactive({
    search: props.filters.search || '',
    status: props.filters.status || '',
    type: props.filters.type || '',
    severity: props.filters.severity || '',
});

const handleSearch = () => {
    router.get(route('anomalies.index'), { ...form }, { preserveState: true });
};

const resetFilters = () => {
    form.search = '';
    form.status = '';
    form.type = '';
    form.severity = '';
    handleSearch();
};

const formatDateTime = (dt) => {
    if (!dt) return '-';
    return new Date(dt).toLocaleString('zh-CN');
};

const getSeverityClass = (severity) => {
    const classes = { low: 'badge-gray', normal: 'badge-yellow', high: 'badge-red', critical: 'badge-red' };
    return classes[severity] || 'badge-gray';
};

const getStatusClass = (status) => {
    const classes = { open: 'badge-red', in_progress: 'badge-yellow', escalated: 'badge-purple', resolved: 'badge-green', closed: 'badge-gray' };
    return classes[status] || 'badge-gray';
};
</script>
