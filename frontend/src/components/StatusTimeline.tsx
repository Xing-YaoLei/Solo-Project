import React from 'react'
import { Timeline, Empty } from 'antd'
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { StatusChangeLog } from '../types'
import StatusTag from './StatusTag'

interface StatusTimelineProps {
  logs: StatusChangeLog[]
  loading?: boolean
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ logs, loading }) => {
  if (loading) {
    return <div>加载中...</div>
  }

  if (!logs || logs.length === 0) {
    return <Empty description="暂无状态变更记录" />
  }

  return (
    <Timeline
      mode="left"
      items={logs.map((log) => ({
        color: log.newStatus === 'closed' || log.newStatus === 'reviewed' ? 'green' : 'blue',
        dot: log.oldStatus ? undefined : <ClockCircleOutlined style={{ color: '#52c41a' }} />,
        children: (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {log.oldStatus && <StatusTag status={log.oldStatus} />}
              {log.oldStatus && <span>→</span>}
              <StatusTag status={log.newStatus} />
            </div>
            {log.remark && <div style={{ color: '#666', marginBottom: 4 }}>备注：{log.remark}</div>}
            <div style={{ color: '#999', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined />
              <span>操作人ID: {log.changedBy}</span>
              <ClockCircleOutlined />
              <span>{dayjs(log.changedAt).format('YYYY-MM-DD HH:mm:ss')}</span>
            </div>
          </div>
        ),
      }))}
    />
  )
}

export default StatusTimeline
