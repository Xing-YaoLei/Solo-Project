'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  FileText, 
  AlertCircle, 
  Settings,
  Bell,
  Search,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { name: '漏斗看板', href: '/', icon: LayoutDashboard },
  { name: '订单明细', href: '/orders', icon: FileText },
  { name: '任务中心', href: '/tasks', icon: AlertCircle },
  { name: '系统配置', href: '/config', icon: Settings },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-sm">补</span>
              </div>
              <span className="font-display font-bold text-lg">补贴漏斗报表</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'relative px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:text-foreground',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center">
              <User className="h-4 w-4 text-accent-foreground" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
