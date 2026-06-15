import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import ShareExportModal from '@/components/dashboard/ShareExportModal'

export const metadata: Metadata = {
  title: '成绩复核风险监测',
  description: '高校教务成绩复核风险监测图',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
        <ShareExportModal />
      </body>
    </html>
  )
}
