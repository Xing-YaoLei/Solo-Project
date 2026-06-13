import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "咖啡工坊 · 会员储值风险监测系统",
  description: "连锁咖啡会员储值风险监测与数据分析平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
