import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Modal, Form, Input, Select, message, Card, InputNumber, Drawer, Timeline, Descriptions, Popover, Alert, Empty } from 'antd'
import { PlusOutlined, EditOutlined, HistoryOutlined, DiffOutlined } from '@ant-design/icons'
import { advisorsApi, authApi } from '../services'
import dayjs from 'dayjs'

export default function Advisors() {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [historyDrawer, setHistoryDrawer] = useState(false)
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [advisors, setAdvisors] = useState([])
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [filters, setFilters] = useState({})

  useEffect(() => { loadData() }, [pagination.current, pagination.pageSize, filters])
  useEffect(() => { loadAdvisors() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await advisorsApi.list({
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      })
      setData(res.data.data)
      setPagination(p => ({ ...p, total: res.data.pagination.total }))
    } catch {}
    setLoading(false)
  }

  const loadAdvisors = async () => {
    try {
      const [res1, res2] = await Promise.all([
        authApi.listUsers('advisor'),
        authApi.listUsers('teacher'),
      ])
      setAdvisors([...res1.data, ...res2.data])
    } catch {}
  }

  const handleCreate = async () => {
    const vals = await form.validateFields()
    try {
      await advisorsApi.create(vals)
      message.success('创建成功')
      setModal(false)
      form.resetFields()
      loadData()
    } catch {}
  }

  const handleEdit = async () => {
    const vals = await editForm.validateFields()
    try {
      await advisorsApi.update(selected.id, vals)
      message.success('名额已更新，变更历史已保留')
      setEditModal(false)
      loadData()
    } catch {}
  }

  const openEdit = (record) => {
    setSelected(record)
    editForm.setFieldsValue({
      max_quota: record.max_quota,
      current_assigned: record.current_assigned,
      department: record.department,
      reason: '',
    })
    setEditModal(true)
  }

  const viewHistory = async (record) => {
    setSelected(record)
    setHistoryDrawer(true)
    try {
      const res = await advisorsApi.history(record.id)
      setHistory(res.data)
    } catch { setHistory([]) }
  }

  const columns = [
    { title: '导师', dataIndex: 'advisor_name', width: 120 },
    { title: '学期', dataIndex: 'semester', width: 130 },
    { title: '院系', dataIndex: 'department', width: 130 },
    { title: '名额配置', width: 280, render: (_, r) => {
      const pct = r.max_quota ? Math.min(100, r.current_assigned / r.max_quota * 100) : 0
      const color = pct >= 100 ? '#ff4d4f' : pct >= 80 ? '#faad14' : '#52c41a'
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Tag color="blue">上限 {r.max_quota}</Tag>
            <Tag color="purple">已用 {r.current_assigned}</Tag>
            <Tag color={pct >= 100 ? 'error' : pct >= 80 ? 'warning' : 'success'}>
              剩余 {r.remaining_quota}
            </Tag>
          </Space>
          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
          </div>
        </Space>
      )
    } },
    { title: '使用率', width: 100, render: (_, r) => {
      const pct = r.max_quota ? Math.round(r.current_assigned / r.max_quota * 100) : 0
      return <span style={{ color: pct >= 100 ? '#ff4d4f' : pct >= 80 ? '#faad14' : '#52c41a', fontWeight: 600 }}>{pct}%</span>
    } },
    { title: '更新时间', dataIndex: 'updated_at', width: 160, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '操作', width: 180, fixed: 'right', render: (_, r) => (
      <Space size="small">
        <Popover
          content={
            <div style={{ maxWidth: 240 }}>
              <b>变更前后保留</b>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                修改名额时系统会自动记录 old_value→new_value、操作人、时间和原因
              </div>
            </div>
          }
          title={null}
        >
          <DiffOutlined style={{ color: '#8c8c8c', cursor: 'help' }} />
        </Popover>
        <Button size="small" icon={<HistoryOutlined />} onClick={() => viewHistory(r)}>历史</Button>
        <Button size="small" icon={<EditOutlined />} type="primary" onClick={() => openEdit(r)}>调整</Button>
      </Space>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="page-title" style={{ margin: 0 }}>
          导师名额管理
          <Tag color="blue" style={{ marginLeft: 8 }}>改动时保留前后值</Tag>
        </div>
        <Space>
          <Select
            placeholder="学期"
            allowClear
            style={{ width: 140 }}
            value={filters.semester || undefined}
            onChange={v => setFilters(f => ({ ...f, semester: v || '' }))}
            options={[...new Set(data.map(s => s.semester))].filter(Boolean).map(s => ({ label: s, value: s }))}
          />
          <Select
            placeholder="院系"
            allowClear
            style={{ width: 140 }}
            value={filters.department || undefined}
            onChange={v => setFilters(f => ({ ...f, department: v || '' }))}
            options={[...new Set(data.map(s => s.department))].filter(Boolean).map(d => ({ label: d, value: d }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal(true)}>新建名额</Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: t => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total }),
          }}
        />
      </Card>

      <Modal title="新建导师名额" open={modal} onCancel={() => setModal(false)} onOk={handleCreate}>
        <Form form={form} layout="vertical">
          <Form.Item name="advisor_id" label="选择导师" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={advisors.map(a => ({ label: `${a.full_name} (${a.department || ''})`, value: a.id }))}
            />
          </Form.Item>
          <Form.Item name="semester" label="学期" rules={[{ required: true }]}>
            <Select options={['2024-2025-1', '2024-2025-2', '2025-2026-1', '2025-2026-2'].map(s => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="department" label="院系">
            <Input />
          </Form.Item>
          <Space>
            <Form.Item name="max_quota" label="最大名额" rules={[{ required: true }]} style={{ width: 200 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="current_assigned" label="已分配数" initialValue={0} style={{ width: 200 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal title={`调整名额 - ${selected?.advisor_name || ''}`} open={editModal} onCancel={() => setEditModal(false)} onOk={handleEdit}>
        <Alert
          type="info"
          showIcon
          message="系统会自动记录变更的前后值、操作人、原因和时间"
          style={{ marginBottom: 16 }}
        />
        <Form form={editForm} layout="vertical">
          <Space>
            <Form.Item name="max_quota" label="最大名额" rules={[{ required: true }]} style={{ width: 200 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="current_assigned" label="已分配数" style={{ width: 200 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="department" label="院系">
            <Input />
          </Form.Item>
          <Form.Item name="reason" label="调整原因" rules={[{ required: true, message: '请填写调整原因' }]}>
            <Input.TextArea rows={3} placeholder="说明调整名额的原因（如：新增课题、学生需求变化等）" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`变更历史 - ${selected?.advisor_name || ''} (${selected?.semester || ''})`}
        placement="right"
        width={520}
        open={historyDrawer}
        onClose={() => setHistoryDrawer(false)}
      >
        {selected && (
          <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="当前最大名额">{selected.max_quota}</Descriptions.Item>
            <Descriptions.Item label="当前已分配">{selected.current_assigned}</Descriptions.Item>
          </Descriptions>
        )}
        <div className="page-title" style={{ fontSize: 14 }}>名额变更轨迹（所有历史修改均保留）</div>
        {history.length === 0 ? (
          <Empty description="暂无变更记录" />
        ) : (
          <Timeline
            items={history.map(h => ({
              color: h.new_value > h.old_value ? 'green' : h.new_value < h.old_value ? 'red' : 'blue',
              children: (
                <Card size="small" style={{ marginBottom: 8 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Tag color={h.new_value > h.old_value ? 'green' : 'red'}>
                        <DiffOutlined /> {h.old_value} → {h.new_value}
                      </Tag>
                      <span style={{ marginLeft: 8 }}>
                        <b>{h.changed_by_name || '系统'}</b>
                      </span>
                      <span style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 8 }}>
                        {dayjs(h.changed_at).format('YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </div>
                    {h.reason && (
                      <div style={{ fontSize: 12, background: '#fafafa', padding: '6px 10px', borderRadius: 4 }}>
                        <b>调整原因:</b> {h.reason}
                      </div>
                    )}
                  </Space>
                </Card>
              ),
            }))}
          />
        )}
      </Drawer>
    </div>
  )
}
