import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/ui/Navigation';

export const metadata: Metadata = {
  title: '高校教务成绩复核趋势看板',
  description: '高校教务成绩复核分析与教室利用率管理平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Navigation />
          <main className="flex-1 ml-64">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
