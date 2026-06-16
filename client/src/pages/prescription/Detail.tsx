import { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Tabs,
  List,
  Avatar,
  Upload,
  message,
  Modal,
  Form,
  Input,
  Select,
  Timeline,
  Empty,
  Drawer,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UploadOutlined,
  PlusOutlined,
  FileImageOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getPrescriptionById,
  reviewPrescription,
  uploadAttachment,
  deleteAttachment,
  addSupplementNote,
  changePrescriptionStatus,
  submitPrescription,
} from '@/api/prescription'
import { getFollowUpByPrescriptionId, createFollowUp, updateFollowUp } from '@/api/business'
import { useUserStore } from '@/store/user'
import {
  PrescriptionStatus,
  PrescriptionStatusNames,
  PrescriptionStatusColors,
  UserRole,
  AttachmentType,
  AttachmentTypeNames,
} from '@/types'
import type { PrescriptionDetail, AttachmentType as AttachmentTypeEnum } from '@/types'
import dayjs from 'dayjs'

const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

const PrescriptionDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { hasRole, user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(null)

  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [reviewType, setReviewType] = useState<'approve' | 'reject'>('approve')
  const [reviewForm] = Form.useForm()

  const [supplementModalVisible, setSupplementModalVisible] = useState(false)
  const [supplementForm] = Form.useForm()

  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [statusForm] = Form.useForm()

  const [followUpModalVisible, setFollowUpModalVisible] = useState(false)
  const [followUpForm] = Form.useForm()
  const [followUp, setFollowUp] = useState<any>(null)
  const [isEditingFollowUp, setIsEditingFollowUp] = useState(false)

  const [imagePreviewVisible, setImagePreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')

  useEffect(() => {
    if (id) {
      fetchDetail()
      fetchFollowUp()
    }
  }, [id])

  const fetchDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getPrescriptionById(Number(id))
      setPrescription(data)
    } catch (error) {
      console.error('Fetch prescription detail error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowUp = async () => {
    if (!id) return
    try {
      const data = await getFollowUpByPrescriptionId(Number(id))
      setFollowUp(data)
    } catch (error) {
      console.error('Fetch follow-up error:', error)
    }
  }

  const handleSubmit = async () => {
    if (!id) return
    try {
      await submitPrescription(Number(id))
      message.success('处方已提交审核')
      fetchDetail()
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const handleReview = (type: 'approve' | 'reject') => {
    setReviewType(type)
    reviewForm.resetFields()
    setReviewModalVisible(true)
  }

  const handleReviewSubmit = async () => {
    if (!id) return
    try {
      const values = await reviewForm.validateFields()
      await reviewPrescription(Number(id), {
        isApproved: reviewType === 'approve',
        opinion: values.opinion || '',
        remark: values.remark,
      })
      message.success(reviewType === 'approve' ? '审核通过' : '已拒绝')
      setReviewModalVisible(false)
      fetchDetail()
    } catch (error) {
      console.error('Review error:', error)
    }
  }

  const handleUpload = async (file: File, type: AttachmentTypeEnum) => {
    if (!id) return false
    try {
      await uploadAttachment(Number(id), type, file)
      message.success('上传成功')
      fetchDetail()
      return true
    } catch (error) {
      console.error('Upload error:', error)
      return false
    }
  }

  const handleDeleteAttachment = (attachmentId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个附件吗？',
      onOk: async () => {
        try {
          await deleteAttachment(attachmentId)
          message.success('删除成功')
          fetchDetail()
        } catch (error) {
          console.error('Delete attachment error:', error)
        }
      },
    })
  }

  const handlePreviewImage = (filePath: string) => {
    setPreviewImage(`/${filePath}`)
    setImagePreviewVisible(true)
  }

  const handleAddSupplement = () => {
    supplementForm.resetFields()
    setSupplementModalVisible(true)
  }

  const handleSupplementSubmit = async () => {
    if (!id) return
    try {
      const values = await supplementForm.validateFields()
      await addSupplementNote(Number(id), {
        content: values.content,
        source: values.source,
      })
      message.success('添加成功')
      setSupplementModalVisible(false)
      fetchDetail()
    } catch (error) {
      console.error('Add supplement error:', error)
    }
  }

  const handleStatusChange = () => {
    statusForm.resetFields()
    setStatusModalVisible(true)
  }

  const handleStatusSubmit = async () => {
    if (!id) return
    try {
      const values = await statusForm.validateFields()
      await changePrescriptionStatus(Number(id), {
        status: values.status,
        remark: values.remark,
      })
      message.success('状态已更新')
      setStatusModalVisible(false)
      fetchDetail()
    } catch (error) {
      console.error('Status change error:', error)
    }
  }

  const handleFollowUp = () => {
    if (followUp) {
      followUpForm.setFieldsValue({
        content: followUp.content,
        result: followUp.result,
        isCompleted: followUp.isCompleted,
        remark: followUp.remark,
      })
      setIsEditingFollowUp(true)
    } else {
      followUpForm.resetFields()
      setIsEditingFollowUp(false)
    }
    setFollowUpModalVisible(true)
  }

  const handleFollowUpSubmit = async () => {
    if (!id) return
    try {
      const values = await followUpForm.validateFields()
      if (isEditingFollowUp && followUp) {
        await updateFollowUp(followUp.id, values)
      } else {
        await createFollowUp(Number(id), values)
      }
      message.success('保存成功')
      setFollowUpModalVisible(false)
      fetchFollowUp()
    } catch (error) {
      console.error('Follow-up submit error:', error)
    }
  }

  const prescriptionPhotos = prescription?.attachments.filter(
    (a) => a.type === AttachmentType.PrescriptionPhoto
  ) || []

  const supplementDocuments = prescription?.attachments.filter(
    (a) => a.type === AttachmentType.SupplementDocument
  ) || []

  const drugColumns = [
    { title: '药品名称', dataIndex: 'drugName', width: 200 },
    { title: '规格', dataIndex: 'specification', width: 140 },
    { title: '用法用量', dataIndex: 'dosage', width: 140 },
    { title: '频次', dataIndex: 'frequency', width: 120 },
    { title: '数量', dataIndex: 'quantity', width: 80, render: (v: number, r: any) => `${v} ${r.unit}` },
    { title: '单价(元)', dataIndex: 'price', width: 100, render: (v: number) => v.toFixed(2) },
    {
      title: '小计(元)',
      width: 100,
      render: (_: any, r: any) => (r.price * r.quantity).toFixed(2),
    },
    { title: '备注', dataIndex: 'remark' },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <div className="page-title">
            处方详情 - {prescription?.prescriptionNo}
            <Tag
              color={prescription ? PrescriptionStatusColors[prescription.status] : 'default'}
              style={{ marginLeft: 12 }}
            >
              {prescription?.statusName}
            </Tag>
            {prescription?.hasUnclearRecord && (
              <Tag color="warning" icon={<ExclamationCircleOutlined />}>
                有不清记录
              </Tag>
            )}
          </div>
        </Space>
        <Space>
          {hasRole([UserRole.Cashier, UserRole.StoreManager]) &&
            prescription?.status === PrescriptionStatus.Pending && (
              <Button type="primary" onClick={handleSubmit}>
                提交审核
              </Button>
            )}
          {hasRole([UserRole.Pharmacist, UserRole.StoreManager]) &&
            (prescription?.status === PrescriptionStatus.Reviewing ||
              prescription?.status === PrescriptionStatus.SupplementRequired) && (
              <>
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleReview('approve')}>
                  审核通过
                </Button>
                <Button danger icon={<CloseCircleOutlined />} onClick={() => handleReview('reject')}>
                  审核拒绝
                </Button>
              </>
            )}
          {hasRole([UserRole.Pharmacist, UserRole.StoreManager, UserRole.Headquarters]) && (
            <Button onClick={handleStatusChange}>状态变更</Button>
          )}
        </Space>
      </div>

      <Tabs defaultActiveKey="1">
        <TabPane tab="基本信息" key="1">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="患者信息" size="small">
              <Descriptions column={3} size="small">
                <Descriptions.Item label="姓名">{prescription?.patientName}</Descriptions.Item>
                <Descriptions.Item label="性别">{prescription?.gender}</Descriptions.Item>
                <Descriptions.Item label="年龄">{prescription?.age} 岁</Descriptions.Item>
                <Descriptions.Item label="联系电话">{prescription?.patientPhone}</Descriptions.Item>
                <Descriptions.Item label="门店">{prescription?.storeName}</Descriptions.Item>
                <Descriptions.Item label="收银员">{prescription?.cashierName}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="处方信息" size="small">
              <Descriptions column={3} size="small">
                <Descriptions.Item label="处方编号">{prescription?.prescriptionNo}</Descriptions.Item>
                <Descriptions.Item label="处方日期">
                  {dayjs(prescription?.prescriptionDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="诊断">{prescription?.diagnosis}</Descriptions.Item>
                <Descriptions.Item label="医生">{prescription?.doctorName}</Descriptions.Item>
                <Descriptions.Item label="医院">{prescription?.hospital}</Descriptions.Item>
                <Descriptions.Item label="状态">{prescription?.statusName}</Descriptions.Item>
                <Descriptions.Item label="药师">{prescription?.pharmacistName || '-'}</Descriptions.Item>
                <Descriptions.Item label="提交时间">
                  {prescription?.submittedAt
                    ? dayjs(prescription.submittedAt).format('YYYY-MM-DD HH:mm')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="审核时间">
                  {prescription?.reviewedAt
                    ? dayjs(prescription.reviewedAt).format('YYYY-MM-DD HH:mm')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={3}>
                  {prescription?.remark || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title={
                <Space>
                  <span>药品明细</span>
                  <Tag color="blue">{prescription?.itemCount} 种</Tag>
                </Space>
              }
              size="small"
            >
              <Table
                rowKey="id"
                columns={drugColumns}
                dataSource={prescription?.items || []}
                pagination={false}
                size="small"
                bordered
              />
            </Card>
          </Space>
        </TabPane>

        <TabPane tab="处方照片 & 附件" key="2">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card
              title="处方照片"
              extra={
                <Upload
                  showUploadList={false}
                  customRequest={async ({ file }) => {
                    await handleUpload(file as File, AttachmentType.PrescriptionPhoto)
                  }}
                  accept="image/*"
                >
                  <Button type="primary" size="small" icon={<UploadOutlined />}>
                    上传处方照片
                  </Button>
                </Upload>
              }
              size="small"
            >
              {prescriptionPhotos.length === 0 ? (
                <Empty description="暂无处方照片" />
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {prescriptionPhotos.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        width: 120,
                        textAlign: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                      onClick={() => handlePreviewImage(att.filePath)}
                    >
                      <div
                        style={{
                          width: 120,
                          height: 120,
                          border: '1px solid #d9d9d9',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#fafafa',
                          marginBottom: 8,
                        }}
                      >
                        <FileImageOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#595959',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {att.originalFileName}
                      </div>
                      {hasRole([UserRole.Pharmacist, UserRole.StoreManager]) && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          style={{ position: 'absolute', top: -4, right: -4 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteAttachment(att.id)
                          }}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card
              title="补充资料"
              extra={
                <Upload
                  showUploadList={false}
                  customRequest={async ({ file }) => {
                    await handleUpload(file as File, AttachmentType.SupplementDocument)
                  }}
                >
                  <Button type="primary" size="small" icon={<UploadOutlined />}>
                    上传补充资料
                  </Button>
                </Upload>
              }
              size="small"
            >
              {supplementDocuments.length === 0 ? (
                <Empty description="暂无补充资料" />
              ) : (
                <List
                  dataSource={supplementDocuments}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          size="small"
                          danger
                          onClick={() => handleDeleteAttachment(item.id)}
                        >
                          删除
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<FileImageOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
                        title={item.originalFileName}
                        description={
                          <Space size={16}>
                            <span>上传者：{item.uploaderName}</span>
                            <span>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Space>
        </TabPane>

        <TabPane tab="药师意见" key="3">
          <Card size="small">
            {prescription?.pharmacistOpinions.length === 0 ? (
              <Empty description="暂无药师意见" />
            ) : (
              <List
                dataSource={prescription?.pharmacistOpinions}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <Space>
                          <span>{item.pharmacistName}</span>
                          <Tag color={item.isApproved ? 'success' : 'error'}>
                            {item.isApproved ? '同意' : '拒绝'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 8 }}>{item.opinion}</div>
                          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                            {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="补充说明" key="4">
          <Card
            size="small"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddSupplement}>
                添加补充说明
              </Button>
            }
          >
            {prescription?.supplementNotes.length === 0 ? (
              <Empty description="暂无补充说明" />
            ) : (
              <List
                dataSource={prescription?.supplementNotes}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <Space>
                          <span>{item.operatorName}</span>
                          <Tag color="blue">{item.source}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 8 }}>{item.content}</div>
                          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                            {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="处理痕迹" key="5">
          <Card size="small">
            {prescription?.auditLogs.length === 0 ? (
              <Empty description="暂无处理记录" />
            ) : (
              <Timeline
                items={prescription?.auditLogs.map((log) => ({
                  color:
                    log.newStatusName === '审核通过' || log.newStatusName === '已完成'
                      ? 'green'
                      : log.newStatusName === '审核拒绝'
                      ? 'red'
                      : log.newStatusName === '处方不清'
                      ? 'orange'
                      : 'blue',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>
                        {log.action}
                        <Tag
                          color={
                            log.newStatusName === '审核通过' || log.newStatusName === '已完成'
                              ? 'success'
                              : log.newStatusName === '审核拒绝'
                              ? 'error'
                              : 'processing'
                          }
                          style={{ marginLeft: 8 }}
                        >
                          {log.oldStatusName} → {log.newStatusName}
                        </Tag>
                      </div>
                      <div style={{ color: '#595959', marginBottom: 4 }}>
                        操作人：{log.operatorName}
                      </div>
                      {log.remark && (
                        <div style={{ color: '#8c8c8c', fontSize: 13 }}>备注：{log.remark}</div>
                      )}
                      <div style={{ color: '#bfbfbf', fontSize: 12, marginTop: 4 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="回访记录" key="6">
          <Card
            size="small"
            extra={
              hasRole([UserRole.Pharmacist, UserRole.StoreManager]) && (
                <Button type="primary" size="small" onClick={handleFollowUp}>
                  {followUp ? '编辑回访' : '添加回访'}
                </Button>
              )
            }
          >
            {!followUp ? (
              <Empty description="暂无回访记录" />
            ) : (
              <div>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="回访人">{followUp.operatorName}</Descriptions.Item>
                  <Descriptions.Item label="回访时间">
                    {dayjs(followUp.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={followUp.isCompleted ? 'success' : 'processing'}>
                      {followUp.isCompleted ? '已完成' : '进行中'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="完成时间">
                    {followUp.completedAt
                      ? dayjs(followUp.completedAt).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="回访内容" span={2}>
                    {followUp.content}
                  </Descriptions.Item>
                  <Descriptions.Item label="回访结果" span={2}>
                    {followUp.result}
                  </Descriptions.Item>
                  <Descriptions.Item label="备注" span={2}>
                    {followUp.remark || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={reviewType === 'approve' ? '审核通过' : '审核拒绝'}
        open={reviewModalVisible}
        onOk={handleReviewSubmit}
        onCancel={() => setReviewModalVisible(false)}
        okText="确认"
        cancelText="取消"
        width={500}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            name="opinion"
            label={reviewType === 'approve' ? '审核意见' : '拒绝原因'}
            rules={
              reviewType === 'reject' ? [{ required: true, message: '请填写拒绝原因' }] : []
            }
          >
            <TextArea rows={4} placeholder={reviewType === 'approve' ? '请输入审核意见（选填）' : '请输入拒绝原因'} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="请输入备注（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加补充说明"
        open={supplementModalVisible}
        onOk={handleSupplementSubmit}
        onCancel={() => setSupplementModalVisible(false)}
        okText="提交"
        cancelText="取消"
        width={500}
      >
        <Form form={supplementForm} layout="vertical">
          <Form.Item
            name="content"
            label="补充内容"
            rules={[{ required: true, message: '请输入补充内容' }]}
          >
            <TextArea rows={4} placeholder="请输入补充说明内容" />
          </Form.Item>
          <Form.Item
            name="source"
            label="来源"
            rules={[{ required: true, message: '请选择来源' }]}
            initialValue="线下补充"
          >
            <Select placeholder="请选择来源">
              <Option value="线下补充">线下补充</Option>
              <Option value="电话沟通">电话沟通</Option>
              <Option value="系统录入">系统录入</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="状态变更"
        open={statusModalVisible}
        onOk={handleStatusSubmit}
        onCancel={() => setStatusModalVisible(false)}
        okText="确认"
        cancelText="取消"
        width={500}
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item
            name="status"
            label="目标状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择目标状态">
              {Object.entries(PrescriptionStatusNames).map(([key, value]) => (
                <Option key={key} value={Number(key)}>
                  {value}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="变更原因">
            <TextArea rows={3} placeholder="请输入变更原因（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={isEditingFollowUp ? '编辑回访' : '添加回访'}
        open={followUpModalVisible}
        onOk={handleFollowUpSubmit}
        onCancel={() => setFollowUpModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <Form form={followUpForm} layout="vertical">
          <Form.Item
            name="content"
            label="回访内容"
            rules={[{ required: true, message: '请输入回访内容' }]}
          >
            <TextArea rows={3} placeholder="请输入回访内容" />
          </Form.Item>
          <Form.Item
            name="result"
            label="回访结果"
            rules={[{ required: true, message: '请输入回访结果' }]}
          >
            <TextArea rows={3} placeholder="请输入回访结果" />
          </Form.Item>
          <Form.Item
            name="isCompleted"
            label="是否完成"
            valuePropName="checked"
          >
            <Select>
              <Option value={false}>否</Option>
              <Option value={true}>是</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="请输入备注（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        width={600}
        open={imagePreviewVisible}
        onClose={() => setImagePreviewVisible(false)}
        title="图片预览"
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="预览"
            style={{ width: '100%' }}
          />
        )}
      </Drawer>
    </div>
  )
}

export default PrescriptionDetail
