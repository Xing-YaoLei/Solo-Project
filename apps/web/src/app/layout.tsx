import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '跑腿物品核验任务分派台',
  description: '本地跑腿物品核验任务分派管理系统',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
