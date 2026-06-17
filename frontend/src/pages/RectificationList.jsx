import React, { useState, useEffect, useCallback } from 'react'
import {
  Row,
  Col,
  Card,
  Select,
  Button,
  Tag,
  Table,
  App as AntApp,
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  Progress,
  Tooltip,
} from 'antd'
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { api } from '../api/index.js'

const STATUS_MAP = {
  pending: { text: '待整改', color: 'orange', icon: <ClockCircleOutlined /> },
  completed: { text: '已完成', color: 'green', icon: <CheckCircleOutlined /> },
  overdue: { text: '已超期', color: 'red', icon: <WarningOutlined /> },
}

export default function RectificationList() {
  const { message, modal } = AntApp.useApp()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [promotions, setPromotions] = useState([])
  const [filters, setFilters] = useState({ status: undefined, promotion_id: undefined })
  const [editModal, setEditModal] = useState({ open: false, data: null, mode: 'create' })
  const [form] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [list, promos] = await Promise.all([
        api.getRectifications(filters),
        api.getPromotions(),
      ])
      setData(list)
      setPromotions(promos)
    } catch (e) {
      message.error('加载整改记录失败')
    } finally {
      setLoading(false)
    }
  }, [filters, message])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const pendingCount = data.filter((d) => d.rectification_status === 'pending').length
  const completedCount = data.filter((d) => d.rectification_status === 'completed').length
  const overdueCount = data.filter((d) => d.rectification_status === 'overdue').length
  const totalTarget = data.length || 1
  const completedRate = Math.round((completedCount / totalTarget) * 100)

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        require_rectification_date: values.require_rectification_date.format('YYYY-MM-DD'),
        actual_rectification_date: values.actual_rectification_date
          ? values.actual_rectification_date.format('YYYY-MM-DD')
          : null,
      }
      if (editModal.mode === 'create') {
        await api.createRectification(payload)
      } else {
        await api.updateRectification(editModal.data.id, payload)
      }
      message.success('保存成功')
      setEditModal({ open: false, data: null, mode: 'create' })
      form.resetFields()
      fetchData()
    } catch (e) {
      message.error('保存失败')
    }
  }

  const openEdit = (record) => {
    setEditModal({ open: true, data: record, mode: 'edit' })
    form.setFieldsValue({
      promotion_id: record.promotion_id,
      inspection_id: record.inspection_id,
      issue_description: record.issue_description,
      require_rectification_date: dayjs(record.require_rectification_date),
      actual_rectification_date: record.actual_rectification_date
        ? dayjs(record.actual_rectification_date)
        : null,
      rectification_status: record.rectification_status,
      rectification_remark: record.rectification_remark,
      rectification_by: record.rectification_by,
      reviewer: record.reviewer,
    })
  }

  const openCreate = () => {
    setEditModal({ open: true, data: null, mode: 'create' })
    form.resetFields()
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '促销活动',
      dataIndex: 'promotion_id',
      width: 200,
      render: (v) => {
        const p = promotions.find((x) => x.id === v)
        return p ? `${p.promo_code} - ${p.promo_name}` : `ID:${v}`
      },
    },
    {
      title: '关联巡检',
      dataIndex: 'inspection_id',
      width: 100,
      render: (v) => (v ? `#${v}` : '-'),
    },
    {
      title: '问题描述',
      dataIndex: 'issue_description',
      width: 240,
      ellipsis: true,
      render: (v) => <Tooltip title={v}>{v}</Tooltip>,
    },
    {
      title: '要求完成日期',
      dataIndex: 'require_rectification_date',
      width: 120,
    },
    {
      title: '实际完成日期',
      dataIndex: 'actual_rectification_date',
      width: 120,
      render: (v) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'rectification_status',
      width: 100,
      filters: Object.keys(STATUS_MAP).map((k) => ({
        text: STATUS_MAP[k].text,
        value: k,
      })),
      onFilter: (v, r) => r.rectification_status === v,
      render: (v) => {
        const s = STATUS_MAP[v] || STATUS_MAP.pending
        return (
          <Tag icon={s.icon} color={s.color}>
            {s.text}
          </Tag>
        )
      },
    },
    {
      title: '整改说明',
      dataIndex: 'rectification_remark',
      width: 200,
      ellipsis: true,
      render: (v) => <Tooltip title={v}>{v || '-'}</Tooltip>,
    },
    {
      title: '整改人',
      dataIndex: 'rectification_by',
      width: 120,
      render: (v) => v || '-',
    },
    {
      title: '复核人',
      dataIndex: 'reviewer',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      render: (_, r) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Progress
              type="dashboard"
              percent={completedRate}
              format={(p) => <span style={{ color: '#52c41a', fontWeight: 700 }}>{p}%</span>}
              strokeColor="#52c41a"
            />
            <div style={{ textAlign: 'center', marginTop: -8, color: '#6b7280', fontSize: 13 }}>
              整改完成率
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card info">
            <div className="stat-label">总问题数</div>
            <div className="stat-value">{data.length}</div>
            <SearchOutlined className="stat-icon" />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card warning">
            <div className="stat-label">待整改/超期</div>
            <div className="stat-value">
              {pendingCount}
              {overdueCount > 0 && <span style={{ fontSize: 18 }}> / {overdueCount}</span>}
            </div>
            <WarningOutlined className="stat-icon" />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card success">
            <div className="stat-label">已完成</div>
            <div className="stat-value">{completedCount}</div>
            <CheckCircleOutlined className="stat-icon" />
          </div>
        </Col>
      </Row>

      <div className="card-section">
        <Row gutter={16} align="middle">
          <Col span={24}>
            <Space size="middle" wrap>
              <Select
                allowClear
                placeholder="选择促销活动"
                showSearch
                style={{ minWidth: 320 }}
                options={promotions.map((p) => ({
                  value: p.id,
                  label: `${p.promo_code} - ${p.promo_name}`,
                }))}
                value={filters.promotion_id}
                onChange={(v) => setFilters((f) => ({ ...f, promotion_id: v }))}
              />
              <Select
                allowClear
                placeholder="选择状态"
                style={{ width: 160 }}
                options={Object.keys(STATUS_MAP).map((k) => ({
                  value: k,
                  label: STATUS_MAP[k].text,
                }))}
                value={filters.status}
                onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              />
              <Button icon={<ReloadOutlined />} onClick={fetchData}>
                查询
              </Button>
            </Space>
            <Space style={{ float: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                新建整改记录
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div className="card-section">
        <div className="section-title">整改记录列表</div>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          rowClassName={(r) =>
            r.rectification_status === 'overdue' ? 'impact-highlight' : ''
          }
          pagination={{ pageSize: 15, showSizeChanger: true }}
        />
      </div>

      <Modal
        open={editModal.open}
        title={editModal.mode === 'create' ? '新建整改记录' : `编辑整改记录 #${editModal.data?.id}`}
        width={680}
        onCancel={() => {
          setEditModal({ open: false, data: null, mode: 'create' })
          form.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="促销活动"
                name="promotion_id"
                rules={[{ required: true, message: '请选择促销活动' }]}
              >
                <Select
                  showSearch
                  placeholder="请选择"
                  options={promotions.map((p) => ({
                    value: p.id,
                    label: `${p.promo_code} - ${p.promo_name}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="关联巡检ID" name="inspection_id">
                <Input placeholder="可关联巡检记录ID" type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="问题描述"
            name="issue_description"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <Input.TextArea rows={3} placeholder="详细说明陈列问题或异常情况" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="要求完成日期"
                name="require_rectification_date"
                rules={[{ required: true, message: '请选择' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="实际完成日期" name="actual_rectification_date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="整改状态"
                name="rectification_status"
                initialValue="pending"
              >
                <Select
                  options={Object.keys(STATUS_MAP).map((k) => ({
                    value: k,
                    label: STATUS_MAP[k].text,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="整改人" name="rectification_by">
                <Input placeholder="执行整改的人员" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="整改说明 / 完成情况" name="rectification_remark">
            <Input.TextArea rows={2} placeholder="如何整改的，完成情况如何" />
          </Form.Item>
          <Form.Item label="复核人" name="reviewer">
            <Input placeholder="复核确认人员" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setEditModal({ open: false, data: null, mode: 'create' })
                  form.resetFields()
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
