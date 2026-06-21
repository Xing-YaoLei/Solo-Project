import type { Metadata } from 'next';
import { Playfair_Display, Noto_Sans_SC } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

const notoSans = Noto_Sans_SC({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans',
});

export const metadata: Metadata = {
  title: '开庭日历漏斗报表系统',
  description: '法律服务开庭日历数据分析平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${playfair.variable} ${notoSans.variable}`}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <Navbar />
        <main className="ml-64 p-8">{children}</main>
      </body>
    </html>
  );
}
