<template>
  <el-container class="app-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo-area">
        <el-icon :size="24" color="#fff"><School /></el-icon>
        <span v-show="!isCollapse" class="logo-text">试听预约分派台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        background-color="#1A365D"
        text-color="#CBD5E0"
        active-text-color="#fff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>
        <el-menu-item index="/appointments">
          <el-icon><Calendar /></el-icon>
          <template #title>预约分派台</template>
        </el-menu-item>
        <el-menu-item index="/conflicts">
          <el-icon><Warning /></el-icon>
          <template #title>冲突检测</template>
        </el-menu-item>
        <el-menu-item index="/reschedule-logs">
          <el-icon><Switch /></el-icon>
          <template #title>改约记录</template>
        </el-menu-item>
        <el-menu-item index="/attendance">
          <el-icon><Checked /></el-icon>
          <template #title>到场管理</template>
        </el-menu-item>
        <el-menu-item index="/reminders">
          <el-icon><Bell /></el-icon>
          <template #title>提醒名单</template>
        </el-menu-item>
        <el-menu-item index="/statistics">
          <el-icon><TrendCharts /></el-icon>
          <template #title>统计报表</template>
        </el-menu-item>
        <el-menu-item v-permission="'ADMIN'" index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" /><Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="28" :icon="UserFilled" />
              <span class="username">{{ userStore.username }}</span>
              <span class="role-tag">{{ roleLabel }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useDictStore } from '@/stores/dict'

const route = useRoute()
const userStore = useUserStore()
const dictStore = useDictStore()
const isCollapse = ref(false)

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/appointments')) return '/appointments'
  return path
})

const currentTitle = computed(() => route.meta?.title || '')

const roleLabel = computed(() => {
  return dictStore.roleOptions.find(r => r.value === userStore.role)?.label || userStore.role
})

function handleCommand(command) {
  if (command === 'logout') {
    userStore.logout()
  }
}
</script>

<style scoped>
.app-layout {
  height: 100vh;
}
.sidebar {
  background: var(--bg-sidebar);
  transition: width 0.3s;
  overflow: hidden;
}
.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid var(--border-color);
  padding: 0 20px;
  height: 60px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
}
.collapse-btn:hover {
  color: var(--edu-blue);
}
.header-right {
  display: flex;
  align-items: center;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.username {
  font-size: 14px;
  color: var(--text-primary);
}
.role-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--edu-blue-lighter);
  color: var(--edu-blue);
  border-radius: 4px;
}
.app-main {
  background: var(--bg-page);
  overflow-y: auto;
}
.el-menu {
  border-right: none;
}
</style>
