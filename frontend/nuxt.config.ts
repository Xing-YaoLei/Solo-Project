export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
  ],
  ssr: false,
  css: [
    '~/assets/css/main.css',
  ],
  build: {
    transpile: ['naive-ui', 'vueuc', '@css-render/vue3-ssr', '@juggle/resize-observer'],
  },
  vite: {
    optimizeDeps: {
      include: [
        'naive-ui',
        'vueuc',
        'date-fns-tz/formatInTimeZone',
        '@juggle/resize-observer',
        'echarts',
        'vue-echarts',
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api',
    },
  },
  app: {
    head: {
      title: '青少年培训续费跟进系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})
