<script setup>
import { ref, reactive, computed } from 'vue'
import { Head, Link, useForm } from '@inertiajs/vue3'
import { Car, Mail, Lock, Check, Eye, EyeOff, ArrowRight, TrendingUp, Users, Target, PieChart } from 'lucide-vue-next'

const form = useForm({
  email: '',
  password: '',
  remember: false,
})

const showPassword = ref(false)
const submit = () => {
  form.post(route('login'), {
    preserveScroll: true,
    only: ['errors', 'auth'],
  })
}

const stats = [
  { icon: TrendingUp, label: '成交转化率', value: '+23.5%', color: 'from-green-500 to-emerald-500' },
  { icon: Users, label: '新增客户', value: '1,286', color: 'from-blue-500 to-cyan-500' },
  { icon: Target, label: '业绩目标', value: '86.7%', color: 'from-purple-500 to-indigo-500' },
  { icon: PieChart, label: '试驾转化', value: '68.2%', color: 'from-orange-500 to-amber-500' },
]
</script>

<template>
  <Head title="登录" />
  <div class="min-h-screen flex">
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
      <div class="absolute inset-0 opacity-10">
        <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div class="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div class="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-indigo-300/20 rounded-full blur-3xl" />
      <div class="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-300/20 rounded-full blur-2xl" />

      <div class="relative z-10 flex flex-col w-full p-12">
        <div class="flex items-center gap-3 mb-12">
          <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
            <Car class="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white leading-tight">汽车销售</h1>
            <p class="text-sm text-blue-100">管理系统</p>
          </div>
        </div>

        <div class="flex-1 flex flex-col justify-center">
          <div class="mb-12">
            <h2 class="text-4xl font-bold text-white mb-4 leading-tight">
              提升销售效率<br />
              <span class="bg-gradient-to-r from-blue-200 via-white to-purple-200 bg-clip-text text-transparent">
                创造卓越业绩
              </span>
            </h2>
            <p class="text-lg text-blue-100 max-w-md leading-relaxed">
              全方位管理客户线索、试驾预约、销售跟进与复盘分析，助力您的团队达成更高目标。
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4 max-w-lg">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="group relative p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div :class="['w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-lg', stat.color]">
                <component :is="stat.icon" class="w-5 h-5 text-white" />
              </div>
              <p class="text-2xl font-bold text-white">{{ stat.value }}</p>
              <p class="text-sm text-blue-100 mt-0.5">{{ stat.label }}</p>
            </div>
          </div>
        </div>

        <div class="mt-12 flex items-center gap-6 text-sm text-blue-200">
          <div class="flex items-center gap-2">
            <Check class="w-4 h-4 text-green-300" />
            <span>数据加密传输</span>
          </div>
          <div class="flex items-center gap-2">
            <Check class="w-4 h-4 text-green-300" />
            <span>权限分级管理</span>
          </div>
          <div class="flex items-center gap-2">
            <Check class="w-4 h-4 text-green-300" />
            <span>7x24小时支持</span>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
      <div class="w-full max-w-md">
        <div class="lg:hidden flex items-center justify-center gap-3 mb-10">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Car class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900 leading-tight">汽车销售</h1>
            <p class="text-xs text-gray-500">管理系统</p>
          </div>
        </div>

        <div class="mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">欢迎回来 👋</h2>
          <p class="text-gray-500">登录您的账户，继续管理销售业务</p>
        </div>

        <form @submit.prevent="submit" class="space-y-5">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Mail class="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                v-model="form.email"
                placeholder="name@example.com"
                required
                autocomplete="username"
                :class="[
                  'block w-full pl-11 pr-4 py-3.5 text-sm rounded-xl border transition-all outline-none placeholder:text-gray-400',
                  form.errors.email
                    ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                ]"
              />
            </div>
            <p v-if="form.errors.email" class="mt-1.5 text-xs text-red-600 font-medium">
              {{ form.errors.email }}
            </p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label for="password" class="block text-sm font-medium text-gray-700">
                密码
              </label>
              <Link
                :href="route('password.request')"
                class="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                忘记密码？
              </Link>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Lock class="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                placeholder="请输入密码"
                required
                autocomplete="current-password"
                :class="[
                  'block w-full pl-11 pr-12 py-3.5 text-sm rounded-xl border transition-all outline-none placeholder:text-gray-400',
                  form.errors.password
                    ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                ]"
                @keydown.meta.enter="submit"
                @keydown.ctrl.enter="submit"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <EyeOff v-if="showPassword" class="w-5 h-5" />
                <Eye v-else class="w-5 h-5" />
              </button>
            </div>
            <p v-if="form.errors.password" class="mt-1.5 text-xs text-red-600 font-medium">
              {{ form.errors.password }}
            </p>
          </div>

          <label class="flex items-center gap-2.5 cursor-pointer select-none group">
            <input
              type="checkbox"
              v-model="form.remember"
              class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span class="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
              记住我，30天内免登录
            </span>
          </label>

          <button
            type="submit"
            :disabled="form.processing"
            :class="[
              'w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200',
              form.processing
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30',
            ]"
          >
            <span v-if="form.processing">登录中...</span>
            <template v-else>
              <span>登录系统</span>
              <ArrowRight class="w-4 h-4" />
            </template>
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-gray-100">
          <p class="text-center text-sm text-gray-500">
            还没有账号？
            <Link
              :href="route('register')"
              class="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              立即注册
            </Link>
          </p>
        </div>

        <div class="mt-8 flex items-center gap-3 text-xs text-gray-400 text-center justify-center">
          <span>© {{ new Date().getFullYear() }} 汽车销售管理系统</span>
          <span class="w-1 h-1 rounded-full bg-gray-300" />
          <span>版本 2.0.0</span>
        </div>
      </div>
    </div>
  </div>
</template>
