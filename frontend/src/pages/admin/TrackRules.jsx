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
  Popconfirm,
  InputNumber,
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { trackRulesAPI, addressDictAPI } from '../../api'

const { Option } = Select

export default function TrackRules() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [area, setArea] = useState(undefined)
  const [areas, setAreas] = useState([])
  const [isActive, setIsActive] = useState(undefined)
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
      const res = await trackRulesAPI.list({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
        area: area,
        is_active: isActive,
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
    setIsActive(undefined)
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

  const handleDelete = async (id) => {
    try {
      await trackRulesAPI.delete(id)
      message.success('删除成功')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await trackRulesAPI.update(editingId, values)
        message.success('更新成功')
      } else {
        await trackRulesAPI.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '适用区域',
      dataIndex: 'area',
      key: 'area',
      width: 120,
      render: (val) => val || '全部区域',
    },
    {
      title: '最大距离(米)',
      dataIndex: 'max_distance',
      key: 'max_distance',
      width: 120,
      render: (val) => val.toLocaleString(),
    },
    {
      title: '预计时长(分钟)',
      dataIndex: 'expected_duration',
      key: 'expected_duration',
      width: 120,
    },
    {
      title: '预警时长(分钟)',
      dataIndex: 'warning_duration',
      key: 'warning_duration',
      width: 120,
      render: (val) => <span style={{ color: '#fa8c16' }}>{val}</span>,
    },
    {
      title: '上报间隔(秒)',
      dataIndex: 'track_interval',
      key: 'track_interval',
      width: 110,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (val) =>
        val ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-title">骑手轨迹规则</div>

      <div className="filter-form">
        <Space size="large">
          <Input
            placeholder="搜索规则名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="适用区域"
            value={area}
            onChange={setArea}
            style={{ width: 150 }}
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
            value={isActive}
            onChange={setIsActive}
            style={{ width: 120 }}
            allowClear
          >
            <Option value={true}>启用</Option>
            <Option value={false}>停用</Option>
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
            新增规则
          </Button>
          <span style={{ color: '#666' }}>共 {total} 条记录</span>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1100 }}
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
        title={editingId ? '编辑轨迹规则' : '新增轨迹规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item name="area" label="适用区域">
            <Select placeholder="不选则适用于全部区域" allowClear>
              {areas.map((a) => (
                <Option key={a} value={a}>
                  {a}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="max_distance"
              label="最大配送距离(米)"
              rules={[{ required: true, message: '请输入最大距离' }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="米" />
            </Form.Item>
            <Form.Item
              name="expected_duration"
              label="预计时长(分钟)"
              rules={[{ required: true, message: '请输入预计时长' }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={1} placeholder="分钟" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="warning_duration"
              label="预警时长(分钟)"
              rules={[{ required: true, message: '请输入预警时长' }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={1} placeholder="分钟" />
            </Form.Item>
            <Form.Item
              name="track_interval"
              label="轨迹上报间隔(秒)"
              rules={[{ required: true, message: '请输入上报间隔' }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={10} placeholder="秒" />
            </Form.Item>
          </div>
          <Form.Item name="is_active" label="是否启用" valuePropName="checked">
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
