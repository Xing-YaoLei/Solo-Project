<template>
  <n-config-provider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <div class="app-layout" v-if="isAuthenticated">
            <LayoutSidebar @menu-select="handleMenuSelect" />
            <div class="main-content">
              <LayoutHeader />
              <main class="content-wrapper">
                <NuxtPage />
              </main>
            </div>
          </div>
          <NuxtPage v-else />
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { zhCN, dateZhCN, darkTheme, lightTheme } from 'naive-ui'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const route = useRoute()

const theme = computed(() => lightTheme)

const handleMenuSelect = (key: string) => {
  navigateTo(key)
}

onMounted(() => {
  if (authStore.token && !authStore.user) {
    authStore.fetchCurrentUser().catch(() => {
      if (!route.path.startsWith('/login')) {
        navigateTo('/login')
      }
    })
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #__nuxt {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
}
</style>
