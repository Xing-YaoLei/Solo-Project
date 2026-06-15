<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <div class="layout-wrapper">
          <div class="layout-sidebar" :class="{ collapsed: collapsed }">
            <div class="sidebar-header">
              <div class="logo-area">
                <span class="logo-icon">📚</span>
                <span v-show="!collapsed" class="logo-text">教材发放跟进台</span>
              </div>
            </div>
            <n-menu
              :options="menuOptions"
              :value="activeKey"
              :collapsed="collapsed"
              :collapsed-width="64"
              :collapsed-icon-size="22"
              :indent="24"
              @update:value="handleMenuSelect"
            />
          </div>
          <div class="layout-main" :class="{ expanded: collapsed }">
            <div class="layout-header">
              <div class="header-left">
                <n-button quaternary @click="collapsed = !collapsed">
                  <template #icon>
                    <n-icon size="20">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
                      </svg>
                    </n-icon>
                  </template>
                </n-button>
                <n-breadcrumb class="header-breadcrumb">
                  <n-breadcrumb-item>{{ currentPageTitle }}</n-breadcrumb-item>
                </n-breadcrumb>
              </div>
              <div class="header-right">
                <n-dropdown :options="userDropdownOptions" @select="handleUserAction">
                  <div class="user-info">
                    <n-avatar :size="32" round style="background-color: var(--color-accent);">
                      {{ userInitial }}
                    </n-avatar>
                    <span class="user-name">{{ userName }}</span>
                  </div>
                </n-dropdown>
              </div>
            </div>
            <div class="layout-content">
              <slot />
            </div>
          </div>
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import type { MenuOption } from 'naive-ui'
import { NIcon } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)

const themeOverrides = {
  common: {
    primaryColor: '#1B3A5C',
    primaryColorHover: '#2A5580',
    primaryColorPressed: '#0F2540',
    primaryColorSuppl: '#1B3A5C',
  },
  Menu: {
    itemTextColorActive: '#F28C28',
    itemTextColorActiveHover: '#F28C28',
    itemIconColorActive: '#F28C28',
    itemIconColorActiveHover: '#F28C28',
    itemColorActive: 'rgba(242, 140, 40, 0.08)',
    itemColorActiveHover: 'rgba(242, 140, 40, 0.12)',
  },
}

const userName = ref('管理员')
const userInitial = computed(() => userName.value.charAt(0))

const menuMap: Record<string, string> = {
  dashboard: '工作台',
  progress: '学习进度',
  risk: '风险预警',
  reminders: '提醒规则',
  analytics: '管理看板',
}

const activeKey = computed(() => {
  const path = route.path
  if (path === '/' || path === '/dashboard') return 'dashboard'
  const key = path.replace('/', '')
  return key in menuMap ? key : 'dashboard'
})

const currentPageTitle = computed(() => menuMap[activeKey.value] || '工作台')

function renderIcon(icon: string) {
  return () =>
    h(NIcon, null, {
      default: () =>
        h('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: '0 0 24 24',
          fill: 'currentColor',
          innerHTML: icon,
        }),
    })
}

const menuOptions: MenuOption[] = [
  {
    label: '工作台',
    key: 'dashboard',
    icon: renderIcon(
      '<path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zM13 4v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z"/>'
    ),
  },
  {
    label: '学习进度',
    key: 'progress',
    icon: renderIcon(
      '<path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2 2H5V5h14v14zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>'
    ),
  },
  {
    label: '风险预警',
    key: 'risk',
    icon: renderIcon(
      '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>'
    ),
  },
  {
    label: '提醒规则',
    key: 'reminders',
    icon: renderIcon(
      '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>'
    ),
  },
  {
    label: '管理看板',
    key: 'analytics',
    icon: renderIcon(
      '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>'
    ),
  },
]

const userDropdownOptions = [
  { label: '个人设置', key: 'profile' },
  { label: '退出登录', key: 'logout' },
]

function handleMenuSelect(key: string) {
  router.push(`/${key === 'dashboard' ? '' : key}`)
}

function handleUserAction(key: string) {
  if (key === 'logout') {
    router.push('/')
  }
}
</script>

<style scoped>
.layout-wrapper {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.layout-sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  height: 100vh;
  background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow: hidden;
}

.layout-sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
  min-width: var(--sidebar-collapsed-width);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  overflow: hidden;
}

.logo-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 1px;
}

.layout-sidebar :deep(.n-menu) {
  --n-item-text-color: rgba(255, 255, 255, 0.75);
  --n-item-text-color-hover: #fff;
  --n-item-icon-color: rgba(255, 255, 255, 0.75);
  --n-item-icon-color-hover: #fff;
  --n-item-color-active: rgba(242, 140, 40, 0.15);
  --n-item-text-color-active: #F28C28;
  --n-item-icon-color-active: #F28C28;
  --n-item-color-active-hover: rgba(242, 140, 40, 0.2);
  --n-item-text-color-active-hover: #F28C28;
  --n-item-icon-color-active-hover: #F28C28;
  background: transparent;
}

.layout-sidebar :deep(.n-menu .n-menu-item) {
  margin: 2px 8px;
  border-radius: 6px;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.layout-header {
  height: var(--header-height);
  background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-breadcrumb {
  font-size: 15px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.user-info:hover {
  background: var(--color-bg);
}

.user-name {
  font-size: 14px;
  color: var(--color-text);
}

.layout-content {
  flex: 1;
  overflow-y: auto;
  background: var(--color-bg);
}
</style>
