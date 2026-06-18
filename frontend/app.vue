<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <NMessageProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </NNotificationProvider>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'

const authStore = useAuthStore()

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#F59E0B',
    primaryColorHover: '#FBBF24',
    primaryColorPressed: '#D97706',
    primaryColorSuppl: '#F59E0B',
    borderRadius: '8px',
    fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  Card: {
    borderRadius: '12px',
  },
  Button: {
    borderRadiusMedium: '8px',
    borderRadiusSmall: '6px',
  },
  Tag: {
    borderRadius: '6px',
  },
}

onMounted(() => {
  authStore.init()
})
</script>
