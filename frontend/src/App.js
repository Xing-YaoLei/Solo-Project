import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Breadcrumb,
} from 'antd';
import {
  DashboardOutlined,
  LineChartOutlined,
  SwapOutlined,
  AlertOutlined,
  AuditOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CoffeeOutlined,
} from '@ant-design/icons';

import Dashboard from './pages/Dashboard';
import RiskChart from './pages/RiskChart';
import DataConsistency from './pages/DataConsistency';
import FaultsTasks from './pages/FaultsTasks';
import Inspection from './pages/Inspection';

const { Sider, Header, Content } = Layout;

const App = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">仪表盘</Link>,
    },
    {
      key: '/risk-chart',
      icon: <LineChartOutlined />,
      label: <Link to="/risk-chart">清洁风险监测图</Link>,
    },
    {
      key: 'data-consistency',
      icon: <SwapOutlined />,
      label: '数据一致性',
      children: [
        {
          key: '/data-consistency',
          icon: <DatabaseOutlined />,
          label: <Link to="/data-consistency">数据一致性总览</Link>,
        },
      ],
    },
    {
      key: 'faults-tasks',
      icon: <FileTextOutlined />,
      label: '故障与整改',
      children: [
        {
          key: '/faults-tasks',
          icon: <ReloadOutlined />,
          label: <Link to="/faults-tasks">故障任务联动</Link>,
        },
      ],
    },
    {
      key: 'inspection',
      icon: <AuditOutlined />,
      label: '巡检复盘',
      children: [
        {
          key: '/inspection',
          icon: <AuditOutlined />,
          label: <Link to="/inspection">巡检复盘总览</Link>,
        },
      ],
    },
  ];

  const getBreadcrumbItems = () => {
    const pathname = location.pathname;
    const items = [{ title: <Link to="/">首页</Link> }];

    if (pathname.startsWith('/data-consistency')) {
      items.push({ title: '数据一致性' });
      items.push({ title: '库存/POS/会员多版本对比' });
    } else if (pathname.startsWith('/faults-tasks')) {
      items.push({ title: '故障与整改' });
      items.push({ title: '故障总览与整改联动' });
    } else if (pathname.startsWith('/inspection')) {
      items.push({ title: '巡检复盘' });
      items.push({ title: '合格率改善分析' });
    } else if (pathname === '/risk-chart') {
      items.push({ title: '清洁风险监测图' });
    } else if (pathname === '/') {
      items.push({ title: '仪表盘' });
    }

    return items;
  };

  const getSelectedKeys = () => {
    const pathname = location.pathname;
    if (pathname.startsWith('/data-consistency')) return ['/data-consistency'];
    if (pathname.startsWith('/faults-tasks')) return ['/faults-tasks'];
    if (pathname.startsWith('/inspection')) return ['/inspection'];
    return [pathname];
  };

  const getOpenKeys = () => {
    const pathname = location.pathname;
    const keys = [];
    if (pathname.startsWith('/data-consistency')) keys.push('data-consistency');
    if (pathname.startsWith('/faults-tasks')) keys.push('faults-tasks');
    if (pathname.startsWith('/inspection')) keys.push('inspection');
    return keys;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
        width={240}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: collapsed ? 16 : 18,
            background: 'rgba(255,255,255,0.08)',
            margin: 16,
            borderRadius: 8,
          }}
        >
          <CoffeeOutlined style={{ fontSize: 24, marginRight: collapsed ? 0 : 8 }} />
          {!collapsed && <span>咖啡设备监测</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Breadcrumb items={getBreadcrumbItems()} />
        </Header>

        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#f5f5f5',
            borderRadius: 8,
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/risk-chart" element={<RiskChart />} />
            <Route path="/data-consistency" element={<DataConsistency />} />
            <Route path="/data-consistency/:sub" element={<DataConsistency />} />
            <Route path="/faults-tasks" element={<FaultsTasks />} />
            <Route path="/faults-tasks/:sub" element={<FaultsTasks />} />
            <Route path="/inspection" element={<Inspection />} />
            <Route path="/inspection/:sub" element={<Inspection />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
