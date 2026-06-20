import { useEffect, useState } from 'react'
import { Table, Spin, Tag, Button, Tooltip, Space, Badge, Select } from 'antd'
import { WarningOutlined, DownloadOutlined, InfoCircleOutlined, CameraOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { analyticsApi, CheckinRecord, PerformanceSchedule } from '../api/analytics'
import { exportApi } from '../api'
import { useAuthStore } from '../store/auth'

interface Props {
  schedules: PerformanceSchedule[]
  loading: boolean
  onOpenMetric: (code: string) => void
}

const CHANNEL_LABELS: Record<string, { label: string; color: string }> = {
  staff: { label: '人工检票', color: 'blue' },
  gate: { label: '闸机核验', color: 'green' },
  self_service: { label: '自助核销', color: 'purple' },
}

const ANOMALY_TYPES: Record<string, string> = {
  '重复核销': 'red',
  '无效签到码': 'orange',
  '人脸不匹配': 'magenta',
  '票种不符': 'gold',
  '超员入场': 'volcano',
}

const AnomalyCheckinTable = ({ schedules, loading, onOpenMetric }: Props) => {
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null)
  const [data, setData] = useState<CheckinRecord[]>([])
  const [tableLoading, setTableLoading] = useState(false)
  const hasRole = useAuthStore((state) => state.hasRole)

  useEffect(() => {
    if (schedules.length > 0 && !selectedSchedule) {
      setSelectedSchedule(schedules[0].id)
    }
  }, [schedules])

  const loadData = () => {
    setTableLoading(true)
    analyticsApi
      .getAnomalyCheckins(selectedSchedule || undefined)
      .then(setData)
      .finally(() => setTableLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [selectedSchedule])

  const columns = [
    {
      title: '核销时间',
      dataIndex: 'checkin_time',
      key: 'checkin_time',
      width: 160,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a: CheckinRecord, b: CheckinRecord) =>
        dayjs(a.checkin_time).valueOf() - dayjs(b.checkin_time).valueOf(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '异常类型',
      dataIndex: 'anomaly_type',
      key: 'anomaly_type',
      width: 130,
      render: (t: string) => (
        <Tag icon={<WarningOutlined />} color={ANOMALY_TYPES[t] || 'red'}>
          {t}
        </Tag>
      ),
      filters: Object.keys(ANOMALY_TYPES).map((k) => ({ text: k, value: k })),
      onFilter: (value: string, record: CheckinRecord) => record.anomaly_type === value,
    },
    {
      title: '异常描述',
      dataIndex: 'anomaly_description',
      key: 'anomaly_description',
      width: 200,
      ellipsis: true,
    },
    {
      title: '核销渠道',
      dataIndex: 'checkin_channel',
      key: 'checkin_channel',
      width: 110,
      render: (ch: string) => {
        const c = CHANNEL_LABELS[ch] || { label: ch, color: 'default' }
        return <Tag color={c.color}>{c.label}</Tag>
      },
    },
    {
      title: '摄像头核验',
      dataIndex: 'camera_verified',
      key: 'camera_verified',
      width: 110,
      render: (v: boolean, record: CheckinRecord) => (
        <Space>
          <Badge status={v ? 'success' : 'error'} text={v ? '已匹配' : '未核验'} />
          {record.camera_snapshot_id && (
            <Tooltip title={`快照ID: ${record.camera_snapshot_id}`}>
              <CameraOutlined style={{ color: '#1677ff', cursor: 'pointer' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '用户标识',
      dataIndex: 'user_identifier',
      key: 'user_identifier',
      width: 110,
    },
    {
      title: '订单ID',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 90,
    },
    {
      title: '操作员工',
      dataIndex: 'staff_name',
      key: 'staff_name',
      width: 100,
      render: (name: string, record: CheckinRecord) => (
        <span>
          {name}
          {record.staff_id && <span style={{ color: '#888', fontSize: 12 }}> ({record.staff_id})</span>}
        </span>
      ),
    },
  ]

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">
            核销异常记录
            <Tag color="red" style={{ marginLeft: 8 }}>
              {data.length} 条异常
            </Tag>
          </span>
          <Tooltip title="点击查看异常核销率指标定义">
            <Button
              type="text"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => onOpenMetric('anomaly_rate')}
              style={{ marginLeft: 4 }}
            />
          </Tooltip>
        </div>
        <Space>
          <Select
            style={{ width: 260 }}
            value={selectedSchedule}
            onChange={setSelectedSchedule}
            loading={loading}
            allowClear
            placeholder="选择演出（留空查看全部）"
            options={schedules.map((s) => ({
              label: `${s.performance_name} (${dayjs(s.performance_date).format('MM-DD HH:mm')})`,
              value: s.id,
            }))}
          />
          {hasRole('operation_manager', 'analyst') && (
            <Button
              type="primary"
              danger
              ghost
              icon={<DownloadOutlined />}
              onClick={() => exportApi.exportCheckinRecords(selectedSchedule || undefined)}
            >
              导出CSV
            </Button>
          )}
        </Space>
      </div>
      <Spin spinning={tableLoading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          size="small"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 6, showSizeChanger: false }}
        />
      </Spin>
    </div>
  )
}

export default AnomalyCheckinTable
