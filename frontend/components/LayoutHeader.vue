<template>
  <header class="layout-header">
    <div class="header-left">
      <span class="page-title">{{ pageTitle }}</span>
    </div>
    <div class="header-right">
      <n-badge :value="unreadCount" :max="99" class="notification-badge">
        <n-button text @click="showNotifications = true">
          <template #icon>
            <n-icon><NotificationsOutline /></n-icon>
          </template>
        </n-button>
      </n-badge>
      <n-dropdown :options="userMenuOptions" @select="handleUserMenu">
        <div class="user-info">
          <n-avatar round size="small">
            {{ user?.username?.charAt(0)?.toUpperCase() }}
          </n-avatar>
          <span class="username">{{ user?.username }}</span>
        </div>
      </n-dropdown>
    </div>

    <n-drawer v-model:show="showNotifications" :width="400" title="通知消息">
      <div class="notification-list">
        <div v-if="notifications.length === 0" class="empty-state">
          暂无通知
        </div>
        <n-list v-else hoverable clickable>
          <n-list-item v-for="item in notifications" :key="item.id" @click="markAsRead(item)">
            <template #prefix>
              <n-icon size="20" :color="item.is_read ? '#999' : '#1890ff'">
                <AlertCircleOutline />
              </n-icon>
            </template>
            <div class="notification-item">
              <div class="notification-title">{{ item.title }}</div>
              <div class="notification-content">{{ item.content }}</div>
              <div class="notification-time">{{ formatTime(item.created_at) }}</div>
            </div>
          </n-list-item>
        </n-list>
      </div>
    </n-drawer>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { NotificationsOutline, AlertCircleOutline, LogOutOutline, PersonOutline } from '@vicons/ionicons5'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const route = useRoute()
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': '工作台',
    '/followups': '续费跟进台',
    '/reminder-rules': '提醒规则',
    '/courses': '课程管理',
    '/assignments': '作业管理',
    '/reports': '月底复盘',
    '/settings': '系统设置',
  }
  return titles[route.path] || '青少年培训续费跟进系统'
})

const showNotifications = ref(false)
const notifications = ref<any[]>([])
const unreadCount = ref(0)

const userMenuOptions = [
  { label: '个人中心', key: 'profile', icon: 'person' },
  { label: '退出登录', key: 'logout', icon: 'logout' },
]

const handleUserMenu = (key: string) => {
  if (key === 'logout') {
    authStore.logout()
    navigateTo('/login')
  } else if (key === 'profile') {
    navigateTo('/profile')
  }
}

const fetchNotifications = async () => {
  try {
    const api = useApi()
    const response = await api.get('/notifications/notifications/?is_read=false')
    notifications.value = response.data.results || []
    unreadCount.value = response.data.count || 0
  } catch (e) {
    console.error('获取通知失败', e)
  }
}

const markAsRead = async (item: any) => {
  try {
    const api = useApi()
    await api.post(`/notifications/notifications/${item.id}/mark_read/`)
    item.is_read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (e) {
    console.error('标记已读失败', e)
  }
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    fetchNotifications()
  }
})
</script>

<style scoped>
.layout-header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f5f5f5;
}

.username {
  font-size: 14px;
  color: #595959;
}

.notification-list {
  max-height: 60vh;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.notification-item {
  flex: 1;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.notification-content {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 11px;
  color: #bfbfbf;
}
</style>
