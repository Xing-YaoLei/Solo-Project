import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '@/types'

export const OPERATOR_USERS: User[] = [
  {
    id: 1,
    username: 'zhangsan',
    full_name: '张三',
    role: 'admin',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'lisi',
    full_name: '李四',
    role: 'operator',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    username: 'wangwu',
    full_name: '王五',
    role: 'supervisor',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
]

const STORAGE_KEY = 'current_operator_id'

interface OperatorContextValue {
  currentOperator: User | null
  setCurrentOperator: (user: User | null) => void
  operatorUsers: User[]
}

const OperatorContext = createContext<OperatorContextValue | undefined>(undefined)

export function OperatorProvider({ children }: { children: ReactNode }) {
  const [currentOperator, setCurrentOperatorState] = useState<User | null>(null)

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY)
    if (savedId) {
      const user = OPERATOR_USERS.find((u) => u.id === Number(savedId))
      if (user) {
        setCurrentOperatorState(user)
        return
      }
    }
    setCurrentOperatorState(OPERATOR_USERS[0])
  }, [])

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
      value={{ currentOperator, setCurrentOperator, operatorUsers: OPERATOR_USERS }}
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
