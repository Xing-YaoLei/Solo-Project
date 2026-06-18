<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { usePage, useForm, Head, Link, router } from '@inertiajs/vue3';
import {
    Car, Plus, Download, Filter, Search, ChevronLeft, ChevronRight,
    Eye, Check, X, Edit3, ToggleLeft, ToggleRight, TrendingUp,
    DollarSign, Gauge, Fuel, Settings
} from 'lucide-vue-next';

const { proxy } = getCurrentInstance();
const page = usePage();

const props = defineProps({
    vehicles: Object,
    filters: Object,
    filterOptions: Object,
});

const selectedIds = ref([]);

const form = useForm({
    search: props.filters.search || '',
    brand: props.filters.brand || '',
    transmission: props.filters.transmission || '',
    fuel_type: props.filters.fuel_type || '',
    store_id: props.filters.store_id || '',
    test_drive_available: props.filters.test_drive_available || '',
    price_min: props.filters.price_min || '',
    price_max: props.filters.price_max || '',
    mileage_min: props.filters.mileage_min || '',
    mileage_max: props.filters.mileage_max || '',
});

const allSelected = computed(() => {
    return props.vehicles.data.length > 0 && selectedIds.value.length === props.vehicles.data.length;
});

const toggleSelectAll = () => {
    if (allSelected.value) {
        selectedIds.value = [];
    } else {
        selectedIds.value = props.vehicles.data.map(v => v.id);
    }
};

const toggleSelect = (id) => {
    const idx = selectedIds.value.indexOf(id);
    if (idx > -1) {
        selectedIds.value.splice(idx, 1);
    } else {
        selectedIds.value.push(id);
    }
};

const handleFilter = () => {
    router.get(route('vehicles.index'), form.data(), { preserveState: true, replace: true });
};

const resetFilters = () => {
    form.reset();
    router.get(route('vehicles.index'), {}, { preserveState: true, replace: true });
};

const toggleStatus = (vehicle) => {
    router.post(route('vehicles.toggle-status', vehicle.id), {}, {
        preserveState: true,
    });
};

const exportVehicles = () => {
    router.get(route('vehicles.export'), form.data());
};
</script>

<template>
    <Head title="车辆档案" />

    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">车辆档案管理</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">管理所有可用于试驾的车辆档案</p>
            </div>
            <div class="flex items-center gap-2">
                <button @click="exportVehicles" class="btn-secondary">
                    <Download class="w-4 h-4" />
                    导出
                </button>
                <Link :href="route('vehicles.create')" class="btn-primary">
                    <Plus class="w-4 h-4" />
                    新增车辆
                </Link>
            </div>
        </div>

        <div class="card p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div class="lg:col-span-2">
                    <div class="relative">
                        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input v-model="form.search" type="text" placeholder="搜索VIN/车牌/品牌/车系..." class="input pl-9" @keyup.enter="handleFilter" />
                    </div>
                </div>
                <select v-model="form.brand" class="select" @change="handleFilter">
                    <option value="">全部品牌</option>
                    <option v-for="b in filterOptions.brands" :key="b" :value="b">{{ b }}</option>
                </select>
                <select v-model="form.store_id" class="select" @change="handleFilter">
                    <option value="">全部门店</option>
                    <option v-for="s in filterOptions.stores" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
                <select v-model="form.transmission" class="select" @change="handleFilter">
                    <option value="">全部变速箱</option>
                    <option v-for="t in filterOptions.transmissions" :key="t" :value="t">{{ t }}</option>
                </select>
                <select v-model="form.fuel_type" class="select" @change="handleFilter">
                    <option value="">全部燃油类型</option>
                    <option v-for="f in filterOptions.fuelTypes" :key="f" :value="f">{{ f }}</option>
                </select>
                <select v-model="form.test_drive_available" class="select" @change="handleFilter">
                    <option value="">是否可试驾</option>
                    <option value="1">可试驾</option>
                    <option value="0">不可试驾</option>
                </select>
                <div class="flex items-center gap-1">
                    <input v-model="form.price_min" type="number" class="input" placeholder="最低价格" @keyup.enter="handleFilter" />
                </div>
                <div class="flex items-center gap-1">
                    <input v-model="form.price_max" type="number" class="input" placeholder="最高价格" @keyup.enter="handleFilter" />
                </div>
                <div class="flex items-center gap-2">
                    <input v-model="form.mileage_min" type="number" class="input flex-1" placeholder="里程≥" @keyup.enter="handleFilter" />
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
                <div class="lg:col-span-2"></div>
                <div class="lg:col-span-2 flex items-center gap-1">
                    <span class="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">里程区间(KM)：</span>
                    <input v-model="form.mileage_max" type="number" class="input flex-1" placeholder="里程≤" @keyup.enter="handleFilter" />
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <button @click="handleFilter" class="btn-secondary">
                    <Filter class="w-4 h-4" />
                    应用筛选
                </button>
                <button @click="resetFilters" class="btn-ghost">
                    <X class="w-4 h-4" />
                    重置
                </button>
                <div class="flex-1"></div>
                <span v-if="selectedIds.length > 0" class="text-sm text-slate-500 dark:text-slate-400">
                    已选择 {{ selectedIds.length }} 辆
                </span>
            </div>
        </div>

        <div class="card overflow-hidden">
            <div class="scroll-x">
                <table class="table">
                    <thead>
                        <tr>
                            <th class="w-10">
                                <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            </th>
                            <th>VIN</th>
                            <th>车牌</th>
                            <th>品牌</th>
                            <th>车系</th>
                            <th>型号</th>
                            <th>年款</th>
                            <th>颜色</th>
                            <th>里程(KM)</th>
                            <th>价格</th>
                            <th>门店</th>
                            <th>试驾次数</th>
                            <th>状态</th>
                            <th>可试驾</th>
                            <th class="w-24">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="vehicle in vehicles.data" :key="vehicle.id">
                            <td>
                                <input type="checkbox" :checked="selectedIds.includes(vehicle.id)" @change="toggleSelect(vehicle.id)" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            </td>
                            <td>
                                <Link :href="route('vehicles.show', vehicle.id)" class="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                                    {{ vehicle.vin }}
                                </Link>
                            </td>
                            <td class="font-medium text-slate-900 dark:text-slate-100">{{ vehicle.plate_number || '-' }}</td>
                            <td>{{ vehicle.brand }}</td>
                            <td>{{ vehicle.series }}</td>
                            <td>{{ vehicle.model }}</td>
                            <td>{{ vehicle.year }}</td>
                            <td>{{ vehicle.color }}</td>
                            <td>{{ proxy.$filters.number(vehicle.mileage) }}</td>
                            <td class="font-medium text-emerald-600 dark:text-emerald-400">{{ proxy.$filters.currency(vehicle.price) }}</td>
                            <td>{{ vehicle.store?.name || '-' }}</td>
                            <td>{{ proxy.$filters.number(vehicle.test_drives_count || 0) }}</td>
                            <td>
                                <button
                                    @click="toggleStatus(vehicle)"
                                    :class="vehicle.status === 'active' ? 'badge-success cursor-pointer' : 'badge-gray cursor-pointer'"
                                >
                                    {{ vehicle.status === 'active' ? '上架' : '下架' }}
                                </button>
                            </td>
                            <td>
                                <span v-if="vehicle.test_drive_available" class="badge-success flex items-center gap-1">
                                    <Check class="w-3 h-3" />
                                    可试驾
                                </span>
                                <span v-else class="badge-gray flex items-center gap-1">
                                    <X class="w-3 h-3" />
                                    不可试驾
                                </span>
                            </td>
                            <td>
                                <div class="flex items-center gap-1">
                                    <Link :href="route('vehicles.show', vehicle.id)" class="btn-ghost p-1.5">
                                        <Eye class="w-4 h-4" />
                                    </Link>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="vehicles.data.length === 0">
                            <td colspan="15" class="text-center py-12 text-slate-500 dark:text-slate-400">
                                暂无车辆数据
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="vehicles.links && vehicles.links.length > 3" class="flex items-center justify-between">
            <p class="text-sm text-slate-500 dark:text-slate-400">
                显示 {{ vehicles.from }} - {{ vehicles.to }} 条，共 {{ vehicles.total }} 条
            </p>
            <div class="flex items-center gap-1">
                <Link
                    v-if="vehicles.prev_page_url"
                    :href="vehicles.prev_page_url"
                    class="btn-secondary px-3 py-1.5"
                >
                    <ChevronLeft class="w-4 h-4" />
                </Link>
                <span v-else class="btn-secondary px-3 py-1.5 opacity-50 cursor-not-allowed">
                    <ChevronLeft class="w-4 h-4" />
                </span>
                <span class="px-3 py-1.5 text-sm">第 {{ vehicles.current_page }} / {{ vehicles.last_page }} 页</span>
                <Link
                    v-if="vehicles.next_page_url"
                    :href="vehicles.next_page_url"
                    class="btn-secondary px-3 py-1.5"
                >
                    <ChevronRight class="w-4 h-4" />
                </Link>
                <span v-else class="btn-secondary px-3 py-1.5 opacity-50 cursor-not-allowed">
                    <ChevronRight class="w-4 h-4" />
                </span>
            </div>
        </div>
    </div>
</template>
