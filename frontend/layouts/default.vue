<template>
  <NLayout style="height: 100vh" has-sider>
            <NLayoutSider
              :width="220"
              :collapsed-width="64"
              :collapsed="collapsed"
              :collapsed-mode="'width'"
              show-trigger
              @update:collapsed="onCollapsed"
              bordered
            >
              <div class="h-16 flex items-center px-4 border-b border-gray-200">
                <div class="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  车
                </div>
                <transition name="fade">
                  <span v-show="!collapsed" class="ml-3 text-base font-semibold text-green-700 whitespace-nowrap">
                    车源跟进台
                  </span>
                </transition>
              </div>
              <NMenu
                :value="route.fullPath"
                :options="menuOptions"
                :collapsed="collapsed"
                :collapsed-width="64"
                :collapsed-icon-size="22"
                @update:value="onMenuSelect"
              />
            </NLayoutSider>
            <NLayout>
              <NLayoutHeader bordered class="flex items-center justify-between px-6 h-16">
                <div>
                  <NBreadcrumb>
                    <NBreadcrumbItem v-for="b in breadcrumbs" :key="b.label">
                      {{ b.label }}
                    </NBreadcrumbItem>
                  </NBreadcrumb>
                </div>
                <div class="flex items-center gap-4">
                  <NTag v-if="authStore.user" :bordered="false" type="info">
                    {{ authStore.user.role_display }}
                  </NTag>
                  <NDropdown :options="userMenuOptions" @select="onUserAction">
                    <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded">
                      <NAvatar round size="small" style="background: #18a058">
                        {{ authStore.user?.first_name?.[0] || authStore.user?.username?.[0] || 'U' }}
                      </NAvatar>
                      <span class="text-sm">{{ authStore.user?.first_name }}{{ authStore.user?.last_name }} ({{ authStore.user?.username }})</span>
                      <NIcon :component="CaretDownOutlined" size="14" />
                    </div>
                  </NDropdown>
                </div>
              </NLayoutHeader>
              <NLayoutContent class="overflow-auto bg-gray-50">
                <slot />
              </NLayoutContent>
            </NLayout>
          </NLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import {
  DashboardOutlined, CarOutlined, FileTextOutlined,
  SettingOutlined, LogoutOutlined, CaretDownOutlined,
  BarChartOutlined, SearchOutlined, AlertOutlined,
} from '@vicons/antd'
import { useAuthStore } from '~/stores/auth'

const collapsed = ref(false)
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const menuOptions = computed(() => {
  const menus = [
    {
      label: '工作台',
      key: '/',
      icon: DashboardOutlined,
    },
    {
      label: '车源档案',
      key: '/vehicles',
      icon: CarOutlined,
    },
    {
      label: '资料缺失',
      key: '/documents/missing',
      icon: AlertOutlined,
    },
    {
      label: '库存周转',
      key: '/inventory-turnover',
      icon: BarChartOutlined,
    },
    {
      label: '统计报表',
      key: '/statistics',
      icon: SearchOutlined,
    },
  ]
  if (authStore.isManager) {
    menus.push({
      label: '系统管理',
      key: '/users',
      icon: SettingOutlined,
    })
  }
  return menus
})

const breadcrumbs = computed(() => {
  const map: Record<string, string> = {
    '/': '工作台',
    '/vehicles': '车源档案',
    '/statistics': '统计报表',
    '/inventory-turnover': '库存周转',
    '/users': '用户管理',
  }
  const crumbs = [{ label: '首页', key: '/' }]
  if (route.fullPath === '/') return crumbs
  if (route.fullPath.startsWith('/vehicles/')) {
    crumbs.push({ label: '车源档案', key: '/vehicles' })
    crumbs.push({ label: '车源详情', key: route.fullPath })
  } else {
    const label = map[route.fullPath] || '当前页面'
    crumbs.push({ label, key: route.fullPath })
  }
  return crumbs
})

const userMenuOptions = [
  {
    label: '个人资料',
    key: 'profile',
    icon: FileTextOutlined,
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: LogoutOutlined,
  },
]

function onCollapsed(v: boolean) {
  collapsed.value = v
}

function onMenuSelect(key: string) {
  if (key === route.fullPath) return
  router.push(key)
}

function onUserAction(key: string) {
  if (key === 'logout') {
    dialog.warning({
      title: '确认退出？',
      content: '退出后需要重新登录才能继续使用',
      positiveText: '退出',
      negativeText: '取消',
      onPositiveClick: async () => {
        await authStore.logout()
        message.success('已退出')
        router.push('/login')
      },
    })
  } else if (key === 'profile') {
    message.info('个人资料功能开发中')
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
