import { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Input,
  List,
  Avatar,
  Form,
  Select,
  Modal,
  message,
  Timeline,
  Divider,
  Row,
  Col,
  Statistic,
  Badge,
  Steps,
  Alert,
} from 'antd'
import {
  ArrowLeftOutlined,
  UserOutlined,
  SendOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  SwapOutlined,
  MessageOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { conflictLevelLabels, conflictStatusLabels } from '../utils/enumLabels'
import type { Conflict, ConflictCommunication, ConflictReview } from '../types'

const { Option } = Select
const { TextArea } = Input
const { Step } = Steps

const ConflictDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [conflict, setConflict] = useState<Conflict | null>(null)
  const [communications, setCommunications] = useState<ConflictCommunication[]>([])
  const [reviews, setReviews] = useState<ConflictReview[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [resolveModalVisible, setResolveModalVisible] = useState(false)
  const [escalateModalVisible, setEscalateModalVisible] = useState(false)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [resolveForm] = Form.useForm()
  const [escalateForm] = Form.useForm()
  const [reviewForm] = Form.useForm()

  useEffect(() => {
    if (id) {
      loadData(parseInt(id))
    }
  }, [id])

  const loadData = async (conflictId: number) => {
    setLoading(true)
    try {
      const [conflictRes, commRes, reviewRes] = await Promise.all([
        api.conflicts.getById(conflictId),
        api.conflicts.getCommunications(conflictId),
        api.conflicts.getReviews(conflictId),
      ])

      setConflict(conflictRes.data)
      setCommunications(commRes.data)
      setReviews(reviewRes.data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !id) return

    try {
      await api.conflicts.addCommunication(parseInt(id), {
        message: messageInput,
        isInternal: false,
      })
      setMessageInput('')
      message.success('消息已发送')
      loadData(parseInt(id))
    } catch (error) {
      message.error('发送失败')
    }
  }

  const handleResolve = async () => {
    try {
      const values = await resolveForm.validateFields()
      if (!id) return

      await api.conflicts.resolve(parseInt(id), {
        resolution: values.resolution,
        resolutionType: values.resolutionType,
        newSchedule1Id: values.newSchedule1Id,
        newSchedule2Id: values.newSchedule2Id,
      })

      message.success('冲突已解决')
      setResolveModalVisible(false)
      loadData(parseInt(id))
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleEscalate = async () => {
    try {
      const values = await escalateForm.validateFields()
      if (!id) return

      await api.conflicts.escalate(parseInt(id), {
        reason: values.reason,
        escalateTo: values.escalateTo,
      })

      message.success('已升级处理')
      setEscalateModalVisible(false)
      loadData(parseInt(id))
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleReview = async () => {
    try {
      const values = await reviewForm.validateFields()
      if (!id) return

      await api.conflicts.addReview(parseInt(id), {
        reviewComment: values.reviewComment,
        reviewResult: values.reviewResult,
      })

      message.success('复核意见已提交')
      setReviewModalVisible(false)
      loadData(parseInt(id))
    } catch (error) {
      message.error('操作失败')
    }
  }

  const getConflictLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Low: 'success',
      Medium: 'warning',
      High: 'orange',
      Critical: 'error',
    }
    return colors[level] || 'default'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Pending: 'processing',
      UnderReview: 'warning',
      Resolved: 'success',
      Escalated: 'error',
      Rejected: 'default',
    }
    return colors[status] || 'default'
  }

  const getStepStatus = (status: string) => {
    if (status === 'Pending') return 'process'
    if (status === 'UnderReview') return 'process'
    if (status === 'Resolved') return 'finish'
    if (status === 'Escalated') return 'error'
    return 'wait'
  }

  if (!conflict) {
    return <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/conflicts')}>
          返回列表
        </Button>
      </div>

      {conflict.status === 'Escalated' && (
        <Alert
          message="该冲突已升级处理"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#f5222d' }} />
                冲突详情
                <Tag color={getConflictLevelColor(conflict.conflictLevel)}>
                  {conflictLevelLabels[conflict.conflictLevel]}
                </Tag>
              </Space>
            }
            extra={
              <Space>
                {conflict.status === 'Pending' && (
                  <Button type="primary" onClick={() => setResolveModalVisible(true)}>
                    处理冲突
                  </Button>
                )}
                {conflict.status === 'UnderReview' && (
                  <>
                    <Button onClick={() => setReviewModalVisible(true)}>
                      提交复核意见
                    </Button>
                    <Button type="primary" onClick={() => setResolveModalVisible(true)}>
                      解决冲突
                    </Button>
                  </>
                )}
                {conflict.status !== 'Resolved' && conflict.status !== 'Escalated' && (
                  <Button danger onClick={() => setEscalateModalVisible(true)}>
                    升级处理
                  </Button>
                )}
              </Space>
            }
          >
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="冲突ID">#{conflict.id}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(conflict.status)}>
                  {conflictStatusLabels[conflict.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="冲突类型">
                {conflict.conflictType === 'Classroom' ? '教室冲突' :
                 conflict.conflictType === 'Teacher' ? '教师冲突' :
                 conflict.conflictType === 'Student' ? '学生冲突' : '时间冲突'}
              </Descriptions.Item>
              <Descriptions.Item label="风险等级">
                <Tag color={getConflictLevelColor(conflict.conflictLevel)}>
                  {conflictLevelLabels[conflict.conflictLevel]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="冲突描述" span={2}>
                {conflict.description}
              </Descriptions.Item>
              <Descriptions.Item label="处理人">
                {conflict.assigneeName || '未分配'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(conflict.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">
              <Space>
                <SwapOutlined />
                涉及排课信息
              </Space>
            </Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="排课 1" type="inner">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="课程">{conflict.schedule1Course}</Descriptions.Item>
                    <Descriptions.Item label="教室">{conflict.schedule1Classroom}</Descriptions.Item>
                    <Descriptions.Item label="教师">{conflict.schedule1Teacher}</Descriptions.Item>
                    <Descriptions.Item label="时间">
                      {conflict.schedule1WeekDay} {conflict.schedule1Time}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="排课 2" type="inner">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="课程">{conflict.schedule2Course}</Descriptions.Item>
                    <Descriptions.Item label="教室">{conflict.schedule2Classroom}</Descriptions.Item>
                    <Descriptions.Item label="教师">{conflict.schedule2Teacher}</Descriptions.Item>
                    <Descriptions.Item label="时间">
                      {conflict.schedule2WeekDay} {conflict.schedule2Time}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            {conflict.resolution && (
              <>
                <Divider orientation="left">
                  <Space>
                    <CheckCircleOutlined />
                    解决方案
                  </Space>
                </Divider>
                <Alert
                  message={conflict.resolutionType === 'ChangeSchedule1' ? '调整排课1' :
                           conflict.resolutionType === 'ChangeSchedule2' ? '调整排课2' :
                           conflict.resolutionType === 'ChangeBoth' ? '调整双方' : '其他方式'}
                  description={conflict.resolution}
                  type="success"
                  showIcon
                />
              </>
            )}

            <Divider orientation="left">
              <Space>
                <MessageOutlined />
                沟通过程
              </Space>
            </Divider>

            <List
              dataSource={communications}
              locale={{ emptyText: '暂无沟通记录' }}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <Space>
                        <span>{item.senderName}</span>
                        {item.isInternal && <Tag color="orange">内部沟通</Tag>}
                        <span style={{ color: '#999', fontSize: 12 }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </Space>
                    }
                    description={item.message}
                  />
                </List.Item>
              )}
            />

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <TextArea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="输入沟通消息..."
                rows={2}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
              >
                发送
              </Button>
            </div>

            {reviews.length > 0 && (
              <>
                <Divider orientation="left">
                  <Space>
                    <FileTextOutlined />
                    复核意见
                  </Space>
                </Divider>
                <Timeline
                  items={reviews.map((review) => ({
                    color: review.reviewResult === 'Approved' ? 'green' :
                           review.reviewResult === 'Rejected' ? 'red' : 'blue',
                    children: (
                      <Card size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Space>
                            <Avatar size="small" icon={<UserOutlined />} />
                            <span style={{ fontWeight: 500 }}>{review.reviewerName}</span>
                            <Tag color={review.reviewResult === 'Approved' ? 'success' :
                                       review.reviewResult === 'Rejected' ? 'error' : 'default'}>
                              {review.reviewResult === 'Approved' ? '同意' :
                               review.reviewResult === 'Rejected' ? '驳回' : '需修改'}
                            </Tag>
                          </Space>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            {new Date(review.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div>{review.reviewComment}</div>
                      </Card>
                    ),
                  }))}
                />
              </>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="处理进度" size="small">
            <Steps direction="vertical" current={getCurrentStep(conflict.status)}>
              <Step
                status={conflict.status !== 'Pending' ? 'finish' : 'process'}
                title="冲突检测"
                description={new Date(conflict.createdAt).toLocaleString()}
              />
              <Step
                status={['UnderReview', 'Resolved', 'Escalated'].includes(conflict.status) ? 'finish' : 'wait'}
                title="分配处理"
                description={conflict.assignedAt ? new Date(conflict.assignedAt).toLocaleString() : '待分配'}
              />
              <Step
                status={['Resolved', 'Escalated'].includes(conflict.status) ? 'finish' : 'wait'}
                title="方案制定"
              />
              <Step
                status={conflict.status === 'Resolved' ? 'finish' : conflict.status === 'Escalated' ? 'error' : 'wait'}
                title={conflict.status === 'Escalated' ? '已升级' : '冲突解决'}
                description={conflict.resolvedAt ? new Date(conflict.resolvedAt).toLocaleString() : ''}
              />
            </Steps>
          </Card>

          <Card title="处理时效" size="small" style={{ marginTop: 16 }}>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic
                  title="已耗时"
                  value={calculateHours(conflict.createdAt)}
                  suffix="小时"
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="目标时效"
                  value={24}
                  suffix="小时"
                  valueStyle={{ fontSize: 16, color: calculateHours(conflict.createdAt) > 24 ? '#f5222d' : '#52c41a' }}
                />
              </Col>
            </Row>
            {calculateHours(conflict.createdAt) > 24 && (
              <Alert
                message="已超出处理时效"
                type="warning"
                showIcon
                size="small"
                style={{ marginTop: 8 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="处理冲突"
        open={resolveModalVisible}
        onOk={handleResolve}
        onCancel={() => setResolveModalVisible(false)}
        width={600}
      >
        <Form form={resolveForm} layout="vertical">
          <Form.Item
            name="resolutionType"
            label="解决方案类型"
            rules={[{ required: true, message: '请选择解决方案类型' }]}
          >
            <Select placeholder="请选择">
              <Option value="ChangeSchedule1">调整排课1</Option>
              <Option value="ChangeSchedule2">调整排课2</Option>
              <Option value="ChangeBoth">调整双方排课</Option>
              <Option value="Other">其他方式</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="resolution"
            label="解决方案说明"
            rules={[{ required: true, message: '请输入解决方案' }]}
          >
            <TextArea rows={4} placeholder="请详细描述解决方案..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="升级处理"
        open={escalateModalVisible}
        onOk={handleEscalate}
        onCancel={() => setEscalateModalVisible(false)}
        width={500}
      >
        <Form form={escalateForm} layout="vertical">
          <Form.Item
            name="escalateTo"
            label="升级至"
            rules={[{ required: true, message: '请选择升级对象' }]}
          >
            <Select placeholder="请选择">
              <Option value={1}>教务处主任</Option>
              <Option value={2}>分管副校长</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="reason"
            label="升级原因"
            rules={[{ required: true, message: '请输入升级原因' }]}
          >
            <TextArea rows={4} placeholder="请说明需要升级处理的原因..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交复核意见"
        open={reviewModalVisible}
        onOk={handleReview}
        onCancel={() => setReviewModalVisible(false)}
        width={500}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            name="reviewResult"
            label="复核结果"
            rules={[{ required: true, message: '请选择复核结果' }]}
          >
            <Select placeholder="请选择">
              <Option value="Approved">同意解决方案</Option>
              <Option value="NeedsRevision">需修改方案</Option>
              <Option value="Rejected">驳回方案</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="reviewComment"
            label="复核意见"
            rules={[{ required: true, message: '请输入复核意见' }]}
          >
            <TextArea rows={4} placeholder="请输入详细的复核意见..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function getCurrentStep(status: string): number {
  if (status === 'Pending') return 0
  if (status === 'UnderReview') return 1
  if (status === 'Resolved') return 3
  if (status === 'Escalated') return 3
  return 0
}

function calculateHours(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.round(diff / (1000 * 60 * 60))
}

export default ConflictDetail
