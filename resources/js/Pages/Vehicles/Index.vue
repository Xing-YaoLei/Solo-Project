<template>
    <AppLayout title="车辆管理">
        <div class="space-y-6">
            <div class="card">
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div>
                            <label class="label">搜索</label>
                            <input
                                v-model="form.search"
                                type="text"
                                class="input-field"
                                placeholder="车架号/车牌/品牌/车型"
                                @keyup.enter="handleSearch"
                            />
                        </div>
                        <div>
                            <label class="label">状态</label>
                            <select v-model="form.status" class="select-field" @change="handleSearch">
                                <option value="">全部</option>
                                <option v-for="(label, value) in statuses" :key="value" :value="value">{{ label }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">品牌</label>
                            <select v-model="form.brand" class="select-field" @change="handleSearch">
                                <option value="">全部</option>
                                <option v-for="brand in brands" :key="brand" :value="brand">{{ brand }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">入库日期起</label>
                            <input v-model="form.date_from" type="date" class="input-field" @change="handleSearch" />
                        </div>
                        <div>
                            <label class="label">入库日期止</label>
                            <input v-model="form.date_to" type="date" class="input-field" @change="handleSearch" />
                        </div>
                        <div class="flex items-end gap-2">
                            <button type="button" @click="resetFilters" class="btn-secondary">重置</button>
                            <Link v-if="can.create" :href="route('vehicles.create')" class="btn-primary">+ 新建车辆</Link>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="text-lg font-medium text-gray-900">
                        车辆列表
                        <span class="text-sm font-normal text-gray-500 ml-2">
                            共 {{ vehicles.total }} 条
                        </span>
                    </h3>
                    <div v-if="selectedIds.length > 0" class="flex items-center gap-3">
                        <span class="text-sm text-gray-600">已选 {{ selectedIds.length }} 项</span>
                        <button v-if="can.batch_update" @click="showBatchModal = true" class="btn-secondary text-sm py-1">
                            批量操作
                        </button>
                        <button @click="selectedIds = []" class="text-sm text-gray-500 hover:text-gray-700">
                            取消选择
                        </button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead class="table-head">
                            <tr>
                                <th class="table-th w-12">
                                    <input
                                        type="checkbox"
                                        :checked="isAllSelected"
                                        @change="toggleSelectAll"
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </th>
                                <th class="table-th">车辆信息</th>
                                <th class="table-th">车牌/VIN</th>
                                <th class="table-th">里程/年款</th>
                                <th class="table-th">状态</th>
                                <th class="table-th">
                                    <button @click="sortBy('arrival_date')" class="flex items-center gap-1 hover:text-primary-600">
                                        入库日期
                                        <SortArrow :field="'arrival_date'" :current="sortField" :dir="sortDir" />
                                    </button>
                                </th>
                                <th class="table-th">库龄</th>
                                <th class="table-th">
                                    <button @click="sortBy('purchase_price')" class="flex items-center gap-1 hover:text-primary-600">
                                        收购价
                                        <SortArrow :field="'purchase_price'" :current="sortField" :dir="sortDir" />
                                    </button>
                                </th>
                                <th class="table-th">异常</th>
                                <th class="table-th">操作</th>
                            </tr>
                        </thead>
                        <tbody class="table-body">
                            <tr v-for="vehicle in vehicles.data" :key="vehicle.id">
                                <td class="table-td">
                                    <input
                                        type="checkbox"
                                        :value="vehicle.id"
                                        v-model="selectedIds"
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </td>
                                <td class="table-td">
                                    <Link :href="route('vehicles.show', vehicle.id)" class="table-link font-medium">
                                        {{ vehicle.brand }} {{ vehicle.model }}
                                    </Link>
                                    <div class="text-xs text-gray-500">{{ vehicle.year }}款 · {{ vehicle.color || '未填' }}</div>
                                </td>
                                <td class="table-td">
                                    <div class="text-sm font-medium">{{ vehicle.plate_no || '待上牌' }}</div>
                                    <div class="text-xs text-gray-500 font-mono">{{ vehicle.vin?.slice(-6) }}</div>
                                </td>
                                <td class="table-td text-sm">
                                    <div>{{ vehicle.mileage?.toLocaleString() }} km</div>
                                    <div class="text-xs text-gray-500">{{ vehicle.displacement || '-' }} · {{ vehicle.transmission || '-' }}</div>
                                </td>
                                <td class="table-td">
                                    <VehicleStatusBadge :status="vehicle.status" />
                                </td>
                                <td class="table-td text-sm">
                                    {{ vehicle.arrival_date || '-' }}
                                </td>
                                <td class="table-td">
                                    <span
                                        v-if="vehicle.days_in_stock !== null"
                                        :class="vehicle.days_in_stock > 30 ? 'text-red-600 font-medium' : ''"
                                    >
                                        {{ vehicle.days_in_stock }} 天
                                    </span>
                                    <span v-else>-</span>
                                </td>
                                <td class="table-td text-sm">
                                    <div>¥{{ vehicle.purchase_price?.toLocaleString() || '-' }}</div>
                                    <div v-if="vehicle.preparation_cost > 0" class="text-xs text-gray-500">
                                        整备: ¥{{ vehicle.preparation_cost.toLocaleString() }}
                                    </div>
                                </td>
                                <td class="table-td">
                                    <span v-if="vehicle.missing_documents_count > 0" class="badge-red">
                                        缺{{ vehicle.missing_documents_count }}项
                                    </span>
                                    <span v-else class="badge-green">正常</span>
                                </td>
                                <td class="table-td">
                                    <div class="flex items-center gap-2">
                                        <Link :href="route('vehicles.show', vehicle.id)" class="table-link">详情</Link>
                                        <Link v-if="can.update" :href="route('vehicles.edit', vehicle.id)" class="table-link">编辑</Link>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="px-6 py-3 border-t border-gray-200">
                    <Pagination :links="vehicles.links" />
                </div>
            </div>
        </div>

        <Modal v-model:show="showBatchModal" title="批量操作">
            <div class="space-y-4">
                <div>
                    <label class="label">变更状态</label>
                    <select v-model="batchForm.status" class="select-field">
                        <option value="">不修改</option>
                        <option v-for="(label, value) in statuses" :key="value" :value="value">{{ label }}</option>
                    </select>
                </div>
                <div>
                    <label class="label">分配评估师</label>
                    <input type="text" v-model="batchForm.remark" class="input-field" placeholder="备注信息（可选）" />
                </div>
            </div>
            <template #footer>
                <button type="button" @click="showBatchModal = false" class="btn-secondary w-full sm:order-1">
                    取消
                </button>
                <button type="button" @click="submitBatchUpdate" :disabled="batchProcessing" class="btn-primary w-full sm:order-2">
                    {{ batchProcessing ? '处理中...' : '确认提交' }}
                </button>
            </template>
        </Modal>
    </AppLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useForm, usePage, router, Link } from '@inertiajs/vue3';
import AppLayout from '@/Components/AppLayout.vue';
import VehicleStatusBadge from '@/Components/VehicleStatusBadge.vue';
import Modal from '@/Components/Modal.vue';
import Pagination from '@/Components/Pagination.vue';
import SortArrow from '@/Components/SortArrow.vue';

const props = defineProps({
    vehicles: Object,
    filters: Object,
    brands: Array,
    statuses: Object,
    can: Object,
});

const page = usePage();

const form = reactive({
    search: props.filters.search || '',
    status: props.filters.status || '',
    brand: props.filters.brand || '',
    date_from: props.filters.date_from || '',
    date_to: props.filters.date_to || '',
});

const sortField = ref(page.props.sort || 'created_at');
const sortDir = ref(page.props.dir || 'desc');

const selectedIds = ref([]);
const showBatchModal = ref(false);
const batchProcessing = ref(false);
const batchForm = reactive({
    status: '',
    remark: '',
});

const isAllSelected = computed(() => {
    return props.vehicles.data.length > 0 && selectedIds.value.length === props.vehicles.data.length;
});

const handleSearch = () => {
    router.get(route('vehicles.index'), { ...form }, { preserveState: true });
};

const resetFilters = () => {
    form.search = '';
    form.status = '';
    form.brand = '';
    form.date_from = '';
    form.date_to = '';
    handleSearch();
};

const sortBy = (field) => {
    if (sortField.value === field) {
        sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortField.value = field;
        sortDir.value = 'asc';
    }
    router.get(route('vehicles.index'), { ...form, sort: sortField.value, dir: sortDir.value }, { preserveState: true });
};

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedIds.value = [];
    } else {
        selectedIds.value = props.vehicles.data.map(v => v.id);
    }
};

const submitBatchUpdate = () => {
    const updates = {};
    if (batchForm.status) updates.status = batchForm.status;

    if (Object.keys(updates).length === 0) {
        alert('请选择要批量修改的内容');
        return;
    }

    batchProcessing.value = true;
    router.post(route('vehicles.batch-update'), {
        ids: selectedIds.value,
        updates,
    }, {
        preserveState: true,
        onSuccess: () => {
            showBatchModal.value = false;
            selectedIds.value = [];
            batchForm.status = '';
            batchForm.remark = '';
        },
        onFinish: () => {
            batchProcessing.value = false;
        },
    });
};
</script>
