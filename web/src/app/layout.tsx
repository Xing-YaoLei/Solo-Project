import type { Metadata } from 'next'
import { Noto_Sans_SC, JetBrains_Mono } from 'next/font/google'
import QueryProvider from '@/lib/QueryProvider'
import AppLayout from '@/components/AppLayout'
import './globals.css'

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '养老护理用药提醒分派台',
  description: '养老护理用药提醒分派管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${notoSansSC.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <QueryProvider>
          <AppLayout>{children}</AppLayout>
        </QueryProvider>
      </body>
    </html>
  )
}
