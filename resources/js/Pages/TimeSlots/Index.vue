<template>
    <AppLayout title="时段配置">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">时段配置</h1>
                    <p class="text-gray-600 mt-1">管理试听时段和容量规则</p>
                </div>
                <Link :href="route('time-slots.create')" class="btn-primary">
                    新建时段
                </Link>
            </div>

            <div class="card">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时段名称</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">默认容量</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">适用星期</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="slot in timeSlots.data" :key="slot.id" class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {{ slot.name }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ slot.start_time }} - {{ slot.end_time }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ slot.default_capacity }} 人
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ slot.day_of_week !== null ? getWeekdayLabel(slot.day_of_week) : '每天' }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span :class="slot.is_active ? 'badge badge-success' : 'badge badge-gray'">
                                        {{ slot.is_active ? '启用' : '停用' }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link :href="route('time-slots.edit', slot.id)" class="text-blue-600 hover:text-blue-900 mr-3">
                                        编辑
                                    </Link>
                                </td>
                            </tr>
                            <tr v-if="timeSlots.data.length === 0">
                                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                                    暂无时段数据
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
import { Link, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage();
const props = page.props;

const timeSlots = props.timeSlots;

const getWeekdayLabel = (day) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[day] || '';
};
</script>
