import { useEffect, useState } from 'react'
import { Table, Spin, Select, Tag, Button, Tooltip, Space } from 'antd'
import { DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { analyticsApi, Sponsor, PerformanceSchedule } from '../api/analytics'
import { exportApi } from '../api'
import { useAuthStore } from '../store/auth'

interface Props {
  schedules: PerformanceSchedule[]
  loading: boolean
  onOpenMetric: (code: string) => void
}

const SponsorListTable = ({ schedules, loading, onOpenMetric }: Props) => {
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null)
  const [data, setData] = useState<Sponsor[]>([])
  const [tableLoading, setTableLoading] = useState(false)
  const hasRole = useAuthStore((state) => state.hasRole)

  useEffect(() => {
    if (schedules.length > 0 && !selectedSchedule) {
      setSelectedSchedule(schedules[0].id)
    }
  }, [schedules])

  useEffect(() => {
    if (selectedSchedule) {
      setTableLoading(true)
      analyticsApi
        .getSponsors(selectedSchedule)
        .then(setData)
        .finally(() => setTableLoading(false))
    }
  }, [selectedSchedule])

  const levelColor = (level: string) => {
    if (level.includes('冠名')) return 'magenta'
    if (level.includes('联合')) return 'gold'
    if (level.includes('支持')) return 'blue'
    return 'default'
  }

  const typeColor = (type: string) => {
    if (type.includes('现金')) return 'red'
    if (type.includes('实物')) return 'orange'
    if (type.includes('技术')) return 'cyan'
    return 'default'
  }

  const columns = [
    {
      title: '赞助商名称',
      dataIndex: 'sponsor_name',
      key: 'sponsor_name',
      width: 180,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '赞助类型',
      dataIndex: 'sponsor_type',
      key: 'sponsor_type',
      width: 100,
      render: (t: string) => <Tag color={typeColor(t)}>{t}</Tag>,
    },
    {
      title: '赞助级别',
      dataIndex: 'sponsorship_level',
      key: 'sponsorship_level',
      width: 100,
      render: (t: string) => <Tag color={levelColor(t)}>{t}</Tag>,
    },
    {
      title: '赞助金额',
      dataIndex: 'contribution_amount',
      key: 'contribution_amount',
      width: 120,
      render: (val: string) => <span className="sponsor-amount">¥{Number(val).toLocaleString()}</span>,
      sorter: (a: Sponsor, b: Sponsor) => Number(a.contribution_amount) - Number(b.contribution_amount),
    },
    {
      title: '实物赞助',
      dataIndex: 'in_kind_items',
      key: 'in_kind_items',
      width: 180,
      ellipsis: true,
    },
    {
      title: '分配票数',
      dataIndex: 'ticket_allocation',
      key: 'ticket_allocation',
      width: 90,
      sorter: (a: Sponsor, b: Sponsor) => a.ticket_allocation - b.ticket_allocation,
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 120,
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
      width: 130,
    },
    {
      title: '合同编号',
      dataIndex: 'contract_no',
      key: 'contract_no',
      width: 130,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => (
        <Tag color={s === 'confirmed' ? 'green' : 'orange'}>
          {s === 'confirmed' ? '已确认' : s}
        </Tag>
      ),
    },
  ]

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">赞助清单明细</span>
          <Tooltip title="点击查看赞助金额指标定义">
            <Button
              type="text"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => onOpenMetric('sponsor_contribution')}
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
            options={schedules.map((s) => ({
              label: `${s.performance_name} (${dayjs(s.performance_date).format('MM-DD HH:mm')})`,
              value: s.id,
            }))}
          />
          {hasRole('operation_manager', 'analyst') && (
            <Button
              type="primary"
              ghost
              icon={<DownloadOutlined />}
              onClick={() => exportApi.exportSponsorList(selectedSchedule || undefined)}
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
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 5, showSizeChanger: false }}
        />
      </Spin>
    </div>
  )
}

export default SponsorListTable
