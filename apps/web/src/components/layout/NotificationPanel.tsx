'use client';

import React, { useEffect } from 'react';
import { Drawer, List, Badge, Button, Empty, Tag, Typography, Space } from 'antd';
import { BellOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useNotificationsStore } from '@/store/notifications';
import { formatRelativeTime } from '@/lib/utils/format';
import { NotificationType } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

const { Text, Paragraph } = Typography;

const notificationTypeConfig: Record<string, { color: string; label: string }> = {
  [NotificationType.TASK_ASSIGNED]: { color: 'cyan', label: '任务分派' },
  [NotificationType.TASK_DUE_REMINDER]: { color: 'orange', label: '任务截止' },
  [NotificationType.EVIDENCE_REVIEW_NEEDED]: { color: 'purple', label: '证据复核' },
  [NotificationType.EVIDENCE_REVIEWED]: { color: 'green', label: '复核完成' },
  [NotificationType.SUPPLEMENT_REQUESTED]: { color: 'gold', label: '补件通知' },
  [NotificationType.SUPPLEMENT_COMPLETED]: { color: 'lime', label: '补件完成' },
  [NotificationType.CHECKLIST_DUE]: { color: 'magenta', label: '清单提醒' },
  [NotificationType.SYSTEM]: { color: 'blue', label: '系统' },
};

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ open, onClose }) => {
  const router = useRouter();
  const {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    isLoading,
    unreadCount,
    deleteNotification,
  } = useNotificationsStore();

  useEffect(() => {
    if (open) {
      fetchNotifications({ page: 1, pageSize: 20 });
    }
  }, [open, fetchNotifications]);

  const handleNotificationClick = async (notification: (typeof notifications)[0]) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose();
      return;
    }
    if (notification.taskId) {
      router.push(`/tasks/${notification.taskId}`);
      onClose();
      return;
    }
    if (notification.evidenceId) {
      router.push(`/evidences/${notification.evidenceId}`);
      onClose();
    }
  };

  const renderExtra = () => (
    <Space>
      {unreadCount > 0 && (
        <Button
          size="small"
          type="link"
          onClick={() => markAllAsRead()}
          icon={<CheckOutlined />}
        >
          全部已读
        </Button>
      )}
    </Space>
  );

  return (
    <Drawer
      title={
        <Space>
          <BellOutlined />
          <span>通知中心</span>
          {unreadCount > 0 && <Badge count={unreadCount} />}
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      extra={renderExtra()}
    >
      {notifications.length === 0 ? (
        <Empty description="暂无通知" />
      ) : (
        <List
          loading={isLoading}
          dataSource={notifications}
          renderItem={(item) => {
            const typeConfig = notificationTypeConfig[item.type] || { color: 'default', label: '通知' };
            return (
              <List.Item
                key={item.id}
                className={cn(
                  'cursor-pointer hover:bg-gray-50 px-2 rounded transition-colors',
                  !item.isRead && 'bg-blue-50',
                )}
                onClick={() => handleNotificationClick(item)}
                actions={[
                  <Button
                    key="delete"
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                    }}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge
                      dot={!item.isRead}
                      status={!item.isRead ? 'processing' : 'default'}
                      offset={[-2, 2]}
                    >
                      <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
                    </Badge>
                  }
                  title={
                    <div className="flex justify-between items-start">
                      <Text strong={!item.isRead} className="text-sm">
                        {item.title}
                      </Text>
                      <Text type="secondary" className="text-xs ml-2 whitespace-nowrap">
                        {formatRelativeTime(item.createdAt)}
                      </Text>
                    </div>
                  }
                  description={
                    <Paragraph ellipsis={{ rows: 2 }} className="text-xs text-gray-600 mb-0">
                      {item.content || '暂无详细内容'}
                    </Paragraph>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Drawer>
  );
};

export default NotificationPanel;
