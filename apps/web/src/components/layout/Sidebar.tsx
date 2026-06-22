'use client';

import React, { useMemo } from 'react';
import { Layout, Menu } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashboardOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
  OrderedListOutlined,
  AuditOutlined,
  AlertOutlined,
  BarChartOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { usePermission } from '@/lib/hooks/usePermission';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const permission = usePermission();

  const menuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [];

    if (permission.canViewTasks) {
      items.push({
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '任务分派台',
      });
    }

    if (permission.canViewEvidences) {
      items.push({
        key: '/evidences',
        icon: <FolderOpenOutlined />,
        label: '证据归档列表',
      });
    }

    if (permission.canViewChecklists) {
      items.push({
        key: '/checklists',
        icon: <OrderedListOutlined />,
        label: '检查清单',
      });
    }

    if (permission.canViewSamplings) {
      items.push({
        key: '/samplings',
        icon: <AuditOutlined />,
        label: '抽样记录',
      });
    }

    if (permission.canViewTemplates) {
      items.push({
        key: '/templates',
        icon: <MessageOutlined />,
        label: '通报模板',
      });
    }

    if (permission.canViewIssues) {
      items.push({
        key: '/issues',
        icon: <AlertOutlined />,
        label: '问题追踪',
      });
    }

    if (permission.canViewStatistics) {
      items.push({
        key: '/statistics',
        icon: <BarChartOutlined />,
        label: '统计分析',
      });
    }

    if (permission.canViewUnauthorized) {
      items.push({
        key: '/audit-log/unauthorized',
        icon: <SafetyCertificateOutlined />,
        label: '越权记录',
      });
    }

    if (permission.canManageUsers) {
      items.push({
        key: '/users',
        icon: <TeamOutlined />,
        label: '用户管理',
      });
    }

    if (permission.canViewAuditLogs) {
      items.push({
        key: '/audit-log',
        icon: <HistoryOutlined />,
        label: '操作日志',
      });
    }

    return items;
  }, [permission]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    router.push(key);
  };

  const getSelectedKeys = useMemo(() => {
    const path = pathname;
    const basePath = '/' + path.split('/')[1];
    return [basePath];
  }, [pathname]);

  return (
    <Sider
      width={240}
      theme="dark"
      className="h-screen sticky top-0 border-r border-gray-200"
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-700">
        <h1 className="text-white text-lg font-bold tracking-wide">
          审计管理系统
        </h1>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={getSelectedKeys}
        items={menuItems}
        onClick={handleMenuClick}
        className="border-r-0 pt-2"
      />
    </Sider>
  );
};

export default Sidebar;
