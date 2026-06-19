'use client';

import { Layout, Menu, theme, Badge, Avatar, Dropdown, Space } from 'antd';
import {
  CalendarOutlined,
  FileTextOutlined,
  DashboardOutlined,
  MoneyCollectOutlined,
  AlertOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  FileDoneOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { notificationApi } from '@/services/api';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/performances', icon: <CalendarOutlined />, label: '演出排期' },
  { key: '/tasks', icon: <FileTextOutlined />, label: '任务分派台' },
  { key: '/records', icon: <DashboardOutlined />, label: '记录页' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
  { key: '/sponsors', icon: <MoneyCollectOutlined />, label: '赞助管理' },
  { key: '/tickets', icon: <FileDoneOutlined />, label: '票种规则' },
  { key: '/verifications', icon: <BarChartOutlined />, label: '核销记录' },
  { key: '/disputes', icon: <AlertOutlined />, label: '退票争议' },
  { key: '/system-logs', icon: <HistoryOutlined />, label: '系统日志' },
  { key: '/review', icon: <BarChartOutlined />, label: '月底复盘' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [selectedKey, setSelectedKey] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const current = menuItems.find(item => pathname.startsWith(item.key));
    if (current) {
      setSelectedKey(current.key);
    }
    fetchUnreadCount();
  }, [pathname]);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount(1);
      setUnreadCount(res.data as any);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMenuClick = (e: any) => {
    router.push(e.key);
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          景区运营管理台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: 16 }}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          height: 64,
        }}>
          <Space size={24}>
            <Badge count={unreadCount} size="small">
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>管理员</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 'calc(100vh - 96px)',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
