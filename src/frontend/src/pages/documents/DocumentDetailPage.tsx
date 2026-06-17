import { useState } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Typography,
  Button,
  Tabs,
  Table,
  Space,
  Spin,
  Alert,
  Row,
  Col,
  Statistic,
  List,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Popconfirm,
} from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  HistoryOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  PaperClipOutlined,
  UploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { documentApi } from '@/api'
import {
  formatCurrency,
  documentStatusColors,
  documentStatusLabels,
  documentTypeLabels,
  amountConsistencyColors,
  amountConsistencyLabels,
} from '@/config/status'
import {
  DocumentStatus,
  AmountConsistencyStatus,
  type DocumentItem,
  type DocumentHistory,
  type Attachment,
} from '@/types'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps, UploadFile } from 'antd/es/upload'

const { Title, Text } = Typography
const { TextArea } = Input

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('info')
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [approvalType, setApprovalType] = useState<'approve' | 'reject'>('approve')
  const [approvalComment, setApprovalComment] = useState('')
  const [form] = Form.useForm()
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([])
  const [uploadDescription, setUploadDescription] = useState('')

  const { data: document, isLoading, error } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentApi.getDocument(id!),
    enabled: !!id,
  })

  const { data: history } = useQuery({
    queryKey: ['document', id, 'history'],
    queryFn: () => documentApi.getDocumentHistory(id!),
    enabled: !!id && activeTab === 'history',
  })

  const { data: attachments } = useQuery({
    queryKey: ['document', id, 'attachments'],
    queryFn: () => documentApi.getAttachments(id!),
    enabled: !!id,
  })

  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ file, description }: { file: File; description?: string }) =>
      documentApi.uploadAttachment(id!, file, description),
    onSuccess: () => {
      message.success('附件上传成功')
      setUploadFileList([])
      setUploadDescription('')
      queryClient.invalidateQueries({ queryKey: ['document', id] })
      queryClient.invalidateQueries({ queryKey: ['document', id, 'attachments'] })
    },
    onError: () => {
      message.error('附件上传失败')
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => documentApi.deleteAttachment(attachmentId),
    onSuccess: () => {
      message.success('附件删除成功')
      queryClient.invalidateQueries({ queryKey: ['document', id] })
      queryClient.invalidateQueries({ queryKey: ['document', id, 'attachments'] })
    },
    onError: () => {
      message.error('附件删除失败')
    },
  })

  const handleUpload = () => {
    if (uploadFileList.length === 0) {
      message.warning('请先选择要上传的文件')
      return
    }
    const file = uploadFileList[0].originFileObj as File
    uploadAttachmentMutation.mutate({ file, description: uploadDescription || undefined })
  }

  const handleFileChange: UploadProps['onChange'] = (info) => {
    setUploadFileList(info.fileList.slice(-1))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const submitMutation = useMutation({
    mutationFn: () => documentApi.submitForApproval(id!),
    onSuccess: () => {
      message.success('提交审批成功')
      queryClient.invalidateQueries({ queryKey: ['document', id] })
    },
    onError: () => {
      message.error('提交审批失败')
    },
  })

  const approveMutation = useMutation({
    mutationFn: () => documentApi.approve(id!, { comments: approvalComment }),
    onSuccess: () => {
      message.success('审批通过成功')
      setIsApprovalModalOpen(false)
      setApprovalComment('')
      queryClient.invalidateQueries({ queryKey: ['document', id] })
    },
    onError: () => {
      message.error('审批操作失败')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => documentApi.reject(id!, { comments: approvalComment }),
    onSuccess: () => {
      message.success('拒绝审批成功')
      setIsApprovalModalOpen(false)
      setApprovalComment('')
      queryClient.invalidateQueries({ queryKey: ['document', id] })
    },
    onError: () => {
      message.error('拒绝操作失败')
    },
  })

  const verifyAmountMutation = useMutation({
    mutationFn: () => documentApi.verifyAmountConsistency(id!),
    onSuccess: () => {
      message.success('金额一致性校验已触发')
      queryClient.invalidateQueries({ queryKey: ['document', id] })
    },
    onError: () => {
      message.error('金额一致性校验失败')
    },
  })

  const handleApproval = async () => {
    if (approvalType === 'approve') {
      approveMutation.mutate()
    } else {
      rejectMutation.mutate()
    }
  }

  const openApprovalModal = (type: 'approve' | 'reject') => {
    setApprovalType(type)
    setIsApprovalModalOpen(true)
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !document) {
    return <Alert type="error" message="加载单据详情失败，请稍后重试" />
  }

  const getAmountConsistencyIcon = (status: AmountConsistencyStatus) => {
    switch (status) {
      case AmountConsistencyStatus.Consistent:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case AmountConsistencyStatus.Inconsistent:
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      case AmountConsistencyStatus.PendingVerification:
        return <WarningOutlined style={{ color: '#faad14' }} />
      case AmountConsistencyStatus.Resolved:
        return <CheckCircleOutlined style={{ color: '#1890ff' }} />
      default:
        return null
    }
  }

  const itemColumns: ColumnsType<DocumentItem> = [
    {
      title: '序号',
      dataIndex: 'itemOrder',
      key: 'itemOrder',
      width: 60,
    },
    {
      title: '编码',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 100,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 150,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (value) => value.toFixed(2),
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (value) => formatCurrency(value),
    },
    {
      title: '小计',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 140,
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: '关联材料',
      dataIndex: 'materialName',
      key: 'materialName',
      width: 150,
      render: (value) => value || '-',
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
  ]

  const calculateItemsTotal = (items: DocumentItem[] = []) => {
    return items.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const itemsTotal = calculateItemsTotal(document.items)

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {document.amountConsistency === AmountConsistencyStatus.Inconsistent && (
            <Alert
              message="金额不一致"
              description={
                <div>
                  预期金额: <Text delete>{formatCurrency(document.expectedAmount)}</Text>
                  <span style={{ margin: '0 8px' }}>→</span>
                  实际金额: <Text strong>{formatCurrency(document.actualAmount || 0)}</Text>
                  <span style={{ marginLeft: 16 }} className="amount-difference">
                    差额: {formatCurrency(document.amountDifference)}
                  </span>
                </div>
              }
              type="error"
              showIcon
              action={
                <Button size="small" onClick={() => verifyAmountMutation.mutate()} loading={verifyAmountMutation.isPending}>
                  重新校验
                </Button>
              }
            />
          )}

          {document.amountConsistency === AmountConsistencyStatus.PendingVerification && (
            <Alert
              message="金额一致性待核实"
              description="请确认预期金额与实际金额是否一致"
              type="warning"
              showIcon
              action={
                <Button size="small" onClick={() => verifyAmountMutation.mutate()} loading={verifyAmountMutation.isPending}>
                  立即核实
                </Button>
              }
            />
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="预期金额"
                  value={document.expectedAmount}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="实际金额"
                  value={document.actualAmount || 0}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: document.amountConsistency === AmountConsistencyStatus.Inconsistent ? '#ff4d4f' : '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="差额"
                  value={Math.abs(document.amountDifference)}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: document.amountDifference !== 0 ? '#ff4d4f' : '#52c41a' }}
                  prefixCls={document.amountDifference !== 0 ? 'amount-difference' : 'amount-consistent'}
                />
              </Card>
            </Col>
          </Row>

          <Card title="单据详情">
            <Descriptions column={2} bordered size="middle">
              <Descriptions.Item label="单据编号">{document.documentNumber}</Descriptions.Item>
              <Descriptions.Item label="单据类型">{documentTypeLabels[document.type]}</Descriptions.Item>
              <Descriptions.Item label="单据标题">{document.title}</Descriptions.Item>
              <Descriptions.Item label="所属项目">
                <Button type="link" onClick={() => navigate(`/projects/${document.projectId}`)}>
                  {document.projectName}
                </Button>
              </Descriptions.Item>
              <Descriptions.Item label="单据状态">
                <Tag color={documentStatusColors[document.status]} icon={<ClockCircleOutlined />}>
                  {documentStatusLabels[document.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="金额一致性">
                <Tag color={amountConsistencyColors[document.amountConsistency]} icon={getAmountConsistencyIcon(document.amountConsistency)}>
                  {amountConsistencyLabels[document.amountConsistency]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{document.createdByName}</Descriptions.Item>
              <Descriptions.Item label="创建日期">
                {dayjs(document.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="测量/记录日期">
                {dayjs(document.measurementDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="审批日期">
                {document.approvalDate ? dayjs(document.approvalDate).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="明细项数">{document.itemCount} 项</Descriptions.Item>
              <Descriptions.Item label="附件数">{document.attachmentCount} 个</Descriptions.Item>
              <Descriptions.Item label="待审批节点">{document.pendingApprovalCount} 个</Descriptions.Item>
              <Descriptions.Item label="备注说明" span={2}>
                {document.description || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="明细清单">
            <Table
              columns={itemColumns}
              dataSource={document.items || []}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1200 }}
              summary={(pageData) => {
                let total = 0
                pageData.forEach((item) => {
                  total += item.subtotal
                })
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={7} align="right">
                        <Text strong>明细合计:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                          {formatCurrency(total)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} colSpan={3} />
                    </Table.Summary.Row>
                    {document.expectedAmount !== itemsTotal && (
                      <Table.Summary.Row style={{ background: '#fff2f0' }}>
                        <Table.Summary.Cell index={0} colSpan={7} align="right">
                          <Text type="warning">单据预期金额:</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                            {formatCurrency(document.expectedAmount)}
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} colSpan={3} />
                      </Table.Summary.Row>
                    )}
                  </Table.Summary>
                )
              }}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined /> 变更历史 ({history?.length || 0})
        </span>
      ),
      children: (
        <Card>
          <List
            dataSource={history || []}
            loading={!history}
            renderItem={(item: DocumentHistory) => (
              <List.Item key={item.id}>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.action}</Text>
                      {item.oldStatus && item.newStatus && (
                        <>
                          <Tag color={documentStatusColors[item.oldStatus]}>
                            {documentStatusLabels[item.oldStatus]}
                          </Tag>
                          <span>→</span>
                          <Tag color={documentStatusColors[item.newStatus]}>
                            {documentStatusLabels[item.newStatus]}
                          </Tag>
                        </>
                      )}
                      {item.source && <Tag color="blue">{item.source}</Tag>}
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        {item.createdByName} · {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                      </Text>
                      {item.conclusion && (
                        <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                          <Text type="secondary">结论：</Text>
                          <Text>{item.conclusion}</Text>
                        </div>
                      )}
                      {(item.oldValues || item.materialsBefore) && (
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">变更前：</Text>
                          <div style={{ padding: 8, background: '#fafafa', borderRadius: 4, fontFamily: 'monospace' }}>
                            {item.oldValues || item.materialsBefore}
                          </div>
                        </div>
                      )}
                      {(item.newValues || item.materialsAfter) && (
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">变更后：</Text>
                          <div style={{ padding: 8, background: '#f0f9ff', borderRadius: 4, fontFamily: 'monospace' }}>
                            {item.newValues || item.materialsAfter}
                          </div>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'attachments',
      label: (
        <span>
          <PaperClipOutlined /> 附件管理 ({attachments?.length || 0})
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="上传附件" type="inner">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                fileList={uploadFileList}
                onChange={handleFileChange}
                beforeUpload={() => false}
                maxCount={1}
                onRemove={() => setUploadFileList([])}
              >
                <Button icon={<UploadOutlined />}>选择文件</Button>
              </Upload>
              <Input
                placeholder="附件描述（选填）"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
              <Button
                type="primary"
                onClick={handleUpload}
                loading={uploadAttachmentMutation.isPending}
                disabled={uploadFileList.length === 0}
              >
                上传附件
              </Button>
            </Space>
          </Card>

          <Card title="附件列表" type="inner">
            <List
              dataSource={attachments || []}
              loading={!attachments}
              locale={{ emptyText: '暂无附件' }}
              renderItem={(item: Attachment) => (
                <List.Item
                  key={item.id}
                  actions={[
                    <Button
                      key="download"
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => window.open(item.filePath, '_blank')}
                    >
                      下载
                    </Button>,
                    <Popconfirm
                      key="delete"
                      title="确认删除该附件？"
                      onConfirm={() => deleteAttachmentMutation.mutate(item.id)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deleteAttachmentMutation.isPending && deleteAttachmentMutation.variables === item.id}
                      >
                        删除
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<PaperClipOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={
                      <Space>
                        <Text strong>{item.originalFileName}</Text>
                        <Tag color="blue">{formatFileSize(item.fileSize)}</Tag>
                        {item.description && <Tag>{item.description}</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          上传时间: {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                        {item.contentType && (
                          <Text type="secondary">类型: {item.contentType}</Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/documents')}>
            返回列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            <FileTextOutlined /> {document.title}
          </Title>
          <Tag color={documentStatusColors[document.status]} style={{ margin: 0 }}>
            {documentStatusLabels[document.status]}
          </Tag>
          <Tag color={amountConsistencyColors[document.amountConsistency]} icon={getAmountConsistencyIcon(document.amountConsistency)}>
            {amountConsistencyLabels[document.amountConsistency]}
          </Tag>
        </Space>
        <Space wrap>
          {document.status === DocumentStatus.Draft && (
            <>
              <Button icon={<EditOutlined />}>编辑单据</Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => submitMutation.mutate()}
                loading={submitMutation.isPending}
              >
                提交审批
              </Button>
            </>
          )}
          {(document.status === DocumentStatus.PendingReview ||
            document.status === DocumentStatus.PendingApproval) && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => openApprovalModal('approve')}
                loading={approveMutation.isPending}
              >
                审批通过
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => openApprovalModal('reject')}
                loading={rejectMutation.isPending}
              >
                拒绝审批
              </Button>
            </>
          )}
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setActiveTab('history')}
          >
            查看历史
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title={approvalType === 'approve' ? '审批通过' : '拒绝审批'}
        open={isApprovalModalOpen}
        onOk={handleApproval}
        onCancel={() => setIsApprovalModalOpen(false)}
        confirmLoading={approveMutation.isPending || rejectMutation.isPending}
        okText={approvalType === 'approve' ? '确认通过' : '确认拒绝'}
        okButtonProps={{ danger: approvalType === 'reject' }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="审批意见">
            <TextArea
              rows={4}
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder={approvalType === 'approve' ? '请输入审批通过的意见（选填）' : '请输入拒绝的原因（必填）'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DocumentDetailPage
