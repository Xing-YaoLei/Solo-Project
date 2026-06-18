<template>
  <NLayout has-sider style="height: 100vh">
    <NLayoutSider
      bordered
      :width="220"
      :native-scrollbar="false"
      content-style="padding: 0;"
      :collapsed-width="64"
      :collapsed="collapsed"
      show-trigger
      collapse-mode="width"
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="sider-header">
        <div v-if="!collapsed" class="logo-text">过户材料跟进台</div>
        <div v-else class="logo-icon">过户</div>
      </div>
      <NMenu
        v-model:value="activeKey"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :theme-overrides="menuThemeOverrides"
        @update:value="handleMenuSelect"
      />
    </NLayoutSider>
    <NLayout>
      <NLayoutHeader bordered style="height: 56px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between;">
        <NBreadcrumb>
          <NBreadcrumbItem @click="navigateTo('/')">首页</NBreadcrumbItem>
          <NBreadcrumbItem v-if="currentPageTitle">{{ currentPageTitle }}</NBreadcrumbItem>
        </NBreadcrumb>
        <NSpace align="center" :size="12">
          <NTooltip>
            <template #trigger>
              <NBadge :value="exceptionCount" :max="99">
                <NButton quaternary circle @click="navigateTo('/exceptions')">
                  <template #icon>
                    <NIcon size="18"><AlertCircleOutline /></NIcon>
                  </template>
                </NButton>
              </NBadge>
            </template>
            异常项
          </NTooltip>
          <NDropdown :options="userMenuOptions" @select="handleUserMenu">
            <NButton quaternary size="small">
              <template #icon>
                <NIcon size="16"><PersonOutline /></NIcon>
              </template>
              {{ currentUser?.username || '未登录' }}
            </NButton>
          </NDropdown>
        </NSpace>
      </NLayoutHeader>
      <NLayoutContent content-style="padding: 0;" :native-scrollbar="false">
        <slot />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { NIcon } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  GridOutline,
  FolderOpenOutline,
  AlertCircleOutline,
  BarChartOutline,
  PersonOutline,
} from '@vicons/ionicons5'

const collapsed = ref(false)
const activeKey = ref('dashboard')
const route = useRoute()
const authStore = useAuthStore()
const api = useApi()

const currentUser = computed(() => authStore.user)
const exceptionCount = ref(0)
let statsTimer: ReturnType<typeof setInterval> | null = null

const currentPageTitle = computed(() => {
  const map: Record<string, string> = {
    '/': '',
    '/records': '记录池管理',
    '/records/pending': '待处理池',
    '/records/review': '待复核池',
    '/records/completed': '已完成池',
    '/exceptions': '异常处理中心',
    '/analytics': '汇总看板',
  }
  return map[route.path] || ''
})

function renderIcon(icon: any) {
  return () => h(NIcon, { size: 18 }, { default: () => h(icon) })
}

const menuOptions: MenuOption[] = [
  { label: '工作台', key: 'dashboard', icon: renderIcon(GridOutline) },
  { label: '记录池', key: 'records', icon: renderIcon(FolderOpenOutline) },
  { label: '异常中心', key: 'exceptions', icon: renderIcon(AlertCircleOutline) },
  { label: '汇总看板', key: 'analytics', icon: renderIcon(BarChartOutline) },
]

const menuThemeOverrides = {
  itemTextColor: '#F1F5F9',
  itemTextColorHover: '#F59E0B',
  itemTextColorActive: '#F59E0B',
  itemTextColorChildActive: '#F59E0B',
  itemIconColor: '#94A3B8',
  itemIconColorHover: '#F59E0B',
  itemIconColorActive: '#F59E0B',
  arrowColor: '#94A3B8',
}

const userMenuOptions = [
  { label: '退出登录', key: 'logout' },
]

async function loadExceptionCount() {
  if (!authStore.isAuthenticated) return
  try {
    const data = await api.get<{ exception_count: number }>('/dashboard/stats/')
    exceptionCount.value = data.exception_count
  } catch {}
}

function handleMenuSelect(key: string) {
  const pathMap: Record<string, string> = {
    dashboard: '/',
    records: '/records',
    exceptions: '/exceptions',
    analytics: '/analytics',
  }
  const path = pathMap[key]
  if (path) navigateTo(path)
}

function handleUserMenu(key: string) {
  if (key === 'logout') {
    authStore.logout()
  }
}

onMounted(() => {
  const pathKeyMap: Record<string, string> = {
    '/': 'dashboard',
    '/records': 'records',
    '/records/pending': 'records',
    '/records/review': 'records',
    '/records/completed': 'records',
    '/exceptions': 'exceptions',
    '/analytics': 'analytics',
  }
  activeKey.value = pathKeyMap[route.path] || 'dashboard'
  loadExceptionCount()
  statsTimer = setInterval(loadExceptionCount, 30000)
})

onBeforeUnmount(() => {
  if (statsTimer) {
    clearInterval(statsTimer)
  }
})
</script>

<style scoped>
.sider-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #F1F5F9;
  letter-spacing: 1px;
}

.logo-icon {
  font-size: 14px;
  font-weight: 700;
  color: #F59E0B;
}
</style>
