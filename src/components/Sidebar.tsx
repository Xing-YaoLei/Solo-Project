import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  AlertTriangle,
  Download,
  Share2,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAppStore, useCurrentUser } from '../store';
import { api, roleLabels } from '../utils/api';
import { useState } from 'react';

const menuItems = [
  { path: '/dashboard', label: '仪表盘概览', icon: LayoutDashboard },
  { path: '/payment', label: '收款流水明细', icon: Receipt },
  { path: '/risk', label: '风险监测', icon: AlertTriangle },
  { path: '/export', label: '数据下载', icon: Download },
];

export default function Sidebar() {
  const user = useCurrentUser();
  const logout = useAppStore((state) => state.logout);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const handleLogout = async () => {
    await api.logout();
    logout();
  };

  const handleShare = async () => {
    if (!user) return;
    const share = await api.createShareLink(user.id, 7);
    const fullUrl = `${window.location.origin}${share.shareUrl}`;
    setShareUrl(fullUrl);
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <>
      <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">退租验房监测</h1>
              <p className="text-xs text-slate-400">Risk Monitoring</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          {user && (
            <div className="px-4 py-3 mb-4">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-slate-400">{roleLabels[user.role]}</p>
            </div>
          )}

          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">生成分享链接</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">退出登录</span>
          </button>
        </div>
      </aside>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">分享链接已生成</h3>
            <p className="text-sm text-slate-600 mb-4">
              该链接有效期为7天，不同角色打开链接时看到的数据范围不同。
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-700"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                复制
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
