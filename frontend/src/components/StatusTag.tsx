import React from 'react'
import { Tag } from 'antd'

const statusColorMap: Record<string, string> = {
  'pending': 'default',
  'reviewed': 'success',
  'follow_up': 'warning',

  'not_started': 'default',
  'in_progress': 'processing',
  'submitted': 'blue',
  'closed': 'success',

  'open': 'error',
  'processing': 'warning',

  'approved': 'success',
  'rejected': 'error',

  'complete': 'success',
  'missing': 'error',
  'partial': 'warning',

  'completed': 'success',
  'failed': 'error',
  'cancelled': 'default',
}

const statusTextMap: Record<string, string> = {
  'pending': '待审核',
  'reviewed': '已审核',
  'follow_up': '需跟进',

  'not_started': '未启动',
  'in_progress': '进行中',
  'submitted': '已提交',
  'closed': '已关闭',

  'open': '待处理',
  'processing': '处理中',

  'approved': '已通过',
  'rejected': '已拒绝',

  'complete': '证据完整',
  'missing': '证据缺失',
  'partial': '部分证据',

  'completed': '已完成',
  'failed': '失败',
  'cancelled': '已取消',
}

interface StatusTagProps {
  status: string
}

const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const color = statusColorMap[status] || 'default'
  const text = statusTextMap[status] || status
  return <Tag color={color}>{text}</Tag>
}

export default StatusTag
