<template>
    <AppLayout title="首页概览">
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">在库车辆</p>
                            <p class="mt-1 text-3xl font-semibold text-gray-900">{{ stats.in_stock }}</p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-full">
                            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                        </div>
                    </div>
                    <div class="mt-4 flex items-center gap-4 text-sm">
                        <span class="badge-yellow">评估中 {{ stats.pending }}</span>
                        <span class="badge-blue">整备中 {{ stats.preparing }}</span>
                        <span class="badge-green">待售 {{ stats.available }}</span>
                    </div>
                </div>

                <div class="card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">本月已售</p>
                            <p class="mt-1 text-3xl font-semibold text-gray-900">{{ stats.sold_this_month }}</p>
                        </div>
                        <div class="p-3 bg-green-100 rounded-full">
                            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p class="mt-4 text-sm text-gray-500">
                        本月销售额: ¥{{ formatNumber(stats.sold_revenue_this_month) }}
                    </p>
                </div>

                <div class="card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">库存价值</p>
                            <p class="mt-1 text-3xl font-semibold text-gray-900">¥{{ formatNumber(stats.stock_value) }}</p>
                        </div>
                        <div class="p-3 bg-purple-100 rounded-full">
                            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div class="card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">待处理异常</p>
                            <p class="mt-1 text-3xl font-semibold text-gray-900">{{ stats.open_anomalies }}</p>
                        </div>
                        <div class="p-3 bg-red-100 rounded-full">
                            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>
                    <p class="mt-4 text-sm" :class="stats.high_severity_anomalies > 0 ? 'text-red-600' : 'text-gray-500'">
                        高严重程度: {{ stats.high_severity_anomalies }} 项
                    </p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-medium text-gray-900">库存周转趋势</h3>
                    </div>
                    <div class="card-body">
                        <div class="space-y-3">
                            <div
                                v-for="item in inventoryTurnover"
                                :key="item.month"
                                class="flex items-center justify-between"
                            >
                                <span class="text-sm text-gray-600">{{ item.month }}</span>
                                <div class="flex items-center gap-4">
                                    <span class="text-sm text-gray-500">售出 {{ item.sold_count }} 台</span>
                                    <span class="text-sm font-medium" :class="item.turnover_days && item.turnover_days > 30 ? 'text-red-600' : 'text-gray-900'">
                                        {{ item.turnover_days ? item.turnover_days + ' 天' : '-' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-medium text-gray-900">最近异常</h3>
                        <Link v-if="can.manage_anomaly" :href="route('anomalies.index')" class="text-sm text-primary-600 hover:text-primary-700">
                            查看全部
                        </Link>
                    </div>
                    <div class="card-body">
                        <div v-if="recentAnomalies.length === 0" class="text-sm text-gray-500 text-center py-4">
                            暂无待处理异常
                        </div>
                        <div v-else class="space-y-3">
                            <div
                                v-for="anomaly in recentAnomalies"
                                :key="anomaly.id"
                                class="flex items-start justify-between p-3 bg-gray-50 rounded"
                            >
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-medium">{{ anomaly.title }}</span>
                                        <span :class="getSeverityClass(anomaly.severity)">{{ anomaly.severity_label }}</span>
                                        <span :class="getStatusClass(anomaly.status)">{{ anomaly.status_label }}</span>
                                    </div>
                                    <p class="mt-1 text-xs text-gray-500">
                                        {{ anomaly.vehicle?.brand }} {{ anomaly.vehicle?.model }}
                                        ({{ anomaly.vehicle?.plate_no || anomaly.vehicle?.vin?.slice(-6) }})
                                    </p>
                                </div>
                                <Link :href="route('anomalies.show', anomaly.id)" class="text-sm text-primary-600 hover:text-primary-700">
                                    处理
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="text-lg font-medium text-gray-900">最近车辆</h3>
                    <Link v-if="can.create_vehicle" :href="route('vehicles.create')" class="btn-primary text-sm py-1">
                        + 新建车辆
                    </Link>
                </div>
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead class="table-head">
                            <tr>
                                <th class="table-th">车辆信息</th>
                                <th class="table-th">车架号/车牌</th>
                                <th class="table-th">状态</th>
                                <th class="table-th">库龄</th>
                                <th class="table-th">负责人</th>
                                <th class="table-th">操作</th>
                            </tr>
                        </thead>
                        <tbody class="table-body">
                            <tr v-for="vehicle in recentVehicles" :key="vehicle.id">
                                <td class="table-td">
                                    <div class="font-medium">{{ vehicle.brand }} {{ vehicle.model }}</div>
                                    <div class="text-xs text-gray-500">{{ vehicle.year }}款 · {{ vehicle.color || '未填色' }}</div>
                                </td>
                                <td class="table-td">
                                    <div class="text-sm">{{ vehicle.plate_no || '待上牌' }}</div>
                                    <div class="text-xs text-gray-500 font-mono">{{ vehicle.vin?.slice(-8) }}</div>
                                </td>
                                <td class="table-td">
                                    <VehicleStatusBadge :status="vehicle.status" />
                                </td>
                                <td class="table-td">
                                    <span v-if="vehicle.days_in_stock !== null" :class="vehicle.days_in_stock > 30 ? 'text-red-600 font-medium' : ''">
                                        {{ vehicle.days_in_stock }} 天
                                    </span>
                                    <span v-else class="text-gray-400">-</span>
                                </td>
                                <td class="table-td text-sm">
                                    <span v-if="vehicle.appraiser">{{ vehicle.appraiser.name }}</span>
                                    <span v-else class="text-gray-400">未分配</span>
                                </td>
                                <td class="table-td">
                                    <Link :href="route('vehicles.show', vehicle.id)" class="table-link">
                                        详情
                                    </Link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import AppLayout from '@/Components/AppLayout.vue';
import VehicleStatusBadge from '@/Components/VehicleStatusBadge.vue';
import { Link } from '@inertiajs/vue3';

defineProps({
    stats: Object,
    inventoryTurnover: Array,
    recentVehicles: Array,
    recentAnomalies: Array,
    vehiclesByStatus: Object,
    userRole: String,
    permissions: Object,
});

const can = {
    create_vehicle: true,
    manage_anomaly: true,
};

const formatNumber = (num) => {
    return Number(num || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 });
};

const getSeverityClass = (severity) => {
    const classes = {
        low: 'badge-gray',
        normal: 'badge-yellow',
        high: 'badge-red',
        critical: 'badge-red',
    };
    return classes[severity] || 'badge-gray';
};

const getStatusClass = (status) => {
    const classes = {
        open: 'badge-red',
        in_progress: 'badge-yellow',
        escalated: 'badge-purple',
        resolved: 'badge-green',
        closed: 'badge-gray',
    };
    return classes[status] || 'badge-gray';
};
</script>
