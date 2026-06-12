import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  TagOutlined,
  DollarOutlined,
  ShoppingOutlined,
  CarOutlined,
  CrownOutlined,
  WarningOutlined,
  ExportOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = AntLayout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '排程看板' },
  { key: '/product-tags', icon: <TagOutlined />, label: '商品标签管理' },
  { key: '/settlement-sheets', icon: <DollarOutlined />, label: '结算单管理' },
  { key: '/group-batches', icon: <ShoppingOutlined />, label: '团购批次管理' },
  { key: '/arrival-lists', icon: <CarOutlined />, label: '到货清单管理' },
  { key: '/leader-tiers', icon: <CrownOutlined />, label: '团长等级管理' },
  { key: '/exception-orders', icon: <WarningOutlined />, label: '异常单处理' },
  { key: '/export-center', icon: <ExportOutlined />, label: '导出中心' },
];

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{ background: token.colorBgContainer }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
          {collapsed ? (
            <ShoppingOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          ) : (
            <span style={{ fontSize: 16, fontWeight: 600, color: token.colorPrimary, whiteSpace: 'nowrap' }}>冷链排程台</span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 'none' }}
        />
      </Sider>
      <AntLayout>
        <Header style={{ padding: '0 24px', background: token.colorBgContainer, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
          <span
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18, cursor: 'pointer', marginRight: 16 }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <span style={{ fontSize: 18, fontWeight: 600 }}>社区团购冷藏商品排程台</span>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: token.colorBgContainer, borderRadius: token.borderRadiusLG, minHeight: 280 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
