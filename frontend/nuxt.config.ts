import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
  ],
  css: [
    '~/assets/styles/main.css',
  ],
  app: {
    head: {
      title: '二手车门店车源上架跟进台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:8000/api',
    },
  },
  typescript: {
    strict: true,
    shim: false,
  },
  vite: {
    optimizeDeps: {
      include: [
        'naive-ui',
        'echarts',
      ],
    },
  },
})
