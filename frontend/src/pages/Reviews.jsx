import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, Descriptions, Drawer, message, Timeline, Empty, InputNumber, Popconfirm, Card } from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, FileSearchOutlined } from '@ant-design/icons'
import { reviewsApi, scoresApi, studentsApi, auditApi } from '../services'
import dayjs from 'dayjs'

const statusMap = {
  pending: { label: '待处理', color: 'default' },
  under_review: { label: '复核中', color: 'processing' },
  materials_missing: { label: '材料缺失', color: 'warning' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
  closed: { label: '已关闭', color: 'default' },
}

export default function Reviews() {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [loading, setLoading] = useState(false)
  const [createModal, setCreateModal] = useState(false)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [filters, setFilters] = useState({ status: '' })

  useEffect(() => { loadData() }, [pagination.current, pagination.pageSize, filters])
  useEffect(() => { loadLookups() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await reviewsApi.list({
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      })
      setData(res.data.data)
      setPagination(p => ({ ...p, total: res.data.pagination.total }))
    } catch {}
    setLoading(false)
  }

  const loadLookups = async () => {
    try {
      const [sRes, scRes] = await Promise.all([
        studentsApi.list({ page_size: 200 }),
        scoresApi.list({ page_size: 200 }),
      ])
      setStudents(sRes.data.data)
      const courseMap = new Map()
      scRes.data.data.forEach(s => {
        if (s.course_id && !courseMap.has(s.course_id)) {
          courseMap.set(s.course_id, { id: s.course_id, name: s.course_name, code: s.course_code })
        }
      })
      setCourses([...courseMap.values()])
    } catch {}
  }

  const handleCreate = async () => {
    const vals = await form.validateFields()
    try {
      await reviewsApi.create({
        ...vals,
        deadline: vals.deadline ? vals.deadline.format('YYYY-MM-DD') : undefined,
      })
      message.success('申请创建成功')
      setCreateModal(false)
      form.resetFields()
      loadData()
    } catch {}
  }

  const handleEdit = async () => {
    const vals = await editForm.validateFields()
    try {
      await reviewsApi.update(selected.id, {
        ...vals,
      })
      message.success('更新成功')
      setEditModal(false)
      loadData()
    } catch {}
  }

  const viewDetail = async (record) => {
    setSelected(record)
    setDetailDrawer(true)
    try {
      const res = await auditApi.byReview(record.id)
      setAuditLogs(res.data)
    } catch { setAuditLogs([]) }
  }

  const openEdit = (record) => {
    setSelected(record)
    editForm.setFieldsValue({
      status: record.status,
      review_result: record.review_result,
      adjusted_score: record.adjusted_score,
    })
    setEditModal(true)
  }

  const columns = [
    { title: '编号', dataIndex: 'application_no', width: 140 },
    { title: '学生', dataIndex: 'student_name', width: 100, render: (v, r) => `${v} (${r.student_no})` },
    { title: '课程', dataIndex: 'course_name', width: 160 },
    { title: '分数', width: 140, render: (_, r) => (
      <Space>
        <Tag color={r.current_score < 60 ? 'error' : 'default'}>当前 {r.current_score}</Tag>
        {r.expected_score && <Tag color="blue">期望 {r.expected_score}</Tag>}
        {r.adjusted_score != null && <Tag color="green">调整 {r.adjusted_score}</Tag>}
      </Space>
    ) },
    { title: '状态', dataIndex: 'status', width: 110, render: s => <Tag color={statusMap[s]?.color}>{statusMap[s]?.label}</Tag> },
    { title: '审核人', dataIndex: 'reviewer_name', width: 90 },
    { title: '经办人', dataIndex: 'handler_name', width: 90 },
    { title: '申请时间', dataIndex: 'applied_at', width: 150, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '截止', dataIndex: 'deadline', width: 110, render: v => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { title: '操作', width: 160, fixed: 'right', render: (_, r) => (
      <Space size="small">
        <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r)}>详情</Button>
        <Button size="small" icon={<EditOutlined />} type="link" onClick={() => openEdit(r)}>处理</Button>
      </Space>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="page-title" style={{ margin: 0 }}>复核申请管理</div>
        <Space>
          <Select
            placeholder="按状态筛选"
            allowClear
            style={{ width: 140 }}
            value={filters.status || undefined}
            onChange={v => setFilters(f => ({ ...f, status: v || '' }))}
            options={Object.entries(statusMap).map(([v, { label }]) => ({ label, value: v }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>新建申请</Button>
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
            showTotal: t => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total }),
          }}
        />
      </Card>

      <Modal title="新建复核申请" open={createModal} onCancel={() => setCreateModal(false)} onOk={handleCreate} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="student_id" label="学生" rules={[{ required: true, message: '请选择学生' }]}>
            <Select
              showSearch
              placeholder="搜索并选择学生"
              optionFilterProp="label"
              options={students.map(s => ({ label: `${s.name} (${s.student_id}) - ${s.class_name}`, value: s.id }))}
            />
          </Form.Item>
          <Form.Item name="course_id" label="课程" rules={[{ required: true, message: '请选择课程' }]}>
            <Select
              showSearch
              placeholder="选择课程"
              optionFilterProp="label"
              options={courses.map(c => ({ label: `${c.name} (${c.code})`, value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="expected_score" label="期望成绩">
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item name="reason" label="申请理由" rules={[{ required: true, message: '请填写理由' }]}>
            <Input.TextArea rows={4} placeholder="详细说明成绩复核的理由..." />
          </Form.Item>
          <Form.Item name="deadline" label="截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={`处理复核申请 ${selected?.application_no || ''}`} open={editModal} onCancel={() => setEditModal(false)} onOk={handleEdit}>
        <Form form={editForm} layout="vertical">
          <Form.Item name="status" label="处理状态" rules={[{ required: true }]}>
            <Select options={Object.entries(statusMap).map(([v, { label }]) => ({ label, value: v }))} />
          </Form.Item>
          <Form.Item name="adjusted_score" label="调整后成绩（通过时填写）">
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item name="review_result" label="复核结果说明">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="复核申请详情" placement="right" width={560} open={detailDrawer} onClose={() => setDetailDrawer(false)}>
        {selected && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="申请编号" span={2}>{selected.application_no}</Descriptions.Item>
              <Descriptions.Item label="学生">{selected.student_name}</Descriptions.Item>
              <Descriptions.Item label="学号">{selected.student_no}</Descriptions.Item>
              <Descriptions.Item label="课程" span={2}>{selected.course_name} ({selected.course_code})</Descriptions.Item>
              <Descriptions.Item label="当前分数">{selected.current_score}</Descriptions.Item>
              <Descriptions.Item label="期望分数">{selected.expected_score || '-'}</Descriptions.Item>
              <Descriptions.Item label="调整分数" span={2}>{selected.adjusted_score != null ? selected.adjusted_score : '-'}</Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                <Tag color={statusMap[selected.status]?.color}>{statusMap[selected.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="审核人">{selected.reviewer_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="经办人">{selected.handler_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="申请时间" span={2}>{dayjs(selected.applied_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="截止日期" span={2}>{selected.deadline ? dayjs(selected.deadline).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
            </Descriptions>
            <Card size="small" title="申请理由" style={{ marginBottom: 16 }}>
              {selected.reason}
            </Card>
            {selected.review_result && (
              <Card size="small" title="复核结果" style={{ marginBottom: 16 }}>
                {selected.review_result}
              </Card>
            )}
            <Card size="small" title="审计轨迹" extra={<Tag>{auditLogs.length}条</Tag>}>
              {auditLogs.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
                <Timeline
                  items={auditLogs.map(l => ({
                    children: (
                      <div style={{ fontSize: 12 }}>
                        <div>
                          <Tag>{l.action}</Tag>
                          <b>{l.operator_name}</b>
                          <span style={{ color: '#8c8c8c', marginLeft: 6 }}>{dayjs(l.created_at).format('MM-DD HH:mm')}</span>
                        </div>
                        {l.reason && <div style={{ color: '#595959', marginTop: 2 }}>原因: {l.reason}</div>}
                        {l.action_taken && <div style={{ color: '#1677ff', marginTop: 2 }}>处理: {l.action_taken}</div>}
                      </div>
                    ),
                  }))}
                />
              )}
            </Card>
          </>
        )}
      </Drawer>
    </div>
  )
}
