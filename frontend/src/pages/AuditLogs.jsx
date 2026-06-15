import { useEffect, useState } from 'react'
import { Card, Table, Tag, Space, Select, DatePicker, Input, Tooltip, Empty, Descriptions } from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined,
  SearchOutlined, InfoCircleOutlined, FileDoneOutlined, CheckCircleOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { auditApi, authApi } from '../services'
import dayjs from 'dayjs'

const ACTION_COLORS = {
  create: { label: '创建', color: 'blue' },
  update: { label: '更新', color: 'geekblue' },
  delete: { label: '删除', color: 'red' },
  status_change: { label: '状态变更', color: 'purple' },
  download: { label: '下载', color: 'green' },
  notify: { label: '通知', color: 'orange' },
}

const ENTITY_LABELS = {
  review_application: '复核申请',
  advisor_quota: '导师名额',
  report: '报表',
  notification: '通知',
  user: '用户',
  student: '学生',
  score: '成绩',
}

export default function AuditLogs() {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 })
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({})
  const [operators, setOperators] = useState([])
  const [keyword, setKeyword] = useState('')

  useEffect(() => { loadData() }, [pagination.current, pagination.pageSize, filters])
  useEffect(() => { loadOperators() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await auditApi.list({
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      })
      setData(res.data.data)
      setPagination(p => ({ ...p, total: res.data.pagination.total }))
    } catch {}
    setLoading(false)
  }

  const loadOperators = async () => {
    try {
      const res = await authApi.listUsers()
      setOperators(res.data)
    } catch {}
  }

  const columns = [
    { title: '时间', dataIndex: 'created_at', width: 170, sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at), render: v => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    { title: '操作', dataIndex: 'action', width: 100, render: a => {
      const cfg = ACTION_COLORS[a] || { label: a, color: 'default' }
      return <Tag color={cfg.color}>{cfg.label}</Tag>
    } },
    { title: '实体类型', dataIndex: 'entity_type', width: 110, render: v => <Tag color="blue">{ENTITY_LABELS[v] || v}</Tag> },
    { title: '实体ID', dataIndex: 'entity_id', width: 80, render: v => v || '-' },
    { title: '关联复核', dataIndex: 'review_id', width: 100, render: v => v ? <Tag color="purple">#{v}</Tag> : '-' },
    { title: '操作人', dataIndex: 'operator_name', width: 100 },
    { title: '原因', dataIndex: 'reason', width: 200, ellipsis: true, render: v => v ? (
      <Tooltip title={v}>
        <span style={{ color: '#d46b08' }}>{v}</span>
      </Tooltip>
    ) : '-' },
    { title: '处理动作', dataIndex: 'action_taken', width: 200, ellipsis: true, render: v => v ? (
      <Tooltip title={v}>
        <Tag color="blue" style={{ maxWidth: 200 }}>{v}</Tag>
      </Tooltip>
    ) : '-' },
    { title: '关闭时间', dataIndex: 'closed_at', width: 160, render: v => v ? (
      <Tag icon={<CheckCircleOutlined />} color="success">{dayjs(v).format('MM-DD HH:mm')}</Tag>
    ) : '-' },
    { title: '变更内容', width: 280, render: (_, r) => {
      const hasOld = r.old_values && Object.keys(r.old_values).length > 0
      const hasNew = r.new_values && Object.keys(r.new_values).length > 0
      if (!hasOld && !hasNew) return '-'
      return (
        <Tooltip
          title={
            <div style={{ maxWidth: 400 }}>
              {hasOld && (
                <Card size="small" title={<Tag color="error">变更前 (old)</Tag>} style={{ marginBottom: 8 }}>
                  <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(r.old_values, null, 2)}
                  </pre>
                </Card>
              )}
              {hasNew && (
                <Card size="small" title={<Tag color="success">变更后 (new)</Tag>}>
                  <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(r.new_values, null, 2)}
                  </pre>
                </Card>
              )}
            </div>
          }
        >
          <Space size="small" wrap>
            {hasOld && <Tag color="error"><EditOutlined /> old: {Object.keys(r.old_values).length}项</Tag>}
            {hasNew && <Tag color="success"><PlusOutlined /> new: {Object.keys(r.new_values).length}项</Tag>}
          </Space>
        </Tooltip>
      )
    } },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="page-title" style={{ margin: 0 }}>
          审计日志
          <Tag color="geekblue" style={{ marginLeft: 8 }}>
            <InfoCircleOutlined /> 全操作追踪：原因·处理动作·关闭时间
          </Tag>
        </div>
        <Space wrap>
          <Select
            placeholder="操作类型"
            allowClear
            style={{ width: 140 }}
            value={filters.action || undefined}
            onChange={v => setFilters(f => ({ ...f, action: v || '' }))}
            options={Object.entries(ACTION_COLORS).map(([v, cfg]) => ({ label: cfg.label, value: v }))}
          />
          <Select
            placeholder="实体类型"
            allowClear
            style={{ width: 140 }}
            value={filters.entity_type || undefined}
            onChange={v => setFilters(f => ({ ...f, entity_type: v || '' }))}
            options={Object.entries(ENTITY_LABELS).map(([v, l]) => ({ label: l, value: v }))}
          />
          <Select
            placeholder="操作人"
            allowClear
            showSearch
            style={{ width: 160 }}
            value={filters.operator_id || undefined}
            onChange={v => setFilters(f => ({ ...f, operator_id: v || '' }))}
            options={operators.map(o => ({ label: o.full_name, value: o.id }))}
            optionFilterProp="label"
          />
        </Space>
      </div>

      <RowPseudo style={{ marginBottom: 16 }} gutter={16}>
        {[
          { label: '总操作数', value: pagination.total, color: '#1677ff' },
          { label: '状态变更', value: data.filter(d => d.action === 'status_change').length, color: '#722ed1' },
          { label: '发送通知', value: data.filter(d => d.action === 'notify').length, color: '#fa8c16' },
          { label: '文件下载', value: data.filter(d => d.action === 'download').length, color: '#52c41a' },
          { label: '含原因记录', value: data.filter(d => d.reason).length, color: '#eb2f96' },
          { label: '已关闭', value: data.filter(d => d.closed_at).length, color: '#13c2c2' },
        ].map((s, i) => (
          <ColPseudo key={i}>
            <Card size="small" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</div>
            </Card>
          </ColPseudo>
        ))}
      </RowPseudo>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1500 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            pageSizeOptions: ['20', '50', '100', '200'],
            showSizeChanger: true,
            showTotal: t => `共 ${t} 条审计记录`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total }),
          }}
        />
      </Card>
    </div>
  )
}

import { Row, Col } from 'antd'
function RowPseudo(props) { return <Row {...props} /> }
function ColPseudo(props) { return <Col xs={12} md={8} lg={4} {...props} /> }
