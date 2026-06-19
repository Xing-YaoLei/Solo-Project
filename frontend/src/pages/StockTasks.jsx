import { useState, useEffect } from 'react'
import {
  Row, Col, Input, Select, Table, Tag, Modal, Form, Input as AntInput,
  Button, Space, message,
} from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { stockTaskApi } from '../api'

const statusMap = {
  open: { color: 'error', label: '待处理' },
  in_progress: { color: 'processing', label: '处理中' },
  resolved: { color: 'success', label: '已解决' },
  closed: { color: 'default', label: '已关闭' },
}

const priorityMap = {
  normal: { color: 'default', label: '普通' },
  high: { color: 'warning', label: '高' },
  urgent: { color: 'error', label: '紧急' },
}

export default function StockTasks() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [summary, setSummary] = useState(null)
  const [filters, setFilters] = useState({ status: undefined, priority: undefined })
  const [editModal, setEditModal] = useState({ open: false, record: null })
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadSummary()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.priority) params.priority = filters.priority
    const result = await stockTaskApi.list(params).catch(() => ({ items: [] }))
    setData(result?.items || [])
    setLoading(false)
  }

  const loadSummary = async () => {
    const s = await stockTaskApi.getSummary().catch(() => null)
    setSummary(s)
  }

  const handleEdit = (record) => {
    setEditModal({ open: true, record })
    form.setFieldsValue({
      status: record.status,
      notes: record.notes,
      resolution: record.resolution,
      assigned_to: record.assigned_to,
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await stockTaskApi.update(editModal.record.id, values)
      message.success('更新成功')
      setEditModal({ open: false, record: null })
      loadData()
      loadSummary()
    } catch (e) {
      console.error(e)
    }
  }

  const columns = [
    { title: '任务编号', dataIndex: 'task_no', key: 'task_no', width: 130 },
    { title: '关联工单', dataIndex: 'order_no', key: 'order_no', width: 140 },
    { title: '配件编码', dataIndex: 'part_code', key: 'part_code', width: 110 },
    { title: '配件名称', dataIndex: 'part_name', key: 'part_name' },
    { title: '数量', dataIndex: 'required_qty', key: 'required_qty', width: 70 },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (v) => <Tag color={priorityMap[v]?.color}>{priorityMap[v]?.label}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.label}</Tag>,
    },
    { title: '负责人', dataIndex: 'assigned_to', key: 'assigned_to', width: 90 },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: '处理结论',
      dataIndex: 'resolution',
      key: 'resolution',
      ellipsis: true,
      render: (v) => v || <span style={{ color: '#999' }}>待处理</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <a onClick={() => handleEdit(record)}>处理</a>
          {record.repair_order_id && (
            <a onClick={() => navigate(`/repair-order/${record.repair_order_id}`)}>
              查看工单
            </a>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">配件缺货任务</div>
        <div className="page-subtitle">
          管理配件缺货备注任务，复盘时可查看处理结论
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="label">总任务数</div>
            <div className="value">{summary?.total || '--'}</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="label">待处理</div>
            <div className="value" style={{ color: '#ff4d4f' }}>{summary?.open || 0}</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="label">处理中</div>
            <div className="value" style={{ color: '#1677ff' }}>{summary?.in_progress || 0}</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="label">已解决</div>
            <div className="value" style={{ color: '#52c41a' }}>{summary?.resolved || 0}</div>
          </div>
        </Col>
      </Row>

      <div className="filter-bar">
        <Select
          placeholder="任务状态"
          style={{ width: 150 }}
          allowClear
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
          options={[
            { value: 'open', label: '待处理' },
            { value: 'in_progress', label: '处理中' },
            { value: 'resolved', label: '已解决' },
            { value: 'closed', label: '已关闭' },
          ]}
        />
        <Select
          placeholder="优先级"
          style={{ width: 150 }}
          allowClear
          value={filters.priority}
          onChange={(v) => setFilters({ ...filters, priority: v })}
          options={[
            { value: 'normal', label: '普通' },
            { value: 'high', label: '高' },
            { value: 'urgent', label: '紧急' },
          ]}
        />
      </div>

      <div className="chart-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          size="small"
        />
      </div>

      <Modal
        title="处理缺货任务"
        open={editModal.open}
        onCancel={() => setEditModal({ open: false, record: null })}
        onOk={handleSubmit}
        okText="保存"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="任务编号">
            <div>{editModal.record?.task_no}</div>
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'open', label: '待处理' },
                { value: 'in_progress', label: '处理中' },
                { value: 'resolved', label: '已解决' },
                { value: 'closed', label: '已关闭' },
              ]}
            />
          </Form.Item>
          <Form.Item name="assigned_to" label="负责人">
            <Input placeholder="请输入负责人" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <AntInput.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
          <Form.Item name="resolution" label="处理结论">
            <AntInput.TextArea rows={3} placeholder="请输入处理结论，复盘时可查看" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
