import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref({
    id: 1,
    username: 'demo',
    realName: '张老师',
    role: 'MANAGER',
    department: '教学部',
    phone: '13800138000'
  })

  const role = computed(() => user.value.role)
  const isManager = computed(() => user.value.role === 'MANAGER')

  const setRole = (newRole) => {
    if (newRole === 'manager' || newRole === 'MANAGER') {
      user.value.role = 'MANAGER'
      user.value.realName = '李总监'
    } else {
      user.value.role = 'CONSULTANT'
      user.value.realName = '张老师'
    }
  }

  return { user, role, isManager, setRole }
})
