import type { Metadata } from 'next';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { getQueryClient } from '@/lib/api/query-client';
import './globals.css';

export const metadata: Metadata = {
  title: '审计管理系统',
  description: '企业内部审计管理平台',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const queryClient = getQueryClient();

  return (
    <html lang="zh-CN">
      <body>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            locale={zhCN}
            theme={{
              token: {
                colorPrimary: '#3b82f6',
                borderRadius: 8,
                colorLink: '#3b82f6',
                colorLinkActive: '#1d4ed8',
                colorLinkHover: '#2563eb',
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
              },
              components: {
                Layout: {
                  headerBg: '#ffffff',
                  siderBg: '#001529',
                  bodyBg: '#f5f7fa',
                },
                Menu: {
                  darkItemBg: '#001529',
                  darkSubMenuItemBg: '#000c17',
                  darkItemSelectedBg: '#3b82f6',
                },
              },
            }}
          >
            <AntdApp>{children}</AntdApp>
          </ConfigProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
