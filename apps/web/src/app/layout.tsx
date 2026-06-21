import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: '法律案件委托分派台',
  description: '法律服务案件委托任务分派平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
