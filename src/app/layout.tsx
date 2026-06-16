import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "药店连锁会员慢病风险监测系统",
  description: "追踪药店连锁会员慢病健康状况，整合收银系统、会员记录、库存数据",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center text-slate-500">
              加载中...
            </div>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  );
}
