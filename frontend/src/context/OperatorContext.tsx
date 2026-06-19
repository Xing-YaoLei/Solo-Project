import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '@/types'
import { userApi } from '@/services/api'

const STORAGE_KEY = 'current_operator_id'

interface OperatorContextValue {
  currentOperator: User | null
  setCurrentOperator: (user: User | null) => void
  operatorUsers: User[]
  loading: boolean
}

const OperatorContext = createContext<OperatorContextValue | undefined>(undefined)

export function OperatorProvider({ children }: { children: ReactNode }) {
  const [operatorUsers, setOperatorUsers] = useState<User[]>([])
  const [currentOperator, setCurrentOperatorState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const users = await userApi.getList()
      setOperatorUsers(users)

      const savedId = localStorage.getItem(STORAGE_KEY)
      if (savedId && users.length > 0) {
        const user = users.find((u) => u.id === Number(savedId))
        if (user) {
          setCurrentOperatorState(user)
          return
        }
      }
      if (users.length > 0) {
        setCurrentOperatorState(users[0])
      }
    } catch (error) {
      console.error('加载用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const setCurrentOperator = (user: User | null) => {
    setCurrentOperatorState(user)
    if (user) {
      localStorage.setItem(STORAGE_KEY, String(user.id))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <OperatorContext.Provider
      value={{ currentOperator, setCurrentOperator, operatorUsers, loading }}
    >
      {children}
    </OperatorContext.Provider>
  )
}

export function useOperator() {
  const ctx = useContext(OperatorContext)
  if (!ctx) {
    throw new Error('useOperator must be used within OperatorProvider')
  }
  return ctx
}
