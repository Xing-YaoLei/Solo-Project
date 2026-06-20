import { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  List,
  Upload,
  Divider,
  Row,
  Col,
} from 'antd'
import {
  ArrowLeftOutlined,
  UploadOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from '@tanstack/react-router'
import { appealsAPI } from '../../api'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const statusOptions = [
  { value: 'pending', label: '待处理', color: 'orange' },
  { value: 'processing', label: '处理中', color: 'blue' },
  { value: 'resolved', label: '已解决', color: 'green' },
  { value: 'rejected', label: '已驳回', color: 'default' },
]

const appealTypes = [
  { value: 'late', label: '超时申诉' },
  { value: 'damage', label: '损坏申诉' },
  { value: 'lost', label: '丢失申诉' },
  { value: 'wrong', label: '错送申诉' },
]

const appellantTypes = [
  { value: 'customer', label: '客户' },
  { value: 'rider', label: '骑手' },
  { value: 'merchant', label: '商家' },
]

export default function AppealDetail() {
  const navigate = useNavigate()
  const params = useParams({ from: '/appeals/$appealId' })
  const appealId = params.appealId

  const [appeal, setAppeal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [handleVisible, setHandleVisible] = useState(false)
  const [evidenceVisible, setEvidenceVisible] = useState(false)
  const [handleForm] = Form.useForm()
  const [evidenceForm] = Form.useForm()

  useEffect(() => {
    if (appealId) {
      loadAppealDetail()
    }
  }, [appealId])

  const loadAppealDetail = async () => {
    setLoading(true)
    try {
      const res = await appealsAPI.get(appealId)
      setAppeal(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = () => {
    setHandleVisible(true)
    handleForm.setFieldsValue({
      status: appeal.status,
      compensate_amount: appeal.compensate_amount,
      handler: '管理员',
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await handleForm.validateFields()
      await appealsAPI.update(appealId, values)
      message.success('处理成功')
      setHandleVisible(false)
      handleForm.resetFields()
      loadAppealDetail()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddEvidence = async () => {
    try {
      const values = await evidenceForm.validateFields()
      await appealsAPI.addEvidence({
        appeal_id: parseInt(appealId),
        evidence_type: values.evidence_type,
        evidence_url: values.evidence_url,
        evidence_name: values.evidence_name,
      })
      message.success('证据添加成功')
      setEvidenceVisible(false)
      evidenceForm.resetFields()
      loadAppealDetail()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteEvidence = async (index) => {
    try {
      await appealsAPI.removeEvidence(appealId, index)
      message.success('删除成功')
      loadAppealDetail()
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusColor = (status) => {
    const opt = statusOptions.find((o) => o.value === status)
    return opt?.color || 'default'
  }

  const getStatusLabel = (status) => {
    const opt = statusOptions.find((o) => o.value === status)
    return opt?.label || status
  }

  const getAppealTypeLabel = (type) => {
    const opt = appealTypes.find((o) => o.value === type)
    return opt?.label || type
  }

  const getAppellantLabel = (type) => {
    const opt = appellantTypes.find((o) => o.value === type)
    return opt?.label || type
  }

  if (!appeal) {
    return <div>加载中...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/appeals' })}>
          返回列表
        </Button>
      </div>

      <Card
        title={
          <Space>
            <span>申诉详情</span>
            <span style={{ fontSize: 14, color: '#666' }}>申诉#{appeal.id}</span>
            <Tag color={getStatusColor(appeal.status)} style={{ marginLeft: 8 }}>
              {getStatusLabel(appeal.status)}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<UploadOutlined />} onClick={() => setEvidenceVisible(true)}>
              添加证据
            </Button>
            {(appeal.status === 'pending' || appeal.status === 'processing') && (
              <Button type="primary" onClick={handleProcess}>
                处理申诉
              </Button>
            )}
          </Space>
        }
        loading={loading}
      >
        <div className="detail-section">
          <div className="detail-section-title">基本信息</div>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="关联订单">{appeal.order_no || '-'}</Descriptions.Item>
            <Descriptions.Item label="申诉类型">{getAppealTypeLabel(appeal.appeal_type)}</Descriptions.Item>
            <Descriptions.Item label="申诉方">{getAppellantLabel(appeal.appellant)}</Descriptions.Item>
            <Descriptions.Item label="申诉人">{appeal.appellant_name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{appeal.appellant_phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="处理人">{appeal.handler || '-'}</Descriptions.Item>
            <Descriptions.Item label="索赔金额">¥{appeal.claim_amount}</Descriptions.Item>
            <Descriptions.Item label="赔付金额" style={{ color: appeal.compensate_amount > 0 ? '#f5222d' : 'inherit' }}>
              ¥{appeal.compensate_amount}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(appeal.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="处理时间">
              {appeal.handle_time ? dayjs(appeal.handle_time).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider />

        <div className="detail-section">
          <div className="detail-section-title">申诉描述</div>
          <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
            {appeal.description}
          </div>
        </div>

        <Divider />

        <div className="detail-section">
          <div className="detail-section-title">
            申诉证据 ({appeal.evidence?.length || 0})
          </div>
          {appeal.evidence && appeal.evidence.length > 0 ? (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 4, lg: 6 }}
              dataSource={appeal.evidence}
              renderItem={(item, index) => (
                <List.Item>
                  <Card
                    size="small"
                    cover={
                      item.type === 'image' ? (
                        <div style={{ height: 120, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          📷 {item.name}
                        </div>
                      ) : (
                        <div style={{ height: 120, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          📄 {item.name}
                        </div>
                      )
                    }
                    actions={[
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleDeleteEvidence(index)}
                      >
                        删除
                      </Button>,
                    ]}
                  >
                    <Card.Meta title={item.name} description={item.type} />
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>
              暂无证据
            </div>
          )}
        </div>

        {appeal.handle_result && (
          <>
            <Divider />
            <div className="detail-section">
              <div className="detail-section-title">处理结果</div>
              <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 8, border: '1px solid #91caff' }}>
                {appeal.handle_result}
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        title="处理申诉"
        open={handleVisible}
        onOk={handleSubmit}
        onCancel={() => setHandleVisible(false)}
        width={500}
        destroyOnClose
      >
        <Form form={handleForm} layout="vertical">
          <Form.Item
            name="status"
            label="处理状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择">
              {statusOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="handler" label="处理人">
            <Input placeholder="处理人姓名" />
          </Form.Item>
          <Form.Item name="compensate_amount" label="赔付金额(元)">
            <Input type="number" placeholder="请输入赔付金额" />
          </Form.Item>
          <Form.Item name="handle_result" label="处理结果说明">
            <TextArea rows={4} placeholder="请输入处理结果说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加证据"
        open={evidenceVisible}
        onOk={handleAddEvidence}
        onCancel={() => setEvidenceVisible(false)}
        width={500}
        destroyOnClose
      >
        <Form form={evidenceForm} layout="vertical">
          <Form.Item
            name="evidence_type"
            label="证据类型"
            rules={[{ required: true, message: '请选择证据类型' }]}
          >
            <Select placeholder="请选择">
              <Option value="image">图片</Option>
              <Option value="video">视频</Option>
              <Option value="audio">音频</Option>
              <Option value="document">文档</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="evidence_name"
            label="证据名称"
            rules={[{ required: true, message: '请输入证据名称' }]}
          >
            <Input placeholder="请输入证据名称" />
          </Form.Item>
          <Form.Item
            name="evidence_url"
            label="证据链接"
            rules={[{ required: true, message: '请输入证据链接' }]}
          >
            <Input placeholder="请输入证据文件链接" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
