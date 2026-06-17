import { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Tabs,
  Timeline,
  Table,
  Button,
  Space,
  Spin,
  message,
  Progress,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Popconfirm
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  UploadOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import type { UploadProps } from 'antd'
import { getSiteDetail } from '@/services/site'
import { getSiteTimeline } from '@/services/timeline'
import { getSiteSubmissions, reviewSubmission, retrySubmission, closeSubmission } from '@/services/submission'
import { getSiteActionLogs } from '@/services/actionLog'
import type {
  ConstructionSite,
  TimelineChange,
  MaterialSubmission,
  ActionLog
} from '@/types'
import {
  SubmissionStatus,
  SubmissionStatusText,
  ChangeTypeText,
  ActionTypeText,
  MaterialCategory,
  MaterialCategoryText
} from '@/types'
import { formatDateTime } from '@/utils/date'

const { TabPane } = Tabs
const { Option } = Select

function SiteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [site, setSite] = useState<ConstructionSite | null>(null)
  const [timeline, setTimeline] = useState<TimelineChange[]>([])
  const [submissions, setSubmissions] = useState<MaterialSubmission[]>([])
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([])
  const [activeTab, setActiveTab] = useState('timeline')
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [reviewingSubmission, setReviewingSubmission] = useState<MaterialSubmission | null>(null)
  const [reviewForm] = Form.useForm()

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [siteData, timelineData, submissionsData, logsData] = await Promise.all([
        getSiteDetail(Number(id)),
        getSiteTimeline(Number(id)),
        getSiteSubmissions(Number(id)),
        getSiteActionLogs(Number(id))
      ])
      setSite(siteData)
      setTimeline(timelineData)
      setSubmissions(submissionsData)
      setActionLogs(logsData)
    } catch (error) {
      message.error('获取详情失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return 'default'
      case 1:
        return 'processing'
      case 2:
        return 'warning'
      case 3:
        return 'success'
      case 4:
        return 'success'
      case 5:
        return 'default'
      default:
        return 'default'
    }
  }

  const getSubmissionStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.Pending:
        return 'default'
      case SubmissionStatus.Submitted:
        return 'processing'
      case SubmissionStatus.Approved:
        return 'success'
      case SubmissionStatus.Rejected:
        return 'error'
      case SubmissionStatus.Closed:
        return 'default'
      default:
        return 'default'
    }
  }

  const handleReview = (record: MaterialSubmission) => {
    setReviewingSubmission(record)
    reviewForm.resetFields()
    setReviewModalVisible(true)
  }

  const handleReviewSubmit = async () => {
    try {
      const values = await reviewForm.validateFields()
      if (reviewingSubmission) {
        await reviewSubmission({
          id: reviewingSubmission.id,
          status: values.status,
          reviewComment: values.reviewComment
        })
        message.success('审核完成')
        setReviewModalVisible(false)
        fetchData()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleRetry = async (record: MaterialSubmission) => {
    try {
      await retrySubmission({ id: record.id, operatorName: '管理员' })
      message.success('已重新提交')
      fetchData()
    } catch (error) {
      message.error('操作失败')
      console.error(error)
    }
  }

  const handleClose = async (record: MaterialSubmission) => {
    try {
      await closeSubmission({ id: record.id, operatorName: '管理员' })
      message.success('已关闭')
      fetchData()
    } catch (error) {
      message.error('操作失败')
      console.error(error)
    }
  }

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/upload',
    headers: {
      authorization: 'authorization-text'
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 文件上传成功`)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 文件上传失败`)
      }
    }
  }

  const submissionColumns = [
    {
      title: '材料名称',
      dataIndex: 'materialName',
      key: 'materialName'
    },
    {
      title: '分类',
      dataIndex: 'materialCategory',
      key: 'materialCategory',
      render: (category: MaterialCategory) => MaterialCategoryText[category]
    },
    {
      title: '是否必需',
      dataIndex: 'isRequired',
      key: 'isRequired',
      render: (required: boolean) => (
        <Tag color={required ? 'red' : 'default'}>{required ? '是' : '否'}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: SubmissionStatus) => (
        <Tag color={getSubmissionStatusColor(status)}>{SubmissionStatusText[status]}</Tag>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => date ? formatDateTime(date) : '-'
    },
    {
      title: '提交人',
      dataIndex: 'submittedBy',
      key: 'submittedBy',
      render: (name: string) => name || '-'
    },
    {
      title: '审核意见',
      dataIndex: 'reviewComment',
      key: 'reviewComment',
      ellipsis: true,
      render: (comment: string) => comment || '-'
    },
    {
      title: '重试次数',
      dataIndex: 'retryCount',
      key: 'retryCount'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: MaterialSubmission) => (
        <Space size="small">
          {record.status === SubmissionStatus.Submitted && (
            <Button type="link" size="small" onClick={() => handleReview(record)}>
              审核
            </Button>
          )}
          {record.status === SubmissionStatus.Rejected && (
            <Button type="link" size="small" onClick={() => handleRetry(record)}>
              重新提交
            </Button>
          )}
          {(record.status === SubmissionStatus.Pending || record.status === SubmissionStatus.Rejected) && (
            <Popconfirm
              title="确定关闭该材料提交吗？"
              onConfirm={() => handleClose(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>
                关闭
              </Button>
            </Popconfirm>
          )}
          {record.filePath && (
            <Button type="link" size="small">
              下载
            </Button>
          )}
        </Space>
      )
    }
  ]

  const actionLogColumns = [
    {
      title: '动作类型',
      dataIndex: 'actionType',
      key: 'actionType',
      render: (type: number) => ActionTypeText[type as keyof typeof ActionTypeText] || '其他'
    },
    {
      title: '动作标题',
      dataIndex: 'actionTitle',
      key: 'actionTitle'
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      render: (name: string) => name || '-'
    },
    {
      title: '操作人角色',
      dataIndex: 'operatorRole',
      key: 'operatorRole',
      render: (role: string) => role || '-'
    },
    {
      title: '操作时间',
      dataIndex: 'actionTime',
      key: 'actionTime',
      render: (date: string) => formatDateTime(date)
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip: string) => ip || '-'
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Spin spinning={loading}>
        <Card
          title={
            <Space>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/sites')}
              />
              <span>{site?.siteName || '工地详情'}</span>
              <Tag color={site ? getStatusColor(site.status) : 'default'}>
                {site?.statusText}
              </Tag>
            </Space>
          }
          extra={
            <Space>
              <Button icon={<EditOutlined />}>编辑</Button>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>上传材料</Button>
              </Upload>
            </Space>
          }
        >
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="工地名称">{site?.siteName}</Descriptions.Item>
            <Descriptions.Item label="地址">{site?.address}</Descriptions.Item>
            <Descriptions.Item label="客户">{site?.customerName}</Descriptions.Item>
            <Descriptions.Item label="客户电话">{site?.customerPhone}</Descriptions.Item>
            <Descriptions.Item label="区域">{site?.areaName}</Descriptions.Item>
            <Descriptions.Item label="负责人">{site?.personInChargeName}</Descriptions.Item>
            <Descriptions.Item label="负责人电话">{site?.personInChargePhone}</Descriptions.Item>
            <Descriptions.Item label="标签分组">{site?.tagGroup || '-'}</Descriptions.Item>
            <Descriptions.Item label="计划开工日期">{site?.plannedStartDate || '-'}</Descriptions.Item>
            <Descriptions.Item label="计划完工日期">{site?.plannedEndDate || '-'}</Descriptions.Item>
            <Descriptions.Item label="实际开工日期">{site?.actualStartDate || '-'}</Descriptions.Item>
            <Descriptions.Item label="实际完工日期">{site?.actualEndDate || '-'}</Descriptions.Item>
            <Descriptions.Item label="确认截止日期">{site?.confirmationDeadline || '-'}</Descriptions.Item>
            <Descriptions.Item label="预算金额">{site?.budget ? `¥${site.budget}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="资料完整率" span={2}>
              <Progress
                percent={Math.round(site?.materialCompleteRate || 0)}
                format={(percent) => `${percent}% (${site?.submittedMaterialCount || 0}/${site?.totalMaterialCount || 0})`}
              />
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{site?.remark || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card style={{ marginTop: '16px' }}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane
              tab={
                <span>
                  <ClockCircleOutlined />
                  变更时间线
                </span>
              }
              key="timeline"
            >
              <div style={{ padding: '16px 0' }}>
                <Timeline
                  items={timeline.map((item) => ({
                    color: item.changeType === 0 ? 'blue' : item.changeType === 1 ? 'orange' : 'green',
                    children: (
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.changeTitle}</div>
                        <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                          {item.changeDescription}
                        </div>
                        {item.oldValue && item.newValue && (
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            {item.oldValue} → {item.newValue}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                          <Space>
                            <span>{ChangeTypeText[item.changeType]}</span>
                            <span>·</span>
                            <span>{item.operatorName || '系统'}</span>
                            <span>·</span>
                            <span>{formatDateTime(item.changeTime)}</span>
                          </Space>
                        </div>
                      </div>
                    )
                  }))}
                />
                {timeline.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    <InfoCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <div>暂无变更记录</div>
                  </div>
                )}
              </div>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <FileTextOutlined />
                  材料提交
                </span>
              }
              key="submissions"
            >
              <Table
                columns={submissionColumns}
                dataSource={submissions}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <HistoryOutlined />
                  动作日志
                </span>
              }
              key="actionLogs"
            >
              <Table
                columns={actionLogColumns}
                dataSource={actionLogs}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </TabPane>
          </Tabs>
        </Card>
      </Spin>

      <Modal
        title="材料审核"
        open={reviewModalVisible}
        onOk={handleReviewSubmit}
        onCancel={() => setReviewModalVisible(false)}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            name="status"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select placeholder="请选择审核结果">
              <Option value={SubmissionStatus.Approved}>
                <Space>
                  <CheckOutlined style={{ color: '#52c41a' }} />
                  通过
                </Space>
              </Option>
              <Option value={SubmissionStatus.Rejected}>
                <Space>
                  <CloseOutlined style={{ color: '#f5222d' }} />
                  驳回
                </Space>
              </Option>
            </Select>
          </Form.Item>
          <Form.Item name="reviewComment" label="审核意见">
            <Input.TextArea rows={4} placeholder="请输入审核意见" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SiteDetail
