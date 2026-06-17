import { createLazyFileRoute } from '@tanstack/react-router'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Tag,
  Modal,
  Form,
  Drawer,
  Descriptions,
  Upload,
  message,
  Popconfirm,
  Card,
  List,
  Typography,
  Divider,
  Switch,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractApi, timelineApi } from '@/api'
import type { Contract, ContractAttachment } from '@/types'
import dayjs from 'dayjs'
import { useState, useMemo } from 'react'
import StatusTimelineComponent from '@/components/StatusTimeline'
import { saveAs } from 'file-saver'

// @ts-ignore
export const Route = createLazyFileRoute('/contracts')({
  component: ContractsPage,
})

const { RangePicker } = DatePicker
const { TextArea } = Input
const { Title } = Typography

const statusOptions = [
  { value: 'draft', label: '草稿', color: 'default' },
  { value: 'pending', label: '待审批', color: 'warning' },
  { value: 'approved', label: '已审批', color: 'success' },
  { value: 'completed', label: '已完成', color: 'success' },
  { value: 'cancelled', label: '已作废', color: 'error' },
]

const attachmentCategoryOptions = [
  { value: 'contract', label: '主合同' },
  { value: 'supplement', label: '补充协议' },
  { value: 'drawing', label: '图纸' },
  { value: 'quotation', label: '报价单' },
  { value: 'other', label: '其他' },
]

function ContractsPage() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [uploadForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalVisible, setModalVisible] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<any[]>([])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contracts', 'list', page, pageSize, searchForm.getFieldsValue()],
    queryFn: () => {
      const values = searchForm.getFieldsValue()
      const params: any = {
        page,
        page_size: pageSize,
        keyword: values.keyword,
        status: values.status,
      }
      if (values.dateRange) {
        params.start_date = values.dateRange[0]?.format('YYYY-MM-DD')
        params.end_date = values.dateRange[1]?.format('YYYY-MM-DD')
      }
      return contractApi.getList(params)
    },
  })

  const { data: detailData } = useQuery({
    queryKey: ['contractDetail', selectedContract?.id],
    queryFn: () => {
      if (!selectedContract?.id) return null
      return contractApi.getDetail(selectedContract.id)
    },
    enabled: !!selectedContract?.id,
  })

  const { data: attachments, refetch: refetchAttachments } = useQuery({
    queryKey: ['contractAttachments', selectedContract?.id],
    queryFn: () => {
      if (!selectedContract?.id) return []
      return contractApi.getAttachments(selectedContract.id)
    },
    enabled: !!selectedContract?.id,
  })

  const { data: timelineData } = useQuery({
    queryKey: ['contractTimeline', selectedContract?.id],
    queryFn: () => {
      if (!selectedContract?.id) return []
      return timelineApi.getByContract(selectedContract.id)
    },
    enabled: !!selectedContract?.id,
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Contract>) => contractApi.create(data),
    onSuccess: () => {
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['contracts', 'list'] })
    },
    onError: () => {
      message.error('创建失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Contract> }) =>
      contractApi.update(id, data),
    onSuccess: () => {
      message.success('更新成功')
      setModalVisible(false)
      setEditingContract(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['contracts', 'list'] })
    },
    onError: () => {
      message.error('更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contractApi.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['contracts', 'list'] })
    },
    onError: () => {
      message.error('删除失败')
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ contractId, attachmentId }: { contractId: number; attachmentId: number }) =>
      contractApi.deleteAttachment(contractId, attachmentId),
    onSuccess: () => {
      message.success('删除附件成功')
      refetchAttachments()
    },
    onError: () => {
      message.error('删除附件失败')
    },
  })

  const getStatusColor = (status: string) => {
    const option = statusOptions.find((o) => o.value === status)
    return option?.color || 'default'
  }

  const getStatusText = (status: string) => {
    const option = statusOptions.find((o) => o.value === status)
    return option?.label || status
  }

  const getCategoryText = (category?: string) => {
    const option = attachmentCategoryOptions.find((o) => o.value === category)
    return option?.label || '其他'
  }

  const handleCreate = () => {
    setEditingContract(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Contract) => {
    setEditingContract(record)
    form.setFieldsValue({
      ...record,
      sign_date: record.sign_date ? dayjs(record.sign_date) : null,
      start_date: record.start_date ? dayjs(record.start_date) : null,
      end_date: record.end_date ? dayjs(record.end_date) : null,
    })
    setModalVisible(true)
  }

  const handleViewDetail = (record: Contract) => {
    setSelectedContract(record)
    setDrawerVisible(true)
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const formattedValues = {
        ...values,
        sign_date: values.sign_date?.format('YYYY-MM-DD'),
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      }
      if (editingContract) {
        updateMutation.mutate({ id: editingContract.id, data: formattedValues })
      } else {
        createMutation.mutate(formattedValues)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleUpload = async () => {
    if (!selectedContract) return
    try {
      const values = await uploadForm.validateFields()
      setUploading(true)

      for (const file of fileList) {
        const formData = new FormData()
        formData.append('file', file.originFileObj)
        formData.append('category', values.category || 'other')
        formData.append('is_contract', String(values.is_contract || false))
        await contractApi.uploadAttachment(selectedContract.id, formData)
      }

      message.success('上传成功')
      setUploadModalVisible(false)
      setFileList([])
      uploadForm.resetFields()
      refetchAttachments()
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadAttachment = async (attachment: ContractAttachment) => {
    if (!selectedContract) return
    try {
      const blob = await contractApi.downloadAttachment(selectedContract.id, attachment.id)
      saveAs(blob, attachment.file_name)
      message.success('下载成功')
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleDeleteAttachment = (attachmentId: number) => {
    if (!selectedContract) return
    deleteAttachmentMutation.mutate({ contractId: selectedContract.id, attachmentId })
  }

  const handleSearch = () => {
    setPage(1)
    refetch()
  }

  const handleReset = () => {
    searchForm.resetFields()
    setPage(1)
    refetch()
  }

  const columns = useMemo(
    () => [
      {
        title: '合同编号',
        dataIndex: 'contract_no',
        key: 'contract_no',
        render: (text: string) => (
          <span className="font-mono text-blue-600">{text}</span>
        ),
      },
      {
        title: '项目名称',
        dataIndex: 'project_name',
        key: 'project_name',
      },
      {
        title: '客户名称',
        dataIndex: 'client_name',
        key: 'client_name',
      },
      {
        title: '合同金额',
        dataIndex: 'contract_amount',
        key: 'contract_amount',
        render: (val: number) => (
          <span className="amount-highlight">¥{val.toLocaleString()}</span>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
        ),
      },
      {
        title: '签约日期',
        dataIndex: 'sign_date',
        key: 'sign_date',
        render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
        render: (_: any, record: Contract) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              详情
            </Button>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除该合同吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  )

  return (
    <div className="page-container">
      <Card className="card-wrapper mb-4">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键字">
            <Input placeholder="合同编号/项目名称/客户名称" allowClear style={{ width: 240 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: 160 }}
              options={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="签约日期">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card className="card-wrapper">
        <div className="flex justify-between items-center mb-4">
          <Title level={4} style={{ margin: 0 }}>
            合同列表
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建合同
          </Button>
        </div>

        <Table
          dataSource={data?.items || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>

      <Modal
        title={editingContract ? '编辑合同' : '新建合同'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingContract(null)
          form.resetFields()
        }}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="contract_no"
              label="合同编号"
              rules={[{ required: true, message: '请输入合同编号' }]}
            >
              <Input placeholder="请输入合同编号" />
            </Form.Item>
            <Form.Item
              name="project_name"
              label="项目名称"
              rules={[{ required: true, message: '请输入项目名称' }]}
            >
              <Input placeholder="请输入项目名称" />
            </Form.Item>
            <Form.Item
              name="client_name"
              label="客户名称"
              rules={[{ required: true, message: '请输入客户名称' }]}
            >
              <Input placeholder="请输入客户名称" />
            </Form.Item>
            <Form.Item name="client_phone" label="客户电话">
              <Input placeholder="请输入客户电话" />
            </Form.Item>
            <Form.Item
              name="contract_amount"
              label="合同金额"
              rules={[{ required: true, message: '请输入合同金额' }]}
            >
              <Input
                type="number"
                prefix="¥"
                placeholder="请输入合同金额"
                addonBefore="¥"
              />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select
                placeholder="请选择状态"
                options={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
              />
            </Form.Item>
            <Form.Item name="sign_date" label="签约日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择签约日期" />
            </Form.Item>
            <Form.Item name="area" label="面积(㎡)">
              <Input type="number" placeholder="请输入面积" />
            </Form.Item>
            <Form.Item name="house_type" label="房屋类型">
              <Select
                placeholder="请选择房屋类型"
                options={[
                  { value: 'apartment', label: '公寓' },
                  { value: 'villa', label: '别墅' },
                  { value: 'house', label: '独栋' },
                  { value: 'commercial', label: '商业' },
                ]}
              />
            </Form.Item>
            <Form.Item name="address" label="地址">
              <Input placeholder="请输入地址" />
            </Form.Item>
            <Form.Item name="start_date" label="开工日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择开工日期" />
            </Form.Item>
            <Form.Item name="end_date" label="竣工日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择竣工日期" />
            </Form.Item>
          </div>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button
              onClick={() => {
                setModalVisible(false)
                setEditingContract(null)
                form.resetFields()
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingContract ? '保存' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="合同详情"
        placement="right"
        width={800}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false)
          setSelectedContract(null)
        }}
        destroyOnClose
      >
        {selectedContract && (
          <div className="space-y-6">
            <Card title="基本信息" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="合同编号">
                  {detailData?.contract_no || selectedContract.contract_no}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={getStatusColor(detailData?.status || selectedContract.status)}>
                    {getStatusText(detailData?.status || selectedContract.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="项目名称">
                  {detailData?.project_name || selectedContract.project_name}
                </Descriptions.Item>
                <Descriptions.Item label="客户名称">
                  {detailData?.client_name || selectedContract.client_name}
                </Descriptions.Item>
                <Descriptions.Item label="客户电话">
                  {detailData?.client_phone || selectedContract.client_phone || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="房屋类型">
                  {detailData?.house_type || selectedContract.house_type || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="面积">
                  {detailData?.area ? `${detailData.area} ㎡` : selectedContract.area ? `${selectedContract.area} ㎡` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="合同金额">
                  <span className="amount-highlight">
                    ¥{(detailData?.contract_amount || selectedContract.contract_amount).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="签约日期">
                  {detailData?.sign_date || selectedContract.sign_date
                    ? dayjs(detailData?.sign_date || selectedContract.sign_date).format('YYYY-MM-DD')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="地址">
                  {detailData?.address || selectedContract.address || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="开工日期">
                  {detailData?.start_date || selectedContract.start_date
                    ? dayjs(detailData?.start_date || selectedContract.start_date).format('YYYY-MM-DD')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="竣工日期">
                  {detailData?.end_date || selectedContract.end_date
                    ? dayjs(detailData?.end_date || selectedContract.end_date).format('YYYY-MM-DD')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>
                  {detailData?.remark || selectedContract.remark || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title={
                <div className="flex items-center gap-2">
                  <PaperClipOutlined />
                  附件管理
                </div>
              }
              size="small"
              extra={
                <Button
                  type="primary"
                  size="small"
                  icon={<UploadOutlined />}
                  onClick={() => {
                    setUploadModalVisible(true)
                    setFileList([])
                    uploadForm.resetFields()
                  }}
                >
                  上传附件
                </Button>
              }
            >
              <List
                dataSource={attachments || []}
                locale={{ emptyText: '暂无附件' }}
                renderItem={(item: ContractAttachment) => (
                  <List.Item
                    key={item.id}
                    actions={[
                      <Button
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownloadAttachment(item)}
                      >
                        下载
                      </Button>,
                      <Popconfirm
                        title="确定删除该附件吗？"
                        onConfirm={() => handleDeleteAttachment(item.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined className="text-blue-500 text-xl" />}
                      title={
                        <div className="flex items-center gap-2">
                          <span>{item.file_name}</span>
                          <Tag color="blue" className="text-xs">
                            {getCategoryText(item.category)}
                          </Tag>
                          {item.is_contract && <Tag color="green" className="text-xs">合同文件</Tag>}
                        </div>
                      }
                      description={
                        <div className="text-sm text-gray-500">
                          {item.file_size ? `${(item.file_size / 1024).toFixed(2)} KB` : ''}
                          <span className="ml-4">
                            上传时间: {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Divider />

            <Card
              title={
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined />
                  状态时间线
                </div>
              }
              size="small"
            >
              <StatusTimelineComponent data={timelineData || []} />
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title="上传附件"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false)
          setFileList([])
          uploadForm.resetFields()
        }}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form form={uploadForm} layout="vertical" className="mt-4">
          <Form.Item name="category" label="附件分类">
            <Select
              placeholder="请选择附件分类"
              options={attachmentCategoryOptions}
              defaultValue="other"
            />
          </Form.Item>
          <Form.Item name="is_contract" label="是否为合同文件" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="files"
            label="选择文件"
            rules={[{ required: true, message: '请选择要上传的文件' }]}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
            >
              <Button icon={<UploadOutlined />}>选择文件（支持多文件）</Button>
            </Upload>
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button
              onClick={() => {
                setUploadModalVisible(false)
                setFileList([])
                uploadForm.resetFields()
              }}
            >
              取消
            </Button>
            <Button type="primary" onClick={handleUpload} loading={uploading}>
              上传
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
