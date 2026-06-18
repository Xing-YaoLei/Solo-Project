<script setup>
import { computed, ref, watch } from 'vue'
import { usePage, useForm, router, Head, Link } from '@inertiajs/vue3'
import {
    User, Car, Building2, Clock, Calendar, Users,
    UserCheck, MapPin, Route, FileText, Save, ArrowLeft,
    Search, Plus, Phone
} from 'lucide-vue-next'

const page = usePage()

const options = computed(() => page.props.options || {
    statuses: [],
    stores: [],
    vehicles: [],
    salesUsers: [],
    defaultStatus: 'pending',
})

const form = useForm({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    vehicle_id: options.value.defaultVehicle || '',
    store_id: options.value.defaultStore || '',
    test_drive_type: 'standard',
    scheduled_start: '',
    scheduled_end: '',
    planned_duration: 60,
    sales_user_id: options.value.defaultSalesUser || '',
    companion_user_id: '',
    assigned_user_id: options.value.defaultSalesUser || '',
    pickup_location: '',
    return_location: '',
    planned_route: '',
    remarks: '',
    status: options.value.defaultStatus || 'pending',
})

const showCustomerPicker = ref(false)

watch(() => form.scheduled_start, (val) => {
    if (val && !form.scheduled_end) {
        const d = new Date(val)
        d.setMinutes(d.getMinutes() + (form.planned_duration || 60))
        const pad = n => String(n).padStart(2, '0')
        form.scheduled_end = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
})

watch(() => form.planned_duration, (val) => {
    if (form.scheduled_start && val) {
        const d = new Date(form.scheduled_start)
        d.setMinutes(d.getMinutes() + Number(val))
        const pad = n => String(n).padStart(2, '0')
        form.scheduled_end = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
})

function submit() {
    form.post(route('test-drives.store'), {
        preserveScroll: true,
    })
}
</script>

<template>
    <Head title="新建试驾预约" />

    <div class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
                <Link :href="route('test-drives.index')" class="btn-ghost p-2">
                    <ArrowLeft class="w-5 h-5" />
                </Link>
                <div>
                    <h1 class="text-2xl font-bold text-slate-900 dark:text-white">新建试驾预约</h1>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">填写以下信息创建新的试驾预约记录</p>
                </div>
            </div>
        </div>

        <form @submit.prevent="submit" class="space-y-6">
            <div class="card">
                <div class="card-body">
                    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div class="space-y-5">
                            <div>
                                <label class="label flex items-center gap-1.5">
                                    <User class="w-4 h-4 text-slate-500" />
                                    客户信息
                                    <span class="text-red-500">*</span>
                                </label>
                                <div class="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20">
                                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div class="sm:col-span-1">
                                            <label class="text-xs text-slate-500 dark:text-slate-400 mb-1 block">客户ID</label>
                                            <div class="relative">
                                                <input v-model="form.customer_id" type="text" class="input" placeholder="输入或搜索" />
                                                <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    <Search class="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label class="text-xs text-slate-500 dark:text-slate-400 mb-1 block">姓名 <span class="text-red-500">*</span></label>
                                            <input v-model="form.customer_name" type="text" class="input" placeholder="客户姓名" />
                                        </div>
                                        <div>
                                            <label class="text-xs text-slate-500 dark:text-slate-400 mb-1 block">电话 <span class="text-red-500">*</span></label>
                                            <div class="relative">
                                                <Phone class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input v-model="form.customer_phone" type="tel" class="input pl-10" placeholder="手机号" />
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mt-3">
                                        <button type="button" class="btn-link text-xs">
                                            <Plus class="w-3 h-3" />
                                            从客户库选择
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label class="label flex items-center gap-1.5">
                                    <Car class="w-4 h-4 text-slate-500" />
                                    试驾车辆
                                    <span class="text-red-500">*</span>
                                </label>
                                <select v-model="form.vehicle_id" class="select" required>
                                    <option value="">请选择试驾车辆</option>
                                    <option v-for="v in options.vehicles" :key="v.id" :value="v.id">
                                        {{ v.brand }} {{ v.model }} · {{ v.plate_number }} ({{ v.year || '' }})
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label class="label flex items-center gap-1.5">
                                    <Building2 class="w-4 h-4 text-slate-500" />
                                    门店
                                    <span class="text-red-500">*</span>
                                </label>
                                <select v-model="form.store_id" class="select" required>
                                    <option value="">请选择门店</option>
                                    <option v-for="s in options.stores" :key="s.id" :value="s.id">
                                        {{ s.name }} - {{ s.address || '' }}
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label class="label">试驾类型</label>
                                <select v-model="form.test_drive_type" class="select">
                                    <option value="standard">标准试驾</option>
                                    <option value="extended">深度试驾</option>
                                    <option value="comparison">对比试驾</option>
                                    <option value="family">家庭试驾</option>
                                </select>
                            </div>
                        </div>

                        <div class="space-y-5">
                            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label class="label flex items-center gap-1.5">
                                        <Calendar class="w-4 h-4 text-slate-500" />
                                        预约开始时间
                                        <span class="text-red-500">*</span>
                                    </label>
                                    <input v-model="form.scheduled_start" type="datetime-local" class="input" required />
                                </div>
                                <div>
                                    <label class="label flex items-center gap-1.5">
                                        <Calendar class="w-4 h-4 text-slate-500" />
                                        预约结束时间
                                    </label>
                                    <input v-model="form.scheduled_end" type="datetime-local" class="input" />
                                </div>
                            </div>

                            <div>
                                <label class="label flex items-center gap-1.5">
                                    <Clock class="w-4 h-4 text-slate-500" />
                                    计划时长（分钟）
                                </label>
                                <div class="flex gap-2">
                                    <button type="button" v-for="mins in [30, 60, 90, 120]" :key="mins"
                                        @click="form.planned_duration = mins"
                                        :class="form.planned_duration == mins ? 'btn-primary' : 'btn-secondary'"
                                        class="flex-1 text-sm"
                                    >
                                        {{ mins }}分钟
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label class="label flex items-center gap-1.5">
                                    <Users class="w-4 h-4 text-slate-500" />
                                    销售顾问
                                    <span class="text-red-500">*</span>
                                </label>
                                <select v-model="form.sales_user_id" class="select" required>
                                    <option value="">请选择销售顾问</option>
                                    <option v-for="u in options.salesUsers" :key="u.id" :value="u.id">
                                        {{ u.name }} ({{ u.role_label || '销售' }})
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label class="label flex items-center gap-1.5">
                                    <User class="w-4 h-4 text-slate-500" />
                                    陪同人员
                                </label>
                                <select v-model="form.companion_user_id" class="select">
                                    <option value="">无需陪同</option>
                                    <option v-for="u in options.salesUsers" :key="'c' + u.id" :value="u.id">
                                        {{ u.name }}
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label class="label flex items-center gap-1.5">
                                    <UserCheck class="w-4 h-4 text-slate-500" />
                                    处理人
                                </label>
                                <select v-model="form.assigned_user_id" class="select">
                                    <option value="">请选择处理人</option>
                                    <option v-for="u in options.salesUsers" :key="'a' + u.id" :value="u.id">
                                        {{ u.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div>
                            <label class="label flex items-center gap-1.5">
                                <MapPin class="w-4 h-4 text-slate-500" />
                                取车地点
                            </label>
                            <input v-model="form.pickup_location" type="text" class="input" placeholder="如：4S店正门停车场" />
                        </div>
                        <div>
                            <label class="label flex items-center gap-1.5">
                                <MapPin class="w-4 h-4 text-slate-500" />
                                还车地点
                            </label>
                            <input v-model="form.return_location" type="text" class="input" placeholder="如：4S店正门停车场" />
                        </div>
                    </div>

                    <div class="mt-5">
                        <label class="label flex items-center gap-1.5">
                            <Route class="w-4 h-4 text-slate-500" />
                            计划路线
                        </label>
                        <textarea
                            v-model="form.planned_route"
                            class="textarea"
                            rows="3"
                            placeholder="描述试驾路线，如：从4S店出发，经三环路→绕城高速→折返..."
                        ></textarea>
                    </div>

                    <div class="mt-5">
                        <label class="label flex items-center gap-1.5">
                            <FileText class="w-4 h-4 text-slate-500" />
                            备注
                        </label>
                        <textarea
                            v-model="form.remarks"
                            class="textarea"
                            rows="3"
                            placeholder="其他需要备注的信息..."
                        ></textarea>
                    </div>
                </div>
            </div>

            <div class="card sticky bottom-4 z-10">
                <div class="card-body flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div class="text-sm text-slate-500 dark:text-slate-400">
                        <span v-if="form.errors">带 <span class="text-red-500">*</span> 为必填项</span>
                    </div>
                    <div class="flex gap-2 sm:justify-end">
                        <Link :href="route('test-drives.index')" class="btn-secondary">
                            <ArrowLeft class="w-4 h-4" />
                            取消
                        </Link>
                        <button type="submit" class="btn-primary" :disabled="form.processing">
                            <Save class="w-4 h-4" />
                            {{ form.processing ? '提交中...' : '提交创建' }}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>
