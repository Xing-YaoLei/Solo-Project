<script setup>
import { ref, computed } from 'vue'
import { Head, Link, useForm } from '@inertiajs/vue3'
import { Car, Mail, ArrowLeft, ArrowRight, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  status: {
    type: String,
    default: '',
  },
})

const form = useForm({
  email: '',
})

const submitted = ref(false)
const emailSent = computed(() => props.status || submitted.value)

const submit = () => {
  form.post(route('password.email'), {
    preserveScroll: true,
    onSuccess: () => {
      submitted.value = true
    },
  })
}
</script>

<template>
  <Head title="重置密码" />
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

        <div class="flex-1 flex items-center">
          <div class="max-w-md">
            <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 ring-1 ring-white/30">
              <KeyRound class="w-8 h-8 text-white" />
            </div>
            <h2 class="text-3xl font-bold text-white mb-4 leading-tight">
              忘记密码？<br />
              <span class="text-blue-200">别担心，我们帮您找回</span>
            </h2>
            <p class="text-lg text-blue-100 leading-relaxed">
              输入您注册时使用的邮箱地址，我们将向您发送密码重置链接。链接有效期为60分钟，请及时使用。
            </p>

            <div class="mt-8 space-y-4">
              <div class="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <CheckCircle2 class="w-5 h-5 text-green-300 shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-semibold text-white">安全可靠</p>
                  <p class="text-xs text-blue-100 mt-0.5">链接一次性有效，使用后即失效</p>
                </div>
              </div>
              <div class="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <AlertTriangle class="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-semibold text-white">注意事项</p>
                  <p class="text-xs text-blue-100 mt-0.5">请检查邮箱的垃圾邮件或推广文件夹</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-12">
          <Link
            :href="route('login')"
            class="inline-flex items-center gap-2 text-sm font-medium text-blue-100 hover:text-white transition-colors"
          >
            <ArrowLeft class="w-4 h-4" />
            返回登录页
          </Link>
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

        <div v-if="emailSent">
          <div class="mb-8 text-center">
            <div class="w-20 h-20 mx-auto rounded-2xl bg-green-50 flex items-center justify-center mb-6 ring-8 ring-green-50">
              <CheckCircle2 class="w-10 h-10 text-green-600" />
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">重置邮件已发送！</h2>
            <p class="text-gray-500 leading-relaxed">
              如果该邮箱已注册，我们已向
              <span class="font-semibold text-gray-900">{{ form.email || '您的邮箱' }}</span>
              发送了密码重置链接，请查收邮件。
            </p>
          </div>

          <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
            <div class="flex items-start gap-3">
              <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div class="text-sm">
                <p class="font-medium text-amber-800">没有收到邮件？</p>
                <ul class="text-amber-700 mt-1.5 space-y-1 list-disc list-inside">
                  <li>检查垃圾邮件或推广文件夹</li>
                  <li>确认邮箱地址是否正确</li>
                  <li>等待1-2分钟后再试</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <button
              type="button"
              @click="submitted = false; form.reset()"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft class="w-4 h-4" />
              使用其他邮箱
            </button>
          </div>
        </div>

        <form v-else @submit.prevent="submit" class="space-y-5">
          <div class="mb-8">
            <div class="lg:hidden w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 ring-4 ring-blue-50">
              <KeyRound class="w-7 h-7 text-blue-600" />
            </div>
            <h2 class="text-3xl font-bold text-gray-900 mb-2">重置密码</h2>
            <p class="text-gray-500">输入您的邮箱，我们将发送重置链接给您</p>
          </div>

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
                autofocus
                autocomplete="email"
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
            <span v-if="form.processing">发送中...</span>
            <template v-else>
              <span>发送重置链接</span>
              <ArrowRight class="w-4 h-4" />
            </template>
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-gray-100">
          <p class="text-center text-sm text-gray-500">
            想起密码了？
            <Link
              :href="route('login')"
              class="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              返回登录
            </Link>
          </p>
        </div>

        <div class="mt-8 flex items-center gap-3 text-xs text-gray-400 text-center justify-center">
          <span>© {{ new Date().getFullYear() }} 汽车销售管理系统</span>
        </div>
      </div>
    </div>
  </div>
</template>
