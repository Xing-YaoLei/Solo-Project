import { useState, useEffect } from 'react'
import {
  Row, Col, Table, Tag, Button, Modal, Form, Input, InputNumber,
  Space, message, Select, Descriptions,
} from 'antd'
import { EditOutlined, HistoryOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { warningApi } from '../api'

const categoryMap = {
  vehicle: { color: 'blue', label: '车辆预警' },
  quality: { color: 'orange', label: '质量预警' },
  inventory: { color: 'purple', label: '库存预警' },
}

export default function WarningSettings() {
  const [data, setData] = useState([])
  const [logs, setLogs] = useState([])
  const [editModal, setEditModal] = useState({ open: false, record: null })
  const [logsModal, setLogsModal] = useState({ open: false, thresholdId: null })
  const [form] = Form.useForm()

  useEffect(() => {
    loadThresholds()
    loadAllLogs()
  }, [])

  const loadThresholds = async () => {
    const result = await warningApi.listThresholds().catch(() => ({ items: [] }))
    setData(result?.items || [])
  }

  const loadAllLogs = async () => {
    const result = await warningApi.getAllLogs({ limit: 50 }).catch(() => ({ items: [] }))
    setLogs(result?.items || [])
  }

  const handleEdit = (record) => {
    setEditModal({ open: true, record })
    form.setFieldsValue({
      current_value: record.current_value,
      updated_by: '',
      change_reason: '',
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await warningApi.updateThreshold(editModal.record.id, values)
      message.success('阈值更新成功，已记录修改人')
      setEditModal({ open: false, record: null })
      loadThresholds()
      loadAllLogs()
    } catch (e) {
      message.error(e?.response?.data?.detail || '更新失败')
    }
  }

  const viewLogs = async (record) => {
    setLogsModal({ open: true, thresholdId: record.id })
  }

  const columns = [
    { title: '预警名称', dataIndex: 'name', key: 'name' },
    { title: '编码', dataIndex: 'code', key: 'code', width: 180 },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (v) => <Tag color={categoryMap[v]?.color}>{categoryMap[v]?.label}</Tag>,
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '当前阈值',
      dataIndex: 'current_value',
      key: 'current_value',
      width: 120,
      render: (v, r) => (
        <span style={{ fontWeight: 600, color: '#1677ff' }}>
          {v} {r.unit}
        </span>
      ),
    },
    {
      title: '允许范围',
      key: 'range',
      width: 140,
      render: (_, r) => (
        <span style={{ color: '#666' }}>
          {r.min_value ?? '-'} ~ {r.max_value ?? '-'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (v) => (v ? <Tag color="success">启用</Tag> : <Tag color="default">禁用</Tag>),
    },
    { title: '最后修改人', dataIndex: 'updated_by', key: 'updated_by', width: 100 },
    {
      title: '修改时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            修改
          </Button>
          <Button type="link" icon={<HistoryOutlined />} onClick={() => viewLogs(record)}>
            变更历史
          </Button>
        </Space>
      ),
    },
  ]

  const logColumns = [
    { title: '预警名称', dataIndex: 'threshold_name', key: 'threshold_name' },
    {
      title: '变更',
      key: 'change',
      render: (_, r) => (
        <span>
          {r.old_value} → <span style={{ color: '#1677ff', fontWeight: 600 }}>{r.new_value}</span>
        </span>
      ),
    },
    { title: '修改人', dataIndex: 'changed_by', key: 'changed_by' },
    { title: '修改原因', dataIndex: 'change_reason', key: 'change_reason', render: (v) => v || '-' },
    {
      title: '修改时间',
      dataIndex: 'changed_at',
      key: 'changed_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">预警阈值配置</div>
        <div className="page-subtitle">
          业务人员可调整预警阈值，所有修改记录修改人及修改原因
        </div>
      </div>

      <div className="chart-card">
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          阈值列表
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>

      <div className="chart-card" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          最近变更记录
        </div>
        <Table
          columns={logColumns}
          dataSource={logs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </div>

      <Modal
        title="修改预警阈值"
        open={editModal.open}
        onCancel={() => setEditModal({ open: false, record: null })}
        onOk={handleSubmit}
        okText="确认修改"
        width={520}
      >
        {editModal.record && (
          <>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="预警名称">{editModal.record.name}</Descriptions.Item>
              <Descriptions.Item label="当前阈值">
                {editModal.record.current_value} {editModal.record.unit}
              </Descriptions.Item>
              <Descriptions.Item label="允许范围">
                {editModal.record.min_value ?? '-'} ~ {editModal.record.max_value ?? '-'} {editModal.record.unit}
              </Descriptions.Item>
            </Descriptions>
            <Form form={form} layout="vertical">
              <Form.Item
                name="current_value"
                label={`新阈值 (${editModal.record.unit})`}
                rules={[{ required: true, message: '请输入新阈值' }]}
              >
                <InputNumber
                  min={editModal.record.min_value}
                  max={editModal.record.max_value}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item
                name="updated_by"
                label="修改人"
                rules={[{ required: true, message: '请输入修改人姓名' }]}
              >
                <Input placeholder="请输入您的姓名" />
              </Form.Item>
              <Form.Item name="change_reason" label="修改原因">
                <Input.TextArea rows={3} placeholder="请输入修改原因" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      <LogsModal
        open={logsModal.open}
        thresholdId={logsModal.thresholdId}
        onClose={() => setLogsModal({ open: false, thresholdId: null })}
      />
    </div>
  )
}

function LogsModal({ open, thresholdId, onClose }) {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    if (open && thresholdId) loadLogs()
  }, [open, thresholdId])

  const loadLogs = async () => {
    const result = await warningApi.getThresholdLogs(thresholdId).catch(() => ({ items: [] }))
    setLogs(result?.items || [])
  }

  const columns = [
    {
      title: '变更',
      key: 'change',
      render: (_, r) => (
        <span>
          {r.old_value} → <span style={{ color: '#1677ff', fontWeight: 600 }}>{r.new_value}</span>
        </span>
      ),
    },
    { title: '修改人', dataIndex: 'changed_by', key: 'changed_by' },
    { title: '修改原因', dataIndex: 'change_reason', key: 'change_reason', render: (v) => v || '-' },
    {
      title: '修改时间',
      dataIndex: 'changed_at',
      key: 'changed_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  return (
    <Modal
      title="阈值变更历史"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Modal>
  )
}
