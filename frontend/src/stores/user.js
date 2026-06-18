import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getUserInfo } from '@/api/user'
import { ROLES, ROLE_LABELS } from '@/utils/permission'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  const loginLoading = ref(false)

  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  const userRole = computed(() => userInfo.value?.role || '')
  const userName = computed(() => userInfo.value?.username || userInfo.value?.name || '')
  const userAvatar = computed(() => userInfo.value?.avatar || '')
  const roleLabel = computed(() => ROLE_LABELS[userRole.value] || '')
  const isAdmin = computed(() => userRole.value === ROLES.ADMIN)
  const isExternal = computed(() => userRole.value === ROLES.EXTERNAL)

  async function login(loginForm) {
    loginLoading.value = true
    try {
      const res = await loginApi(loginForm)
      const { token: newToken, ...info } = res || { token: 'mock-token-' + Date.now(), ...getMockUser(loginForm.username) }
      token.value = newToken
      userInfo.value = info.username ? info : { ...info, ...getMockUser(loginForm.username) }
      localStorage.setItem('token', token.value)
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
      return userInfo.value
    } finally {
      loginLoading.value = false
    }
  }

  async function logout() {
    try {
      await logoutApi()
    } catch (e) {
    }
    clearUser()
  }

  async function fetchUserInfo() {
    try {
      const info = await getUserInfo()
      if (info) {
        userInfo.value = info
        localStorage.setItem('userInfo', JSON.stringify(info))
      }
      return info
    } catch (e) {
      return userInfo.value
    }
  }

  function clearUser() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    loginLoading,
    isLoggedIn,
    userRole,
    userName,
    userAvatar,
    roleLabel,
    isAdmin,
    isExternal,
    login,
    logout,
    fetchUserInfo,
    clearUser
  }
})

function getMockUser(username) {
  const mockUsers = {
    admin: { id: 1, username: 'admin', name: '系统管理员', role: ROLES.ADMIN, avatar: '', department: '技术部' },
    manager: { id: 2, username: 'manager', name: '张经理', role: ROLES.MANAGER, avatar: '', department: '运营部' },
    operator: { id: 3, username: 'operator', name: '李运营', role: ROLES.OPERATOR, avatar: '', department: '运营部' },
    finance: { id: 4, username: 'finance', name: '王金融', role: ROLES.FINANCE, avatar: '', department: '金融部' },
    external: { id: 5, username: 'external', name: '外部合作方', role: ROLES.EXTERNAL, avatar: '', department: '外部' }
  }
  return mockUsers[username] || mockUsers.operator
}
