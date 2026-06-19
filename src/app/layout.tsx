import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "汽车维修工位排班漏斗报表",
  description: "汽车维修全流程数据可视化报表系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {children}
      </body>
    </html>
  );
}
