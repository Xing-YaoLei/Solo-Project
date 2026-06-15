import { create } from 'zustand'
import axios from 'axios'
import { EnumsData, defaultEnums } from '../utils/enums'

export interface User {
  id: number
  username: string
  full_name: string
  role: string
}

interface AppState {
  user: User | null
  enums: EnumsData
  loadingEnums: boolean
  setUser: (user: User) => void
  setEnums: (enums: EnumsData) => void
  fetchEnums: () => Promise<void>
}

const defaultUser: User = {
  id: 1,
  username: 'admin',
  full_name: '系统管理员',
  role: 'administrator',
}

export const useAppStore = create<AppState>((set) => ({
  user: defaultUser,
  enums: defaultEnums,
  loadingEnums: false,

  setUser: (user: User) => set({ user }),

  setEnums: (enums: EnumsData) => set({ enums }),

  fetchEnums: async () => {
    set({ loadingEnums: true })
    try {
      const response = await axios.get<EnumsData>('/api/enums')
      set({ enums: response.data })
    } catch (error) {
      console.error('获取枚举数据失败，使用默认值:', error)
      set({ enums: defaultEnums })
    } finally {
      set({ loadingEnums: false })
    }
  },
}))
