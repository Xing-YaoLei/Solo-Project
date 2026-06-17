import React, { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Tooltip,
  Badge,
  Row,
  Col,
  Statistic,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { orderApi, analysisApi } from '@/api'
import { useAppStore } from '@/store'
import type { MoveOutOrderListDto, MoveOutOrderQueryDto, MoveOutStatus } from '@/types'
import {
  formatMoveOutStatus,
  formatDateOnly,
  formatCurrency,
  moveOutStatusMap,
} from '@/utils/format'

const { RangePicker } = DatePicker
const { Option } = Select

const OrderList: React.FC = () => {
  const navigate = useNavigate()
  const { loading, setLoading } = useAppStore()
  const [form] = Form.useForm()
  const [data, setData] = useState<MoveOutOrderListDto[]>([])
  const [total, setTotal] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [stats, setStats] = useState<{
    totalOrders: number
    pendingOrders: number
    completedOrders: number
    averageDurationHours: number
  } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params: MoveOutOrderQueryDto = {
        pageNumber,
        pageSize,
        searchKeyword: values.searchKeyword,
        status: values.status,
        building: values.building,
        hasOverdueRent: values.hasOverdueRent,
      }
      if (values.moveOutDateRange && values.moveOutDateRange.length === 2) {
        params.moveOutDateFrom = values.moveOutDateRange[0].format('YYYY-MM-DD')
        params.moveOutDateTo = values.moveOutDateRange[1].format('YYYY-MM-DD')
      }
      const result = await orderApi.getList(params)
      setData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      console.error('获取退租单列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [form, pageNumber, pageSize, setLoading])

  const fetchStats = useCallback(async () => {
    try {
      const result = await analysisApi.getOrderStats()
      setStats(result)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [fetchData, fetchStats])

  const handleSearch = () => {
    setPageNumber(1)
    fetchData()
  }

  const handleReset = () => {
    form.resetFields()
    setPageNumber(1)
    setTimeout(fetchData, 0)
  }

  const handleExport = async () => {
    try {
      const values = form.getFieldsValue()
      const params: MoveOutOrderQueryDto = {
        searchKeyword: values.searchKeyword,
        status: values.status,
        building: values.building,
        hasOverdueRent: values.hasOverdueRent,
      }
      if (values.moveOutDateRange && values.moveOutDateRange.length === 2) {
        params.moveOutDateFrom = values.moveOutDateRange[0].format('YYYY-MM-DD')
        params.moveOutDateTo = values.moveOutDateRange[1].format('YYYY-MM-DD')
      }
      await orderApi.exportOrders(params)
    } catch (error) {
      console.error('导出失败:', error)
    }
  }

  const columns: ColumnsType<MoveOutOrderListDto> = [
    {
      title: '退租单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      fixed: 'left' as const,
      render: (text: string, record) => (
        <a onClick={() => navigate(`/desktop/orders/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '房屋信息',
      key: 'apartment',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.building}</div>
          <div style={{ color: '#666', fontSize: 12 }}>{record.apartmentNumber}</div>
        </div>
      ),
    },
    {
      title: '租客信息',
      key: 'tenant',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.tenantName}</div>
          <div style={{ color: '#666', fontSize: 12 }}>{record.tenantPhone}</div>
        </div>
      ),
    },
    {
      title: '计划退租日期',
      dataIndex: 'moveOutDate',
      key: 'moveOutDate',
      width: 120,
      render: (date: string) => formatDateOnly(date),
      sorter: true,
    },
    {
      title: '实际退租日期',
      dataIndex: 'actualMoveOutDate',
      key: 'actualMoveOutDate',
      width: 120,
      render: (date: string | null) => formatDateOnly(date),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: MoveOutStatus) => {
        const info = formatMoveOutStatus(status)
        return <Tag color={info.color as 'blue' | 'green' | 'red' | 'orange' | 'cyan' | 'purple' | 'default'}>{info.text}</Tag>
      },
    },
    {
      title: '处理人',
      dataIndex: 'assignedHandlerName',
      key: 'assignedHandlerName',
      width: 100,
      render: (name: string | null) => name || '-',
    },
    {
      title: '待办任务',
      dataIndex: 'pendingTodos',
      key: 'pendingTodos',
      width: 90,
      align: 'center' as const,
      render: (count: number) => count > 0 ? <Badge count={count} /> : <span style={{ color: '#999' }}>0</span>,
    },
    {
      title: '租金逾期',
      dataIndex: 'hasOverdueRent',
      key: 'hasOverdueRent',
      width: 90,
      align: 'center' as const,
      render: (hasOverdue: boolean) =>
        hasOverdue ? (
          <Tooltip title="存在租金逾期">
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          </Tooltip>
        ) : (
          <span style={{ color: '#999' }}>无</span>
        ),
    },
    {
      title: '扣款金额',
      dataIndex: 'totalDeduction',
      key: 'totalDeduction',
      width: 110,
      render: (value: number | null) => formatCurrency(value),
    },
    {
      title: '最终退款',
      dataIndex: 'finalRefund',
      key: 'finalRefund',
      width: 110,
      render: (value: number | null) => formatCurrency(value),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => formatDateOnly(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/desktop/orders/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ]

  const statusOptions = Object.entries(moveOutStatusMap).map(([value, info]) => ({
    value: Number(value),
    label: info.text,
  }))

  return (
    <div>
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="退租单总数" value={stats.totalOrders} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="待处理" value={stats.pendingOrders} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已完成" value={stats.completedOrders} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="平均处理时长"
                value={stats.averageDurationHours}
                precision={1}
                suffix="小时"
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item name="searchKeyword" label="关键词">
            <Input placeholder="单号/租客/房屋" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 140 }}>
              {statusOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="building" label="楼栋">
            <Input placeholder="楼栋" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="hasOverdueRent" label="租金逾期">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
          <Form.Item name="moveOutDateRange" label="退租日期">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pageNumber,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, size) => {
              setPageNumber(page)
              setPageSize(size)
            },
          }}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  )
}

export default OrderList
