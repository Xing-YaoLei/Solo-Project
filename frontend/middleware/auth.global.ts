export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  const token = useCookie('token')

  if (token.value && !authStore.token) {
    authStore.token = token.value as string
    authStore.loadUserFromToken()
  }

  if (to.path === '/login') {
    if (authStore.isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
