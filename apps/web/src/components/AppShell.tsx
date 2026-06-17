'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuthStore } from '@/stores'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('token')
    if (!token && pathname !== '/login') {
      router.push('/login')
    }
  }, [isAuthenticated, pathname, router])

  if (!mounted) {
    return null
  }

  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-muted/30">{children}</main>
      </div>
    </div>
  )
}
