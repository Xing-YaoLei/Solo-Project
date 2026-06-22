import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: '合规审计整改跟踪 · 风险监测系统',
  description: '企业合规审计整改跟踪与风险监测平台，打通权限日志、ERP导出、邮件材料多源数据，全流程可追溯可回查。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
