import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Form,
  message,
  Row,
  Col,
  Card,
  Statistic,
  Modal,
  Descriptions,
  List,
} from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined, CheckOutlined } from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import { settlementsAPI, addressDictAPI, ordersAPI } from '../../api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

const statusOptions = [
  { value: 'pending', label: '待确认', color: 'orange' },
  { value: 'confirmed', label: '已确认', color: 'green' },
  { value: 'paid', label: '已打款', color: 'blue' },
]

export default function SettlementList() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [areas, setAreas] = useState([])
  const [handlers, setHandlers] = useState([])
  const [form] = Form.useForm()
  const [summary, setSummary] = useState({})
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentSettlement, setCurrentSettlement] = useState(null)

  useEffect(() => {
    loadAreas()
    loadHandlers()
    loadSettlements()
    loadSummary()
  }, [page, pageSize])

  const loadAreas = async () => {
    try {
      const res = await addressDictAPI.getAreas()
      setAreas(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadHandlers = async () => {
    try {
      const res = await ordersAPI.getHandlers()
      setHandlers(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadSettlements = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params = {
        page,
        page_size: pageSize,
        status: values.status,
        keyword: values.keyword,
        area: values.area,
        handler: values.handler,
      }
      if (values.dateRange && values.dateRange.length === 2) {
        params.start_date = values.dateRange[0].format('YYYY-MM-DD')
        params.end_date = values.dateRange[1].format('YYYY-MM-DD')
      }
      const res = await settlementsAPI.list(params)
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async () => {
    try {
      const values = form.getFieldsValue()
      const params = {}
      if (values.dateRange && values.dateRange.length === 2) {
        params.start_date = values.dateRange[0].format('YYYY-MM-DD')
        params.end_date = values.dateRange[1].format('YYYY-MM-DD')
      }
      if (values.area) {
        params.area = values.area
      }
      if (values.handler) {
        params.handler = values.handler
      }
      const res = await settlementsAPI.getSummary(params)
      setSummary(res.data || {})
    } catch (e) {
      console.error(e)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadSettlements()
    loadSummary()
  }

  const handleReset = () => {
    form.resetFields()
    setPage(1)
    loadSettlements()
    loadSummary()
  }

  const handleViewDetail = (record) => {
    setCurrentSettlement(record)
    setDetailVisible(true)
  }

  const handleConfirm = async (id) => {
    try {
      await settlementsAPI.confirm(id, '管理员')
      message.success('确认成功')
      loadSettlements()
      loadSummary()
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusColor = (status) => {
    const opt = statusOptions.find((o) => o.value === status)
    return opt?.color || 'default'
  }

  const getStatusLabel = (status) => {
    const opt = statusOptions.find((o) => o.value === status)
    return opt?.label || status
  }

  const columns = [
    {
      title: '结算单号',
      dataIndex: 'settlement_no',
      key: 'settlement_no',
      width: 180,
    },
    {
      title: '关联订单',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160,
    },
    {
      title: '处理组',
      dataIndex: 'handlers',
      key: 'handlers',
      width: 140,
      render: (val) => {
        if (!val || val.length === 0) return '-'
        return (
          <Space wrap size={[4, 4]}>
            {val.slice(0, 2).map((h) => (
              <Tag key={h} color="blue" style={{ fontSize: 12 }}>
                {h}
              </Tag>
            ))}
            {val.length > 2 && <Tag color="default">+{val.length - 2}</Tag>}
          </Space>
        )
      },
    },
    {
      title: '订单总收入',
      dataIndex: 'total_income',
      key: 'total_income',
      width: 120,
      render: (val) => `¥${val}`,
    },
    {
      title: '骑手收入',
      dataIndex: 'rider_income',
      key: 'rider_income',
      width: 120,
      render: (val) => `¥${val}`,
    },
    {
      title: '平台收入',
      dataIndex: 'platform_income',
      key: 'platform_income',
      width: 120,
      render: (val) => `¥${val}`,
    },
    {
      title: '申诉赔付',
      dataIndex: 'appeal_compensation',
      key: 'appeal_compensation',
      width: 100,
      render: (val) => (val > 0 ? <span style={{ color: '#f5222d' }}>-¥{val}</span> : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>,
    },
    {
      title: '确认人',
      dataIndex: 'confirmed_by',
      key: 'confirmed_by',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            明细
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleConfirm(record.id)}
            >
              确认
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-title">结算管理</div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="结算单总数" value={summary.total_count || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="订单总收入"
              value={summary.total_income || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="骑手总收入"
              value={summary.total_rider_income || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="赔付总额"
              value={summary.total_compensation || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="filter-form">
        <Form form={form} layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="结算单/订单号" style={{ width: 200 }} allowClear />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="status" label="状态">
                <Select placeholder="全部状态" style={{ width: 140 }} allowClear>
                  {statusOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="area" label="区域">
                <Select placeholder="全部区域" style={{ width: 140 }} allowClear>
                  {areas.map((area) => (
                    <Option key={area} value={area}>
                      {area}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="handler" label="负责人">
                <Select placeholder="全部处理组" style={{ width: 160 }} allowClear>
                  {handlers.map((h) => (
                    <Option key={h} value={h}>
                      {h}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="dateRange" label="日期">
                <RangePicker style={{ width: 260 }} />
              </Form.Item>
            </Col>
            <Col>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>

      <div className="table-toolbar">
        <span style={{ color: '#666' }}>共 {total} 条记录</span>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />

      <Modal
        title="结算明细"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {currentSettlement && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="结算单号">
                {currentSettlement.settlement_no}
              </Descriptions.Item>
              <Descriptions.Item label="关联订单">
                {currentSettlement.order_no}
              </Descriptions.Item>
              <Descriptions.Item label="订单总收入">
                ¥{currentSettlement.total_income}
              </Descriptions.Item>
              <Descriptions.Item label="骑手收入">
                ¥{currentSettlement.rider_income}
              </Descriptions.Item>
              <Descriptions.Item label="平台收入">
                ¥{currentSettlement.platform_income}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(currentSettlement.status)}>
                  {getStatusLabel(currentSettlement.status)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <div className="detail-section-title">明细项</div>
            <List
              size="small"
              bordered
              dataSource={currentSettlement.detail || []}
              renderItem={(item) => (
                <List.Item>
                  <span>{item.name}</span>
                  <span style={{ color: item.amount >= 0 ? '#3f8600' : '#cf1322' }}>
                    {item.amount >= 0 ? '+' : ''}¥{item.amount}
                  </span>
                </List.Item>
              )}
            />

            {currentSettlement.remark && (
              <>
                <div className="detail-section-title" style={{ marginTop: 16 }}>
                  备注
                </div>
                <div style={{ color: '#666' }}>{currentSettlement.remark}</div>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
