import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './context/AuthContext';

export const metadata: Metadata = {
  title: '旅游民宿保洁排班风险监测图',
  description: '整合门锁记录、OTA订单、客服消息的民宿运营风险监测平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-body">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
