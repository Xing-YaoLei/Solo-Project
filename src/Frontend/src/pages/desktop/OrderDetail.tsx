import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Divider,
  Form,
  Select,
  Input,
  DatePicker,
  Modal,
  Upload,
  message,
  Empty,
  List,
  Badge,
  Table,
  InputNumber,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ArrowLeftOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { orderApi, todoApi, staffApi } from '@/api'
import { useAppStore } from '@/store'
import Timeline from '@/components/Timeline'
import type {
  MoveOutOrderDetailDto,
  TodoTaskDto,
  TimelineEventDto,
  MoveOutStatus,
  StaffDto,
  UtilityReadingDto,
  UtilitySummaryDto,
  InspectionItemDto,
  InspectionRecordDto,
  InspectionSummaryDto,
  PaymentRecordDto,
  PaymentSummaryDto,
  ComplaintTagDto,
  ComplaintSummaryDto,
  CreateUtilityReadingDto,
  CreateInspectionRecordDto,
  CreatePaymentRecordDto,
  CreateComplaintTagDto,
  InspectionItemStatus,
  PaymentType,
  PaymentMethod,
  ResponsibilityParty,
} from '@/types'
import {
  formatMoveOutStatus,
  formatTodoStatus,
  formatTodoPriority,
  formatDateOnly,
  formatDateTime,
  formatCurrency,
  moveOutStatusMap,
  formatInspectionItemStatus,
  formatPaymentType,
  formatPaymentMethod,
  formatResponsibilityParty,
  paymentTypeMap,
  paymentMethodMap,
} from '@/utils/format'

const { TextArea } = Input
const { Option } = Select

const OrderDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { setLoading } = useAppStore()
  const [order, setOrder] = useState<MoveOutOrderDetailDto | null>(null)
  const [todos, setTodos] = useState<TodoTaskDto[]>([])
  const [timeline, setTimeline] = useState<TimelineEventDto[]>([])
  const [staffList, setStaffList] = useState<StaffDto[]>([])
  const [utilityReadings, setUtilityReadings] = useState<UtilityReadingDto[]>([])
  const [utilitySummary, setUtilitySummary] = useState<UtilitySummaryDto | null>(null)
  const [inspectionItems, setInspectionItems] = useState<InspectionItemDto[]>([])
  const [inspectionRecords, setInspectionRecords] = useState<InspectionRecordDto[]>([])
  const [inspectionSummary, setInspectionSummary] = useState<InspectionSummaryDto | null>(null)
  const [payments, setPayments] = useState<PaymentRecordDto[]>([])
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummaryDto | null>(null)
  const [complaints, setComplaints] = useState<ComplaintTagDto[]>([])
  const [complaintSummary, setComplaintSummary] = useState<ComplaintSummaryDto | null>(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [noteModalVisible, setNoteModalVisible] = useState(false)
  const [utilityModalVisible, setUtilityModalVisible] = useState(false)
  const [inspectionModalVisible, setInspectionModalVisible] = useState(false)
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [complaintModalVisible, setComplaintModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('basic')
  const [editForm] = Form.useForm()
  const [noteForm] = Form.useForm()
  const [utilityForm] = Form.useForm()
  const [inspectionForm] = Form.useForm()
  const [paymentForm] = Form.useForm()
  const [complaintForm] = Form.useForm()

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [
        orderData,
        todoData,
        timelineData,
        staffData,
        utilityData,
        inspectionItemsData,
        inspectionData,
        paymentData,
        complaintData,
      ] = await Promise.all([
        orderApi.getDetail(id),
        todoApi.getByOrderId(id),
        orderApi.getTimeline(id),
        staffApi.getActive(),
        orderApi.getUtilityReadings(id),
        orderApi.getInspectionItems(id),
        orderApi.getInspectionRecords(id),
        orderApi.getPayments(id),
        orderApi.getComplaints(id),
      ])
      setOrder(orderData)
      setTodos(todoData)
      setTimeline(timelineData)
      setStaffList(staffData)
      setUtilityReadings(utilityData.items)
      setUtilitySummary(utilityData.summary)
      setInspectionItems(inspectionItemsData)
      setInspectionRecords(inspectionData.items)
      setInspectionSummary(inspectionData.summary)
      setPayments(paymentData.items)
      setPaymentSummary(paymentData.summary)
      setComplaints(complaintData.items)
      setComplaintSummary(complaintData.summary)
    } catch (error) {
      console.error('获取订单详情失败:', error)
    } finally {
      setLoading(false)
    }
  }, [id, setLoading])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEdit = () => {
    if (!order) return
    editForm.setFieldsValue({
      status: order.status,
      assignedHandlerId: order.assignedHandlerId,
      coHandlerId: order.coHandlerId,
      moveOutDate: order.moveOutDate ? dayjs(order.moveOutDate) : null,
      actualMoveOutDate: order.actualMoveOutDate ? dayjs(order.actualMoveOutDate) : null,
      inspectionDate: order.inspectionDate ? dayjs(order.inspectionDate) : null,
      reason: order.reason,
      reviewResult: order.reviewResult,
    })
    setEditModalVisible(true)
  }

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      const submitData = {
        ...values,
        moveOutDate: values.moveOutDate?.format('YYYY-MM-DDTHH:mm:ss'),
        actualMoveOutDate: values.actualMoveOutDate?.format('YYYY-MM-DDTHH:mm:ss'),
        inspectionDate: values.inspectionDate?.format('YYYY-MM-DDTHH:mm:ss'),
      }
      await orderApi.update(id!, submitData)
      message.success('更新成功')
      setEditModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('更新失败:', error)
    }
  }

  const handleAddNote = async () => {
    try {
      const values = await noteForm.validateFields()
      await orderApi.addTimelineNote({
        moveOutOrderId: id!,
        notes: values.notes,
      })
      message.success('添加备注成功')
      setNoteModalVisible(false)
      noteForm.resetFields()
      fetchData()
    } catch (error) {
      console.error('添加备注失败:', error)
    }
  }

  const handleAddUtility = async () => {
    try {
      const values = await utilityForm.validateFields()
      const data: CreateUtilityReadingDto = {
        moveOutOrderId: id!,
        utilityType: values.utilityType,
        previousReading: values.previousReading,
        currentReading: values.currentReading,
        unit: values.unit,
        usageAmount: values.usageAmount,
        unitPrice: values.unitPrice,
        totalAmount: values.totalAmount,
        readingDate: values.readingDate.format('YYYY-MM-DDTHH:mm:ss'),
        remarks: values.remarks,
      }
      await orderApi.createUtilityReading(id!, data)
      message.success('录入水电读数成功')
      setUtilityModalVisible(false)
      utilityForm.resetFields()
      fetchData()
    } catch (error) {
      console.error('录入水电读数失败:', error)
    }
  }

  const handleAddInspection = async () => {
    try {
      const values = await inspectionForm.validateFields()
      const data: CreateInspectionRecordDto = {
        moveOutOrderId: id!,
        inspectionDate: values.inspectionDate.format('YYYY-MM-DDTHH:mm:ss'),
        overallCondition: values.overallCondition,
        remarks: values.remarks,
        items: inspectionItems.map((item) => ({
          category: item.category,
          itemName: item.itemName,
          location: item.location,
          status: item.status,
          description: item.description,
          estimatedCost: item.estimatedCost,
          responsibility: item.responsibility,
          photoUrls: item.photoUrls,
        })),
      }
      await orderApi.createInspectionRecord(id!, data)
      message.success('创建验房记录成功')
      setInspectionModalVisible(false)
      inspectionForm.resetFields()
      fetchData()
    } catch (error) {
      console.error('创建验房记录失败:', error)
    }
  }

  const handleAddPayment = async () => {
    try {
      const values = await paymentForm.validateFields()
      const data: CreatePaymentRecordDto = {
        moveOutOrderId: id!,
        paymentType: values.paymentType,
        paymentMethod: values.paymentMethod,
        amount: values.amount,
        payerName: values.payerName,
        payeeName: values.payeeName,
        transactionNo: values.transactionNo,
        paymentDate: values.paymentDate.format('YYYY-MM-DDTHH:mm:ss'),
        remarks: values.remarks,
      }
      await orderApi.createPayment(id!, data)
      message.success('创建收款记录成功')
      setPaymentModalVisible(false)
      paymentForm.resetFields()
      fetchData()
    } catch (error) {
      console.error('创建收款记录失败:', error)
    }
  }

  const handleAddComplaint = async () => {
    try {
      const values = await complaintForm.validateFields()
      const data: CreateComplaintTagDto = {
        moveOutOrderId: id!,
        tagType: values.tagType,
        description: values.description,
        severity: values.severity,
        remarks: values.remarks,
      }
      await orderApi.createComplaint(id!, data)
      message.success('添加投诉标签成功')
      setComplaintModalVisible(false)
      complaintForm.resetFields()
      fetchData()
    } catch (error) {
      console.error('添加投诉标签失败:', error)
    }
  }

  if (!order) {
    return <Empty description="加载中..." />
  }

  const statusInfo = formatMoveOutStatus(order.status as MoveOutStatus)

  const utilityColumns: ColumnsType<UtilityReadingDto> = [
    {
      title: '类型',
      dataIndex: 'utilityType',
      key: 'utilityType',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '上次读数',
      dataIndex: 'previousReading',
      key: 'previousReading',
      width: 100,
    },
    {
      title: '本次读数',
      dataIndex: 'currentReading',
      key: 'currentReading',
      width: 100,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '用量',
      dataIndex: 'usageAmount',
      key: 'usageAmount',
      width: 100,
      render: (v: number | null) => v ?? '-',
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      render: (v: number | null) => formatCurrency(v),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (v: number | null) => formatCurrency(v),
    },
    {
      title: '读数日期',
      dataIndex: 'readingDate',
      key: 'readingDate',
      width: 120,
      render: (v: string) => formatDateOnly(v),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      render: (v: string | null) => v || '-',
    },
  ]

  const inspectionRecordColumns: ColumnsType<InspectionRecordDto> = [
    {
      title: '记录编号',
      dataIndex: 'recordNumber',
      key: 'recordNumber',
      width: 150,
    },
    {
      title: '验房日期',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      width: 120,
      render: (v: string) => formatDateOnly(v),
    },
    {
      title: '验房员',
      dataIndex: 'inspectorName',
      key: 'inspectorName',
      width: 100,
      render: (v: string | null) => v || '-',
    },
    {
      title: '项目数',
      dataIndex: 'items',
      key: 'items',
      width: 80,
      render: (items: InspectionItemDto[]) => items.length,
    },
    {
      title: '预估费用',
      dataIndex: 'totalEstimatedCost',
      key: 'totalEstimatedCost',
      width: 100,
      render: (v: number | null) => formatCurrency(v),
    },
    {
      title: '整体状况',
      dataIndex: 'overallCondition',
      key: 'overallCondition',
      ellipsis: true,
      render: (v: string | null) => v || '-',
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      render: (v: string | null) => v || '-',
    },
  ]

  const paymentColumns: ColumnsType<PaymentRecordDto> = [
    {
      title: '收款编号',
      dataIndex: 'paymentNumber',
      key: 'paymentNumber',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 100,
      render: (v: PaymentType) => <Tag color="blue">{formatPaymentType(v)}</Tag>,
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100,
      render: (v: PaymentMethod) => formatPaymentMethod(v),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (v: number) => formatCurrency(v),
    },
    {
      title: '付款人',
      dataIndex: 'payerName',
      key: 'payerName',
      width: 100,
      render: (v: string | null) => v || '-',
    },
    {
      title: '收款人',
      dataIndex: 'payeeName',
      key: 'payeeName',
      width: 100,
      render: (v: string | null) => v || '-',
    },
    {
      title: '交易号',
      dataIndex: 'transactionNo',
      key: 'transactionNo',
      width: 150,
      render: (v: string | null) => v || '-',
    },
    {
      title: '收款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (v: string) => formatDateOnly(v),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      render: (v: string | null) => v || '-',
    },
  ]

  const complaintColumns: ColumnsType<ComplaintTagDto> = [
    {
      title: '标签类型',
      dataIndex: 'tagType',
      key: 'tagType',
      width: 120,
      render: (text: string) => <Tag color="red">{text}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (v: number) => {
        const colorMap: Record<number, string> = { 1: 'green', 2: 'orange', 3: 'red' }
        const textMap: Record<number, string> = { 1: '低', 2: '中', 3: '高' }
        return <Tag color={colorMap[v] || 'default'}>{textMap[v] || '未知'}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'resolved',
      key: 'resolved',
      width: 100,
      render: (v: boolean | undefined) => (
        <Tag color={v ? 'success' : 'error'}>{v ? '已解决' : '未解决'}</Tag>
      ),
    },
    {
      title: '标记人',
      dataIndex: 'taggedBy',
      key: 'taggedBy',
      width: 100,
      render: (v: string | null) => v || '-',
    },
    {
      title: '标记时间',
      dataIndex: 'taggedAt',
      key: 'taggedAt',
      width: 150,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '解决备注',
      dataIndex: 'resolutionNotes',
      key: 'resolutionNotes',
      ellipsis: true,
      render: (v: string | null) => v || '-',
    },
  ]

  const tabListNoTitle = [
    { key: 'basic', label: '基本信息' },
    { key: 'todos', label: `待办任务 (${todos.length})` },
    { key: 'utility', label: `水电读数 (${utilityReadings.length})` },
    { key: 'inspection', label: `验房清单 (${inspectionRecords.length})` },
    { key: 'payment', label: `收款流水 (${payments.length})` },
    { key: 'complaint', label: `投诉标签 (${complaints.length})` },
    { key: 'timeline', label: '时间轴' },
  ]

  const contentListNoTitle: Record<string, React.ReactNode> = {
    basic: (
      <>
        <Descriptions title="房屋信息" bordered column={2} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="房屋编号">{order.apartmentNumber}</Descriptions.Item>
          <Descriptions.Item label="楼栋">{order.building}</Descriptions.Item>
          <Descriptions.Item label="楼层">{order.floor}</Descriptions.Item>
          <Descriptions.Item label="地址" span={2}>{order.address}</Descriptions.Item>
        </Descriptions>

        <Descriptions title="租客信息" bordered column={2} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="姓名">{order.tenantName}</Descriptions.Item>
          <Descriptions.Item label="电话">{order.tenantPhone}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{order.tenantEmail || '-'}</Descriptions.Item>
          <Descriptions.Item label="合同开始">{formatDateOnly(order.leaseStartDate)}</Descriptions.Item>
          <Descriptions.Item label="合同结束">{formatDateOnly(order.leaseEndDate)}</Descriptions.Item>
          <Descriptions.Item label="月租金">{formatCurrency(order.monthlyRent)}</Descriptions.Item>
          <Descriptions.Item label="押金" span={2}>{formatCurrency(order.deposit)}</Descriptions.Item>
        </Descriptions>

        <Descriptions title="退租信息" bordered column={2} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="计划退租日期">{formatDateOnly(order.moveOutDate)}</Descriptions.Item>
          <Descriptions.Item label="实际退租日期">{formatDateOnly(order.actualMoveOutDate)}</Descriptions.Item>
          <Descriptions.Item label="验房日期">{formatDateOnly(order.inspectionDate)}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusInfo.color as 'blue' | 'green' | 'red' | 'orange' | 'cyan' | 'purple' | 'default'}>{statusInfo.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="扣款总额">{formatCurrency(order.totalDeduction)}</Descriptions.Item>
          <Descriptions.Item label="最终退款">{formatCurrency(order.finalRefund)}</Descriptions.Item>
          <Descriptions.Item label="处理人">{order.assignedHandlerName || '-'}</Descriptions.Item>
          <Descriptions.Item label="协助处理人">{order.coHandlerName || '-'}</Descriptions.Item>
          <Descriptions.Item label="退租原因" span={2}>{order.reason || '-'}</Descriptions.Item>
          <Descriptions.Item label="复核结果" span={2}>{order.reviewResult || '-'}</Descriptions.Item>
        </Descriptions>

        {order.sourceRecords && order.sourceRecords.length > 0 && (
          <Descriptions title="来源记录" bordered column={1} size="small">
            {order.sourceRecords.map((sr) => (
              <Descriptions.Item key={sr.id} label={`${sr.sourceType} - ${sr.sourceName}`}>
                <Space direction="vertical">
                  <span>来源ID: {sr.sourceId}</span>
                  {sr.remarks && <span>备注: {sr.remarks}</span>}
                  <span style={{ color: '#999', fontSize: 12 }}>创建时间: {formatDateTime(sr.createdAt)}</span>
                </Space>
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </>
    ),
    todos: (
      <>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />}>
            新建待办
          </Button>
        </Space>
        {todos.length === 0 ? (
          <Empty description="暂无待办任务" />
        ) : (
          <List
            dataSource={todos}
            renderItem={(item) => {
              const statusInfo = formatTodoStatus(item.status)
              const priorityInfo = formatTodoPriority(item.priority)
              return (
                <List.Item
                  key={item.id}
                  actions={[
                    <Button type="link" size="small" onClick={() => navigate(`/mobile/todos/${item.id}`)}>
                      查看
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Badge color={priorityInfo.color as 'blue' | 'green' | 'red' | 'orange' | 'default'} />}
                    title={
                      <Space>
                        <span>{item.title}</span>
                        <Tag color={statusInfo.color as 'blue' | 'green' | 'red' | 'orange' | 'default'}>{statusInfo.text}</Tag>
                        <Tag color={priorityInfo.color as 'blue' | 'green' | 'red' | 'orange' | 'default'}>{priorityInfo.text}优先级</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <span>{item.description || '暂无描述'}</span>
                        <Space>
                          <span style={{ color: '#999' }}>处理人: {item.assignedToName || '-'}</span>
                          <span style={{ color: '#999' }}>截止日期: {formatDateOnly(item.dueDate)}</span>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )
            }}
          />
        )}
      </>
    ),
    utility: (
      <>
        {utilitySummary && (
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="读数记录数" value={utilitySummary.totalCount} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="水电总金额" value={utilitySummary.totalAmount} precision={2} prefix="¥" />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="电费金额" value={utilitySummary.electricAmount} precision={2} prefix="¥" valueStyle={{ color: '#faad14' }} />
              </Card>
            </Col>
          </Row>
        )}
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setUtilityModalVisible(true)}>
            录入水电读数
          </Button>
        </Space>
        {utilityReadings.length === 0 ? (
          <Empty description="暂无水电读数记录" />
        ) : (
          <Table
            rowKey="id"
            columns={utilityColumns}
            dataSource={utilityReadings}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 1000 }}
          />
        )}
      </>
    ),
    inspection: (
      <>
        {inspectionSummary && (
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8} md={4}>
              <Card>
                <Statistic title="验房记录数" value={inspectionSummary.totalRecords} />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Card>
                <Statistic title="正常" value={inspectionSummary.normalCount} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Card>
                <Statistic title="轻微损坏" value={inspectionSummary.minorDamageCount} valueStyle={{ color: '#faad14' }} />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Card>
                <Statistic title="严重损坏" value={inspectionSummary.majorDamageCount} valueStyle={{ color: '#ff4d4f' }} />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Card>
                <Statistic title="缺失" value={inspectionSummary.missingCount} valueStyle={{ color: '#ff4d4f' }} />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Card>
                <Statistic title="预估费用" value={inspectionSummary.totalEstimatedCost} precision={2} prefix="¥" />
              </Card>
            </Col>
          </Row>
        )}
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setInspectionModalVisible(true)}>
            创建验房记录
          </Button>
        </Space>
        {inspectionRecords.length === 0 ? (
          <Empty description="暂无验房记录" />
        ) : (
          <Table
            rowKey="id"
            columns={inspectionRecordColumns}
            dataSource={inspectionRecords}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 1000 }}
            expandable={{
              expandedRowRender: (record) => (
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
                    { title: '项目名称', dataIndex: 'itemName', key: 'itemName', width: 150 },
                    { title: '位置', dataIndex: 'location', key: 'location', width: 100, render: (v: string | null) => v || '-' },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      key: 'status',
                      width: 100,
                      render: (v: InspectionItemStatus) => {
                        const info = formatInspectionItemStatus(v)
                        return <Tag color={info.color as 'blue' | 'green' | 'red' | 'orange' | 'default'}>{info.text}</Tag>
                      },
                    },
                    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, render: (v: string | null) => v || '-' },
                    { title: '预估费用', dataIndex: 'estimatedCost', key: 'estimatedCost', width: 100, render: (v: number | null) => formatCurrency(v) },
                    {
                      title: '责任方',
                      dataIndex: 'responsibility',
                      key: 'responsibility',
                      width: 100,
                      render: (v: ResponsibilityParty | null) => (v !== null && v !== undefined ? formatResponsibilityParty(v) : '-'),
                    },
                  ]}
                  dataSource={record.items}
                />
              ),
            }}
          />
        )}
      </>
    ),
    payment: (
      <>
        {paymentSummary && (
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="收款笔数" value={paymentSummary.totalCount} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="收款总金额" value={paymentSummary.totalAmount} precision={2} prefix="¥" />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="损坏赔偿" value={paymentSummary.damageCompensationAmount} precision={2} prefix="¥" valueStyle={{ color: '#ff4d4f' }} />
              </Card>
            </Col>
          </Row>
        )}
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setPaymentModalVisible(true)}>
            创建收款记录
          </Button>
        </Space>
        {payments.length === 0 ? (
          <Empty description="暂无收款记录" />
        ) : (
          <Table
            rowKey="id"
            columns={paymentColumns}
            dataSource={payments}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 1100 }}
          />
        )}
      </>
    ),
    complaint: (
      <>
        {complaintSummary && (
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="投诉总数" value={complaintSummary.totalCount} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="未解决" value={complaintSummary.unresolvedCount} valueStyle={{ color: '#ff4d4f' }} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="高严重度" value={complaintSummary.highSeverityCount} valueStyle={{ color: '#ff4d4f' }} />
              </Card>
            </Col>
          </Row>
        )}
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setComplaintModalVisible(true)}>
            添加投诉标签
          </Button>
        </Space>
        {complaints.length === 0 ? (
          <Empty description="暂无投诉标签" />
        ) : (
          <Table
            rowKey="id"
            columns={complaintColumns}
            dataSource={complaints}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 1100 }}
          />
        )}
      </>
    ),
    timeline: (
      <>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<PlusOutlined />} onClick={() => setNoteModalVisible(true)}>
            添加备注
          </Button>
        </Space>
        <Timeline events={timeline} />
      </>
    ),
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/desktop/orders')}>
          返回列表
        </Button>
        <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
          编辑
        </Button>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="退租单号"
              value={order.orderNumber}
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="状态"
              value={statusInfo.text}
              valueStyle={{ color: statusInfo.color === 'success' ? '#52c41a' : statusInfo.color === 'error' ? '#ff4d4f' : '#1677ff', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="待办任务数" value={todos.length} />
          </Card>
        </Col>
      </Row>

      <Card
        tabList={tabListNoTitle}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
      >
        {contentListNoTitle[activeTab]}
      </Card>

      <Modal
        title="编辑退租单"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleEditSubmit}
        width={700}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  {Object.entries(moveOutStatusMap).map(([value, info]) => (
                    <Option key={value} value={Number(value)}>
                      {info.text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assignedHandlerId" label="处理人">
                <Select showSearch optionFilterProp="children" placeholder="选择处理人">
                  {staffList.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="coHandlerId" label="协助处理人">
                <Select showSearch optionFilterProp="children" placeholder="选择协助处理人" allowClear>
                  {staffList.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="moveOutDate" label="计划退租日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actualMoveOutDate" label="实际退租日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="inspectionDate" label="验房日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="reason" label="退租原因">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="reviewResult" label="复核结果">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="添加备注"
        open={noteModalVisible}
        onCancel={() => setNoteModalVisible(false)}
        onOk={handleAddNote}
        destroyOnClose
      >
        <Form form={noteForm} layout="vertical">
          <Form.Item
            name="notes"
            label="备注内容"
            rules={[{ required: true, message: '请输入备注内容' }]}
          >
            <TextArea rows={4} placeholder="请输入备注内容" />
          </Form.Item>
          <Form.Item label="附件">
            <Upload multiple>
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="录入水电读数"
        open={utilityModalVisible}
        onCancel={() => setUtilityModalVisible(false)}
        onOk={handleAddUtility}
        width={600}
        destroyOnClose
      >
        <Form form={utilityForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="utilityType"
                label="水电类型"
                rules={[{ required: true, message: '请选择水电类型' }]}
              >
                <Select placeholder="请选择">
                  <Option value="water">水费</Option>
                  <Option value="electric">电费</Option>
                  <Option value="gas">燃气费</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="readingDate"
                label="读数日期"
                rules={[{ required: true, message: '请选择读数日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="previousReading"
                label="上次读数"
                rules={[{ required: true, message: '请输入上次读数' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currentReading"
                label="本次读数"
                rules={[{ required: true, message: '请输入本次读数' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="单位">
                <Input placeholder="如：度、吨" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="usageAmount" label="用量">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitPrice" label="单价">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalAmount" label="总金额">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remarks" label="备注">
                <TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="创建验房记录"
        open={inspectionModalVisible}
        onCancel={() => setInspectionModalVisible(false)}
        onOk={handleAddInspection}
        width={700}
        destroyOnClose
      >
        <Form form={inspectionForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="inspectionDate"
                label="验房日期"
                rules={[{ required: true, message: '请选择验房日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="overallCondition" label="整体状况">
                <TextArea rows={2} placeholder="请描述整体状况" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remarks" label="备注">
                <TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
          {inspectionItems.length > 0 && (
            <>
              <Divider orientation="left">验房项目预览</Divider>
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={inspectionItems}
                columns={[
                  { title: '分类', dataIndex: 'category', width: 100 },
                  { title: '项目', dataIndex: 'itemName', width: 120 },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    width: 100,
                    render: (v: InspectionItemStatus) => {
                      const info = formatInspectionItemStatus(v)
                      return <Tag color={info.color as 'blue' | 'green' | 'red' | 'orange' | 'default'}>{info.text}</Tag>
                    },
                  },
                  { title: '预估费用', dataIndex: 'estimatedCost', width: 100, render: (v: number | null) => formatCurrency(v) },
                ]}
              />
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title="创建收款记录"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        onOk={handleAddPayment}
        width={600}
        destroyOnClose
      >
        <Form form={paymentForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentType"
                label="收款类型"
                rules={[{ required: true, message: '请选择收款类型' }]}
              >
                <Select placeholder="请选择">
                  {Object.entries(paymentTypeMap).map(([value, text]) => (
                    <Option key={value} value={Number(value)}>
                      {text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="支付方式"
                rules={[{ required: true, message: '请选择支付方式' }]}
              >
                <Select placeholder="请选择">
                  {Object.entries(paymentMethodMap).map(([value, text]) => (
                    <Option key={value} value={Number(value)}>
                      {text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="金额"
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentDate"
                label="收款日期"
                rules={[{ required: true, message: '请选择收款日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payerName" label="付款人">
                <Input placeholder="请输入付款人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payeeName" label="收款人">
                <Input placeholder="请输入收款人" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="transactionNo" label="交易号">
                <Input placeholder="请输入交易号" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remarks" label="备注">
                <TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="添加投诉标签"
        open={complaintModalVisible}
        onCancel={() => setComplaintModalVisible(false)}
        onOk={handleAddComplaint}
        width={600}
        destroyOnClose
      >
        <Form form={complaintForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tagType"
                label="标签类型"
                rules={[{ required: true, message: '请输入标签类型' }]}
              >
                <Input placeholder="如：服务态度、设施问题等" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="severity"
                label="严重程度"
                rules={[{ required: true, message: '请选择严重程度' }]}
              >
                <Select placeholder="请选择">
                  <Option value={1}>低</Option>
                  <Option value={2}>中</Option>
                  <Option value={3}>高</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="description"
                label="描述"
                rules={[{ required: true, message: '请输入描述' }]}
              >
                <TextArea rows={4} placeholder="请详细描述投诉内容" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remarks" label="备注">
                <TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default OrderDetail
