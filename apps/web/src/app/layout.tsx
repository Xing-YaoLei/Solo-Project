import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: '社区团购售后退款分派台',
  description: '社区团购售后退款任务分派与管理系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
