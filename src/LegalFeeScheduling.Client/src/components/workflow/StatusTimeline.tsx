import { useState, useEffect } from 'react'
import { Timeline, message, Empty, Card, Tag } from 'antd'
import { workflowApi } from '../../api/workflow'
import { StatusHistory, QuoteStatus } from '../../types'
import { statusLabels, statusColors } from '../quotes/QuoteList'
import dayjs from 'dayjs'

interface StatusTimelineProps {
  quoteId?: string
}

function StatusTimeline({ quoteId }: StatusTimelineProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<StatusHistory[]>([])

  useEffect(() => {
    const loadData = async () => {
      if (!quoteId) return
      setLoading(true)
      try {
        const result = await workflowApi.getStatusHistory(quoteId)
        setData(result)
      } catch {
        message.error('加载状态历史失败')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [quoteId])

  if (!loading && data.length === 0) {
    return (
      <Card title="状态流转历史">
        <Empty description="暂无状态流转记录" />
      </Card>
    )
  }

  return (
    <Card title="状态流转历史" loading={loading}>
      <Timeline
        items={data.map((item, index) => ({
          color: statusColors[item.toStatus as QuoteStatus],
          dot: (
            <Tag
              color={statusColors[item.toStatus as QuoteStatus]}
              style={{ margin: 0 }}
            >
              {statusLabels[item.toStatus as QuoteStatus]}
            </Tag>
          ),
          children: (
            <div style={{ paddingBottom: index === data.length - 1 ? 0 : 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ color: '#999', marginRight: 8 }}>
                  {statusLabels[item.fromStatus as QuoteStatus]}
                </span>
                <span style={{ color: '#ccc' }}>→</span>
              </div>
              <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                <span>操作人：{item.changedBy || '-'}</span>
                <span style={{ margin: '0 8px', color: '#ddd' }}>|</span>
                <span>{dayjs(item.changedAt).format('YYYY-MM-DD HH:mm')}</span>
              </div>
              {item.remarks && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 12px',
                    background: '#fafafa',
                    borderRadius: 4,
                    fontSize: 13,
                    color: '#555',
                  }}
                >
                  <span style={{ color: '#999' }}>备注：</span>
                  {item.remarks}
                </div>
              )}
            </div>
          ),
        }))}
      />
    </Card>
  )
}

export default StatusTimeline
