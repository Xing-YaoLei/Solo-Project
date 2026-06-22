'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Button, Badge, App as AntdApp } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore } from '@/store/notifications';
import { NotificationPanel } from './NotificationPanel';
import { roleLabels } from '@/lib/utils/permissions';

const { Header } = Layout;

export const HeaderComponent: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationsStore();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { message } = AntdApp.useApp();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleLogout = async () => {
    try {
      await logout();
      message.success('已退出登录');
    } catch {
      message.error('退出登录失败');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      disabled: true,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账号设置',
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Header className="flex items-center justify-between px-6 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          欢迎回来，{user?.fullName || '用户'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: 20 }} />}
            onClick={() => setNotificationOpen(true)}
            className="relative"
          />
        </Badge>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div className="flex items-center cursor-pointer hover:bg-gray-50 rounded px-3 py-1 hover:text-gray-700 transition-colors space-x-2">
            <Avatar size="small" icon={<UserOutlined />} />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{user?.fullName || '用户'}</span>
              <span className="text-xs text-gray-500">
                {user?.role ? roleLabels[user.role] : ''}
              </span>
            </div>
          </div>
        </Dropdown>

        <NotificationPanel
          open={notificationOpen}
          onClose={() => setNotificationOpen(false)}
        />
      </div>
    </Header>
  );
};

export default HeaderComponent;
