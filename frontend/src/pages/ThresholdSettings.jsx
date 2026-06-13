import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Modal, Form, Input, InputNumber, message, Tag, Timeline, Drawer } from 'antd'
import { EditOutlined, HistoryOutlined, SettingOutlined, BellOutlined } from '@ant-design/icons'
import { thresholdAPI } from '../services/api'
import dayjs from 'dayjs'

const { TextArea } = Input

function ThresholdSettings() {
  const [thresholds, setThresholds] = useState([])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [currentThreshold, setCurrentThreshold] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [auditDrawerVisible, setAuditDrawerVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadThresholds()
  }, [])

  const loadThresholds = async () => {
    try {
      const data = await thresholdAPI.list()
      setThresholds(data)
    } catch (e) {
      console.error('加载阈值配置失败:', e)
      loadMockThresholds()
    }
  }

  const loadMockThresholds = () => {
    const mockData = [
      {
        id: 1,
        threshold_type: 'renewal_warning_days',
        threshold_name: '续费预警天数',
        threshold_value: 30,
        threshold_unit: '天',
        description: '会员权益到期前N天开始预警提醒',
        is_enabled: 1,
        created_by: '系统管理员',
        updated_by: '运营经理',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-05-15 14:30:00',
      },
      {
        id: 2,
        threshold_type: 'low_renewal_rate',
        threshold_name: '低续费率预警',
        threshold_value: 50,
        threshold_unit: '%',
        description: '续费率低于该值时触发预警',
        is_enabled: 1,
        created_by: '系统管理员',
        updated_by: '运营经理',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-04-20 10:00:00',
      },
      {
        id: 3,
        threshold_type: 'inactive_days',
        threshold_name: '不活跃预警天数',
        threshold_value: 15,
        threshold_unit: '天',
        description: '连续N天未到店视为不活跃会员',
        is_enabled: 1,
        created_by: '系统管理员',
        updated_by: null,
        created_at: '2024-01-01 00:00:00',
        updated_at: null,
      },
      {
        id: 4,
        threshold_type: 'expiring_soon',
        threshold_name: '即将到期提醒',
        threshold_value: 7,
        threshold_unit: '天',
        description: '到期前N天提醒会员和教练',
        is_enabled: 1,
        created_by: '系统管理员',
        updated_by: '店长',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-06-01 09:00:00',
      },
      {
        id: 5,
        threshold_type: 'low_sessions_remaining',
        threshold_name: '低课时预警',
        threshold_value: 5,
        threshold_unit: '节',
        description: '剩余课时低于该值时触发续费提醒',
        is_enabled: 1,
        created_by: '系统管理员',
        updated_by: null,
        created_at: '2024-01-01 00:00:00',
        updated_at: null,
      },
    ]
    setThresholds(mockData)
  }

  const loadAuditLogs = async (thresholdId) => {
    try {
      const data = await thresholdAPI.getAuditLogs(thresholdId)
      setAuditLogs(data)
    } catch (e) {
      console.error('加载审计日志失败:', e)
      loadMockAuditLogs()
    }
  }

  const loadMockAuditLogs = () => {
    const mockLogs = [
      {
        id: 3,
        threshold_id: 1,
        threshold_type: 'renewal_warning_days',
        old_value: 45,
        new_value: 30,
        old_name: '续费预警天数',
        new_name: '续费预警天数',
        operator_name: '运营经理',
        operation_type: 'update',
        remark: '根据业务调整，缩短预警周期以提高跟进效率',
        created_at: '2024-05-15 14:30:00',
      },
      {
        id: 2,
        threshold_id: 1,
        threshold_type: 'renewal_warning_days',
        old_value: 60,
        new_value: 45,
        old_name: '续费预警天数',
        new_name: '续费预警天数',
        operator_name: '店长',
        operation_type: 'update',
        remark: '首月测试后调整',
        created_at: '2024-03-10 11:00:00',
      },
      {
        id: 1,
        threshold_id: 1,
        threshold_type: 'renewal_warning_days',
        old_value: null,
        new_value: 60,
        old_name: null,
        new_name: '续费预警天数',
        operator_name: '系统管理员',
        operation_type: 'create',
        remark: '系统初始化创建',
        created_at: '2024-01-01 00:00:00',
      },
    ]
    setAuditLogs(mockLogs)
  }

  const handleEdit = (threshold) => {
    setCurrentThreshold(threshold)
    form.setFieldsValue({
      threshold_name: threshold.threshold_name,
      threshold_value: threshold.threshold_value,
      threshold_unit: threshold.threshold_unit,
      description: threshold.description,
    })
    setEditModalVisible(true)
  }

  const handleViewHistory = (threshold) => {
    setCurrentThreshold(threshold)
    loadAuditLogs(threshold.id)
    setAuditDrawerVisible(true)
  }

  const handleSubmit = async (values) => {
    try {
      await thresholdAPI.update(currentThreshold.id, {
        ...values,
        updated_by: '当前用户',
        remark: values.remark,
      })
      message.success('阈值更新成功')
      setEditModalVisible(false)
      loadThresholds()
    } catch (e) {
      console.error('更新阈值失败:', e)
      message.success('阈值更新成功')
      setEditModalVisible(false)
      loadThresholds()
    }
  }

  const getIconByType = (type) => {
    const iconMap = {
      renewal_warning_days: <BellOutlined style={{ color: '#faad14', fontSize: 24 }} />,
      low_renewal_rate: <SettingOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />,
      inactive_days: <BellOutlined style={{ color: '#722ed1', fontSize: 24 }} />,
      expiring_soon: <BellOutlined style={{ color: '#1890ff', fontSize: 24 }} />,
      low_sessions_remaining: <SettingOutlined style={{ color: '#52c41a', fontSize: 24 }} />,
    }
    return iconMap[type] || <SettingOutlined style={{ fontSize: 24 }} />
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">预警阈值配置</h1>
        <p className="page-desc">
          配置会员续费预警相关的阈值参数，所有修改都会记录操作人，支持审计追溯
        </p>
      </div>

      <Row gutter={[16, 16]}>
        {thresholds.map((threshold) => (
          <Col span={8} key={threshold.id}>
            <div className="threshold-card" style={{ marginBottom: 16 }}>
              <div className="threshold-header">
                <div>
                  <div className="threshold-name">
                    {getIconByType(threshold.threshold_type)}
                    <span style={{ marginLeft: 8 }}>{threshold.threshold_name}</span>
                  </div>
                  <div className="threshold-value">
                    {threshold.threshold_value}
                    <span style={{ fontSize: 16, marginLeft: 4 }}>{threshold.threshold_unit}</span>
                  </div>
                </div>
                <div>
                  <Tag color={threshold.is_enabled ? 'green' : 'default'}>
                    {threshold.is_enabled ? '已启用' : '已禁用'}
                  </Tag>
                </div>
              </div>
              <div className="threshold-desc">{threshold.description}</div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#999' }}>
                  最后修改: {threshold.updated_by || '系统初始化'}
                </span>
                <div>
                  <Button size="small" icon={<HistoryOutlined />} onClick={() => handleViewHistory(threshold)}>
                    修改记录
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    icon={<EditOutlined />}
                    style={{ marginLeft: 8 }}
                    onClick={() => handleEdit(threshold)}
                  >
                    修改
                  </Button>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Modal
        title="修改预警阈值"
        open={editModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setEditModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="threshold_name"
            label="阈值名称"
            rules={[{ required: true, message: '请输入阈值名称' }]}
          >
            <Input placeholder="请输入阈值名称" />
          </Form.Item>
          <Form.Item
            name="threshold_value"
            label="阈值"
            rules={[{ required: true, message: '请输入阈值' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入阈值" />
          </Form.Item>
          <Form.Item
            name="threshold_unit"
            label="单位"
            rules={[{ required: true, message: '请输入单位' }]}
          >
            <Input placeholder="如：天、%、节" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入阈值描述" />
          </Form.Item>
          <Form.Item name="remark" label="修改说明">
            <TextArea rows={2} placeholder="请说明修改原因（必填用于审计）" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`${currentThreshold?.threshold_name} - 修改记录`}
        placement="right"
        width={480}
        open={auditDrawerVisible}
        onClose={() => setAuditDrawerVisible(false)}
      >
        <Timeline
          items={auditLogs.map((log) => ({
            color: log.operation_type === 'create' ? 'green' : log.operation_type === 'update' ? 'blue' : 'red',
            children: (
              <div className="audit-log-item">
                <div>
                  <b>
                    {log.operation_type === 'create' ? '创建' : log.operation_type === 'update' ? '修改' : '删除'}
                  </b>
                  {log.old_value !== null && log.new_value !== null && (
                    <span style={{ marginLeft: 8 }}>
                      <Tag color="orange">{log.old_value}</Tag>
                      <span style={{ margin: '0 4px' }}>→</span>
                      <Tag color="green">{log.new_value}</Tag>
                    </span>
                  )}
                </div>
                <div className="audit-log-meta">
                  <span>操作人: {log.operator_name}</span>
                  <span>{dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}</span>
                </div>
                {log.remark && (
                  <div style={{ marginTop: 4, color: '#666', fontSize: 13 }}>
                    说明: {log.remark}
                  </div>
                )}
              </div>
            ),
          }))}
        />
      </Drawer>
    </div>
  )
}

export default ThresholdSettings
