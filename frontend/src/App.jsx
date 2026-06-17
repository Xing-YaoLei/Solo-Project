import React, { useState, useEffect } from 'react'
import { Layout, Menu, App as AntApp } from 'antd'
import {
  DashboardOutlined,
  LineChartOutlined,
  ToolOutlined,
  PictureOutlined,
  SettingOutlined,
  FileExcelOutlined,
} from '@ant-design/icons'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import SalesTrend from './pages/SalesTrend.jsx'
import RectificationList from './pages/RectificationList.jsx'
import DisplayPhotos from './pages/DisplayPhotos.jsx'
import ThresholdConfig from './pages/ThresholdConfig.jsx'
import DownloadCenter from './pages/DownloadCenter.jsx'

const { Header, Sider, Content } = Layout

const MENU_ITEMS = [
  { key: '/', label: '促销陈列漏斗看板', icon: <DashboardOutlined /> },
  { key: '/sales-trend', label: '销售变化走势', icon: <LineChartOutlined /> },
  { key: '/rectifications', label: '整改记录管理', icon: <ToolOutlined /> },
  { key: '/photos', label: '陈列照片保存', icon: <PictureOutlined /> },
  { key: '/thresholds', label: '预警阈值配置', icon: <SettingOutlined /> },
  { key: '/download', label: '报表下载中心', icon: <FileExcelOutlined /> },
]

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = AntApp.useApp()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    message.config({ top: 80, duration: 3 })
  }, [message])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={220}
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            borderBottom: '1px solid #f0f0f0',
            fontWeight: 700,
            fontSize: collapsed ? 14 : 16,
            color: '#1677ff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          💊 {collapsed ? '促销报表' : '药店连锁促销陈列报表'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
          style={{ border: 0, paddingTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
            {MENU_ITEMS.find((m) => m.key === location.pathname)?.label || '系统'}
          </div>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </div>
        </Header>
        <Content style={{ background: '#f0f2f5' }}>
          <div className="page-container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sales-trend" element={<SalesTrend />} />
              <Route path="/rectifications" element={<RectificationList />} />
              <Route path="/photos" element={<DisplayPhotos />} />
              <Route path="/thresholds" element={<ThresholdConfig />} />
              <Route path="/download" element={<DownloadCenter />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
