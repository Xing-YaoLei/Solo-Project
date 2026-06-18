<template>
  <NConfigProvider>
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
import { NConfigProvider, NDialogProvider, NMessageProvider, NNotificationProvider } from 'naive-ui'

const authStore = useAuthStore()
const router = useRouter()

watch(() => router.currentRoute.value.path, (path) => {
  if (path !== '/login' && !authStore.isLoggedIn) {
    router.push('/login')
  }
}, { immediate: true })
</script>
