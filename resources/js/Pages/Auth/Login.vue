<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="max-w-md w-full space-y-8">
            <div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    二手车收购协同系统
                </h2>
                <p class="mt-2 text-center text-sm text-gray-600">
                    请登录以继续
                </p>
            </div>

            <div class="card p-8">
                <form @submit.prevent="submit" class="space-y-6">
                    <div>
                        <label class="label">邮箱</label>
                        <input
                            v-model="form.email"
                            type="email"
                            class="input-field"
                            placeholder="请输入邮箱"
                            required
                        />
                    </div>
                    <div>
                        <label class="label">密码</label>
                        <input
                            v-model="form.password"
                            type="password"
                            class="input-field"
                            placeholder="请输入密码"
                            required
                        />
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <input
                                v-model="form.remember"
                                type="checkbox"
                                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label class="ml-2 block text-sm text-gray-900">记住我</label>
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            :disabled="form.processing"
                            class="btn-primary w-full justify-center"
                        >
                            登录
                        </button>
                    </div>
                </form>
                <div v-if="form.errors.email" class="mt-2 text-sm text-red-600">
                    {{ form.errors.email }}
                </div>
            </div>

            <div class="card p-4 text-sm text-gray-600">
                <div class="font-medium mb-2">演示账号：</div>
                <div>店长: manager@example.com / password</div>
                <div>评估师: appraiser@example.com / password</div>
                <div>销售: sales@example.com / password</div>
                <div>金融专员: finance@example.com / password</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useForm } from '@inertiajs/vue3';

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const submit = () => {
    form.post(route('login.authenticate'));
};
</script>
