import { createRouter, createWebHistory } from 'vue-router'
import FunnelDashboard from '../views/FunnelDashboard.vue'
import ThresholdConfig from '../views/ThresholdConfig.vue'
import ReviewMaterial from '../views/ReviewMaterial.vue'

const routes = [
  { path: '/', name: 'FunnelDashboard', component: FunnelDashboard },
  { path: '/threshold', name: 'ThresholdConfig', component: ThresholdConfig },
  { path: '/review', name: 'ReviewMaterial', component: ReviewMaterial },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
