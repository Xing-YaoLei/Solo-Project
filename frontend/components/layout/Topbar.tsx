"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useApp } from "@/lib/context/AppContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ReminderBadge } from "@/components/ui/ReminderBadge";
import { USER_ROLE_LABELS } from "@/lib/constants";

export function Topbar() {
  const { user, logout } = useAuth();
  const { unreadRemindersCount, reminders, markAllRemindersAsRead } = useApp();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const latestReminders = reminders
    .filter((r) => !r.isRead)
    .slice(0, 5);

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="搜索任务、项目..."
                className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <ReminderBadge count={unreadRemindersCount} />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">通知</h3>
                  {unreadRemindersCount > 0 && (
                    <button
                      className="text-xs text-primary-600 hover:underline"
                      onClick={markAllRemindersAsRead}
                    >
                      全部已读
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {latestReminders.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      暂无新通知
                    </div>
                  ) : (
                    latestReminders.map((reminder) => (
                      <Link
                        key={reminder.id}
                        href={`/reminders`}
                        className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        onClick={() => setShowNotifications(false)}
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {reminder.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {reminder.description}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-gray-200">
                  <Link
                    href="/reminders"
                    className="text-sm text-primary-600 hover:underline"
                    onClick={() => setShowNotifications(false)}
                  >
                    查看全部
                  </Link>
                </div>
              </div>
            )}
          </div>

          {user && (
            <div className="relative">
              <button
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <Avatar src={user.avatar} fallback={user.name} size="sm" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {USER_ROLE_LABELS[user.role]}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <User className="h-4 w-4" />
                      个人中心
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-danger-600"
                    >
                      <LogOut className="h-4 w-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
