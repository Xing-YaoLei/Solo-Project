import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '景区运营演出排期管理系统',
  description: '景区运营演出排期任务分派台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
