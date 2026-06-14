<template>
    <AppLayout title="新建时段">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
                <Link :href="route('time-slots.index')" class="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                    ← 返回时段列表
                </Link>
                <h1 class="text-2xl font-bold text-gray-900">新建时段</h1>
            </div>

            <div class="card">
                <div class="card-body">
                    <form @submit.prevent="submitForm">
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="label">时段名称</label>
                                <input v-model="form.name" type="text" class="input-field" placeholder="如：上午第一场" />
                            </div>
                            <div>
                                <label class="label">默认容量</label>
                                <input v-model.number="form.default_capacity" type="number" min="1" class="input-field" />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="label">开始时间</label>
                                <input v-model="form.start_time" type="time" class="input-field" />
                            </div>
                            <div>
                                <label class="label">结束时间</label>
                                <input v-model="form.end_time" type="time" class="input-field" />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="label">适用星期</label>
                                <select v-model="form.day_of_week" class="select-field">
                                    <option :value="null">每天</option>
                                    <option :value="0">周日</option>
                                    <option :value="1">周一</option>
                                    <option :value="2">周二</option>
                                    <option :value="3">周三</option>
                                    <option :value="4">周四</option>
                                    <option :value="5">周五</option>
                                    <option :value="6">周六</option>
                                </select>
                            </div>
                            <div>
                                <label class="label">状态</label>
                                <select v-model="form.is_active" class="select-field">
                                    <option :value="true">启用</option>
                                    <option :value="false">停用</option>
                                </select>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="label">备注</label>
                            <textarea v-model="form.remark" rows="2" class="input-field"></textarea>
                        </div>

                        <div class="flex justify-end gap-3">
                            <Link :href="route('time-slots.index')" class="btn-secondary">
                                取消
                            </Link>
                            <button type="submit" class="btn-primary">
                                创建
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { reactive } from 'vue';
import { Link, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const form = reactive({
    name: '',
    start_time: '09:00',
    end_time: '10:00',
    default_capacity: 10,
    day_of_week: null,
    is_active: true,
    remark: '',
});

const submitForm = () => {
    if (!form.name) {
        alert('请输入时段名称');
        return;
    }
    router.post(route('time-slots.store'), form);
};
</script>
