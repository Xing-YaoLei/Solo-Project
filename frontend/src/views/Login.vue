<template>
  <div class="login-page">
    <div class="login-bg"></div>
    <div class="login-container">
      <el-card class="login-card" shadow="hover">
        <div class="login-header">
          <div class="logo flex-center">
            <el-icon :size="36" color="#409eff"><DataBoard /></el-icon>
          </div>
          <h2 class="title">Solo 漏斗看板管理系统</h2>
          <p class="subtitle">上架漏斗可视化 · 异常智能检测 · 数据驱动决策</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              prefix-icon="User"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          <el-form-item prop="remember">
            <el-checkbox v-model="form.remember">记住密码</el-checkbox>
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="userStore.loginLoading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form>

        <div class="login-tips">
          <el-divider>测试账号</el-divider>
          <div class="account-list">
            <div v-for="acc in testAccounts" :key="acc.username" class="account-item" @click="fillAccount(acc)">
              <el-tag :type="acc.type" size="small" effect="light">{{ acc.label }}</el-tag>
              <span class="account-user">{{ acc.username }}</span>
              <span class="account-pass">/ {{ acc.password }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const form = reactive({
  username: 'manager',
  password: '123456',
  remember: true
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const testAccounts = [
  { username: 'admin', password: '123456', label: '超级管理员', type: 'danger' },
  { username: 'manager', password: '123456', label: '运营经理', type: 'primary' },
  { username: 'operator', password: '123456', label: '运营人员', type: 'success' },
  { username: 'finance', password: '123456', label: '金融专员', type: 'warning' },
  { username: 'external', password: '123456', label: '外部人员', type: 'info' }
]

async function handleLogin() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    await userStore.login({ ...form })
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (e) {
    if (e && e !== false) {
      ElMessage.error(e.message || '登录失败')
    }
  }
}

function fillAccount(acc) {
  form.username = acc.username
  form.password = acc.password
}
</script>

<style lang="scss" scoped>
.login-page {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%);
  }
}

.login-container {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 440px;
  border-radius: 16px;
  padding: 20px;

  :deep(.el-card__body) {
    padding: 32px 28px;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 28px;

  .logo {
    width: 72px;
    height: 72px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #ecf5ff, #d9ecff);
    border-radius: 20px;
  }

  .title {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 600;
    color: #303133;
  }

  .subtitle {
    margin: 0;
    font-size: 13px;
    color: #909399;
  }
}

.login-form {
  .login-btn {
    width: 100%;
    margin-top: 8px;
  }
}

.login-tips {
  margin-top: 24px;

  .account-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .account-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    background: #f5f7fa;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;

    &:hover {
      background: #ecf5ff;
      transform: translateY(-1px);
    }

    .account-user {
      font-weight: 500;
      color: #606266;
    }

    .account-pass {
      color: #c0c4cc;
    }
  }
}
</style>
