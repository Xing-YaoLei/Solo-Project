<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="brand-section">
          <h1 class="brand-title">青少年培训<br />续费跟进系统</h1>
          <p class="brand-desc">统一管理续费跟进，提升续费转化率</p>
        </div>
      </div>
      <div class="login-right">
        <n-card class="login-card" title="用户登录" hoverable>
          <n-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-placement="top"
            size="large"
          >
            <n-form-item label="用户名" path="username">
              <n-input
                v-model:value="formData.username"
                placeholder="请输入用户名"
                clearable
              >
                <template #prefix>
                  <n-icon><PersonOutline /></n-icon>
                </template>
              </n-input>
            </n-form-item>
            <n-form-item label="密码" path="password">
              <n-input
                v-model:value="formData.password"
                type="password"
                placeholder="请输入密码"
                show-password-on="click"
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <n-icon><LockClosedOutline /></n-icon>
                </template>
              </n-input>
            </n-form-item>
            <n-form-item>
              <n-button
                type="primary"
                block
                size="large"
                :loading="loading"
                @click="handleLogin"
              >
                登录
              </n-button>
            </n-form-item>
          </n-form>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { PersonOutline, LockClosedOutline } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)

const formData = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  try {
    await formRef.value?.validate()
  } catch (e) {
    return
  }

  loading.value = true
  try {
    await authStore.login(formData.username, formData.password)
    message.success('登录成功')
    navigateTo('/followups')
  } catch (error: any) {
    message.error(error.response?.data?.error || '登录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    navigateTo('/followups')
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  width: 900px;
  height: 500px;
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-left {
  width: 50%;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.brand-section {
  text-align: center;
  padding: 40px;
}

.brand-title {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 20px;
}

.brand-desc {
  font-size: 16px;
  opacity: 0.9;
}

.login-right {
  width: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-card {
  width: 100%;
  border: none;
}

.login-card :deep(.n-card-header) {
  text-align: center;
  border: none;
  padding-bottom: 24px;
}

.login-card :deep(.n-card-header .n-card-header__main) {
  font-size: 22px;
  font-weight: 600;
}
</style>
