import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Form,
  Modal,
  message,
  Rate,
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons'
import { ridersAPI, addressDictAPI } from '../../api'

const { Option } = Select

const levelOptions = [
  { value: 'junior', label: '初级' },
  { value: 'normal', label: '中级' },
  { value: 'senior', label: '高级' },
]

const statusOptions = [
  { value: 'online', label: '在线', color: 'green' },
  { value: 'offline', label: '离线', color: 'default' },
  { value: 'busy', label: '忙碌', color: 'orange' },
  { value: 'rest', label: '休息', color: 'blue' },
]

export default function Riders() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [area, setArea] = useState(undefined)
  const [areas, setAreas] = useState([])
  const [status, setStatus] = useState(undefined)
  const [level, setLevel] = useState(undefined)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadAreas()
  }, [page, pageSize])

  const loadAreas = async () => {
    try {
      const res = await addressDictAPI.getAreas()
      setAreas(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await ridersAPI.list({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
        area: area,
        status: status,
        level: level,
      })
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
    loadData()
  }

  const handleReset = () => {
    setKeyword('')
    setArea(undefined)
    setStatus(undefined)
    setLevel(undefined)
    setPage(1)
    loadData()
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await ridersAPI.update(editingId, values)
        message.success('更新成功')
      } else {
        await ridersAPI.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusColor = (s) => {
    const opt = statusOptions.find((o) => o.value === s)
    return opt?.color || 'default'
  }

  const getStatusLabel = (s) => {
    const opt = statusOptions.find((o) => o.value === s)
    return opt?.label || s
  }

  const getLevelLabel = (l) => {
    const opt = levelOptions.find((o) => o.value === l)
    return opt?.label || l
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (val) => getLevelLabel(val),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (val) => <Tag color={getStatusColor(val)}>{getStatusLabel(val)}</Tag>,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      render: (val) => <Rate disabled defaultValue={val} allowHalf />,
    },
    {
      title: '完成订单',
      dataIndex: 'total_orders',
      key: 'total_orders',
      width: 100,
      render: (val) => `${val} 单`,
    },
    {
      title: '拒单数',
      dataIndex: 'reject_count',
      key: 'reject_count',
      width: 90,
      render: (val) => (val > 0 ? <span style={{ color: '#f5222d' }}>{val}次</span> : '0次'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="page-title">骑手管理</div>

      <div className="filter-form">
        <Space size="large">
          <Input
            placeholder="搜索姓名/手机号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="区域"
            value={area}
            onChange={setArea}
            style={{ width: 130 }}
            allowClear
          >
            {areas.map((a) => (
              <Option key={a} value={a}>
                {a}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="状态"
            value={status}
            onChange={setStatus}
            style={{ width: 120 }}
            allowClear
          >
            {statusOptions.map((s) => (
              <Option key={s.value} value={s.value}>
                {s.label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="等级"
            value={level}
            onChange={setLevel}
            style={{ width: 120 }}
            allowClear
          >
            {levelOptions.map((l) => (
              <Option key={l.value} value={l.value}>
                {l.label}
              </Option>
            ))}
          </Select>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Space>
      </div>

      <div className="table-toolbar">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增骑手
          </Button>
          <span style={{ color: '#666' }}>共 {total} 条记录</span>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
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
        title={editingId ? '编辑骑手' : '新增骑手'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入骑手姓名" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="area" label="负责区域" style={{ flex: 1 }}>
              <Select placeholder="请选择区域" allowClear>
                {areas.map((a) => (
                  <Option key={a} value={a}>
                    {a}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="level" label="等级" style={{ flex: 1 }}>
              <Select placeholder="请选择等级">
                {levelOptions.map((l) => (
                  <Option key={l.value} value={l.value}>
                    {l.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="status" label="状态">
            <Select>
              {statusOptions.map((s) => (
                <Option key={s.value} value={s.value}>
                  {s.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
