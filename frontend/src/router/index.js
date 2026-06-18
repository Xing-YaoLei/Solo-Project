import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ROLES, canAccessRoute } from '@/utils/permission'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false, layout: 'blank' }
  },
  {
    path: '/',
    component: () => import('@/components/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '漏斗看板',
          icon: 'DataBoard',
          roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR, ROLES.FINANCE, ROLES.EXTERNAL]
        }
      },
      {
        path: 'quotation',
        name: 'Quotation',
        component: () => import('@/views/Quotation.vue'),
        meta: {
          title: '报价历史',
          icon: 'Money',
          roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR, ROLES.FINANCE, ROLES.EXTERNAL]
        }
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('@/views/Finance.vue'),
        meta: {
          title: '金融资料管理',
          icon: 'Wallet',
          roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.FINANCE]
        }
      },
      {
        path: 'archive',
        name: 'Archive',
        component: () => import('@/views/Archive.vue'),
        meta: {
          title: '车辆档案',
          icon: 'Files',
          roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR]
        }
      },
      {
        path: 'share',
        name: 'Share',
        component: () => import('@/views/Share.vue'),
        meta: {
          title: '分享链接管理',
          icon: 'Share',
          roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR]
        }
      }
    ]
  },
  {
    path: '/public/share/:token',
    name: 'PublicShare',
    component: () => import('@/views/PublicShare.vue'),
    meta: { title: '分享数据', requiresAuth: false, layout: 'blank' }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/Error403.vue'),
    meta: { title: '无权限', requiresAuth: false, layout: 'blank' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Error404.vue'),
    meta: { title: '页面不存在', requiresAuth: false, layout: 'blank' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const WHITE_LIST = ['/login', '/403', '/404']

router.beforeEach(async (to, from, next) => {
  document.title = to.meta?.title ? `${to.meta.title} - Solo 漏斗看板` : 'Solo 漏斗看板管理系统'

  const userStore = useUserStore()
  const token = userStore.token

  if (to.path.startsWith('/public/share/')) {
    return next()
  }

  if (WHITE_LIST.includes(to.path)) {
    if (to.path === '/login' && token && userStore.isLoggedIn) {
      return next('/dashboard')
    }
    return next()
  }

  if (!token || !userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (!userStore.userInfo && token) {
    try {
      await userStore.fetchUserInfo()
    } catch (e) {
      userStore.clearUser()
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }
  }

  if (to.meta?.roles && !canAccessRoute(userStore.userRole, to.meta)) {
    return next('/403')
  }

  next()
})

export default router
