'use client'

import { AppLayout } from '@/components/AppLayout'
import { usePathname } from 'next/navigation'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
