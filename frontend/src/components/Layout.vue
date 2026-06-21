<template>
  <div class="layout-page">
    <header class="layout-header">
      <div class="header-title">
        <el-icon size="24"><Car /></el-icon>
        二手车收购任务分派台
      </div>
      <nav class="header-nav">
        <div
          v-for="item in menus"
          :key="item.path"
          :class="['nav-item', { active: $route.path === item.path }]"
          @click="router.push(item.path)"
        >
          <el-icon style="margin-right: 4px; vertical-align: -2px;">
            <component :is="item.icon" />
          </el-icon>
          {{ item.title }}
        </div>
      </nav>
      <div class="header-right">
        <el-tag type="info" effect="dark" round>
          {{ store.currentUser.realName }} · {{ getRoleName(store.currentUser.role) }}
        </el-tag>
      </div>
    </header>
    <main class="layout-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../store/app'
import { onMounted } from 'vue'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

const menus = [
  { path: '/dashboard', title: '工作台', icon: 'DataAnalysis' },
  { path: '/tasks', title: '任务分派台', icon: 'Tickets' },
  { path: '/statistics', title: '汇总统计', icon: 'Histogram' },
  { path: '/inventory', title: '库存周转', icon: 'Box' }
]

const getRoleName = (r) => {
  const m = { ADMIN: '管理员', MANAGER: '经理', ASSESSOR: '评估师', SALES: '业务员' }
  return m[r] || r
}

onMounted(async () => {
  await Promise.all([store.loadDict(), store.loadUsers()])
})
</script>
