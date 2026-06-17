import React, { useState, useEffect, useCallback } from 'react'
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tooltip,
  App as AntApp,
  Descriptions,
  Divider,
  Alert,
  Empty,
} from 'antd'
import {
  EditOutlined,
  HistoryOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { api } from '../api/index.js'

const CATEGORY_LABELS = {
  exception: { label: '异常预警', color: 'orange' },
  display: { label: '陈列质量', color: 'blue' },
  sales: { label: '销售达成', color: 'green' },
  photo: { label: '照片规范', color: 'purple' },
}

const VALUE_TYPE_HINTS = {
  minutes: '单位：分钟',
  count: '单位：条/个',
  percent: '单位：百分比 (%)',
  score: '单位：分 (0-100)',
  ratio: '单位：比值',
  days: '单位：天',
}

export default function ThresholdConfig() {
  const { message, modal } = AntApp.useApp()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [editModal, setEditModal] = useState({ open: false, record: null })
  const [historyModal, setHistoryModal] = useState({ open: false, record: null })
  const [form] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getThresholds()
      setData(res || [])
    } catch (e) {
      message.error('加载阈值配置失败')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openEdit = (record) => {
    setEditModal({ open: true, record })
    form.setFieldsValue({
      config_value: record.config_value,
      modified_by: record.current_modified_by || '',
      change_reason: '',
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!values.modified_by?.trim()) {
        message.warning('请输入修改人姓名')
        return
      }
      if (!values.change_reason?.trim()) {
        message.warning('请填写修改原因')
        return
      }
      if (Number(values.config_value) === Number(editModal.record.config_value)) {
        message.warning('阈值未发生变化，无需保存')
        return
      }
      await api.updateThreshold(editModal.record.id, {
        config_value: Number(values.config_value),
        modified_by: values.modified_by.trim(),
        change_reason: values.change_reason.trim(),
      })
      message.success('阈值修改成功，变更已留痕')
      setEditModal({ open: false, record: null })
      form.resetFields()
      fetchData()
    } catch (e) {
      if (e?.errorFields) return
      message.error('保存失败')
    }
  }

  const viewHistory = (record) => {
    setHistoryModal({ open: true, record })
  }

  const getRecentModifier = (record) => {
    const logs = record.change_logs || []
    if (logs.length === 0) return record.current_modified_by || '系统默认'
    return logs[0].changed_by
  }

  const getRecentChangeTime = (record) => {
    const logs = record.change_logs || []
    if (logs.length === 0) return record.updated_at
    return logs[0].changed_at
  }

  const columns = [
    {
      title: '阈值名称',
      dataIndex: 'config_name',
      key: 'config_name',
      width: 200,
      fixed: 'left',
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontWeight: 600, color: '#1f2937' }}>{text}</span>
          <Space size={4}>
            <Tag style={{ margin: 0 }} color={CATEGORY_LABELS[record.category]?.color || 'default'}>
              {CATEGORY_LABELS[record.category]?.label || record.category}
            </Tag>
            <code style={{ fontSize: 11, color: '#9ca3af' }}>{record.config_key}</code>
          </Space>
        </Space>
      ),
    },
    {
      title: '配置说明',
      dataIndex: 'description',
      key: 'description',
      width: 280,
      render: (text) => (
        <Tooltip title={text} placement="topLeft">
          <span style={{ color: '#4b5563', fontSize: 13 }}>
            <InfoCircleOutlined style={{ color: '#9ca3af', marginRight: 4 }} />
            {text?.length > 50 ? text.slice(0, 50) + '...' : text || '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '当前阈值',
      dataIndex: 'config_value',
      key: 'config_value',
      width: 140,
      align: 'center',
      render: (val, record) => (
        <Space direction="vertical" size={0} align="center">
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#1677ff',
              fontFamily: 'monospace',
            }}
          >
            {val}
          </span>
          {VALUE_TYPE_HINTS[record.value_type] && (
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              {VALUE_TYPE_HINTS[record.value_type]}
            </span>
          )}
        </Space>
      ),
      sorter: (a, b) => Number(a.config_value) - Number(b.config_value),
    },
    {
      title: '参考范围',
      key: 'range',
      width: 160,
      align: 'center',
      render: (_, record) => {
        const min = record.min_value
        const max = record.max_value
        if (min == null && max == null) return <span style={{ color: '#9ca3af' }}>未限定</span>
        return (
          <Space size={4}>
            <Tag color="cyan" style={{ margin: 0 }}>
              最小值 {min ?? '-'}
            </Tag>
            <Tag color="purple" style={{ margin: 0 }}>
              最大值 {max ?? '-'}
            </Tag>
          </Space>
        )
      },
    },
    {
      title: '最近修改',
      key: 'recent',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <UserOutlined style={{ color: '#6b7280', fontSize: 12 }} />
            <span style={{ color: '#374151', fontSize: 13 }}>{getRecentModifier(record)}</span>
          </Space>
          <Space size={4}>
            <ClockCircleOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
            <span style={{ color: '#6b7280', fontSize: 12 }}>
              {dayjs(getRecentChangeTime(record)).format('YYYY-MM-DD HH:mm')}
            </span>
          </Space>
        </Space>
      ),
    },
    {
      title: '变更历史',
      key: 'logs',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const count = (record.change_logs || []).length
        return (
          <Button
            type="link"
            icon={<HistoryOutlined />}
            onClick={() => viewHistory(record)}
            disabled={count === 0}
          >
            {count > 0 ? `${count} 条记录` : '暂无修改'}
          </Button>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="small"
          onClick={() => openEdit(record)}
        >
          调整阈值
        </Button>
      ),
    },
  ]

  const historyColumns = [
    {
      title: '修改时间',
      dataIndex: 'changed_at',
      key: 'changed_at',
      width: 170,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '修改人',
      dataIndex: 'changed_by',
      key: 'changed_by',
      width: 120,
      render: (v) => (
        <Space size={4}>
          <UserOutlined style={{ color: '#1677ff' }} />
          <span style={{ fontWeight: 500 }}>{v}</span>
        </Space>
      ),
    },
    {
      title: '变更前',
      dataIndex: 'old_value',
      key: 'old_value',
      width: 100,
      align: 'center',
      render: (v) => (
        <Tag color="default" style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: '变更后',
      dataIndex: 'new_value',
      key: 'new_value',
      width: 100,
      align: 'center',
      render: (v) => (
        <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: '修改原因',
      dataIndex: 'change_reason',
      key: 'change_reason',
      render: (v) => <span style={{ color: '#4b5563' }}>{v || '-'}</span>,
    },
  ]

  return (
    <div>
      <Alert
        type="info"
        showIcon
        icon={<ExclamationCircleOutlined />}
        message="阈值调整须知"
        description={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <span>1. 所有阈值调整将自动记录修改人、修改时间、变更前后值及修改原因，便于审计追溯。</span>
            <span>2. 阈值变更后立即生效，下一次看板刷新时将使用新阈值进行异常标注和合格判断。</span>
            <span>3. 建议由业务主管或运营负责人进行调整，避免频繁修改导致数据口径不一致。</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      />

      <Card
        title={
          <Space>
            <span style={{ fontSize: 16, fontWeight: 600 }}>预警阈值配置列表</span>
            <Tag color="blue">{data.length} 项配置</Tag>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1150 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 项阈值配置`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#1677ff' }} />
            <span>调整阈值：{editModal.record?.config_name}</span>
          </Space>
        }
        open={editModal.open}
        onCancel={() => {
          setEditModal({ open: false, record: null })
          form.resetFields()
        }}
        onOk={handleSubmit}
        okText="确认保存（留痕）"
        okButtonProps={{ icon: <SaveOutlined />, type: 'primary' }}
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        {editModal.record && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions
              size="small"
              column={1}
              bordered
              labelStyle={{ width: 110, background: '#fafafa', fontWeight: 500 }}
            >
              <Descriptions.Item label="配置键名">
                <code>{editModal.record.config_key}</code>
              </Descriptions.Item>
              <Descriptions.Item label="所属分类">
                <Tag color={CATEGORY_LABELS[editModal.record.category]?.color}>
                  {CATEGORY_LABELS[editModal.record.category]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前阈值">
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1677ff', fontFamily: 'monospace' }}>
                  {editModal.record.config_value}
                </span>
                {VALUE_TYPE_HINTS[editModal.record.value_type] && (
                  <span style={{ color: '#9ca3af', marginLeft: 8, fontSize: 12 }}>
                    （{VALUE_TYPE_HINTS[editModal.record.value_type]}）
                  </span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="配置说明">
                <span style={{ color: '#4b5563' }}>{editModal.record.description}</span>
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '8px 0' }} />

            <Form form={form} layout="vertical" requiredMark>
              <Form.Item
                label={
                  <Space>
                    <span>新的阈值</span>
                    <span style={{ color: '#f5222d' }}>*</span>
                  </Space>
                }
                name="config_value"
                rules={[
                  { required: true, message: '请输入新的阈值' },
                  {
                    validator: (_, value) => {
                      const v = Number(value)
                      const { min_value, max_value } = editModal.record
                      if (isNaN(v)) return Promise.reject('请输入有效数字')
                      if (min_value != null && v < min_value)
                        return Promise.reject(`不能小于最小值 ${min_value}`)
                      if (max_value != null && v > max_value)
                        return Promise.reject(`不能大于最大值 ${max_value}`)
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={editModal.record.min_value}
                  max={editModal.record.max_value}
                  step={editModal.record.value_type === 'percent' || editModal.record.value_type === 'ratio' ? 0.1 : 1}
                  placeholder={`请输入新阈值（当前值：${editModal.record.config_value}）`}
                  addonAfter={VALUE_TYPE_HINTS[editModal.record.value_type]?.replace('单位：', '')}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <Space>
                        <UserOutlined />
                        <span>修改人姓名</span>
                        <span style={{ color: '#f5222d' }}>*</span>
                      </Space>
                    }
                    name="modified_by"
                    rules={[{ required: true, message: '请输入修改人姓名（用于审计留痕）' }]}
                  >
                    <Input placeholder="请输入您的真实姓名，如：张三" maxLength={20} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={
                  <Space>
                    <InfoCircleOutlined />
                    <span>修改原因</span>
                    <span style={{ color: '#f5222d' }}>*</span>
                  </Space>
                }
                name="change_reason"
                rules={[
                  { required: true, message: '请说明修改原因' },
                  { min: 5, message: '修改原因至少 5 个字' },
                ]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="请简要说明本次阈值调整的原因，例如：业务调整、季节变化、策略变更等"
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <HistoryOutlined style={{ color: '#52c41a' }} />
            <span>变更历史：{historyModal.record?.config_name}</span>
            <Tag color="green">{(historyModal.record?.change_logs || []).length} 条记录</Tag>
          </Space>
        }
        open={historyModal.open}
        onCancel={() => setHistoryModal({ open: false, record: null })}
        footer={null}
        width={900}
        destroyOnClose
      >
        {historyModal.record && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="配置键名">
                <code>{historyModal.record.config_key}</code>
              </Descriptions.Item>
              <Descriptions.Item label="当前阈值">
                <span style={{ fontWeight: 600, color: '#1677ff' }}>
                  {historyModal.record.config_value}
                </span>
              </Descriptions.Item>
            </Descriptions>
            {(historyModal.record.change_logs || []).length > 0 ? (
              <Table
                rowKey="id"
                size="small"
                columns={historyColumns}
                dataSource={historyModal.record.change_logs}
                pagination={{ pageSize: 5, showSizeChanger: true }}
              />
            ) : (
              <Empty description="暂无变更历史记录，系统默认值未被修改过" />
            )}
          </Space>
        )}
      </Modal>
    </div>
  )
}
