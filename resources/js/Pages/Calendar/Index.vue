<template>
    <AppLayout title="日历视图">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-900">日历视图</h1>
                <p class="text-gray-600 mt-1">按日期查看所有试听预约</p>
            </div>

            <div class="card mb-6">
                <div class="card-header flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <div class="flex gap-2">
                            <button @click="prevPeriod" class="btn-secondary text-sm px-3 py-1">
                                上一周
                            </button>
                            <button @click="nextPeriod" class="btn-secondary text-sm px-3 py-1">
                                下一周
                            </button>
                            <button @click="goToToday" class="btn-secondary text-sm px-3 py-1">
                                今天
                            </button>
                        </div>
                        <span class="text-lg font-semibold">
                            {{ startDate }} 至 {{ endDate }}
                        </span>
                    </div>
                    <div class="flex gap-2">
                        <select v-model="filters.status" @change="applyFilters" class="select-field text-sm">
                            <option value="">全部状态</option>
                            <option value="pending">待跟进</option>
                            <option value="confirmed">已确认</option>
                            <option value="need_info">补资料</option>
                            <option value="escalated">升级复核</option>
                            <option value="completed">已完成</option>
                            <option value="cancelled">已取消</option>
                        </select>
                        <Link :href="route('bookings.create') + '?date=' + new Date().toISOString().split('T')[0]" class="btn-primary text-sm">
                            新建预约
                        </Link>
                    </div>
                </div>
            </div>

            <div class="card overflow-x-auto">
                <div class="min-w-[800px]">
                    <div class="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
                        <div class="p-3 text-center font-medium text-gray-500 text-sm">
                            时段
                        </div>
                        <div
                            v-for="date in dateList"
                            :key="date"
                            :class="[
                                'p-3 text-center font-medium text-sm border-l border-gray-200',
                                isToday(date) ? 'bg-blue-50 text-blue-600' : 'text-gray-500'
                            ]"
                        >
                            <div>{{ getWeekdayLabel(date) }}</div>
                            <div class="text-lg font-bold">{{ getDayNumber(date) }}</div>
                        </div>
                    </div>

                    <div v-for="slot in timeSlots" :key="slot.id" class="grid grid-cols-8 border-b border-gray-100">
                        <div class="p-3 text-sm text-gray-600 bg-gray-50">
                            <div class="font-medium">{{ slot.name }}</div>
                            <div class="text-xs text-gray-400">{{ slot.start_time }} - {{ slot.end_time }}</div>
                        </div>
                        <div
                            v-for="date in dateList"
                            :key="date + '-' + slot.id"
                            :class="[
                                'p-2 min-h-[80px] border-l border-gray-100 relative',
                                isToday(date) ? 'bg-blue-50/30' : ''
                            ]"
                        >
                            <div v-if="getSlotCapacity(date, slot.id)" class="text-xs text-gray-400 mb-1">
                                {{ getSlotCapacity(date, slot.id).booked_count }}/{{ getSlotCapacity(date, slot.id).max_capacity }}
                            </div>

                            <div class="space-y-1">
                                <div
                                    v-for="booking in getBookingsForSlot(date, slot.id)"
                                    :key="booking.id"
                                    :class="[
                                        'p-1.5 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity',
                                        getBookingBgClass(booking.status)
                                    ]"
                                    @click="goToBooking(booking.id)"
                                >
                                    <div class="font-medium truncate">{{ booking.student_name }}</div>
                                    <div class="text-xs opacity-75 truncate">{{ booking.phone }}</div>
                                </div>
                            </div>

                            <div
                                v-if="getBookingsForSlot(date, slot.id).length === 0"
                                class="text-center text-gray-300 text-xs py-2 cursor-pointer hover:text-gray-400"
                                @click="createBooking(date, slot.id)"
                            >
                                + 新增
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-4 flex justify-center gap-6 text-sm">
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></span>
                    <span class="text-gray-600">待跟进</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded bg-blue-100 border border-blue-300"></span>
                    <span class="text-gray-600">已确认</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded bg-red-100 border border-red-300"></span>
                    <span class="text-gray-600">升级复核</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded bg-green-100 border border-green-300"></span>
                    <span class="text-gray-600">已完成</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded bg-gray-100 border border-gray-300"></span>
                    <span class="text-gray-600">已取消/关闭</span>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Link, usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage();
const props = page.props;

const calendarData = props.calendarData || {};
const timeSlots = props.timeSlots || [];
const capacityData = props.capacityData || {};
const initialStartDate = props.startDate;
const initialEndDate = props.endDate;
const initialFilters = props.filters || {};

const startDate = ref(initialStartDate);
const endDate = ref(initialEndDate);
const filters = ref({
    status: initialFilters.status || '',
    assigned_to: initialFilters.assigned_to || '',
    source_channel: initialFilters.source_channel || '',
});

const dateList = computed(() => {
    const dates = [];
    let current = new Date(startDate.value);
    const end = new Date(endDate.value);
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
});

const getWeekdayLabel = (dateStr) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const date = new Date(dateStr);
    return weekdays[date.getDay()];
};

const getDayNumber = (dateStr) => {
    const date = new Date(dateStr);
    return date.getDate();
};

const isToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
};

const getBookingsForSlot = (date, slotId) => {
    const dayBookings = calendarData[date] || [];
    return dayBookings.filter(b => b.time_slot_id === slotId);
};

const getSlotCapacity = (date, slotId) => {
    const dayCapacity = capacityData[date] || [];
    return dayCapacity.find(c => c.id === slotId);
};

const getBookingBgClass = (status) => {
    const classes = {
        pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
        need_info: 'bg-orange-100 text-orange-800 border border-orange-200',
        escalated: 'bg-red-100 text-red-800 border border-red-200',
        completed: 'bg-green-100 text-green-800 border border-green-200',
        cancelled: 'bg-gray-100 text-gray-600 border border-gray-200',
        closed: 'bg-gray-100 text-gray-500 border border-gray-200',
    };
    return classes[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
};

const prevPeriod = () => {
    const start = new Date(startDate.value);
    start.setDate(start.getDate() - 7);
    const end = new Date(endDate.value);
    end.setDate(end.getDate() - 7);
    startDate.value = start.toISOString().split('T')[0];
    endDate.value = end.toISOString().split('T')[0];
    loadCalendarData();
};

const nextPeriod = () => {
    const start = new Date(startDate.value);
    start.setDate(start.getDate() + 7);
    const end = new Date(endDate.value);
    end.setDate(end.getDate() + 7);
    startDate.value = start.toISOString().split('T')[0];
    endDate.value = end.toISOString().split('T')[0];
    loadCalendarData();
};

const goToToday = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    startDate.value = startOfWeek.toISOString().split('T')[0];
    endDate.value = endOfWeek.toISOString().split('T')[0];
    loadCalendarData();
};

const applyFilters = () => {
    loadCalendarData();
};

const loadCalendarData = () => {
    router.get(route('calendar'), {
        start_date: startDate.value,
        end_date: endDate.value,
        ...filters.value,
    }, { preserveState: true });
};

const goToBooking = (id) => {
    router.visit(route('bookings.show', id));
};

const createBooking = (date, slotId) => {
    router.visit(route('bookings.create') + `?date=${date}&time_slot_id=${slotId}`);
};
</script>
