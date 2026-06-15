import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/analysis',
    name: 'Analysis',
    component: () => import('@/views/Analysis.vue')
  },
  {
    path: '/students',
    name: 'Students',
    component: () => import('@/views/Students.vue')
  },
  {
    path: '/batches',
    name: 'Batches',
    component: () => import('@/views/Batches.vue')
  },
  {
    path: '/rules',
    name: 'Rules',
    component: () => import('@/views/Rules.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
