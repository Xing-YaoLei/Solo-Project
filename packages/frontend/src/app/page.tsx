'use client';

import { useState, useCallback } from 'react';
import { Layout, Menu, Tabs, theme } from 'antd';
import type { MenuProps, TabsProps } from 'antd';
import {
  CalendarOutlined,
  WarningOutlined,
  RetweetOutlined,
  ExceptionOutlined,
  CheckCircleOutlined,
  BellOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import DispatchDesk from '@/components/DispatchDesk';
import ConflictManager from '@/components/ConflictManager';
import RescheduleManager from '@/components/RescheduleManager';
import ExceptionManager from '@/components/ExceptionManager';
import AttendanceManager from '@/components/AttendanceManager';
import ReminderManager from '@/components/ReminderManager';
import ExportCenter from '@/components/ExportCenter';

const { Header, Sider, Content } = Layout;

type MenuKey =
  | 'dispatch'
  | 'conflict'
  | 'reschedule'
  | 'exception'
  | 'attendance'
  | 'reminder'
  | 'export';

interface TabItem {
  key: MenuKey;
  label: string;
  closable: boolean;
}

const menuItems: MenuProps['items'] = [
  {
    key: 'dispatch',
    icon: <CalendarOutlined />,
    label: '分派台',
  },
  {
    key: 'conflict',
    icon: <WarningOutlined />,
    label: '冲突管理',
  },
  {
    key: 'reschedule',
    icon: <RetweetOutlined />,
    label: '改约审批',
  },
  {
    key: 'exception',
    icon: <ExceptionOutlined />,
    label: '异常单',
  },
  {
    key: 'attendance',
    icon: <CheckCircleOutlined />,
    label: '签到管理',
  },
  {
    key: 'reminder',
    icon: <BellOutlined />,
    label: '提醒管理',
  },
  {
    key: 'export',
    icon: <ExportOutlined />,
    label: '数据导出',
  },
];

const menuLabelMap: Record<MenuKey, string> = {
  dispatch: '分派台',
  conflict: '冲突管理',
  reschedule: '改约审批',
  exception: '异常单',
  attendance: '签到管理',
  reminder: '提醒管理',
  export: '数据导出',
};

function PlaceholderPage({ title }: { title: string }) {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <div
      style={{
        background: colorBgContainer,
        borderRadius: borderRadiusLG,
        padding: 24,
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: 16,
      }}
    >
      {title} - 功能开发中
    </div>
  );
}

function renderContent(key: MenuKey) {
  switch (key) {
    case 'dispatch':
      return <DispatchDesk />;
    case 'conflict':
      return <ConflictManager />;
    case 'reschedule':
      return <RescheduleManager />;
    case 'exception':
      return <ExceptionManager />;
    case 'attendance':
      return <AttendanceManager />;
    case 'reminder':
      return <ReminderManager />;
    case 'export':
      return <ExportCenter />;
    default:
      return null;
  }
}

export default function HomePage() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState<MenuKey>('dispatch');
  const [tabs, setTabs] = useState<TabItem[]>([
    { key: 'dispatch', label: '分派台', closable: false },
  ]);

  const handleMenuClick: MenuProps['onClick'] = useCallback(({ key }) => {
    const menuKey = key as MenuKey;
    setActiveKey(menuKey);
    setTabs((prev) => {
      if (prev.find((t) => t.key === menuKey)) {
        return prev;
      }
      return [...prev, { key: menuKey, label: menuLabelMap[menuKey], closable: true }];
    });
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveKey(key as MenuKey);
  }, []);

  const handleTabEdit: TabsProps['onEdit'] = useCallback(
    (targetKey, action) => {
      if (action === 'remove') {
        setTabs((prev) => {
          const newTabs = prev.filter((t) => t.key !== targetKey);
          if (activeKey === targetKey && newTabs.length > 0) {
            setActiveKey(newTabs[newTabs.length - 1].key);
          }
          return newTabs;
        });
      }
    },
    [activeKey]
  );

  const tabItems: TabsProps['items'] = tabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    closable: tab.closable,
    children: (
      <div style={{ marginTop: 16 }}>{renderContent(tab.key)}</div>
    ),
  }));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={220}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            color: '#fff',
            fontSize: collapsed ? 18 : 20,
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            letterSpacing: 1,
          }}
        >
          {collapsed ? '法' : '法庭管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>
            {menuLabelMap[activeKey]}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
            管理员
          </div>
        </Header>
        <Content style={{ margin: 0, padding: '16px 24px 24px' }}>
          <Tabs
            hideAdd
            type="editable-card"
            activeKey={activeKey}
            onChange={handleTabChange}
            onEdit={handleTabEdit}
            items={tabItems}
            tabBarStyle={{ marginBottom: 0 }}
          />
        </Content>
      </Layout>
    </Layout>
  );
}
