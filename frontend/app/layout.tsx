import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppLayoutWithProvider } from '@/components/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '汽修管理系统',
  description: '汽车维修服务管理系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AppLayoutWithProvider>{children}</AppLayoutWithProvider>
      </body>
    </html>
  );
}
