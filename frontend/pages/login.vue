<template>
  <div class="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
    <NCard class="w-full max-w-md mx-4 shadow-2xl" :bordered="false">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-green-600 mb-2">二手车门店车源上架跟进台</h1>
        <p class="text-gray-500 text-sm">Car Dealer Onboarding Management Platform</p>
      </div>
      <NForm ref="formRef" :model="form" :rules="rules" label-placement="top" size="large">
        <NFormItem label="用户名" path="username">
          <NInput v-model:value="form.username" placeholder="请输入用户名">
            <template #prefix>
              <NIcon :component="PersonOutlined" />
            </template>
          </NInput>
        </NFormItem>
        <NFormItem label="密码" path="password">
          <NInput v-model:value="form.password" type="password" show-password-on="click" placeholder="请输入密码">
            <template #prefix>
              <NIcon :component="LockOutlined" />
            </template>
          </NInput>
        </NFormItem>
        <NButton
          type="primary"
          block
          size="large"
          :loading="loading"
          class="mt-4"
          @click="handleLogin"
        >
          登 录
        </NButton>
      </NForm>
      <NDivider class="my-6">快速体验</NDivider>
      <div class="grid grid-cols-2 gap-3">
        <NButton v-for="d in demoUsers" :key="d.role" size="small" ghost @click="quickLogin(d)">
          {{ d.label }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '~/stores/auth'
import { PersonOutlined, LockOutlined } from '@vicons/antd'

definePageMeta({ layout: false })

const form = reactive({ username: '', password: '' })
const rules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' },
}
const loading = ref(false)
const formRef = ref()
const authStore = useAuthStore()
const message = useMessage()
const router = useRouter()

const demoUsers = [
  { role: 'manager', label: '店长', username: 'manager', password: '123456' },
  { role: 'appraiser', label: '评估师', username: 'appraiser', password: '123456' },
  { role: 'sales', label: '销售', username: 'sales', password: '123456' },
  { role: 'finance', label: '金融专员', username: 'finance', password: '123456' },
]

async function handleLogin() {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return
  } catch { return }
  loading.value = true
  try {
    await authStore.login(form.username, form.password)
    message.success('登录成功')
    router.push('/')
  } catch (e: any) {
    message.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}

function quickLogin(d: typeof demoUsers[0]) {
  form.username = d.username
  form.password = d.password
  handleLogin()
}
</script>
