export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  const token = useCookie('token')

  if (token.value && !authStore.token) {
    authStore.token = token.value
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
