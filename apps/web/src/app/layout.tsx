import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/AppShell'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '长租公寓管理系统',
  description: '长租公寓房源上架任务分派台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AppShell>
          {children}
        </AppShell>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
