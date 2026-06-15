import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import router, { roleDefaultPage } from '@/router'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  const role = ref(localStorage.getItem('role') || '')

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || '')

  function hasRole(targetRole) {
    if (Array.isArray(targetRole)) {
      return targetRole.includes(role.value)
    }
    return role.value === targetRole
  }

  function hasAnyRole(roles) {
    return roles.includes(role.value)
  }

  async function login(loginForm) {
    const res = await authApi.login(loginForm)
    const { token: newToken, user } = res.data
    token.value = newToken
    userInfo.value = user
    role.value = user.role
    localStorage.setItem('token', newToken)
    localStorage.setItem('userInfo', JSON.stringify(user))
    localStorage.setItem('role', user.role)
    router.push(roleDefaultPage[user.role] || '/dashboard')
  }

  async function getUserInfo() {
    const res = await authApi.getUserInfo()
    userInfo.value = res.data
    role.value = res.data.role
    localStorage.setItem('userInfo', JSON.stringify(res.data))
    localStorage.setItem('role', res.data.role)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    role.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('role')
    router.push('/login')
  }

  return { token, userInfo, role, isLoggedIn, username, hasRole, hasAnyRole, login, getUserInfo, logout }
})
