import { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Form,
  Space,
  Tag,
  Modal,
  message,
  Checkbox,
  Drawer,
  Radio,
  Upload,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { TableProps } from 'antd'
import {
  getPrescriptions,
  batchReviewPrescriptions,
  uploadAttachment,
  changePrescriptionStatus,
  submitPrescription,
} from '@/api/prescription'
import { getStores } from '@/api/business'
import { useUserStore } from '@/store/user'
import {
  PrescriptionStatus,
  PrescriptionStatusNames,
  PrescriptionStatusColors,
  UserRole,
  AttachmentType,
} from '@/types'
import type { Prescription, Store, PrescriptionQuery } from '@/types'
import dayjs from 'dayjs'
import PrescriptionForm from './components/PrescriptionForm'

const { RangePicker } = DatePicker
const { TextArea } = Input
const { Option } = Select

const PrescriptionList = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { hasRole, user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Prescription[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [query, setQuery] = useState<PrescriptionQuery>({})

  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [batchReviewModalVisible, setBatchReviewModalVisible] = useState(false)
  const [batchReviewForm] = Form.useForm()
  const [batchActionType, setBatchActionType] = useState<'approve' | 'reject' | 'unclear'>('approve')
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [statusForm] = Form.useForm()
  const [uploadDrawerVisible, setUploadDrawerVisible] = useState(false)

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    fetchData()
  }, [pagination.current, pagination.pageSize, query])

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setCreateModalVisible(true)
    }
    const initQuery: PrescriptionQuery = {}
    const statusParam = searchParams.get('status')
    if (statusParam !== null) {
      initQuery.status = parseInt(statusParam) as PrescriptionStatus
    }
    const storeIdParam = searchParams.get('storeId')
    if (storeIdParam !== null) {
      initQuery.storeId = parseInt(storeIdParam)
    }
    if (searchParams.get('followUpCompleted') === 'true') {
      initQuery.followUpCompleted = true
    }
    if (Object.keys(initQuery).length > 0) {
      setQuery(initQuery)
    }
  }, [searchParams])

  const fetchStores = async () => {
    try {
      const data = await getStores()
      setStores(data)
    } catch (error) {
      console.error('Fetch stores error:', error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await getPrescriptions({
        ...query,
        pageIndex: pagination.current,
        pageSize: pagination.pageSize,
      })
      setData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      console.error('Fetch prescriptions error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (values: any) => {
    const newQuery: PrescriptionQuery = {}
    if (values.keyword) newQuery.keyword = values.keyword
    if (values.status !== undefined) newQuery.status = values.status
    if (values.storeId) newQuery.storeId = values.storeId
    if (values.patientName) newQuery.patientName = values.patientName
    if (values.dateRange) {
      newQuery.startDate = values.dateRange[0].format('YYYY-MM-DD')
      newQuery.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }
    if (values.hasUnclearRecord !== undefined) newQuery.hasUnclearRecord = values.hasUnclearRecord
    setQuery(newQuery)
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleReset = () => {
    setQuery({})
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleTableChange: TableProps<Prescription>['onChange'] = (pag) => {
    setPagination({
      current: pag.current || 1,
      pageSize: pag.pageSize || 20,
    })
  }

  const handleRowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys)
    },
    getCheckboxProps: (record: Prescription) => ({
      disabled: record.status !== PrescriptionStatus.Reviewing && record.status !== PrescriptionStatus.SupplementRequired,
    }),
  }

  const handleBatchApprove = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审核的处方')
      return
    }
    setBatchActionType('approve')
    batchReviewForm.resetFields()
    setBatchReviewModalVisible(true)
  }

  const handleBatchReject = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审核的处方')
      return
    }
    setBatchActionType('reject')
    batchReviewForm.resetFields()
    setBatchReviewModalVisible(true)
  }

  const handleBatchMarkUnclear = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要标记的处方')
      return
    }
    Modal.confirm({
      title: '确认标记',
      content: `确定将选中的 ${selectedRowKeys.length} 条处方标记为"处方不清"吗？`,
      onOk: async () => {
        try {
          for (const id of selectedRowKeys) {
            await changePrescriptionStatus(Number(id), {
              status: PrescriptionStatus.Unclear,
              remark: '批量标记为处方不清',
            })
          }
          message.success('批量标记成功')
          setSelectedRowKeys([])
          fetchData()
        } catch (error) {
          console.error('Batch mark unclear error:', error)
        }
      },
    })
  }

  const handleBatchReviewSubmit = async () => {
    try {
      const values = await batchReviewForm.validateFields()
      await batchReviewPrescriptions({
        ids: selectedRowKeys.map(Number),
        isApproved: batchActionType === 'approve',
        opinion: values.opinion || '',
      })
      message.success('批量审核成功')
      setBatchReviewModalVisible(false)
      setSelectedRowKeys([])
      fetchData()
    } catch (error) {
      console.error('Batch review error:', error)
    }
  }

  const handleViewDetail = (id: number) => {
    navigate(`/prescriptions/${id}`)
  }

  const handleCreateSuccess = () => {
    setCreateModalVisible(false)
    fetchData()
    message.success('创建成功')
  }

  const handleQuickSubmit = async (record: Prescription) => {
    try {
      await submitPrescription(record.id)
      message.success('处方已提交审核')
      fetchData()
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const handleQuickStatusChange = (record: Prescription) => {
    setSelectedPrescription(record)
    statusForm.resetFields()
    setStatusModalVisible(true)
  }

  const handleStatusChangeSubmit = async () => {
    if (!selectedPrescription) return
    try {
      const values = await statusForm.validateFields()
      await changePrescriptionStatus(selectedPrescription.id, {
        status: values.status,
        remark: values.remark,
      })
      message.success('状态已更新')
      setStatusModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Status change error:', error)
    }
  }

  const columns: TableProps<Prescription>['columns'] = [
    {
      title: '处方编号',
      dataIndex: 'prescriptionNo',
      width: 140,
      fixed: 'left',
      render: (text, record) => (
        <a onClick={() => handleViewDetail(record.id)}>{text}</a>
      ),
    },
    {
      title: '患者姓名',
      dataIndex: 'patientName',
      width: 100,
    },
    {
      title: '性别/年龄',
      width: 100,
      render: (_, record) => `${record.gender} / ${record.age}岁`,
    },
    {
      title: '诊断',
      dataIndex: 'diagnosis',
      width: 140,
      ellipsis: true,
    },
    {
      title: '处方日期',
      dataIndex: 'prescriptionDate',
      width: 110,
      render: (text) => dayjs(text).format('YYYY-MM-DD'),
    },
    {
      title: '门店',
      dataIndex: 'storeName',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (status, record) => (
        <Space direction="vertical" size={2}>
          <Tag color={PrescriptionStatusColors[status]} className="status-tag">
            {PrescriptionStatusNames[status]}
          </Tag>
          {record.hasUnclearRecord && (
            <Tag color="orange" style={{ margin: 0 }}>
              <ExclamationCircleOutlined /> 有不清记录
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '药品种类',
      dataIndex: 'itemCount',
      width: 90,
      render: (count) => `${count} 种`,
    },
    {
      title: '附件数',
      dataIndex: 'attachmentCount',
      width: 80,
      render: (count) => `${count} 个`,
    },
    {
      title: '收银员',
      dataIndex: 'cashierName',
      width: 100,
    },
    {
      title: '药师',
      dataIndex: 'pharmacistName',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record.id)}>
            查看
          </Button>
          {hasRole([UserRole.Pharmacist, UserRole.StoreManager]) &&
            (record.status === PrescriptionStatus.Reviewing ||
              record.status === PrescriptionStatus.SupplementRequired) && (
              <Button type="link" size="small" onClick={() => handleQuickStatusChange(record)}>
                审核
              </Button>
            )}
          {hasRole([UserRole.Cashier, UserRole.StoreManager]) && record.status === PrescriptionStatus.Pending && (
            <Button type="link" size="small" onClick={() => handleQuickSubmit(record)}>
              提交审核
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const canShowCheckbox = useMemo(() => {
    return hasRole([UserRole.Pharmacist, UserRole.StoreManager, UserRole.Headquarters])
  }, [hasRole])

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">处方审核排程台</div>
        <Space>
          {hasRole([UserRole.Cashier, UserRole.StoreManager]) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
              新建处方
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
        </Space>
      </div>

      <div className="filter-section">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="处方编号/患者姓名" style={{ width: 200 }} allowClear />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" style={{ width: 140 }} allowClear>
              {Object.entries(PrescriptionStatusNames).map(([key, value]) => (
                <Option key={key} value={Number(key)}>
                  {value}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {hasRole([UserRole.Headquarters, UserRole.StoreManager]) && (
            <Form.Item name="storeId" label="门店">
              <Select placeholder="全部" style={{ width: 160 }} allowClear>
                {stores.map((store) => (
                  <Option key={store.id} value={store.id}>
                    {store.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker />
          </Form.Item>
          <Form.Item name="hasUnclearRecord" label="处方不清记录" valuePropName="checked">
            <Checkbox>仅显示有不清记录</Checkbox>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      {canShowCheckbox && (
        <div className="table-toolbar">
          <div className="batch-actions">
            <span>已选择 {selectedRowKeys.length} 项</span>
            {hasRole([UserRole.Pharmacist, UserRole.StoreManager]) && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleBatchApprove}
                  disabled={selectedRowKeys.length === 0}
                >
                  批量通过
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={handleBatchReject}
                  disabled={selectedRowKeys.length === 0}
                >
                  批量拒绝
                </Button>
              </>
            )}
            {hasRole([UserRole.Pharmacist, UserRole.StoreManager]) && (
              <Button
                icon={<ExclamationCircleOutlined />}
                onClick={handleBatchMarkUnclear}
                disabled={selectedRowKeys.length === 0}
              >
                标记不清
              </Button>
            )}
          </div>
        </div>
      )}

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        onChange={handleTableChange}
        rowSelection={canShowCheckbox ? handleRowSelection : undefined}
        scroll={{ x: 1400 }}
        size="middle"
      />

      <Modal
        title={
          hasRole([UserRole.Pharmacist, UserRole.StoreManager]) && batchActionType === 'approve'
            ? '批量审核通过'
            : '批量审核拒绝'
        }
        open={batchReviewModalVisible}
        onOk={handleBatchReviewSubmit}
        onCancel={() => setBatchReviewModalVisible(false)}
        okText="确认"
        cancelText="取消"
        width={500}
      >
        <p style={{ marginBottom: 16 }}>
          已选择 <strong style={{ color: '#1677ff' }}>{selectedRowKeys.length}</strong> 条处方，
          {batchActionType === 'approve' ? '批量审核通过' : '批量审核拒绝'}。
        </p>
        <Form form={batchReviewForm} layout="vertical">
          <Form.Item
            name="opinion"
            label={batchActionType === 'approve' ? '审核意见' : '拒绝原因'}
            rules={
              batchActionType === 'reject'
                ? [{ required: true, message: '请填写拒绝原因' }]
                : []
            }
          >
            <TextArea rows={4} placeholder={batchActionType === 'approve' ? '请输入审核意见（选填）' : '请输入拒绝原因'} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="状态变更"
        open={statusModalVisible}
        onOk={handleStatusChangeSubmit}
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
            <Select placeholder="请选择状态">
              {Object.entries(PrescriptionStatusNames).map(([key, value]) => (
                <Option key={key} value={Number(key)}>
                  {value}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注说明">
            <TextArea rows={3} placeholder="请输入备注说明（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新建处方"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <PrescriptionForm
          stores={stores}
          defaultStoreId={user?.storeId}
          onSuccess={handleCreateSuccess}
          onCancel={() => setCreateModalVisible(false)}
        />
      </Modal>
    </div>
  )
}

export default PrescriptionList
