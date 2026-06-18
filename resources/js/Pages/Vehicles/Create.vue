<template>
    <AppLayout :title="isEdit ? '编辑车辆' : '新建车辆'">
        <div class="max-w-4xl mx-auto">
            <div class="flex items-center gap-4 mb-6">
                <Link :href="route('vehicles.index')" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? '编辑车辆' : '新建车辆' }}</h1>
            </div>

            <form @submit.prevent="submit" class="space-y-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-medium text-gray-900">基本信息</h3>
                    </div>
                    <div class="card-body">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="label">车架号 (VIN) *</label>
                                <input v-model="form.vin" type="text" class="input-field font-mono" required />
                            </div>
                            <div>
                                <label class="label">车牌号</label>
                                <input v-model="form.plate_no" type="text" class="input-field" />
                            </div>
                            <div>
                                <label class="label">品牌 *</label>
                                <input v-model="form.brand" type="text" class="input-field" required />
                            </div>
                            <div>
                                <label class="label">型号 *</label>
                                <input v-model="form.model" type="text" class="input-field" required />
                            </div>
                            <div>
                                <label class="label">年款 *</label>
                                <input v-model="form.year" type="text" class="input-field" required />
                            </div>
                            <div>
                                <label class="label">颜色</label>
                                <input v-model="form.color" type="text" class="input-field" />
                            </div>
                            <div>
                                <label class="label">里程数 (km) *</label>
                                <input v-model.number="form.mileage" type="number" min="0" class="input-field" required />
                            </div>
                            <div>
                                <label class="label">首次上牌日期</label>
                                <input v-model="form.first_register_date" type="date" class="input-field" />
                            </div>
                            <div>
                                <label class="label">排量</label>
                                <input v-model="form.displacement" type="text" class="input-field" />
                            </div>
                            <div>
                                <label class="label">变速箱</label>
                                <select v-model="form.transmission" class="select-field">
                                    <option value="">请选择</option>
                                    <option value="手动">手动</option>
                                    <option value="自动">自动</option>
                                    <option value="CVT">CVT</option>
                                    <option value="双离合">双离合</option>
                                </select>
                            </div>
                            <div>
                                <label class="label">燃油类型</label>
                                <select v-model="form.fuel_type" class="select-field">
                                    <option value="">请选择</option>
                                    <option value="汽油">汽油</option>
                                    <option value="柴油">柴油</option>
                                    <option value="纯电动">纯电动</option>
                                    <option value="混动">混动</option>
                                </select>
                            </div>
                            <div>
                                <label class="label">入库日期</label>
                                <input v-model="form.arrival_date" type="date" class="input-field" />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-medium text-gray-900">价格信息</h3>
                    </div>
                    <div class="card-body">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label class="label">收购价 (元)</label>
                                <input v-model.number="form.purchase_price" type="number" step="0.01" min="0" class="input-field" />
                            </div>
                            <div>
                                <label class="label">预期售价 (元)</label>
                                <input v-model.number="form.expected_sale_price" type="number" step="0.01" min="0" class="input-field" />
                            </div>
                            <div>
                                <label class="label">状态</label>
                                <select v-model="form.status" class="select-field">
                                    <option v-for="(label, value) in statuses" :key="value" :value="value">{{ label }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-medium text-gray-900">车源信息</h3>
                    </div>
                    <div class="card-body">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="label">车源渠道</label>
                                <select v-model="form.source" class="select-field">
                                    <option value="">请选择</option>
                                    <option value="个人车主">个人车主</option>
                                    <option value="4S店置换">4S店置换</option>
                                    <option value="同行批发">同行批发</option>
                                    <option value="网络平台">网络平台</option>
                                    <option value="老客户介绍">老客户介绍</option>
                                    <option value="其他">其他</option>
                                </select>
                            </div>
                            <div></div>
                            <div>
                                <label class="label">原车主姓名</label>
                                <input v-model="form.owner_name" type="text" class="input-field" />
                            </div>
                            <div>
                                <label class="label">原车主电话</label>
                                <input v-model="form.owner_phone" type="text" class="input-field" />
                            </div>
                            <div class="md:col-span-2">
                                <label class="label">备注</label>
                                <textarea v-model="form.remark" class="textarea-field" rows="4"></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-end gap-3">
                    <Link :href="route('vehicles.index')" class="btn-secondary">取消</Link>
                    <button type="submit" :disabled="form.processing" class="btn-primary">
                        {{ form.processing ? '保存中...' : (isEdit ? '保存修改' : '创建车辆') }}
                    </button>
                </div>
            </form>
        </div>
    </AppLayout>
</template>

<script setup>
import { computed } from 'vue';
import { useForm, Link } from '@inertiajs/vue3';
import AppLayout from '@/Components/AppLayout.vue';

const props = defineProps({
    vehicle: {
        type: Object,
        default: null,
    },
    statuses: {
        type: Object,
        required: true,
    },
});

const isEdit = computed(() => !!props.vehicle?.id);

const form = useForm({
    vin: props.vehicle?.vin || '',
    plate_no: props.vehicle?.plate_no || '',
    brand: props.vehicle?.brand || '',
    model: props.vehicle?.model || '',
    year: props.vehicle?.year || '',
    color: props.vehicle?.color || '',
    mileage: props.vehicle?.mileage || 0,
    first_register_date: props.vehicle?.first_register_date || '',
    displacement: props.vehicle?.displacement || '',
    transmission: props.vehicle?.transmission || '',
    fuel_type: props.vehicle?.fuel_type || '',
    purchase_price: props.vehicle?.purchase_price || null,
    expected_sale_price: props.vehicle?.expected_sale_price || null,
    actual_sale_price: props.vehicle?.actual_sale_price || null,
    status: props.vehicle?.status || 'pending',
    source: props.vehicle?.source || '',
    owner_name: props.vehicle?.owner_name || '',
    owner_phone: props.vehicle?.owner_phone || '',
    remark: props.vehicle?.remark || '',
    arrival_date: props.vehicle?.arrival_date || '',
    sold_date: props.vehicle?.sold_date || '',
    appraiser_id: props.vehicle?.appraiser_id || null,
    sales_id: props.vehicle?.sales_id || null,
});

const submit = () => {
    if (isEdit.value) {
        form.put(route('vehicles.update', props.vehicle.id));
    } else {
        form.post(route('vehicles.store'));
    }
};
</script>
