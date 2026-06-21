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
import { appealsAPI, addressDictAPI, ordersAPI } from '../../api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

const statusOptions = [
  { value: 'pending', label: '待处理', color: 'orange' },
  { value: 'processing', label: '处理中', color: 'blue' },
  { value: 'resolved', label: '已解决', color: 'green' },
  { value: 'rejected', label: '已驳回', color: 'default' },
]

const appealTypes = [
  { value: 'late', label: '超时申诉' },
  { value: 'damage', label: '损坏申诉' },
  { value: 'lost', label: '丢失申诉' },
  { value: 'wrong', label: '错送申诉' },
]

const appellantTypes = [
  { value: 'customer', label: '客户' },
  { value: 'rider', label: '骑手' },
  { value: 'merchant', label: '商家' },
]

export default function AppealList() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [areas, setAreas] = useState([])
  const [handlers, setHandlers] = useState([])
  const [form] = Form.useForm()
  const [createVisible, setCreateVisible] = useState(false)
  const [createForm] = Form.useForm()

  useEffect(() => {
    loadAreas()
    loadHandlers()
    loadAppeals()
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

  const loadAppeals = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params = {
        page,
        page_size: pageSize,
        status: values.status,
        appeal_type: values.appeal_type,
        appellant: values.appellant,
        keyword: values.keyword,
        area: values.area,
        handler: values.handler,
      }
      if (values.dateRange && values.dateRange.length === 2) {
        params.start_date = values.dateRange[0].format('YYYY-MM-DD')
        params.end_date = values.dateRange[1].format('YYYY-MM-DD')
      }
      const res = await appealsAPI.list(params)
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
    loadAppeals()
  }

  const handleReset = () => {
    form.resetFields()
    setPage(1)
    loadAppeals()
  }

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      await appealsAPI.create(values)
      message.success('创建成功')
      setCreateVisible(false)
      createForm.resetFields()
      loadAppeals()
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

  const getAppealTypeLabel = (type) => {
    const opt = appealTypes.find((o) => o.value === type)
    return opt?.label || type
  }

  const getAppellantLabel = (type) => {
    const opt = appellantTypes.find((o) => o.value === type)
    return opt?.label || type
  }

  const columns = [
    {
      title: '申诉ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '关联订单',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160,
    },
    {
      title: '申诉类型',
      dataIndex: 'appeal_type',
      key: 'appeal_type',
      width: 100,
      render: (val) => getAppealTypeLabel(val),
    },
    {
      title: '申诉方',
      dataIndex: 'appellant',
      key: 'appellant',
      width: 80,
      render: (val) => getAppellantLabel(val),
    },
    {
      title: '申诉人',
      dataIndex: 'appellant_name',
      key: 'appellant_name',
      width: 100,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '索赔金额',
      dataIndex: 'claim_amount',
      key: 'claim_amount',
      width: 100,
      render: (val) => `¥${val}`,
    },
    {
      title: '赔付金额',
      dataIndex: 'compensate_amount',
      key: 'compensate_amount',
      width: 100,
      render: (val) => (val > 0 ? `¥${val}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>,
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 120,
      render: (val) => val ? <Tag color="blue">{val}</Tag> : '-',
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
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate({ to: `/appeals/${record.id}` })}>
          处理
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="page-title">申诉管理</div>

      <div className="filter-form">
        <Form form={form} layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="订单号/描述" style={{ width: 200 }} allowClear />
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
              <Form.Item name="appeal_type" label="类型">
                <Select placeholder="全部类型" style={{ width: 140 }} allowClear>
                  {appealTypes.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="appellant" label="申诉方">
                <Select placeholder="全部" style={{ width: 120 }} allowClear>
                  {appellantTypes.map((opt) => (
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
            新建申诉
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
          onClick: () => navigate({ to: `/appeals/${record.id}` }),
          style: { cursor: 'pointer' },
        })}
      />

      <Modal
        title="新建申诉"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="order_id"
            label="关联订单ID"
            rules={[{ required: true, message: '请输入订单ID' }]}
          >
            <Input placeholder="请输入订单ID" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="appeal_type"
                label="申诉类型"
                rules={[{ required: true, message: '请选择申诉类型' }]}
              >
                <Select placeholder="请选择">
                  {appealTypes.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="appellant"
                label="申诉方"
                rules={[{ required: true, message: '请选择申诉方' }]}
              >
                <Select placeholder="请选择">
                  {appellantTypes.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="appellant_name"
                label="申诉人姓名"
                rules={[{ required: true, message: '请输入申诉人姓名' }]}
              >
                <Input placeholder="请输入申诉人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="appellant_phone" label="申诉人电话">
                <Input placeholder="请输入申诉人电话" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="claim_amount" label="索赔金额(元)">
                <Input type="number" placeholder="请输入索赔金额" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="申诉描述"
            rules={[{ required: true, message: '请输入申诉描述' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细描述申诉内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
