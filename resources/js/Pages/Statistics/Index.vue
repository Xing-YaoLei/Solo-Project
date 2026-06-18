<template>
    <AppLayout title="统计分析">
        <div class="space-y-6">
            <div class="card">
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="label">统计周期</label>
                            <select v-model="form.period" class="select-field" @change="handleSearch">
                                <option value="week">本周</option>
                                <option value="month">本月</option>
                                <option value="quarter">本季度</option>
                                <option value="year">本年</option>
                                <option value="custom">自定义</option>
                            </select>
                        </div>
                        <div v-if="form.period === 'custom'">
                            <label class="label">开始日期</label>
                            <input v-model="form.date_from" type="date" class="input-field" @change="handleSearch" />
                        </div>
                        <div v-if="form.period === 'custom'">
                            <label class="label">结束日期</label>
                            <input v-model="form.date_to" type="date" class="input-field" @change="handleSearch" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="card p-6">
                    <div class="text-sm text-gray-500">新增入库</div>
                    <div class="mt-2 text-3xl font-bold text-gray-900">{{ overview.acquired }}</div>
                    <div class="mt-2 text-sm text-gray-600">价值 ¥{{ formatNumber(overview.acquired_value) }}</div>
                </div>
                <div class="card p-6">
                    <div class="text-sm text-gray-500">已售出</div>
                    <div class="mt-2 text-3xl font-bold text-green-600">{{ overview.sold }}</div>
                    <div class="mt-2 text-sm text-gray-600">销售额 ¥{{ formatNumber(overview.revenue) }}</div>
                </div>
                <div class="card p-6">
                    <div class="text-sm text-gray-500">利润</div>
                    <div class="mt-2 text-3xl font-bold" :class="overview.profit >= 0 ? 'text-green-600' : 'text-red-600'">
                        ¥{{ formatNumber(overview.profit) }}
                    </div>
                    <div class="mt-2 text-sm text-gray-600">利润率 {{ overview.profit_margin }}%</div>
                </div>
                <div class="card p-6">
                    <div class="text-sm text-gray-500">平均库存周转</div>
                    <div class="mt-2 text-3xl font-bold" :class="overview.avg_turnover_days > 30 ? 'text-red-600' : 'text-gray-900'">
                        {{ overview.avg_turnover_days }} 天
                    </div>
                    <div class="mt-2 text-sm text-gray-600">当前库存 {{ overview.in_stock }} 台</div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-medium text-gray-900">每日库存与销量</h3>
                    </div>
                    <div class="card-body">
                        <div class="h-64 overflow-x-auto">
                            <div class="flex items-end gap-1 h-full min-w-max">
                                <div
                                    v-for="item in inventoryTurnover"
                                    :key="item.date"
                                    class="flex flex-col items-center gap-1 px-2"
                                >
                                    <div class="flex items-end gap-1 h-48">
                                        <div
                                            class="w-4 bg-blue-500 rounded-t"
                                            :style="{ height: (item.stock / maxStock) * 180 + 'px' }"
                                            :title="'库存: ' + item.stock"
                                        ></div>
                                        <div
                                            class="w-4 bg-green-500 rounded-t"
                                            :style="{ height: (item.sold / maxStock) * 180 + 'px' }"
                                            :title="'售出: ' + item.sold"
                                        ></div>
                                    </div>
                                    <div class="text-xs text-gray-500 w-16 truncate">{{ item.date.slice(5) }}</div>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center justify-center gap-6 mt-4 text-sm">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-blue-500 rounded"></div>
                                <span class="text-gray-600">库存量</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-green-500 rounded"></div>
                                <span class="text-gray-600">日销量</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-medium text-gray-900">品牌收购分布</h3>
                    </div>
                    <div class="card-body">
                        <div class="space-y-3">
                            <div
                                v-for="brand in vehicleStats.by_brand"
                                :key="brand.brand"
                                class="space-y-1"
                            >
                                <div class="flex items-center justify-between text-sm">
                                    <span class="font-medium text-gray-900">{{ brand.brand }}</span>
                                    <span class="text-gray-500">{{ brand.count }} 台 · ¥{{ formatNumber(brand.total_value) }}</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        class="bg-primary-500 h-2 rounded-full"
                                        :style="{ width: (brand.count / maxBrandCount) * 100 + '%' }"
                                    ></div>
                                </div>
                            </div>
                            <div v-if="!vehicleStats.by_brand?.length" class="text-center text-sm text-gray-500 py-8">
                                暂无数据
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-medium text-gray-900">异常统计</h3>
                    </div>
                    <div class="card-body">
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="p-4 bg-gray-50 rounded">
                                <div class="text-sm text-gray-500">异常总数</div>
                                <div class="mt-1 text-2xl font-bold text-gray-900">{{ anomalyStats.total }}</div>
                            </div>
                            <div class="p-4 bg-gray-50 rounded">
                                <div class="text-sm text-gray-500">解决率</div>
                                <div class="mt-1 text-2xl font-bold text-green-600">{{ anomalyStats.resolution_rate }}%</div>
                            </div>
                            <div class="p-4 bg-gray-50 rounded">
                                <div class="text-sm text-gray-500">已解决</div>
                                <div class="mt-1 text-2xl font-bold text-green-600">{{ anomalyStats.resolved }}</div>
                            </div>
                            <div class="p-4 bg-gray-50 rounded">
                                <div class="text-sm text-gray-500">平均处理时长</div>
                                <div class="mt-1 text-2xl font-bold text-gray-900">{{ anomalyStats.avg_resolution_hours }} 小时</div>
                            </div>
                        </div>
                        <div class="text-sm font-medium text-gray-700 mb-3">按类型分布</div>
                        <div class="space-y-2">
                            <div
                                v-for="(count, type) in anomalyStats.by_type"
                                :key="type"
                                class="flex items-center justify-between text-sm"
                            >
                                <span class="text-gray-600">{{ getAnomalyTypeLabel(type) }}</span>
                                <span class="font-medium text-gray-900">{{ count }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-medium text-gray-900">利润分析</h3>
                    </div>
                    <div class="card-body">
                        <div class="grid grid-cols-3 gap-4 mb-6">
                            <div class="p-4 bg-gray-50 rounded text-center">
                                <div class="text-sm text-gray-500">成交车辆</div>
                                <div class="mt-1 text-2xl font-bold text-gray-900">{{ profitAnalysis.total_sold }}</div>
                            </div>
                            <div class="p-4 bg-gray-50 rounded text-center">
                                <div class="text-sm text-gray-500">平均利润</div>
                                <div class="mt-1 text-2xl font-bold text-green-600">¥{{ formatNumber(profitAnalysis.avg_profit) }}</div>
                            </div>
                            <div class="p-4 bg-gray-50 rounded text-center">
                                <div class="text-sm text-gray-500">平均利润率</div>
                                <div class="mt-1 text-2xl font-bold" :class="profitAnalysis.avg_profit_margin >= 0 ? 'text-green-600' : 'text-red-600'">
                                    {{ profitAnalysis.avg_profit_margin }}%
                                </div>
                            </div>
                        </div>
                        <div class="text-sm font-medium text-gray-700 mb-3">利润率分布</div>
                        <div class="space-y-3">
                            <div
                                v-for="range in profitAnalysis.profit_ranges"
                                :key="range.label"
                                class="space-y-1"
                            >
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-gray-600">{{ range.label }}</span>
                                    <span class="font-medium text-gray-900">{{ range.count }} 台</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        :class="[
                                            'h-2 rounded-full',
                                            range.label === '亏损' ? 'bg-red-500' :
                                            range.label.includes('15%') ? 'bg-green-600' :
                                            range.label.includes('10%') ? 'bg-green-500' :
                                            range.label.includes('5%') ? 'bg-yellow-500' :
                                            'bg-blue-500'
                                        ]"
                                        :style="{ width: profitAnalysis.total_sold ? (range.count / profitAnalysis.total_sold) * 100 + '%' : '0%' }"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="text-lg font-medium text-gray-900">热销车型 TOP 10</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead class="table-head">
                            <tr>
                                <th class="table-th">排名</th>
                                <th class="table-th">品牌</th>
                                <th class="table-th">车型</th>
                                <th class="table-th">销量</th>
                                <th class="table-th">平均周转天数</th>
                            </tr>
                        </thead>
                        <tbody class="table-body">
                            <tr v-for="(model, index) in topModels" :key="index">
                                <td class="table-td">
                                    <span
                                        :class="[
                                            'px-2 py-1 text-xs font-bold rounded',
                                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                            index === 1 ? 'bg-gray-200 text-gray-700' :
                                            index === 2 ? 'bg-orange-100 text-orange-800' :
                                            'bg-gray-100 text-gray-600'
                                        ]"
                                    >
                                        #{{ index + 1 }}
                                    </span>
                                </td>
                                <td class="table-td font-medium">{{ model.brand }}</td>
                                <td class="table-td">{{ model.model }}</td>
                                <td class="table-td font-medium text-green-600">{{ model.sold_count }} 台</td>
                                <td class="table-td" :class="model.avg_turnover_days > 30 ? 'text-red-600' : ''">
                                    {{ model.avg_turnover_days }} 天
                                </td>
                            </tr>
                            <tr v-if="!topModels?.length">
                                <td colspan="5" class="table-td text-center text-gray-500 py-8">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { router } from '@inertiajs/vue3';
import AppLayout from '@/Components/AppLayout.vue';

const props = defineProps({
    overview: Object,
    inventoryTurnover: Array,
    vehicleStats: Object,
    anomalyStats: Object,
    profitAnalysis: Object,
    topModels: Array,
    filters: Object,
});

const form = reactive({
    period: props.filters.period || 'month',
    date_from: props.filters.date_from || '',
    date_to: props.filters.date_to || '',
});

const handleSearch = () => {
    router.get(route('statistics.index'), { ...form }, { preserveState: true });
};

const formatNumber = (num) => {
    return Number(num || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 });
};

const maxStock = computed(() => {
    return Math.max(1, ...props.inventoryTurnover.map(i => Math.max(i.stock, i.sold)));
});

const maxBrandCount = computed(() => {
    return Math.max(1, ...(props.vehicleStats.by_brand?.map(b => b.count) || [1]));
});

const getAnomalyTypeLabel = (type) => {
    const labels = {
        missing_doc: '资料缺失',
        damage_dispute: '车况争议',
        price_dispute: '价格争议',
        legal_risk: '法律风险',
        other: '其他异常',
    };
    return labels[type] || type;
};
</script>
