import { Timeline, Tag, Tooltip } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  UploadOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { StatusTimeline as StatusTimelineType } from '@/types'
import dayjs from 'dayjs'

interface StatusTimelineProps {
  data: StatusTimelineType[]
  loading?: boolean
}

const operationTypeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  create: { icon: <FileTextOutlined />, color: 'blue' },
  update: { icon: <EditOutlined />, color: 'blue' },
  delete: { icon: <DeleteOutlined />, color: 'red' },
  upload: { icon: <UploadOutlined />, color: 'green' },
  approve: { icon: <CheckCircleOutlined />, color: 'green' },
  reject: { icon: <CloseCircleOutlined />, color: 'red' },
  submit: { icon: <ClockCircleOutlined />, color: 'orange' },
  exception: { icon: <ExclamationCircleOutlined />, color: 'red' },
  complete: { icon: <CheckCircleOutlined />, color: 'green' },
  close: { icon: <CloseCircleOutlined />, color: 'default' },
}

const statusTextMap: Record<string, string> = {
  draft: '草稿',
  pending: '待处理',
  processing: '处理中',
  approved: '已通过',
  rejected: '已驳回',
  completed: '已完成',
  closed: '已关闭',
}

export default function StatusTimelineComponent({
  data,
  loading = false,
}: StatusTimelineProps) {
  const getColor = (operationType: string) => {
    return operationTypeConfig[operationType]?.color || 'blue'
  }

  const items = data.map((item) => {
    const color = getColor(item.operation_type)
    return {
      color,
      children: (
        <div className="py-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {statusTextMap[item.status] || item.status}
            </span>
            {item.previous_status && (
              <Tooltip title="变更前状态">
                <Tag color="default" className="text-xs">
                  ← {statusTextMap[item.previous_status] || item.previous_status}
                </Tag>
              </Tooltip>
            )}
            <Tag color={color} className="text-xs">
              {item.operation_type}
            </Tag>
          </div>
          {item.remark && (
            <div className="text-sm text-gray-600 mt-1">{item.remark}</div>
          )}
          <div className="text-xs text-gray-400 mt-1 flex justify-between">
            <span>
              操作人: {item.operator?.full_name || '系统'}
            </span>
            <span>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
          </div>
        </div>
      ),
    }
  })

  return (
    <div className="timeline-container">
      <Timeline
        mode="left"
        items={items}
        pending={loading ? '加载中...' : null}
      />
      {data.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-8">
          暂无状态变更记录
        </div>
      )}
    </div>
  )
}
