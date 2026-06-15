import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Modal, Form, Input, Select, message, Card, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons'
import { studentsApi, authApi } from '../services'

export default function Students() {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [advisors, setAdvisors] = useState([])
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [keyword, setKeyword] = useState('')
  const [filters, setFilters] = useState({})

  useEffect(() => { loadData() }, [pagination.current, pagination.pageSize, filters, keyword])
  useEffect(() => { loadAdvisors() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await studentsApi.list({
        page: pagination.current,
        page_size: pagination.pageSize,
        keyword: keyword || undefined,
        ...filters,
      })
      setData(res.data.data)
      setPagination(p => ({ ...p, total: res.data.pagination.total }))
    } catch {}
    setLoading(false)
  }

  const loadAdvisors = async () => {
    try {
      const res = await authApi.listUsers('advisor')
      setAdvisors(res.data)
    } catch {}
  }

  const handleCreate = async () => {
    const vals = await form.validateFields()
    try {
      await studentsApi.create(vals)
      message.success('添加成功')
      setModal(false)
      form.resetFields()
      loadData()
    } catch {}
  }

  const handleEdit = async () => {
    const vals = await editForm.validateFields()
    try {
      await studentsApi.update(selected.id, vals)
      message.success('更新成功')
      setEditModal(false)
      loadData()
    } catch {}
  }

  const openEdit = (record) => {
    setSelected(record)
    editForm.setFieldsValue(record)
    setEditModal(true)
  }

  const columns = [
    { title: '学号', dataIndex: 'student_id', width: 130, sorter: (a, b) => a.student_id.localeCompare(b.student_id) },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '性别', dataIndex: 'gender', width: 70 },
    { title: '年级', dataIndex: 'grade', width: 90 },
    { title: '专业', dataIndex: 'major', width: 160 },
    { title: '班级', dataIndex: 'class_name', width: 100 },
    { title: '院系', dataIndex: 'department', width: 130 },
    { title: '导师', dataIndex: 'advisor_name', width: 100, render: v => v || <Tag color="warning">未分配</Tag> },
    { title: '联系电话', dataIndex: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', width: 180 },
    { title: '操作', width: 100, fixed: 'right', render: (_, r) => (
      <Button size="small" icon={<EditOutlined />} type="link" onClick={() => openEdit(r)}>编辑</Button>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="page-title" style={{ margin: 0 }}>学生名单</div>
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索姓名/学号"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="年级"
            allowClear
            style={{ width: 110 }}
            value={filters.grade || undefined}
            onChange={v => setFilters(f => ({ ...f, grade: v || '' }))}
            options={[...new Set(data.map(s => s.grade))].filter(Boolean).map(g => ({ label: g, value: g }))}
          />
          <Select
            placeholder="院系"
            allowClear
            style={{ width: 140 }}
            value={filters.department || undefined}
            onChange={v => setFilters(f => ({ ...f, department: v || '' }))}
            options={[...new Set(data.map(s => s.department))].filter(Boolean).map(d => ({ label: d, value: d }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal(true)}>添加学生</Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1400 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: t => `共 ${t} 名学生`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total }),
          }}
        />
      </Card>

      <Modal title="添加学生" open={modal} onCancel={() => setModal(false)} onOk={handleCreate} width={600}>
        <Form form={form} layout="vertical">
          <Space wrap>
            <Form.Item name="student_id" label="学号" rules={[{ required: true }]} style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
            <Form.Item name="name" label="姓名" rules={[{ required: true }]} style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
            <Form.Item name="gender" label="性别" style={{ width: 'calc(50% - 8px)' }}>
              <Select options={[{ label: '男', value: '男' }, { label: '女', value: '女' }]} />
            </Form.Item>
            <Form.Item name="advisor_id" label="导师" style={{ width: 'calc(50% - 8px)' }}>
              <Select
                showSearch
                optionFilterProp="label"
                options={advisors.map(a => ({ label: a.full_name, value: a.id }))}
                placeholder="选择导师"
                allowClear
              />
            </Form.Item>
            <Form.Item name="grade" label="年级" style={{ width: 'calc(50% - 8px)' }}>
              <Select options={['2022级', '2023级', '2024级', '2025级'].map(g => ({ label: g, value: g }))} />
            </Form.Item>
            <Form.Item name="major" label="专业" style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
            <Form.Item name="class_name" label="班级" style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
            <Form.Item name="department" label="院系" style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="联系电话" style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="邮箱" style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal title="编辑学生信息" open={editModal} onCancel={() => setEditModal(false)} onOk={handleEdit} width={600}>
        <Form form={editForm} layout="vertical">
          <Space wrap>
            <Form.Item name="name" label="姓名" rules={[{ required: true }]} style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
            <Form.Item name="gender" label="性别" style={{ width: 'calc(50% - 8px)' }}>
              <Select options={[{ label: '男', value: '男' }, { label: '女', value: '女' }]} />
            </Form.Item>
            <Form.Item name="advisor_id" label="导师" style={{ width: 'calc(50% - 8px)' }}>
              <Select
                showSearch
                optionFilterProp="label"
                options={advisors.map(a => ({ label: a.full_name, value: a.id }))}
                allowClear
              />
            </Form.Item>
            <Form.Item name="grade" label="年级" style={{ width: 'calc(50% - 8px)' }}>
              <Select options={['2022级', '2023级', '2024级', '2025级'].map(g => ({ label: g, value: g }))} />
            </Form.Item>
            <Form.Item name="major" label="专业" style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
            <Form.Item name="class_name" label="班级" style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
            <Form.Item name="department" label="院系" style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="联系电话" style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="邮箱" style={{ width: 'calc(50% - 8px)' }}>
              <Input />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}
