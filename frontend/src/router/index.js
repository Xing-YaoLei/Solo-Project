import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台', requiresAuth: true }
      },
      {
        path: 'appointments',
        name: 'AppointmentList',
        component: () => import('@/views/AppointmentList.vue'),
        meta: { title: '预约任务分派台', requiresAuth: true }
      },
      {
        path: 'appointments/:id',
        name: 'AppointmentDetail',
        component: () => import('@/views/AppointmentDetail.vue'),
        meta: { title: '预约单详情', requiresAuth: true }
      },
      {
        path: 'conflicts',
        name: 'ConflictView',
        component: () => import('@/views/ConflictView.vue'),
        meta: { title: '冲突检测', requiresAuth: true }
      },
      {
        path: 'reschedule-logs',
        name: 'RescheduleLog',
        component: () => import('@/views/RescheduleLog.vue'),
        meta: { title: '改约记录', requiresAuth: true }
      },
      {
        path: 'attendance',
        name: 'AttendanceView',
        component: () => import('@/views/AttendanceView.vue'),
        meta: { title: '到场状态管理', requiresAuth: true }
      },
      {
        path: 'reminders',
        name: 'ReminderList',
        component: () => import('@/views/ReminderList.vue'),
        meta: { title: '提醒名单', requiresAuth: true }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
        meta: { title: '统计报表', requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '系统设置', requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const roleDefaultPage = {
  ADMIN: '/dashboard',
  RECEPTIONIST: '/appointments',
  TEACHER: '/appointments',
  PRINCIPAL: '/statistics'
}

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (to.meta.requiresAuth !== false && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.name === 'Login' && token) {
    next(roleDefaultPage[userStore.role] || '/dashboard')
    return
  }

  next()
})

export default router
export { roleDefaultPage }
