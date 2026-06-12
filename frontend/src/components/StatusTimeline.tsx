import { Timeline, Tag } from 'antd'
import { StatusLog } from '../types'
import dayjs from 'dayjs'

interface StatusTimelineProps {
  logs: StatusLog[]
  loading?: boolean
}

export default function StatusTimeline({ logs, loading }: StatusTimelineProps) {
  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>加载中...</div>
  }

  if (!logs || logs.length === 0) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>暂无状态变更记录</div>
  }

  return (
    <Timeline
      items={logs.map((log) => ({
        color: log.old_status ? 'blue' : 'green',
        children: (
          <div className="timeline-item-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {log.old_status && (
                <Tag color="default">{log.old_status}</Tag>
              )}
              {log.old_status && <span style={{ color: '#999' }}>→</span>}
              <Tag color="blue">{log.new_status}</Tag>
              {log.change_reason && (
                <span style={{ color: '#666', fontSize: 13 }}>
                  原因：{log.change_reason}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#999' }}>
              <span>操作人：{log.operator || '系统'}</span>
              <span>
                时间：{dayjs(log.operation_time || log.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            </div>
          </div>
        ),
      }))}
    />
  )
}
