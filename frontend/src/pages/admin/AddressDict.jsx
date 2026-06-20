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
import { addressDictAPI } from '../../api'

const { Option } = Select

export default function AddressDict() {
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
      const res = await addressDictAPI.list({
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
      await addressDictAPI.delete(id)
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
        await addressDictAPI.update(editingId, values)
        message.success('更新成功')
      } else {
        await addressDictAPI.create(values)
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
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
      width: 130,
      render: (val) => val || '-',
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
      <div className="page-title">地址字典管理</div>

      <div className="filter-form">
        <Space size="large">
          <Input
            placeholder="搜索名称/地址"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="选择区域"
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
            新增地址
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
        title={editingId ? '编辑地址' : '新增地址'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入地址名称" />
          </Form.Item>
          <Form.Item
            name="address"
            label="详细地址"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <Input.TextArea rows={2} placeholder="请输入详细地址" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="area" label="区域" style={{ flex: 1 }}>
              <Select placeholder="请选择区域" allowClear>
                {areas.map((a) => (
                  <Option key={a} value={a}>
                    {a}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="lng" label="经度" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="经度" />
            </Form.Item>
            <Form.Item name="lat" label="纬度" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="纬度" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="contact_person" label="联系人" style={{ flex: 1 }}>
              <Input placeholder="联系人姓名" />
            </Form.Item>
            <Form.Item name="contact_phone" label="联系电话" style={{ flex: 1 }}>
              <Input placeholder="联系电话" />
            </Form.Item>
          </div>
          <Form.Item name="is_active" label="状态" valuePropName="checked">
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
