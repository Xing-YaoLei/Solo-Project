<script setup>
import { ref, getCurrentInstance } from 'vue';
import { usePage, useForm, Head, Link } from '@inertiajs/vue3';
import {
    ArrowLeft, Save, Car, Plus, X
} from 'lucide-vue-next';

const { proxy } = getCurrentInstance();
const page = usePage();

const props = defineProps({
    featureOptions: Array,
    stores: Array,
    conditionOptions: Array,
});

const form = useForm({
    vin: '',
    plate_number: '',
    brand: '',
    series: '',
    model: '',
    year: '',
    color: '',
    mileage: '',
    displacement: '',
    transmission: '',
    fuel_type: '',
    seats: '',
    price: '',
    first_register_date: '',
    emission_standard: '',
    condition_level: '',
    test_drive_available: 1,
    features: [],
    store_id: '',
    remark: '',
});

const toggleFeature = (feature) => {
    const idx = form.features.indexOf(feature);
    if (idx > -1) {
        form.features.splice(idx, 1);
    } else {
        form.features.push(feature);
    }
};

const submit = () => {
    form.post(route('vehicles.store'), {
        onSuccess: () => {},
    });
};
</script>

<template>
    <Head title="新增车辆" />

    <div class="space-y-6">
        <div class="flex items-center gap-4">
            <Link :href="route('vehicles.index')" class="btn-ghost p-2">
                <ArrowLeft class="w-5 h-5" />
            </Link>
            <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">新增车辆</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">录入车辆档案信息</p>
            </div>
        </div>

        <form @submit.prevent="submit" class="space-y-6">
            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100">基本标识</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label class="label"><span class="text-red-500">*</span> VIN 车架号</label>
                            <input v-model="form.vin" type="text" class="input font-mono uppercase" placeholder="17位车架号" required />
                        </div>
                        <div>
                            <label class="label">车牌号</label>
                            <input v-model="form.plate_number" type="text" class="input uppercase" placeholder="如：京A12345" />
                        </div>
                        <div>
                            <label class="label"><span class="text-red-500">*</span> 品牌</label>
                            <input v-model="form.brand" type="text" class="input" placeholder="如：奔驰、宝马" required />
                        </div>
                        <div>
                            <label class="label"><span class="text-red-500">*</span> 车系</label>
                            <input v-model="form.series" type="text" class="input" placeholder="如：E级、5系" required />
                        </div>
                        <div>
                            <label class="label"><span class="text-red-500">*</span> 型号</label>
                            <input v-model="form.model" type="text" class="input" placeholder="如：E300L、530Li" required />
                        </div>
                        <div>
                            <label class="label"><span class="text-red-500">*</span> 年款</label>
                            <input v-model="form.year" type="number" min="1990" max="2030" class="input" placeholder="如：2024" required />
                        </div>
                        <div>
                            <label class="label">颜色</label>
                            <input v-model="form.color" type="text" class="input" placeholder="如：曜岩黑、矿石白" />
                        </div>
                        <div>
                            <label class="label">里程 (KM)</label>
                            <input v-model="form.mileage" type="number" min="0" class="input" placeholder="行驶里程" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100">动力与配置</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                            <label class="label">排量 (L)</label>
                            <input v-model="form.displacement" type="text" class="input" placeholder="如：2.0T、3.0" />
                        </div>
                        <div>
                            <label class="label">变速箱</label>
                            <select v-model="form.transmission" class="select">
                                <option value="">请选择</option>
                                <option value="手动">手动</option>
                                <option value="自动">自动</option>
                                <option value="CVT">CVT</option>
                                <option value="双离合">双离合</option>
                                <option value="AMT">AMT</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">燃油类型</label>
                            <select v-model="form.fuel_type" class="select">
                                <option value="">请选择</option>
                                <option value="汽油">汽油</option>
                                <option value="柴油">柴油</option>
                                <option value="纯电">纯电</option>
                                <option value="插电混动">插电混动</option>
                                <option value="油电混动">油电混动</option>
                                <option value="增程式">增程式</option>
                                <option value="氢燃料">氢燃料</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">座位数</label>
                            <input v-model="form.seats" type="number" min="1" max="30" class="input" placeholder="如：5" />
                        </div>
                        <div>
                            <label class="label">排放标准</label>
                            <select v-model="form.emission_standard" class="select">
                                <option value="">请选择</option>
                                <option value="国二">国二</option>
                                <option value="国三">国三</option>
                                <option value="国四">国四</option>
                                <option value="国五">国五</option>
                                <option value="国六a">国六a</option>
                                <option value="国六b">国六b</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">首次上牌日期</label>
                            <input v-model="form.first_register_date" type="date" class="input" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100">业务信息</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label class="label"><span class="text-red-500">*</span> 价格 (元)</label>
                            <input v-model="form.price" type="number" min="0" step="0.01" class="input" placeholder="车辆售价" required />
                        </div>
                        <div>
                            <label class="label">车况等级</label>
                            <select v-model="form.condition_level" class="select">
                                <option value="">请选择</option>
                                <option v-for="opt in conditionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">门店</label>
                            <select v-model="form.store_id" class="select">
                                <option value="">请选择门店</option>
                                <option v-for="store in stores" :key="store.id" :value="store.id">{{ store.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">是否可试驾</label>
                            <label class="flex items-center gap-3 mt-2">
                                <input type="checkbox" v-model="form.test_drive_available" :true-value="1" :false-value="0" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5" />
                                <span class="text-sm text-slate-700 dark:text-slate-300">勾选表示该车辆可用于试驾</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100">车辆配置</h3>
                </div>
                <div class="card-body">
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="feature in featureOptions"
                            :key="feature"
                            type="button"
                            @click="toggleFeature(feature)"
                            :class="[
                                'chip cursor-pointer transition-all border',
                                form.features.includes(feature)
                                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40'
                                    : 'hover:bg-slate-200 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600'
                            ]"
                        >
                            <X v-if="form.features.includes(feature)" class="w-3 h-3" />
                            {{ feature }}
                        </button>
                        <p v-if="featureOptions.length === 0" class="text-sm text-slate-500 dark:text-slate-400">暂无配置选项</p>
                    </div>
                    <div v-if="form.features.length > 0" class="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        已选择 {{ form.features.length }} 项配置
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="font-semibold text-slate-900 dark:text-slate-100">备注</h3>
                </div>
                <div class="card-body">
                    <textarea v-model="form.remark" class="textarea" rows="4" placeholder="车辆补充说明..."></textarea>
                </div>
            </div>

            <div class="flex items-center justify-end gap-3">
                <Link :href="route('vehicles.index')" class="btn-secondary">取消</Link>
                <button type="submit" class="btn-primary" :disabled="form.processing">
                    <Save class="w-4 h-4" />
                    保存车辆
                </button>
            </div>
        </form>
    </div>
</template>
