<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="login-bg-pattern"></div>
    </div>
    <NCard class="login-card" :bordered="false">
      <div class="login-header">
        <div class="login-logo">过户</div>
        <h1 class="login-title">过户材料跟进台</h1>
        <NText depth="3" style="font-size: 14px;">二手车门店过户材料管理系统</NText>
      </div>
      <NForm ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="0" style="margin-top: 32px;">
        <NFormItem path="username" :rule="{ required: true, message: '请输入用户名' }">
          <NInput v-model:value="form.username" placeholder="用户名" size="large" />
        </NFormItem>
        <NFormItem path="password" :rule="{ required: true, message: '请输入密码' }">
          <NInput v-model:value="form.password" type="password" placeholder="密码" size="large" show-password-on="click" @keyup.enter="handleLogin" />
        </NFormItem>
        <NButton type="primary" block size="large" :loading="loading" @click="handleLogin" style="margin-top: 8px;">登录</NButton>
      </NForm>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

definePageMeta({ layout: false })

const api = useApi()
const authStore = useAuthStore()
const { message } = useNaiveDiscrete()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {}

async function handleLogin() {
  if (!form.username || !form.password) return
  loading.value = true
  try {
    const data = await api.post<any>('/auth/login/', { username: form.username, password: form.password })
    authStore.setToken(data.access)
    authStore.setUser({
      id: String(data.user_id || ''),
      username: data.username || form.username,
      role: data.role || 'specialist',
    })
    message.success('登录成功')
    navigateTo('/')
  } catch (e: any) {
    message.error(e.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1E293B 0%, #334155 40%, #1E293B 70%, #0F172A 100%);
  z-index: 0;
}

.login-bg-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.05) 0%, transparent 40%),
    radial-gradient(circle at 60% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 40%);
}

.login-card {
  position: relative;
  z-index: 1;
  width: 420px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
}

.login-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1E293B;
  margin: 0 0 4px;
}
</style>
