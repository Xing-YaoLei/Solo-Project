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
  Modal,
  message,
  Row,
  Col,
} from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import { ordersAPI, addressDictAPI, ridersAPI } from '../../api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

const statusOptions = [
  { value: 'pending', label: '待接单' },
  { value: 'accepted', label: '已接单' },
  { value: 'picked', label: '已取货' },
  { value: 'delivering', label: '配送中' },
  { value: 'delivered', label: '已送达' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'rejected', label: '已拒单' },
  { value: 'appealed', label: '申诉中' },
  { value: 'settled', label: '已结算' },
]

const statusColors = {
  pending: 'orange',
  accepted: 'blue',
  picked: 'cyan',
  delivering: 'geekblue',
  delivered: 'purple',
  completed: 'green',
  cancelled: 'default',
  rejected: 'red',
  appealed: 'magenta',
  settled: 'gold',
}

export default function OrderList() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [areas, setAreas] = useState([])
  const [riders, setRiders] = useState([])
  const [handlers, setHandlers] = useState([])
  const [form] = Form.useForm()
  const [createVisible, setCreateVisible] = useState(false)
  const [createForm] = Form.useForm()

  useEffect(() => {
    loadAreas()
    loadRiders()
    loadHandlers()
    loadOrders()
  }, [page, pageSize])

  const loadAreas = async () => {
    try {
      const res = await addressDictAPI.getAreas()
      setAreas(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadRiders = async () => {
    try {
      const res = await ridersAPI.getOptions()
      setRiders(res.data || [])
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

  const loadOrders = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params = {
        page,
        page_size: pageSize,
        keyword: values.keyword,
        status: values.status,
        area: values.area,
        handler: values.handler,
      }
      if (values.dateRange && values.dateRange.length === 2) {
        params.start_date = values.dateRange[0].format('YYYY-MM-DD')
        params.end_date = values.dateRange[1].format('YYYY-MM-DD')
      }
      const res = await ordersAPI.list(params)
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadOrders()
  }

  const handleReset = () => {
    form.resetFields()
    setPage(1)
    loadOrders()
  }

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      await ordersAPI.create(values)
      message.success('创建成功')
      setCreateVisible(false)
      createForm.resetFields()
      loadOrders()
    } catch (e) {
      console.error(e)
    }
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160,
      fixed: 'left',
    },
    {
      title: '取货地址',
      dataIndex: 'pickup_address',
      key: 'pickup_address',
      ellipsis: true,
      width: 200,
    },
    {
      title: '送货地址',
      dataIndex: 'delivery_address',
      key: 'delivery_address',
      ellipsis: true,
      width: 200,
    },
    {
      title: '区域',
      dataIndex: 'pickup_area',
      key: 'pickup_area',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '骑手',
      dataIndex: 'rider_name',
      key: 'rider_name',
      width: 100,
      render: (val) => val || '-',
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const opt = statusOptions.find((o) => o.value === status)
        return <Tag color={statusColors[status]}>{opt?.label || status}</Tag>
      },
    },
    {
      title: '金额',
      dataIndex: 'total_fee',
      key: 'total_fee',
      width: 100,
      render: (val) => `¥${val}`,
    },
    {
      title: '拒单数',
      dataIndex: 'reject_count',
      key: 'reject_count',
      width: 80,
      render: (val) => (val > 0 ? <Tag color="red">{val}次</Tag> : '-'),
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
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate({ to: `/orders/${record.id}` })}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="page-title">订单管理</div>

      <div className="filter-form">
        <Form form={form} layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="订单号/地址" style={{ width: 200 }} allowClear />
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
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
            新建订单
          </Button>
          <span style={{ color: '#666' }}>共 {total} 条记录</span>
        </Space>
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
        onRow={(record) => ({
          onClick: () => navigate({ to: `/orders/${record.id}` }),
          style: { cursor: 'pointer' },
        })}
      />

      <Modal
        title="新建订单"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pickup_address"
                label="取货地址"
                rules={[{ required: true, message: '请输入取货地址' }]}
              >
                <Input.TextArea rows={2} placeholder="请输入取货地址" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="delivery_address"
                label="送货地址"
                rules={[{ required: true, message: '请输入送货地址' }]}
              >
                <Input.TextArea rows={2} placeholder="请输入送货地址" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="pickup_area" label="取货区域">
                <Select placeholder="请选择区域" allowClear>
                  {areas.map((area) => (
                    <Option key={area} value={area}>
                      {area}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="delivery_area" label="送货区域">
                <Select placeholder="请选择区域" allowClear>
                  {areas.map((area) => (
                    <Option key={area} value={area}>
                      {area}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="distance" label="距离(米)">
                <Input type="number" placeholder="配送距离" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="goods_name" label="物品名称">
                <Input placeholder="物品名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="goods_weight" label="重量(kg)">
                <Input type="number" placeholder="物品重量" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="goods_amount" label="物品价值">
                <Input type="number" placeholder="物品价值" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_name" label="客户姓名">
                <Input placeholder="客户姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_phone" label="客户电话">
                <Input placeholder="客户电话" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
