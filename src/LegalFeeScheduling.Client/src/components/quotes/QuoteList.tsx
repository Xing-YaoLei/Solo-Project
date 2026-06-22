import { useState } from 'react'
import { Table, Button, Tag, Input, Select, DatePicker, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { Quote, QuoteStatus, Channel, QuoteFilter } from '../../types'

const { RangePicker } = DatePicker

interface QuoteListProps {
  data?: Quote[]
  loading?: boolean
  onView?: (quote: Quote) => void
  onCreate?: () => void
  onFilterChange?: (filter: QuoteFilter) => void
  showCreateButton?: boolean
  hideStatusFilter?: boolean
  hideChannelFilter?: boolean
  hideOwnerFilter?: boolean
  hideDateFilter?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
}

export const statusColors: Record<QuoteStatus, string> = {
  [QuoteStatus.Draft]: 'default',
  [QuoteStatus.PendingReview]: 'gold',
  [QuoteStatus.NeedMoreInfo]: 'orange',
  [QuoteStatus.Escalated]: 'magenta',
  [QuoteStatus.Approved]: 'blue',
  [QuoteStatus.Processing]: 'cyan',
  [QuoteStatus.AmountException]: 'red',
  [QuoteStatus.Completed]: 'green',
  [QuoteStatus.Closed]: 'gray',
}

export const statusLabels: Record<QuoteStatus, string> = {
  [QuoteStatus.Draft]: '草稿',
  [QuoteStatus.PendingReview]: '待审核',
  [QuoteStatus.NeedMoreInfo]: '补资料',
  [QuoteStatus.Escalated]: '升级复核',
  [QuoteStatus.Approved]: '审核通过',
  [QuoteStatus.Processing]: '处理中',
  [QuoteStatus.AmountException]: '金额异常',
  [QuoteStatus.Completed]: '已完成',
  [QuoteStatus.Closed]: '已关闭',
}

export const channelLabels: Record<Channel, string> = {
  [Channel.Online]: '线上',
  [Channel.Offline]: '线下',
  [Channel.Partner]: '合作伙伴',
  [Channel.Referral]: '转介绍',
}

function QuoteList({
  data = [],
  loading = false,
  onView,
  onCreate,
  onFilterChange,
  showCreateButton = true,
  hideStatusFilter = false,
  hideChannelFilter = false,
  hideOwnerFilter = false,
  hideDateFilter = false,
  pagination,
}: QuoteListProps) {
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<QuoteStatus | undefined>()
  const [channel, setChannel] = useState<Channel | undefined>()
  const [owner, setOwner] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  const handleSearch = () => {
    onFilterChange?.({
      keyword,
      status,
      channel,
      owner,
      startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      page: 1,
      pageSize: 10,
    })
  }

  const columns: ColumnsType<Quote> = [
    {
      title: '报价单号',
      dataIndex: 'quoteNo',
      key: 'quoteNo',
      width: 160,
      fixed: 'left',
    },
    {
      title: '客户名称',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 140,
    },
    {
      title: '案件名称',
      dataIndex: 'caseName',
      key: 'caseName',
      width: 160,
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 100,
      render: (v: Channel) => channelLabels[v],
    },
    {
      title: '报价金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    {
      title: '最终金额',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 120,
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: QuoteStatus) => (
        <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>
      ),
    },
    {
      title: '责任人',
      dataIndex: 'owner',
      key: 'owner',
      width: 100,
      render: (v?: string) => v || '-',
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => onView?.(record)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索报价单号/客户/案件"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 240 }}
            prefix={<SearchOutlined />}
          />
          {!hideStatusFilter && (
            <Select
              placeholder="选择状态"
              value={status}
              onChange={setStatus}
              allowClear
              style={{ width: 140 }}
              options={Object.entries(statusLabels).map(([value, label]) => ({
                value: value as QuoteStatus,
                label,
              }))}
            />
          )}
          {!hideChannelFilter && (
            <Select
              placeholder="选择渠道"
              value={channel}
              onChange={setChannel}
              allowClear
              style={{ width: 140 }}
              options={Object.entries(channelLabels).map(([value, label]) => ({
                value: value as Channel,
                label,
              }))}
            />
          )}
          {!hideOwnerFilter && (
            <Input
              placeholder="责任人"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              style={{ width: 140 }}
              allowClear
            />
          )}
          {!hideDateFilter && (
            <RangePicker
              value={dateRange as any}
              onChange={(dates) =>
                setDateRange(dates as [Dayjs | null, Dayjs | null] | null)
              }
            />
          )}
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
          {showCreateButton && onCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
              新建报价
            </Button>
          )}
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        scroll={{ x: 1300 }}
        onRow={(record) => ({
          onClick: () => onView?.(record),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}

export default QuoteList
