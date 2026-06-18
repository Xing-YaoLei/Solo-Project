import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dispatch'
  },
  {
    path: '/dispatch',
    name: 'DispatchBoard',
    component: () => import('../views/DispatchBoard.vue')
  },
  {
    path: '/monthly-review',
    name: 'MonthlyReview',
    component: () => import('../views/MonthlyReview.vue')
  },
  {
    path: '/no-show-alert',
    name: 'NoShowAlert',
    component: () => import('../views/NoShowAlert.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
