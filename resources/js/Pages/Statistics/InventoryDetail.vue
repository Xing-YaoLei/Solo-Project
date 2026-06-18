<template>
    <AppLayout title="库存周转追踪">
        <div class="space-y-6">
            <div class="card">
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="label">库龄超过(天)</label>
                            <select v-model="form.over_days" class="select-field" @change="handleSearch">
                                <option value="">全部</option>
                                <option value="7">7天以上</option>
                                <option value="15">15天以上</option>
                                <option value="30">30天以上</option>
                                <option value="60">60天以上</option>
                                <option value="90">90天以上</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">品牌</label>
                            <select v-model="form.brand" class="select-field" @change="handleSearch">
                                <option value="">全部</option>
                                <option v-for="brand in brands" :key="brand" :value="brand">{{ brand }}</option>
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
                        在库车辆明细
                        <span class="text-sm font-normal text-gray-500 ml-2">共 {{ vehicles.total }} 台</span>
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead class="table-head">
                            <tr>
                                <th class="table-th">车辆信息</th>
                                <th class="table-th">状态</th>
                                <th class="table-th">入库日期</th>
                                <th class="table-th">库龄</th>
                                <th class="table-th">收购价</th>
                                <th class="table-th">整备费</th>
                                <th class="table-th">总成本</th>
                                <th class="table-th">预期售价</th>
                                <th class="table-th">负责人</th>
                                <th class="table-th">操作</th>
                            </tr>
                        </thead>
                        <tbody class="table-body">
                            <tr v-for="vehicle in vehicles.data" :key="vehicle.id">
                                <td class="table-td">
                                    <Link :href="route('vehicles.show', vehicle.id)" class="table-link font-medium">
                                        {{ vehicle.brand }} {{ vehicle.model }}
                                    </Link>
                                    <div class="text-xs text-gray-500">
                                        {{ vehicle.year }}款 · {{ vehicle.plate_no || '待上牌' }}
                                    </div>
                                </td>
                                <td class="table-td">
                                    <VehicleStatusBadge :status="vehicle.status" />
                                </td>
                                <td class="table-td text-sm">{{ vehicle.arrival_date }}</td>
                                <td class="table-td">
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="font-bold"
                                            :class="[
                                                vehicle.days_in_stock > 90 ? 'text-red-600 text-lg' :
                                                vehicle.days_in_stock > 60 ? 'text-red-500' :
                                                vehicle.days_in_stock > 30 ? 'text-yellow-600' :
                                                'text-gray-900'
                                            ]"
                                        >
                                            {{ vehicle.days_in_stock }} 天
                                        </span>
                                        <div class="w-16 bg-gray-200 rounded-full h-2">
                                            <div
                                                :class="[
                                                    'h-2 rounded-full',
                                                    vehicle.days_in_stock > 90 ? 'bg-red-600' :
                                                    vehicle.days_in_stock > 60 ? 'bg-red-500' :
                                                    vehicle.days_in_stock > 30 ? 'bg-yellow-500' :
                                                    'bg-green-500'
                                                ]"
                                                :style="{ width: Math.min(100, (vehicle.days_in_stock / 90) * 100) + '%' }"
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td class="table-td text-sm">¥{{ vehicle.purchase_price?.toLocaleString() }}</td>
                                <td class="table-td text-sm text-gray-600">¥{{ vehicle.preparation_cost?.toLocaleString() || '0' }}</td>
                                <td class="table-td font-medium">¥{{ vehicle.total_cost?.toLocaleString() }}</td>
                                <td class="table-td text-sm text-primary-600 font-medium">
                                    ¥{{ vehicle.expected_sale_price?.toLocaleString() || '-' }}
                                </td>
                                <td class="table-td text-sm">
                                    <div>{{ vehicle.appraiser?.name || '-' }}</div>
                                    <div v-if="vehicle.sales" class="text-xs text-gray-500">销售: {{ vehicle.sales.name }}</div>
                                </td>
                                <td class="table-td">
                                    <Link :href="route('vehicles.show', vehicle.id)" class="table-link">详情</Link>
                                </td>
                            </tr>
                            <tr v-if="!vehicles.data?.length">
                                <td colspan="10" class="table-td text-center text-gray-500 py-8">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="px-6 py-3 border-t border-gray-200">
                    <Pagination :links="vehicles.links" />
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { reactive } from 'vue';
import { router, Link } from '@inertiajs/vue3';
import AppLayout from '@/Components/AppLayout.vue';
import VehicleStatusBadge from '@/Components/VehicleStatusBadge.vue';
import Pagination from '@/Components/Pagination.vue';

const props = defineProps({
    vehicles: Object,
    filters: Object,
    brands: Array,
});

const form = reactive({
    over_days: props.filters.over_days || '',
    brand: props.filters.brand || '',
});

const handleSearch = () => {
    router.get(route('statistics.inventory-detail'), { ...form }, { preserveState: true });
};

const resetFilters = () => {
    form.over_days = '';
    form.brand = '';
    handleSearch();
};
</script>
