import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { cn } from '@/lib/utils'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '本地跑腿路线补贴漏斗报表',
  description: '本地跑腿路线补贴漏斗报表系统 - 补贴规则→申诉证据→结算明细全链路追踪',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased gradient-mesh',
          inter.variable,
          spaceGrotesk.variable,
          jetbrainsMono.variable
        )}
      >
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <div className="flex-1 container mx-auto px-4 py-6 md:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
