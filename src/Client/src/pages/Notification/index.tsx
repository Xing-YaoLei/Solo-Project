import { useState, useEffect } from 'react'
import {
  Card,
  List,
  Button,
  Space,
  Select,
  Tag,
  message,
  Spin,
  Empty,
  Popconfirm
} from 'antd'
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  ReadOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import {
  getNotificationList,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '@/services/notification'
import type {
  NotificationRecord,
  NotificationQuery,
  NotificationType
} from '@/types'
import { NotificationTypeText } from '@/types'
import { formatDateTime } from '@/utils/date'

const { Option } = Select

function Notification() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<NotificationRecord[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })
  const [queryParams, setQueryParams] = useState<NotificationQuery>({})

  useEffect(() => {
    fetchData()
  }, [pagination.current, pagination.pageSize, queryParams])

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await getNotificationList({
        ...queryParams,
        pageIndex: pagination.current,
        pageSize: pagination.pageSize
      })
      setData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      message.error('获取通知列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id)
      message.success('已标记为已读')
      fetchData()
    } catch (error) {
      message.error('操作失败')
      console.error(error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      message.success('全部标记为已读')
      fetchData()
    } catch (error) {
      message.error('操作失败')
      console.error(error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
      console.error(error)
    }
  }

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 0:
        return <BellOutlined style={{ color: '#1890ff' }} />
      case 1:
        return <FileTextOutlined style={{ color: '#52c41a' }} />
      case 2:
        return <ClockCircleOutlined style={{ color: '#faad14' }} />
      case 3:
        return <CheckCircleOutlined style={{ color: '#722ed1' }} />
      case 4:
        return <WarningOutlined style={{ color: '#f5222d' }} />
      default:
        return <BellOutlined style={{ color: '#1890ff' }} />
    }
  }

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 0:
        return 'blue'
      case 1:
        return 'green'
      case 2:
        return 'orange'
      case 3:
        return 'purple'
      case 4:
        return 'red'
      default:
        return 'default'
    }
  }

  const unreadCount = data.filter(item => !item.isRead).length

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space wrap>
            <Select
              placeholder="通知类型"
              style={{ width: 150 }}
              allowClear
              value={queryParams.type}
              onChange={(value) => {
                setQueryParams({ ...queryParams, type: value })
                setPagination({ current: 1, pageSize: 20 })
              }}
            >
              {Object.entries(NotificationTypeText).map(([key, text]) => (
                <Option key={key} value={Number(key)}>{text}</Option>
              ))}
            </Select>
            <Select
              placeholder="阅读状态"
              style={{ width: 120 }}
              allowClear
              value={queryParams.isRead}
              onChange={(value) => {
                setQueryParams({ ...queryParams, isRead: value })
                setPagination({ current: 1, pageSize: 20 })
              }}
            >
              <Option value={false}>未读</Option>
              <Option value={true}>已读</Option>
            </Select>
          </Space>
          <Space>
            <span style={{ color: '#999' }}>
              共 {total} 条，未读 {unreadCount} 条
            </span>
            <Button icon={<ReadOutlined />} onClick={handleMarkAllAsRead}>
              全部已读
            </Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          {data.length > 0 ? (
            <List
              dataSource={data}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => {
                  setPagination({ current: page, pageSize })
                }
              }}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '16px',
                    backgroundColor: item.isRead ? 'transparent' : '#f0f5ff',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    border: '1px solid #f0f0f0'
                  }}
                  actions={[
                    !item.isRead && (
                      <Button
                        type="link"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => handleMarkAsRead(item.id)}
                      >
                        标记已读
                      </Button>
                    ),
                    <Popconfirm
                      title="确定删除该通知吗？"
                      onConfirm={() => handleDelete(item.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px'
                        }}
                      >
                        {getTypeIcon(item.type)}
                      </div>
                    }
                    title={
                      <Space>
                        <span style={{ fontWeight: item.isRead ? 'normal' : 'bold' }}>
                          {item.title}
                        </span>
                        <Tag color={getTypeColor(item.type)}>
                          {NotificationTypeText[item.type]}
                        </Tag>
                        {!item.isRead && (
                          <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ color: '#666', marginBottom: '4px' }}>
                          {item.content}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          <Space>
                            {item.siteName && <span>工地：{item.siteName}</span>}
                            <span>{formatDateTime(item.createdAt)}</span>
                          </Space>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无通知" style={{ padding: '60px 0' }} />
          )}
        </Spin>
      </Card>
    </div>
  )
}

export default Notification
