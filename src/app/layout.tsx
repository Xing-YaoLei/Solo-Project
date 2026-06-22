import type { Metadata } from 'next'
import { Noto_Sans_SC, DM_Mono } from 'next/font/google'
import './globals.css'

const notoSansSC = Noto_Sans_SC({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '合规审计整改跟踪',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${notoSansSC.variable} ${dmMono.variable}`}>
      <body className="bg-slate-50 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
