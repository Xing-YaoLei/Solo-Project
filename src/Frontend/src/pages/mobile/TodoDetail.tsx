import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Divider,
  Input,
  Modal,
  Upload,
  message,
  Empty,
  Avatar,
  Row,
  Col,
  Progress,
  Image,
  Badge,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  EditOutlined,
  UploadOutlined,
  PaperClipOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { todoApi } from '@/api'
import { useAppStore } from '@/store'
import type { TodoTaskDto, TodoStatus, TodoPriority } from '@/types'
import {
  formatTodoStatus,
  formatTodoPriority,
  formatDateOnly,
  formatDateTime,
} from '@/utils/format'

const { TextArea } = Input

const TodoDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { setLoading } = useAppStore()
  const [todo, setTodo] = useState<TodoTaskDto | null>(null)
  const [resultModalVisible, setResultModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [result, setResult] = useState('')
  const [description, setDescription] = useState('')

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await todoApi.getDetail(id)
      setTodo(data)
      setDescription(data.description || '')
    } catch (error) {
      console.error('获取待办详情失败:', error)
    } finally {
      setLoading(false)
    }
  }, [id, setLoading])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleComplete = async () => {
    if (!id) return
    try {
      await todoApi.complete(id, result || undefined)
      message.success('任务已完成')
      setResultModalVisible(false)
      setResult('')
      fetchData()
    } catch (error) {
      console.error('完成任务失败:', error)
    }
  }

  const handleStart = async () => {
    if (!id) return
    try {
      await todoApi.updateStatus(id, 1)
      message.success('已开始处理')
      fetchData()
    } catch (error) {
      console.error('开始任务失败:', error)
    }
  }

  const handleSaveDescription = async () => {
    if (!id) return
    try {
      await todoApi.update(id, { description })
      message.success('保存成功')
      setEditModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  if (!todo) {
    return <Empty description="加载中..." />
  }

  const statusInfo = formatTodoStatus(todo.status as TodoStatus)
  const priorityInfo = formatTodoPriority(todo.priority as TodoPriority)

  const getProgress = () => {
    switch (todo.status) {
      case 0:
        return 0
      case 1:
        return 50
      case 2:
        return 100
      default:
        return 0
    }
  }

  const getProgressStatus = (): 'success' | 'exception' | 'active' | 'normal' => {
    if (todo.status === 2) return 'success'
    if (todo.status === 3) return 'exception'
    if (todo.status === 1) return 'active'
    return 'normal'
  }

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/mobile')}>
          返回
        </Button>
      </Space>

      <Card
        style={{
          marginBottom: 12,
          borderLeft: `4px solid ${todo.status === 3 ? '#ff4d4f' : priorityInfo.color === 'error' ? '#ff4d4f' : priorityInfo.color === 'warning' ? '#faad14' : '#1677ff'}`,
        }}
      >
        <Row gutter={12}>
          <Col span={24}>
            <Space align="start" style={{ width: '100%' }}>
              <Avatar
                size="large"
                icon={
                  todo.priority === 3 ? (
                    <ExclamationCircleOutlined />
                  ) : todo.priority === 2 ? (
                    <ClockCircleOutlined />
                  ) : (
                    <ClockCircleOutlined />
                  )
                }
                style={{
                  backgroundColor:
                    todo.priority === 3
                      ? '#ff4d4f'
                      : todo.priority === 2
                      ? '#faad14'
                      : '#1677ff',
                }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, marginBottom: 8 }}>{todo.title}</h3>
                <Space size={8} wrap>
                  <Tag color={statusInfo.color as 'blue' | 'green' | 'red' | 'orange' | 'default'}>
                    {statusInfo.text}
                  </Tag>
                  <Tag color={priorityInfo.color as 'blue' | 'green' | 'red' | 'orange' | 'default'}>
                    {priorityInfo.text}优先级
                  </Tag>
                  {todo.category && <Tag>{todo.category}</Tag>}
                </Space>
              </div>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <Progress
              percent={getProgress()}
              status={getProgressStatus()}
              showInfo={true}
              size="small"
            />
          </div>
        </div>

        <Descriptions column={1} size="small" labelStyle={{ width: 80 }}>
          <Descriptions.Item label="任务编号">
            <Space>
              <span>{todo.taskNo}</span>
              {todo.attachmentUrls && todo.attachmentUrls.length > 0 && (
                <Badge count={todo.attachmentUrls.length} offset={[0, 2]}>
                  <PaperClipOutlined style={{ color: '#1677ff' }} />
                </Badge>
              )}
            </Space>
          </Descriptions.Item>
          {todo.orderNumber && (
            <Descriptions.Item label="关联订单">
              <Space>
                <HomeOutlined />
                <span>{todo.apartmentNumber}</span>
                <span style={{ color: '#666' }}>{todo.orderNumber}</span>
              </Space>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="处理人">
            <Space>
              <UserOutlined />
              <span>{todo.assignedToName || '-'}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="创建人">{todo.createdByName || '-'}</Descriptions.Item>
          <Descriptions.Item label="截止日期">
            <span
              style={{
                color: todo.status === 3 ? '#ff4d4f' : dayjs(todo.dueDate).isBefore(dayjs(), 'day') ? '#ff4d4f' : undefined,
              }}
            >
              {formatDateOnly(todo.dueDate)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="开始时间">
            {todo.startedAt ? formatDateTime(todo.startedAt) : <span style={{ color: '#999' }}>未开始</span>}
          </Descriptions.Item>
          <Descriptions.Item label="完成时间">
            {todo.completedAt ? formatDateTime(todo.completedAt) : <span style={{ color: '#999' }}>未完成</span>}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(todo.createdAt)}</Descriptions.Item>
        </Descriptions>

        {todo.description && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <div style={{ color: '#666', marginBottom: 8 }}>任务描述</div>
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
                {todo.description}
              </div>
            </div>
          </>
        )}

        {todo.result && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <div style={{ color: '#666', marginBottom: 8 }}>处理结果</div>
              <div style={{ padding: 12, background: '#f0f9ff', borderRadius: 6, border: '1px solid #bae0ff' }}>
                {todo.result}
              </div>
            </div>
          </>
        )}

        {todo.attachmentUrls && todo.attachmentUrls.length > 0 && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <div style={{ color: '#666', marginBottom: 8 }}>
                <Space>
                  <PaperClipOutlined />
                  <span>附件 ({todo.attachmentUrls.length})</span>
                </Space>
              </div>
              <Image.PreviewGroup>
                <Row gutter={8}>
                  {todo.attachmentUrls.map((url, idx) => (
                    <Col key={idx} xs={8} sm={6}>
                      <Image
                        src={url}
                        alt={`附件${idx + 1}`}
                        width="100%"
                        style={{ borderRadius: 4 }}
                      />
                    </Col>
                  ))}
                </Row>
              </Image.PreviewGroup>
            </div>
          </>
        )}
      </Card>

      <div style={{ position: 'fixed', bottom: 70, left: 12, right: 12 }}>
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          {todo.status === 0 && (
            <Button type="primary" block icon={<EditOutlined />} onClick={handleStart}>
              开始处理
            </Button>
          )}
          {todo.status === 1 && (
            <Space style={{ width: '100%' }}>
              <Button icon={<EditOutlined />} block onClick={() => setEditModalVisible(true)}>
                编辑
              </Button>
              <Button
                type="primary"
                block
                icon={<CheckOutlined />}
                onClick={() => setResultModalVisible(true)}
              >
                完成任务
              </Button>
            </Space>
          )}
          {(todo.status === 2 || todo.status === 3 || todo.status === 4) && (
            <Button disabled block>
              {statusInfo.text}
            </Button>
          )}
        </Space>
      </div>

      <Modal
        title="填写处理结果"
        open={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        onOk={handleComplete}
        okText="确认完成"
      >
        <TextArea
          rows={4}
          value={result}
          onChange={(e) => setResult(e.target.value)}
          placeholder="请输入处理结果"
        />
        <div style={{ marginTop: 12 }}>
          <Upload multiple>
            <Button icon={<UploadOutlined />}>上传附件</Button>
          </Upload>
        </div>
      </Modal>

      <Modal
        title="编辑任务"
        open={editModalVisible}
        onCancel={() => {
          setDescription(todo.description || '')
          setEditModalVisible(false)
        }}
        onOk={handleSaveDescription}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6, color: '#666' }}>任务描述</div>
          <TextArea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入任务描述"
          />
        </div>
      </Modal>
    </div>
  )
}

export default TodoDetail
