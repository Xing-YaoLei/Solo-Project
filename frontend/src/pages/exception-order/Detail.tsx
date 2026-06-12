import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Descriptions, Card, Tabs, Tag, Row, Col, Statistic, Space, Form, Modal, Input, Select, message, Divider } from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { exceptionOrderApi, statusLogApi, groupBatchApi, arrivalListApi } from '../../api'
import { ExceptionOrderTypeMap, ExceptionOrderStatusMap, ResponsibilityPartyMap, StatusLog } from '../../types'
import { useAppStore } from '../../store'
import StatusBadge from '../../components/StatusBadge'
import StatusTimeline from '../../components/StatusTimeline'

const { Option } = Select
const { TabPane } = Tabs

export default function ExceptionOrderDetail() {
  const navigate = useNavigate()
  const params = useParams({ from: '/exception-orders/$id' })
  const queryClient = useQueryClient()
  const { currentOperator } = useAppStore()
  const [processForm] = Form.useForm()

  const [processModalVisible, setProcessModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const id = Number(params.id)

  const { data: exceptionOrder, isLoading } = useQuery({
    queryKey: ['exception-order', id],
    queryFn: () => exceptionOrderApi.get(id),
    enabled: !!id,
  })

  const { data: statusLogs } = useQuery({
    queryKey: ['status-logs', 'exception_order', id],
    queryFn: () => statusLogApi.list({
      related_type: 'exception_order',
      related_id: id,
      skip: 0,
      limit: 100,
    }),
    enabled: !!id,
  })

  const { data: groupBatch } = useQuery({
    queryKey: ['group-batch', exceptionOrder?.group_batch_id],
    queryFn: () => groupBatchApi.get(exceptionOrder!.group_batch_id),
    enabled: !!exceptionOrder?.group_batch_id,
  })

  const { data: arrivalList } = useQuery({
    queryKey: ['arrival-list', exceptionOrder?.arrival_list_id],
    queryFn: () => arrivalListApi.get(exceptionOrder!.arrival_list_id!),
    enabled: !!exceptionOrder?.arrival_list_id,
  })

  const processMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: any }) =>
      exceptionOrderApi.process(id, values),
    onSuccess: () => {
      message.success('处理成功')
      setProcessModalVisible(false)
      processForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['exception-order', id] })
      queryClient.invalidateQueries({ queryKey: ['status-logs', 'exception_order', id] })
    },
  })

  useEffect(() => {
    if (exceptionOrder) {
      processForm.setFieldsValue({
        status: exceptionOrder.status,
        responsibility_party: exceptionOrder.responsibility_party,
        responsibility_detail: exceptionOrder.responsibility_detail,
        process_result: '',
        compensation_amount: 0,
        processor: currentOperator,
        remark: '',
      })
    }
  }, [exceptionOrder])

  const handleProcess = () => {
    setProcessModalVisible(true)
  }

  const handleProcessSubmit = () => {
    processForm.validateFields().then((values) => {
      processMutation.mutate({
        id,
        values: {
          ...values,
          processor: currentOperator,
          process_time: dayjs().toISOString(),
        },
      })
    })
  }

  const typeColorMap: Record<string, string> = {
    shortage: 'red',
    quality: 'orange',
    damage: 'volcano',
    delay: 'blue',
    other: 'default',
  }

  const respColorMap: Record<string, string> = {
    supplier: 'red',
    warehouse: 'orange',
    logistics: 'blue',
    platform: 'purple',
    customer: 'green',
    unknown: 'default',
  }

  if (isLoading || !exceptionOrder) {
    return <div className="page-container">加载中...</div>
  }

  const logs: StatusLog[] = statusLogs || []

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/exception-orders' })}>
            返回列表
          </Button>
          <h1 className="page-title">异常单详情 - {exceptionOrder.exception_no}</h1>
        </Space>
        {exceptionOrder.status !== 'closed' && (
          <Button type="primary" icon={<EditOutlined />} onClick={handleProcess}>
            处理异常
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          <Col xs={24} sm={6}>
            <Statistic
              title="异常类型"
              value={ExceptionOrderTypeMap[exceptionOrder.type]}
              prefix={<Tag color={typeColorMap[exceptionOrder.type]}>{ExceptionOrderTypeMap[exceptionOrder.type]}</Tag>}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="当前状态"
              valueRender={() => <StatusBadge status={exceptionOrder.status} type="exception" />}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="责任方"
              value={ResponsibilityPartyMap[exceptionOrder.responsibility_party]}
              prefix={<Tag color={respColorMap[exceptionOrder.responsibility_party]}>
                {ResponsibilityPartyMap[exceptionOrder.responsibility_party]}
              </Tag>}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="预估损失"
              value={exceptionOrder.estimated_loss || 0}
              precision={2}
              prefix="¥"
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基本信息" key="basic">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="异常单号">{exceptionOrder.exception_no}</Descriptions.Item>
              <Descriptions.Item label="关联团单">
                {groupBatch ? (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate({
                      to: `/group-batches/${groupBatch.id}`,
                      params: { id: String(groupBatch.id) }
                    })}
                  >
                    {groupBatch.batch_no} - {groupBatch.name}
                  </Button>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="标题">{exceptionOrder.title || '-'}</Descriptions.Item>
              <Descriptions.Item label="上报人">{exceptionOrder.reported_by || '-'}</Descriptions.Item>
              <Descriptions.Item label="上报时间">
                {exceptionOrder.reported_time ? dayjs(exceptionOrder.reported_time).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="处理人">{exceptionOrder.processor || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理时间">
                {exceptionOrder.process_time ? dayjs(exceptionOrder.process_time).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="赔偿金额">
                {exceptionOrder.compensation_amount ? `¥${exceptionOrder.compensation_amount.toFixed(2)}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="影响商品数量">{exceptionOrder.affected_quantity || 0} 件</Descriptions.Item>
              <Descriptions.Item label="影响客户数">{exceptionOrder.affected_customers || 0} 人</Descriptions.Item>
              <Descriptions.Item label="关联到货清单">
                {arrivalList ? arrivalList.product_name : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="商品信息">{exceptionOrder.product_info || '-'}</Descriptions.Item>
              <Descriptions.Item label="详细描述" span={2}>
                {exceptionOrder.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="责任认定详情" span={2}>
                {exceptionOrder.responsibility_detail || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="处理结果" span={2}>
                {exceptionOrder.process_result || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="凭证图片" span={2}>
                {exceptionOrder.evidence_images || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {exceptionOrder.remark || '-'}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>

          <TabPane tab={`状态日志 (${logs.length})`} key="logs">
            <StatusTimeline logs={logs} />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="处理异常单"
        open={processModalVisible}
        onOk={handleProcessSubmit}
        onCancel={() => {
          setProcessModalVisible(false)
        }}
        width={600}
        okText="确认处理"
        cancelText="取消"
        confirmLoading={processMutation.isPending}
      >
        <div>
          <p><strong>异常单号：</strong>{exceptionOrder.exception_no}</p>
          <p><strong>标题：</strong>{exceptionOrder.title}</p>
          <p><strong>当前状态：</strong>{ExceptionOrderStatusMap[exceptionOrder.status]}</p>
          <Divider />
          <Form form={processForm} layout="vertical">
            <Form.Item
              name="status"
              label="新状态"
              rules={[{ required: true, message: '请选择新状态' }]}
            >
              <Select>
                {Object.entries(ExceptionOrderStatusMap).map(([value, label]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="responsibility_party"
              label="责任方"
              rules={[{ required: true, message: '请选择责任方' }]}
            >
              <Select>
                {Object.entries(ResponsibilityPartyMap).map(([value, label]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="responsibility_detail" label="责任认定详情">
              <Input.TextArea rows={2} placeholder="责任认定的详细说明" />
            </Form.Item>
            <Form.Item
              name="process_result"
              label="处理结果"
              rules={[{ required: true, message: '请输入处理结果' }]}
            >
              <Input.TextArea rows={3} placeholder="请详细描述处理结果" />
            </Form.Item>
            <Form.Item name="compensation_amount" label="赔偿金额">
              <Input type="number" step="0.01" min={0} prefix="¥" />
            </Form.Item>
            <Form.Item name="processor" label="处理人">
              <Input />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="请输入备注" />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  )
}
