import { useState } from 'react'
import {
  Button, Card, Col, DatePicker, Descriptions, Drawer, Form, Input, InputNumber,
  Modal, Popconfirm, Row, Select, Space, Table, Tabs, Tag, App,
} from 'antd'
import {
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { bookingApi, masterDataApi, statisticsApi } from '../services/api'
import { BookingRecord, BookingStatus, BookingStatusText, ConflictStatusText, ConflictTypeText, BookingQuery } from '../types'
import type { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker
const { TextArea } = Input
const { Option } = Select

function BookingsPage() {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const [queryParams, setQueryParams] = useState<BookingQuery>({
    pageIndex: 1,
    pageSize: 10,
  })
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [rescheduleVisible, setRescheduleVisible] = useState(false)
  const [createForm] = Form.useForm()
  const [rescheduleForm] = Form.useForm()
  const [precheckWarnings, setPrecheckWarnings] = useState<string[]>([])
  const [exportVisible, setExportVisible] = useState(false)
  const [exportForm] = Form.useForm()

  const bookingsQuery = useQuery({
    queryKey: ['bookings', queryParams],
    queryFn: () => bookingApi.getPagedBookings(queryParams).catch(() => ({ items: [], totalCount: 0, pageIndex: 1, pageSize: 10, totalPages: 0 })),
  })

  const spotsQuery = useQuery({
    queryKey: ['scenic-spots'],
    queryFn: () => masterDataApi.getScenicSpots().catch(() => []),
  })

  const timeSlotsQuery = useQuery({
    queryKey: ['time-slots', createForm.getFieldValue('scenicSpotId'), createForm.getFieldValue('slotDate')?.format('YYYY-MM-DD')],
    queryFn: () => {
      const spotId = createForm.getFieldValue('scenicSpotId')
      const date: Dayjs | undefined = createForm.getFieldValue('slotDate')
      if (!spotId || !date) return Promise.resolve([])
      return masterDataApi.getTimeSlots(spotId, date.format('YYYY-MM-DD')).catch(() => [])
    },
    enabled: !!createForm.getFieldValue('scenicSpotId') && !!createForm.getFieldValue('slotDate'),
  })

  const ticketTypesQuery = useQuery({
    queryKey: ['ticket-types', createForm.getFieldValue('scenicSpotId')],
    queryFn: () => {
      const spotId = createForm.getFieldValue('scenicSpotId')
      if (!spotId) return Promise.resolve([])
      return masterDataApi.getTicketTypes(spotId).catch(() => [])
    },
    enabled: !!createForm.getFieldValue('scenicSpotId'),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => bookingApi.createBooking({
      ...values,
      slotDate: values.slotDate?.format('YYYY-MM-DD'),
      createdBy: '运营管理员',
    }),
    onSuccess: () => {
      message.success('预约创建成功')
      setCreateVisible(false)
      createForm.resetFields()
      setPrecheckWarnings([])
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: () => message.error('创建失败'),
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) => bookingApi.rescheduleBooking(id, {
      ...values,
      newSlotDate: values.newSlotDate?.format('YYYY-MM-DD'),
      operatorName: '运营管理员',
    }),
    onSuccess: () => {
      message.success('改约成功')
      setRescheduleVisible(false)
      rescheduleForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: () => message.error('改约失败'),
  })

  const arrivalMutation = useMutation({
    mutationFn: (id: string) => bookingApi.markArrival(id, {
      arrivalTime: dayjs().toISOString(),
      operatorName: '运营管理员',
    }),
    onSuccess: () => {
      message.success('已标记到场')
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: () => message.error('操作失败'),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      bookingApi.cancelBooking(id, reason, '运营管理员'),
    onSuccess: () => {
      message.success('已取消预约')
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: () => message.error('取消失败'),
  })

  const exportMutation = useMutation({
    mutationFn: (values: any) => statisticsApi.exportBookings({
      ...values,
      filterCriteria: {
        scenicSpotId: values.scenicSpotId,
        status: values.status,
        startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        searchKeyword: values.searchKeyword,
      },
      generatedBy: '运营管理员',
    }),
    onSuccess: (response: any) => {
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const fileName = `预约记录导出_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      message.success(`导出成功：${fileName}`)
      setExportVisible(false)
      exportForm.resetFields()
    },
    onError: () => message.error('导出失败'),
  })

  const handleTableChange = (pagination: any) => {
    setQueryParams({
      ...queryParams,
      pageIndex: pagination.current,
      pageSize: pagination.pageSize,
    })
  }

  const runPrecheck = async () => {
    try {
      const values = createForm.getFieldsValue()
      if (!values.visitorIdCard || !values.scenicSpotId || !values.slotDate || !values.timeSlotId) {
        return
      }
      const result = await bookingApi.precheckConflicts({
        ...values,
        slotDate: values.slotDate?.format('YYYY-MM-DD'),
      })
      if (result?.warnings?.length > 0) {
        setPrecheckWarnings(result.warnings)
      } else {
        setPrecheckWarnings([])
        message.success('未检测到冲突')
      }
    } catch {}
  }

  const handleCancelBooking = (record: BookingRecord) => {
    modal.confirm({
      title: `取消预约 ${record.bookingNo}`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <Form layout="vertical" autoComplete="off">
          <Form.Item label="取消原因" name="cancelReason" rules={[{ required: true, message: '请输入取消原因' }]}>
            <TextArea rows={3} placeholder="请说明取消原因" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const form = (modal as any)._config.content.props.children
        const reason = form.props.name === 'cancelReason' ? '' : ''
        const reasonInput = document.querySelector('textarea[placeholder="请说明取消原因"]') as HTMLTextAreaElement
        if (!reasonInput?.value) return Promise.reject()
        cancelMutation.mutate({ id: record.id, reason: reasonInput.value })
      },
    })
  }

  const statusTag = (status: BookingStatus) => {
    const colorMap: Record<BookingStatus, string> = {
      [BookingStatus.Pending]: 'default',
      [BookingStatus.Confirmed]: 'blue',
      [BookingStatus.Rescheduled]: 'purple',
      [BookingStatus.Cancelled]: 'default',
      [BookingStatus.Arrived]: 'green',
      [BookingStatus.NoShow]: 'orange',
    }
    return <Tag color={colorMap[status]}>{BookingStatusText[status]}</Tag>
  }

  const bookingColumns = [
    { title: '预约编号', dataIndex: 'bookingNo', key: 'bookingNo', width: 120, fixed: 'left' as const },
    { title: '景区', dataIndex: 'scenicSpotName', key: 'scenicSpotName', width: 120 },
    { title: '时段', dataIndex: 'slotDisplay', key: 'slotDisplay', width: 180 },
    { title: '游客', dataIndex: 'visitorName', key: 'visitorName', width: 100 },
    { title: '身份证', dataIndex: 'idCardNumber', key: 'idCardNumber', width: 160 },
    { title: '手机号', dataIndex: 'phoneNumber', key: 'phoneNumber', width: 120 },
    { title: '票种', dataIndex: 'ticketTypeName', key: 'ticketTypeName', width: 100 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 70 },
    { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', width: 90, render: (v) => `¥${v.toFixed(2)}` },
    {
      title: '冲突',
      key: 'hasConflict',
      width: 80,
      render: (_: any, r: BookingRecord) =>
        r.hasConflict ? (
          <Tag color="red" icon={<ExclamationCircleOutlined />} className="conflict-tag">
            有冲突 {r.conflicts?.length || 0}
          </Tag>
        ) : <Tag color="green">正常</Tag>,
    },
    { title: '状态', key: 'status', width: 90, render: (_: any, r: BookingRecord) => statusTag(r.status) },
    {
      title: '到场',
      key: 'arrival',
      width: 90,
      render: (_: any, r: BookingRecord) =>
        r.status === BookingStatus.Arrived ? (
          <div>
            <Tag icon={<CheckCircleOutlined />} color="green">已到场</Tag>
            {r.arrivalTime && <div style={{ fontSize: 11, color: '#999' }}>{dayjs(r.arrivalTime).format('HH:mm')}</div>}
          </div>
        ) : r.status === BookingStatus.NoShow ? <Tag color="orange">未到场</Tag> : '-',
    },
    { title: '创建时间', key: 'createdAt', width: 140, render: (_: any, r: BookingRecord) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 220,
      render: (_: any, r: BookingRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedBooking(r); setDetailVisible(true) }}>查看</Button>
          {r.status === BookingStatus.Confirmed && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => arrivalMutation.mutate(r.id)}>到场</Button>
          )}
          {(r.status === BookingStatus.Confirmed || r.status === BookingStatus.Pending) && (
            <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => { setSelectedBooking(r); setRescheduleVisible(true) }}>改约</Button>
          )}
          {r.status !== BookingStatus.Cancelled && r.status !== BookingStatus.Arrived && (
            <Popconfirm title="确定取消该预约？" onConfirm={() => handleCancelBooking(r)}>
              <Button type="link" size="small" danger>取消</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const bookingData = bookingsQuery.data?.items || []
  const spots = spotsQuery.data || []
  const timeSlots = timeSlotsQuery.data || []
  const ticketTypes = ticketTypesQuery.data || []

  const renderConflictDetails = (record: BookingRecord) => {
    if (!record.conflicts?.length) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
          <ExclamationCircleOutlined style={{ fontSize: 48, opacity: 0.2 }} />
          <div style={{ marginTop: 8 }}>暂无冲突记录</div>
        </div>
      )
    }
    return (
      <Table
        size="small"
        pagination={false}
        dataSource={record.conflicts}
        rowKey="id"
        columns={[
          { title: '冲突类型', key: 'type', width: 100,
            render: (_, r) => <Tag color="red">{ConflictTypeText[r.conflictType]}</Tag> },
          { title: '原因', dataIndex: 'reason', key: 'reason' },
          { title: '状态', key: 'status', width: 90,
            render: (_, r) => {
              const color = r.status <= 1 ? 'red' : r.status === 2 ? 'orange' : 'green'
              return <Tag color={color}>{ConflictStatusText[r.status]}</Tag>
            } },
          { title: '负责人', dataIndex: 'responsiblePerson', key: 'rp', width: 100 },
          { title: '检测时间', key: 't', width: 140,
            render: (_, r) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm') },
        ]}
      />
    )
  }

  const renderRescheduleRecords = (record: BookingRecord) => {
    if (!record.rescheduleRecords?.length) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
          <SwapOutlined style={{ fontSize: 48, opacity: 0.2 }} />
          <div style={{ marginTop: 8 }}>暂无改约记录</div>
        </div>
      )
    }
    return (
      <Table
        size="small"
        pagination={false}
        dataSource={record.rescheduleRecords}
        rowKey="id"
        columns={[
          { title: '原时段', dataIndex: 'originalSlotDisplay', key: 'orig', width: 200 },
          { title: '新时段', dataIndex: 'newSlotDisplay', key: 'new', width: 200 },
          { title: '原因', dataIndex: 'reason', key: 'reason' },
          { title: '操作人', dataIndex: 'operator', key: 'op', width: 100 },
          { title: '时间', key: 't', width: 140,
            render: (_, r) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm') },
        ]}
      />
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Card className="page-container" style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="景区">
            <Select
              allowClear
              placeholder="全部"
              style={{ width: 150 }}
              onChange={(v) => setQueryParams({ ...queryParams, scenicSpotId: v, pageIndex: 1 })}
              value={queryParams.scenicSpotId}
            >
              {spots.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="日期范围">
            <RangePicker
              onChange={(dates) => setQueryParams({
                ...queryParams,
                startDate: dates?.[0]?.format('YYYY-MM-DD'),
                endDate: dates?.[1]?.format('YYYY-MM-DD'),
                pageIndex: 1,
              })}
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              allowClear
              placeholder="全部"
              style={{ width: 130 }}
              onChange={(v) => setQueryParams({ ...queryParams, status: v, pageIndex: 1 })}
              value={queryParams.status}
            >
              {Object.entries(BookingStatusText).map(([k, v]) => (
                <Option key={k} value={Number(k)}>{v}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="有冲突">
            <Select
              allowClear
              placeholder="全部"
              style={{ width: 120 }}
              onChange={(v) => setQueryParams({ ...queryParams, hasConflict: v, pageIndex: 1 })}
              value={queryParams.hasConflict}
            >
              <Option value={true}>仅看有冲突</Option>
              <Option value={false}>仅看无冲突</Option>
            </Select>
          </Form.Item>
          <Form.Item label="搜索">
            <Input.Search
              placeholder="姓名/身份证/预约号"
              allowClear
              style={{ width: 220 }}
              onSearch={(v) => setQueryParams({ ...queryParams, searchKeyword: v, pageIndex: 1 })}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => setQueryParams({ ...queryParams })}
              >查询</Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setQueryParams({ pageIndex: 1, pageSize: 10 })
                  queryClient.invalidateQueries({ queryKey: ['bookings'] })
                }}
              >重置</Button>
            </Space>
          </Form.Item>
        </Form>
        <Row style={{ marginTop: 16 }}>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>新建预约</Button>
            <Button onClick={() => setExportVisible(true)}>导出记录</Button>
          </Space>
        </Row>
      </Card>

      <Card className="page-container">
        <Table
          rowKey="id"
          loading={bookingsQuery.isLoading}
          dataSource={bookingData}
          columns={bookingColumns}
          scroll={{ x: 1600 }}
          pagination={{
            current: queryParams.pageIndex,
            pageSize: queryParams.pageSize,
            total: bookingsQuery.data?.totalCount || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: 8 }}>
                <Tabs
                  defaultActiveKey="conflicts"
                  items={[
                    {
                      key: 'conflicts',
                      label: (
                        <span>
                          <ExclamationCircleOutlined style={{ color: record.hasConflict ? '#ff4d4f' : '#52c41a' }} />
                          冲突检测（{record.conflicts?.length || 0}）
                        </span>
                      ),
                      children: renderConflictDetails(record),
                    },
                    {
                      key: 'reschedules',
                      label: (
                        <span>
                          <SwapOutlined />
                          改约记录（{record.rescheduleRecords?.length || 0}）
                        </span>
                      ),
                      children: renderRescheduleRecords(record),
                    },
                    {
                      key: 'arrival',
                      label: (
                        <span>
                          <CheckCircleOutlined />
                          到场状态
                        </span>
                      ),
                      children: (
                        <Descriptions size="small" column={2} bordered>
                          <Descriptions.Item label="当前状态">{statusTag(record.status)}</Descriptions.Item>
                          <Descriptions.Item label="到场时间">
                            {record.arrivalTime ? dayjs(record.arrivalTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="到场操作人">{record.arrivalOperator || '-'}</Descriptions.Item>
                          <Descriptions.Item label="预约创建时间">{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                        </Descriptions>
                      ),
                    },
                  ]}
                />
              </div>
            ),
            rowExpandable: () => true,
          }}
        />
      </Card>

      <Drawer
        title={`预约详情 - ${selectedBooking?.bookingNo}`}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={900}
      >
        {selectedBooking && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="预约编号">{selectedBooking.bookingNo}</Descriptions.Item>
              <Descriptions.Item label="状态">{statusTag(selectedBooking.status)}</Descriptions.Item>
              <Descriptions.Item label="景区">{selectedBooking.scenicSpotName}</Descriptions.Item>
              <Descriptions.Item label="时段">{selectedBooking.slotDisplay}</Descriptions.Item>
              <Descriptions.Item label="游客">{selectedBooking.visitorName}</Descriptions.Item>
              <Descriptions.Item label="身份证">{selectedBooking.idCardNumber}</Descriptions.Item>
              <Descriptions.Item label="手机号">{selectedBooking.phoneNumber}</Descriptions.Item>
              <Descriptions.Item label="票种">{selectedBooking.ticketTypeName}</Descriptions.Item>
              <Descriptions.Item label="数量">{selectedBooking.quantity}</Descriptions.Item>
              <Descriptions.Item label="金额">¥{selectedBooking.totalAmount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{selectedBooking.remarks || '-'}</Descriptions.Item>
            </Descriptions>
            <Tabs
              defaultActiveKey="conflicts"
              items={[
                { key: 'conflicts', label: `冲突检测（${selectedBooking.conflicts?.length || 0}）`, children: renderConflictDetails(selectedBooking) },
                { key: 'reschedules', label: `改约记录（${selectedBooking.rescheduleRecords?.length || 0}）`, children: renderRescheduleRecords(selectedBooking) },
                {
                  key: 'arrival',
                  label: '到场状态',
                  children: (
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="当前状态">{statusTag(selectedBooking.status)}</Descriptions.Item>
                      <Descriptions.Item label="到场时间">{selectedBooking.arrivalTime ? dayjs(selectedBooking.arrivalTime).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                      <Descriptions.Item label="操作人">{selectedBooking.arrivalOperator || '-'}</Descriptions.Item>
                      <Descriptions.Item label="创建人">{selectedBooking.createdBy || '-'}</Descriptions.Item>
                    </Descriptions>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Drawer>

      <Modal
        title="新建预约"
        open={createVisible}
        onCancel={() => { setCreateVisible(false); createForm.resetFields(); setPrecheckWarnings([]) }}
        width={640}
        onOk={createForm.submit}
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(v) => createMutation.mutate(v)}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="景区" name="scenicSpotId" rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="children"
                  onChange={() => { createForm.setFieldsValue({ timeSlotId: undefined, ticketTypeId: undefined }) }}
                >
                  {spots.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="预约日期" name="slotDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isBefore(dayjs().startOf('day'))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="时段" name="timeSlotId" rules={[{ required: true }]}>
                <Select loading={timeSlotsQuery.isLoading} showSearch optionFilterProp="children">
                  {timeSlots.map((t) => (
                    <Option key={t.id} value={t.id} disabled={t.isFull}>
                      {t.startTime} - {t.endTime}（剩 {t.availableCount}/{t.capacity}）
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="票种" name="ticketTypeId" rules={[{ required: true }]}>
                <Select loading={ticketTypesQuery.isLoading}>
                  {ticketTypes.map((t) => (
                    <Option key={t.id} value={t.id}>{t.name}（¥{t.price}）</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="游客姓名" name="visitorName" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="身份证号" name="visitorIdCard" rules={[{ required: true }]}>
                <Input maxLength={18} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="手机号" name="visitorPhone">
                <Input maxLength={11} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="预约数量" name="quantity" rules={[{ required: true }]} initialValue={1}>
                <InputNumber min={1} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="备注" name="remarks">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
          <Button block onClick={runPrecheck} type="default" style={{ marginBottom: 12 }} icon={<SearchOutlined />}>
            预检冲突
          </Button>
          {precheckWarnings.length > 0 && (
            <div className="export-metadata" style={{ background: '#fff1f0', borderColor: '#ffa39e', marginBottom: 12 }}>
              <div style={{ color: '#cf1322', fontWeight: 600, marginBottom: 8 }}>检测到以下潜在冲突：</div>
              {precheckWarnings.map((w, i) => (
                <div key={i} style={{ color: '#cf1322', padding: '2px 0' }}>• {w}</div>
              ))}
            </div>
          )}
        </Form>
      </Modal>

      <Modal
        title={`改约 - ${selectedBooking?.bookingNo}`}
        open={rescheduleVisible}
        onCancel={() => { setRescheduleVisible(false); rescheduleForm.resetFields() }}
        width={560}
        onOk={rescheduleForm.submit}
        confirmLoading={rescheduleMutation.isPending}
      >
        {selectedBooking && (
          <Form
            form={rescheduleForm}
            layout="vertical"
            onFinish={(v) => rescheduleMutation.mutate({ id: selectedBooking.id, values: v })}
          >
            <div className="export-metadata" style={{ marginBottom: 16 }}>
              <div><strong>原时段：</strong>{selectedBooking.slotDisplay}</div>
              <div><strong>原景区：</strong>{selectedBooking.scenicSpotName}</div>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="新景区" name="newScenicSpotId" rules={[{ required: true }]} initialValue={selectedBooking.scenicSpotId}>
                  <Select>
                    {spots.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="新日期" name="newSlotDate" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="改约原因" name="reason" rules={[{ required: true }]}>
                  <TextArea rows={3} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Modal>

      <Modal
        title="导出预约记录"
        open={exportVisible}
        onCancel={() => setExportVisible(false)}
        width={560}
        onOk={exportForm.submit}
        confirmLoading={exportMutation.isPending}
      >
        <Form form={exportForm} layout="vertical" onFinish={(v) => exportMutation.mutate(v)}>
          <div className="export-metadata" style={{ marginBottom: 16 }}>
            <div><strong>导出将自动包含以下元数据：</strong></div>
            <div>• 筛选口径（所选景区/状态/日期等）</div>
            <div>• 生成时间：{dayjs().format('YYYY-MM-DD HH:mm:ss')}</div>
            <div>• 操作者：运营管理员</div>
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="景区" name="scenicSpotId">
                <Select allowClear placeholder="全部">
                  {spots.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="预约状态" name="status">
                <Select allowClear placeholder="全部">
                  {Object.entries(BookingStatusText).map(([k, v]) => (
                    <Option key={k} value={Number(k)}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="日期范围" name="dateRange">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="搜索关键词" name="searchKeyword">
                <Input placeholder="姓名/身份证/预约号" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="导出格式" name="format" initialValue="excel">
                <Select>
                  <Option value="excel">Excel (.xlsx)</Option>
                  <Option value="csv">CSV</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default BookingsPage
