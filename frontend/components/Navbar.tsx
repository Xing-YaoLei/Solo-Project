'use client';

import { Bell, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  title: string;
  onMenuToggle?: () => void;
}

export function Navbar({ title, onMenuToggle }: NavbarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    onMenuToggle?.();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索..."
            className="w-64 rounded-lg border border-slate-300 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        <button className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
