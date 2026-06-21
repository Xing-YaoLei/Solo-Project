import React from 'react'
import { Timeline, Tag, Empty } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const ApprovalTimeline = ({ nodes }) => {
  if (!nodes || nodes.length === 0) {
    return <Empty description="暂无审批节点" />
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'green'
      case 'rejected':
        return 'red'
      case 'pending':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return '已通过'
      case 'rejected':
        return '已拒绝'
      case 'pending':
        return '待审批'
      default:
        return status
    }
  }

  return (
    <div className="approval-timeline">
      <Timeline
        items={nodes
          .sort((a, b) => a.node_order - b.node_order)
          .map((node) => ({
            color: getStatusColor(node.status),
            dot:
              node.status === 'approved' ? (
                <CheckCircleOutlined style={{ fontSize: 16, color: '#52c41a' }} />
              ) : (
                <ClockCircleOutlined style={{ fontSize: 16 }} />
              ),
            children: (
              <div style={{ padding: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 15 }}>{node.node_name}</strong>
                  <Tag color={getStatusColor(node.status)}>{getStatusText(node.status)}</Tag>
                </div>
                {node.approver && (
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    审批人: {node.approver}
                    {node.approval_time && (
                      <span style={{ marginLeft: 16 }}>
                        {dayjs(node.approval_time).format('YYYY-MM-DD HH:mm')}
                      </span>
                    )}
                  </div>
                )}
                {node.approval_opinion && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 12px',
                      background: '#f5f5f5',
                      borderRadius: 4,
                      fontSize: 13,
                    }}
                  >
                    审批意见: {node.approval_opinion}
                  </div>
                )}
              </div>
            ),
          }))}
      />
    </div>
  )
}

export default ApprovalTimeline
