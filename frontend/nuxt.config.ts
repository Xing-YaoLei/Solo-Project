export default defineNuxtConfig({
  compatibilityDate: '2026-06-14',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@pinia/nuxt', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:8000/api'
    }
  },
  build: {
    transpile: ['naive-ui', 'vue-echarts', '@vueuse/core']
  },
  vite: {
    optimizeDeps: {
      include: ['naive-ui', 'vue-echarts', 'dayjs', 'echarts']
    }
  }
})
