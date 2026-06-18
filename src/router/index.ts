import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '@/pages/DashboardPage.vue'
import SharePage from '@/pages/SharePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardPage,
    },
    {
      path: '/share/:token',
      name: 'share',
      component: SharePage,
      props: true,
    },
  ],
})

export default router
