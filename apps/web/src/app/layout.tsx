import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import ActivitySelector from '@/components/ActivitySelector';
import { Bell, Search, User } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: '活动票务任务分派台',
  description: '演出票务交接、座位、签到、异常处理一体化管理平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen flex">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center gap-4 px-6">
              <ActivitySelector />
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    placeholder="搜索订单号 / 客户 / 签到码..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm border border-transparent focus:bg-white focus:border-slate-300 focus:outline-none"
                  />
                </div>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <button className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
                  <Bell className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-slate-900 leading-none">运营台</div>
                    <div className="text-xs text-slate-500 mt-0.5">管理员</div>
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1 p-6 overflow-y-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
