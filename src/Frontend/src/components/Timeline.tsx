import React from 'react'
import { Timeline as AntTimeline, Tag, Avatar, Space } from 'antd'
import {
  PlusOutlined,
  SwapOutlined,
  EditOutlined,
  PaperClipOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  SwapOutlined as AdjustOutlined,
  EllipsisOutlined,
  SwapOutlined as UserSwitchOutlined,
} from '@ant-design/icons'
import type { TimelineEventDto } from '@/types'
import { formatTimelineEventType, formatDate } from '@/utils/format'

const iconMap: Record<string, React.ReactNode> = {
  plus: <PlusOutlined />,
  swap: <SwapOutlined />,
  edit: <EditOutlined />,
  'paper-clip': <PaperClipOutlined />,
  'user-add': <UserAddOutlined />,
  'user-switch': <UserSwitchOutlined />,
  'check-circle': <CheckCircleOutlined />,
  dollar: <DollarOutlined />,
  thunderbolt: <ThunderboltOutlined />,
  warning: <WarningOutlined />,
  'clock-circle': <ClockCircleOutlined />,
  adjust: <AdjustOutlined />,
  ellipsis: <EllipsisOutlined />,
}

interface TimelineProps {
  events: TimelineEventDto[]
  loading?: boolean
}

const Timeline: React.FC<TimelineProps> = ({ events, loading = false }) => {
  if (loading) {
    return <AntTimeline pending="加载中..." />
  }

  if (!events || events.length === 0) {
    return <AntTimeline pending="暂无记录" />
  }

  const items = events.map((event) => {
    const eventInfo = formatTimelineEventType(event.eventType)
    const color = eventInfo.color as 'blue' | 'green' | 'red' | 'grey' | 'cyan' | 'purple' | 'geekblue' | 'lime' | 'gold' | 'orange' | 'volcano' | 'magenta' | 'pink'
    const icon = iconMap[eventInfo.icon] || <EllipsisOutlined />

    return {
      color,
      dot: <Avatar size="small" style={{ backgroundColor: 'transparent' }} icon={icon} />,
      children: (
        <div style={{ paddingBottom: 12 }}>
          <Space size={8} wrap>
            <Tag color={color}>{eventInfo.text}</Tag>
            <strong>{event.title}</strong>
          </Space>
          {event.description && <div style={{ marginTop: 4, color: '#666' }}>{event.description}</div>}
          {(event.previousValue || event.newValue) && (
            <div style={{ marginTop: 4 }}>
              {event.previousValue && (
                <span style={{ color: '#999', textDecoration: 'line-through', marginRight: 8 }}>
                  {event.previousValue}
                </span>
              )}
              {event.newValue && <span style={{ color: '#1677ff', fontWeight: 500 }}>{event.newValue}</span>}
            </div>
          )}
          {event.notes && <div style={{ marginTop: 4, padding: '6px 8px', background: '#f5f5f5', borderRadius: 4 }}>{event.notes}</div>}
          {event.attachmentUrls && event.attachmentUrls.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <PaperClipOutlined style={{ color: '#999' }} />
              <span style={{ color: '#666', marginLeft: 4 }}>{event.attachmentUrls.length} 个附件</span>
            </div>
          )}
          <div style={{ marginTop: 6, color: '#999', fontSize: 12 }}>
            <Space size={8}>
              {event.actorName && <span>{event.actorName}</span>}
              <span>{formatDate(event.eventTime)}</span>
            </Space>
          </div>
        </div>
      ),
    }
  })

  return <AntTimeline items={items} />
}

export default Timeline
