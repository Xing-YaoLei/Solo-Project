<template>
    <AppLayout title="数据汇总">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-900">数据汇总</h1>
                <p class="text-gray-600 mt-1">按到场率、来源渠道、责任人和复盘标签统计分析</p>
            </div>

            <div class="card mb-6">
                <div class="card-body flex flex-wrap gap-4 items-end">
                    <div>
                        <label class="label">开始日期</label>
                        <input v-model="filters.start_date" type="date" class="input-field" @change="loadData" />
                    </div>
                    <div>
                        <label class="label">结束日期</label>
                        <input v-model="filters.end_date" type="date" class="input-field" @change="loadData" />
                    </div>
                    <button @click="setThisMonth" class="btn-secondary text-sm">
                        本月
                    </button>
                    <button @click="setLastMonth" class="btn-secondary text-sm">
                        上月
                    </button>
                    <button @click="setThisQuarter" class="btn-secondary text-sm">
                        本季度
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="card card-body">
                    <div class="text-sm text-gray-500">总预约数</div>
                    <div class="text-2xl font-bold text-gray-900 mt-1">{{ overview.total_bookings }}</div>
                </div>
                <div class="card card-body">
                    <div class="text-sm text-gray-500">到场人数</div>
                    <div class="text-2xl font-bold text-green-600 mt-1">{{ overview.attended_count }}</div>
                </div>
                <div class="card card-body">
                    <div class="text-sm text-gray-500">到场率</div>
                    <div class="text-2xl font-bold text-blue-600 mt-1">{{ overview.attendance_rate }}%</div>
                </div>
                <div class="card card-body">
                    <div class="text-sm text-gray-500">已完成</div>
                    <div class="text-2xl font-bold text-gray-900 mt-1">{{ overview.completed_count }}</div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="card">
                    <div class="card-header">
                        <h2 class="text-lg font-semibold">按来源渠道统计</h2>
                    </div>
                    <div class="card-body">
                        <div v-if="bySourceChannel.length > 0" class="space-y-3">
                            <div v-for="item in bySourceChannel" :key="item.channel" class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="flex justify-between mb-1">
                                        <span class="text-sm font-medium text-gray-700">{{ item.channel }}</span>
                                        <span class="text-sm text-gray-500">{{ item.total }} 人</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            class="bg-blue-500 h-2 rounded-full"
                                            :style="{ width: getPercent(item.total, maxChannelTotal) + '%' }"
                                        />
                                    </div>
                                </div>
                                <div class="ml-4 text-right w-24">
                                    <div class="text-sm font-medium text-green-600">{{ item.attendance_rate }}%</div>
                                    <div class="text-xs text-gray-400">到场率</div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-8 text-gray-500">
                            暂无数据
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2 class="text-lg font-semibold">按责任人统计</h2>
                    </div>
                    <div class="card-body">
                        <div v-if="byAssignee.length > 0" class="space-y-3">
                            <div v-for="item in byAssignee" :key="item.user_id" class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="flex justify-between mb-1">
                                        <span class="text-sm font-medium text-gray-700">{{ item.user_name }}</span>
                                        <span class="text-sm text-gray-500">{{ item.total }} 人</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            class="bg-green-500 h-2 rounded-full"
                                            :style="{ width: getPercent(item.total, maxAssigneeTotal) + '%' }"
                                        />
                                    </div>
                                </div>
                                <div class="ml-4 text-right w-24 space-y-1">
                                    <div class="text-xs">
                                        <span class="text-green-600">到场 {{ item.attended }}</span>
                                    </div>
                                    <div class="text-xs">
                                        <span class="text-red-500">升级 {{ item.escalated }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-8 text-gray-500">
                            暂无数据
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="card">
                    <div class="card-header">
                        <h2 class="text-lg font-semibold">复盘标签分布</h2>
                    </div>
                    <div class="card-body">
                        <div v-if="reviewTags.length > 0" class="space-y-3">
                            <div v-for="item in reviewTags" :key="item.tag" class="flex items-center">
                                <span class="badge badge-info w-24 text-center">{{ item.tag }}</span>
                                <div class="flex-1 mx-3">
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            class="bg-purple-500 h-2 rounded-full"
                                            :style="{ width: getPercent(item.count, maxTagCount) + '%' }"
                                        />
                                    </div>
                                </div>
                                <span class="text-sm font-medium text-gray-700 w-16 text-right">
                                    {{ item.count }} 次
                                </span>
                            </div>
                        </div>
                        <div v-else class="text-center py-8 text-gray-500">
                            暂无复盘标签数据
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2 class="text-lg font-semibold">按时段统计</h2>
                    </div>
                    <div class="card-body">
                        <div v-if="byTimeSlot.length > 0" class="space-y-3">
                            <div v-for="item in byTimeSlot" :key="item.time_slot_id" class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-gray-700">{{ item.time_slot_name }}</div>
                                    <div class="text-xs text-gray-400">{{ item.time_range }}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-bold text-gray-900">{{ item.total }}</div>
                                    <div class="text-xs text-green-600">到场率 {{ item.attendance_rate }}%</div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-8 text-gray-500">
                            暂无数据
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2 class="text-lg font-semibold">每日趋势</h2>
                </div>
                <div class="card-body">
                    <div v-if="dailyTrend.length > 0">
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-2 text-left text-gray-500 font-medium">日期</th>
                                        <th class="px-4 py-2 text-right text-gray-500 font-medium">预约数</th>
                                        <th class="px-4 py-2 text-right text-gray-500 font-medium">待跟进</th>
                                        <th class="px-4 py-2 text-right text-gray-500 font-medium">已确认</th>
                                        <th class="px-4 py-2 text-right text-gray-500 font-medium">已完成</th>
                                        <th class="px-4 py-2 text-right text-gray-500 font-medium">已取消</th>
                                        <th class="px-4 py-2 text-right text-gray-500 font-medium">到场数</th>
                                        <th class="px-4 py-2 text-right text-gray-500 font-medium">到场率</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    <tr v-for="day in dailyTrend" :key="day.date" class="hover:bg-gray-50">
                                        <td class="px-4 py-2 text-gray-900">{{ day.date }}</td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ day.total }}</td>
                                        <td class="px-4 py-2 text-right text-yellow-600">{{ day.pending }}</td>
                                        <td class="px-4 py-2 text-right text-blue-600">{{ day.confirmed }}</td>
                                        <td class="px-4 py-2 text-right text-green-600">{{ day.completed }}</td>
                                        <td class="px-4 py-2 text-right text-gray-400">{{ day.cancelled }}</td>
                                        <td class="px-4 py-2 text-right text-green-600">{{ day.attended }}</td>
                                        <td class="px-4 py-2 text-right font-medium" :class="day.attendance_rate >= 80 ? 'text-green-600' : day.attendance_rate >= 50 ? 'text-yellow-600' : 'text-red-600'">
                                            {{ day.attendance_rate }}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div v-else class="text-center py-8 text-gray-500">
                        暂无数据
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage();
const props = page.props;

const overview = props.overview || {};
const bySourceChannel = props.bySourceChannel || [];
const byAssignee = props.byAssignee || [];
const reviewTags = props.reviewTags || [];
const byTimeSlot = props.byTimeSlot || [];
const dailyTrend = props.dailyTrend || [];

const filters = ref({
    start_date: props.filters?.start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: props.filters?.end_date || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
});

const maxChannelTotal = computed(() => {
    if (bySourceChannel.length === 0) return 1;
    return Math.max(...bySourceChannel.map(i => i.total));
});

const maxAssigneeTotal = computed(() => {
    if (byAssignee.length === 0) return 1;
    return Math.max(...byAssignee.map(i => i.total));
});

const maxTagCount = computed(() => {
    if (reviewTags.length === 0) return 1;
    return Math.max(...reviewTags.map(i => i.count));
});

const getPercent = (value, max) => {
    if (max === 0) return 0;
    return Math.round((value / max) * 100);
};

const loadData = () => {
    router.get(route('statistics'), filters.value, { preserveState: true });
};

const setThisMonth = () => {
    const now = new Date();
    filters.value.start_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    filters.value.end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    loadData();
};

const setLastMonth = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    filters.value.start_date = lastMonth.toISOString().split('T')[0];
    filters.value.end_date = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString().split('T')[0];
    loadData();
};

const setThisQuarter = () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), quarter * 3, 1);
    const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    filters.value.start_date = start.toISOString().split('T')[0];
    filters.value.end_date = end.toISOString().split('T')[0];
    loadData();
};
</script>
