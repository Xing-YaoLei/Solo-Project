import { Layout, Menu, Avatar, Dropdown, Button, Badge, List, Tabs, Empty, message } from 'antd';
import {
  FileTextOutlined,
  BarChartOutlined,
  DownloadOutlined,
  WarningOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import { notificationApi } from '../services/api';
import type { Notification } from '../types';
import { NotificationStatus, NotificationType } from '../types';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, token } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await notificationApi.unreadCount(user.id);
      setUnreadCount(res.count);
    } catch {
      // ignore
    }
  };

  const loadNotifications = async (status?: NotificationStatus) => {
    if (!user) return;
    try {
      const list = await notificationApi.list(user.id, status);
      setNotifications(list);
    } catch {
      setNotifications([]);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    if (!user) return;
    try {
      await notificationApi.markAsRead(id, user.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      loadNotifications();
    } catch {
      message.error('标记失败');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await notificationApi.markAllAsRead(user.id);
      setUnreadCount(0);
      message.success('已全部标记为已读');
      loadNotifications();
    } catch {
      message.error('操作失败');
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.CheckInInterruption:
        return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case NotificationType.Reminder:
        return <BellOutlined style={{ color: '#fa8c16' }} />;
      case NotificationType.CoachComment:
        return <FileTextOutlined style={{ color: '#1677ff' }} />;
      default:
        return <BellOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const notificationDropdown = {
    items: [
      {
        key: 'panel',
        label: (
          <div style={{ width: 360, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong>通知中心</strong>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={handleMarkAllAsRead}
              >
                全部已读
              </Button>
            </div>
            <Tabs
              defaultActiveKey="unread"
              size="small"
              onChange={(key) =>
                loadNotifications(
                  key === 'unread' ? NotificationStatus.Unread : undefined
                )
              }
              items={[
                {
                  key: 'unread',
                  label: `未读 (${unreadCount})`,
                  children: (
                    notifications.filter(n => n.status === NotificationStatus.Unread).length === 0 ? (
                      <Empty description="暂无新通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                      <List
                        size="small"
                        dataSource={notifications.filter(n => n.status === NotificationStatus.Unread)}
                        renderItem={(item) => (
                          <List.Item
                            key={item.id}
                            style={{ cursor: 'pointer', padding: '8px 0' }}
                            onClick={() => {
                              handleMarkAsRead(item.id);
                              if (item.relatedType === 'CheckInInterruption') {
                                navigate('/interruptions');
                              }
                            }}
                          >
                            <List.Item.Meta
                              avatar={getNotificationIcon(item.type)}
                              title={<span style={{ fontWeight: 500 }}>{item.title}</span>}
                              description={
                                <div>
                                  <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                                    {item.content.length > 60 ? item.content.slice(0, 60) + '...' : item.content}
                                  </div>
                                  <div style={{ color: '#aaa', fontSize: 11 }}>
                                    {dayjs(item.createdAt).format('MM-DD HH:mm')}
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )
                  )
                },
                {
                  key: 'all',
                  label: '全部',
                  children: (
                    notifications.length === 0 ? (
                      <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                      <List
                        size="small"
                        dataSource={notifications}
                        renderItem={(item) => (
                          <List.Item key={item.id} style={{ padding: '8px 0' }}>
                            <List.Item.Meta
                              avatar={getNotificationIcon(item.type)}
                              title={
                                <span style={{
                                  fontWeight: item.status === NotificationStatus.Unread ? 500 : 400,
                                  color: item.status === NotificationStatus.Unread ? '#000' : '#999'
                                }}>
                                  {item.title}
                                </span>
                              }
                              description={
                                <div>
                                  <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                                    {item.content.length > 60 ? item.content.slice(0, 60) + '...' : item.content}
                                  </div>
                                  <div style={{ color: '#aaa', fontSize: 11 }}>
                                    {dayjs(item.createdAt).format('MM-DD HH:mm')}
                                    {item.createdByName && ` · ${item.createdByName}`}
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )
                  )
                }
              ]}
            />
          </div>
        )
      }
    ]
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: `当前账号：${user?.userName || ''}`
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: () => {
          logout();
          navigate('/login');
        }
      }
    ]
  };

  const menuItems = [
    { key: '/records', icon: <FileTextOutlined />, label: '饮食记录' },
    { key: '/monthly-review', icon: <BarChartOutlined />, label: '月底复盘' },
    { key: '/export', icon: <DownloadOutlined />, label: '数据导出' },
    { key: '/interruptions', icon: <WarningOutlined />, label: '打卡中断' }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600
          }}
        >
          💪 健身饮食打卡
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="app-logo">健身私教饮食打卡排程台</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown
              menu={notificationDropdown}
              placement="bottomRight"
              trigger={['click']}
              onOpenChange={(open) => {
                if (open) loadNotifications(NotificationStatus.Unread);
              }}
            >
              <div style={{ cursor: 'pointer', padding: '0 8px' }}>
                <Badge count={unreadCount} size="small">
                  <BellOutlined style={{ fontSize: 18, color: '#333' }} />
                </Badge>
              </div>
            </Dropdown>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} src={user?.avatarUrl} />
                <span>{user?.userName}</span>
                <span style={{
                  fontSize: 11,
                  color: '#999',
                  background: '#f0f0f0',
                  padding: '2px 6px',
                  borderRadius: 4
                }}>
                  {user?.role === 2 ? '管理员' : user?.role === 1 ? '教练' : '学员'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
