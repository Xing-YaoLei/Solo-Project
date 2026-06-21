import { defineStore } from 'pinia'
import { getAllDict, listUsers, listUsersByRole } from '../api'

export const useAppStore = defineStore('app', {
  state: () => ({
    dict: {},
    users: [],
    usersByRole: {},
    currentUser: { id: 2, realName: '王经理', role: 'MANAGER', username: 'manager01' }
  }),
  getters: {
    getDictItem: (state) => (type, code) => {
      const list = state.dict[type] || []
      return list.find(i => i.code === code)?.desc || code
    }
  },
  actions: {
    async loadDict() {
      const { data } = await getAllDict()
      this.dict = data
    },
    async loadUsers() {
      const { data } = await listUsers()
      this.users = data
    },
    async loadUsersByRole(role) {
      const { data } = await listUsersByRole(role)
      this.usersByRole[role] = data
      return data
    },
    getUserName(id) {
      return this.users.find(u => u.id === id)?.realName || '-'
    }
  }
})
