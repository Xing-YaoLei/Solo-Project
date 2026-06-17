import React, { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Drawer,
  Descriptions,
  Modal,
  Row,
  Col,
  Statistic,
  Divider,
  Typography,
  Tabs,
  List,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { overdueApi } from '@/api'
import { useAppStore } from '@/store'
import Timeline from '@/components/Timeline'
import type {
  RentOverdueRecordDto,
  RentOverdueQueryDto,
  AffectedPartyDto,
  SupplementAffectedPartyDto,
  AdjustResponsibilityDto,
  TimelineEventDto,
  PartyType,
  ResponsibilityParty,
  ApprovalStatus,
} from '@/types'
import {
  formatDateOnly,
  formatDateTime,
  formatCurrency,
  formatPartyType,
  formatResponsibilityParty,
  formatApprovalStatus,
  responsibilityPartyMap,
} from '@/utils/format'

const { RangePicker } = DatePicker
const { Option } = Select
const { Title, Text } = Typography

const OverdueList: React.FC = () => {
  const { loading, setLoading } = useAppStore()
  const [searchForm] = Form.useForm()
  const [supplementForm] = Form.useForm<SupplementAffectedPartyDto>()
  const [adjustForm] = Form.useForm<AdjustResponsibilityDto>()
  const [data, setData] = useState<RentOverdueRecordDto[]>([])
  const [total, setTotal] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<RentOverdueRecordDto | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventDto[]>([])
  const [supplementModalVisible, setSupplementModalVisible] = useState(false)
  const [currentAffectedParty, setCurrentAffectedParty] = useState<AffectedPartyDto | null>(null)
  const [adjustModalVisible, setAdjustModalVisible] = useState(false)
  const [stats, setStats] = useState<{
    totalOverdue: number
    unresolvedCount: number
    totalOverdueAmount: number
    averageOverdueDays: number
  } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const values = searchForm.getFieldsValue()
      const params: RentOverdueQueryDto = {
        pageNumber,
        pageSize,
        searchKeyword: values.searchKeyword,
        isResolved: values.isResolved,
      }
      if (values.reportedAtRange && values.reportedAtRange.length === 2) {
        params.reportedAtFrom = values.reportedAtRange[0].format('YYYY-MM-DD')
        params.reportedAtTo = values.reportedAtRange[1].format('YYYY-MM-DD')
      }
      const result = await overdueApi.getOverdueList(params)
      setData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      console.error('获取逾期记录列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [searchForm, pageNumber, pageSize, setLoading])

  const fetchStats = useCallback(async () => {
    try {
      setStats({
        totalOverdue: 0,
        unresolvedCount: 0,
        totalOverdueAmount: 0,
        averageOverdueDays: 0,
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [fetchData, fetchStats])

  const handleSearch = () => {
    setPageNumber(1)
    fetchData()
  }

  const handleReset = () => {
    searchForm.resetFields()
    setPageNumber(1)
    setTimeout(fetchData, 0)
  }

  const fetchDetail = async (id: string) => {
    setLoading(true)
    try {
      const detail = await overdueApi.getOverdueDetail(id)
      setCurrentDetail(detail)
      setDetailVisible(true)
      fetchTimeline(id)
    } catch (error) {
      console.error('获取逾期详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTimeline = async (id: string) => {
    setTimelineLoading(true)
    try {
      const events = await overdueApi.getTimeline(id)
      setTimelineEvents(events)
    } catch (error) {
      console.error('获取时间线失败:', error)
    } finally {
      setTimelineLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailVisible(false)
    setCurrentDetail(null)
    setTimelineEvents([])
  }

  const handleOpenSupplementModal = (party: AffectedPartyDto) => {
    setCurrentAffectedParty(party)
    supplementForm.setFieldsValue({ supplementNote: party.supplementNote || '' })
    setSupplementModalVisible(true)
  }

  const handleSupplementSubmit = async () => {
    if (!currentDetail || !currentAffectedParty) return
    try {
      const values = await supplementForm.validateFields()
      await overdueApi.supplementAffectedParty(
        currentDetail.id,
        currentAffectedParty.id,
        values
      )
      message.success('补充说明提交成功')
      setSupplementModalVisible(false)
      setCurrentAffectedParty(null)
      supplementForm.resetFields()
      fetchDetail(currentDetail.id)
    } catch (error) {
      console.error('补充说明提交失败:', error)
    }
  }

  const handleOpenAdjustModal = () => {
    adjustForm.resetFields()
    setAdjustModalVisible(true)
  }

  const handleAdjustSubmit = async () => {
    if (!currentDetail) return
    try {
      const values = await adjustForm.validateFields()
      await overdueApi.adjustResponsibility(currentDetail.id, values)
      message.success('责任调整提交成功')
      setAdjustModalVisible(false)
      adjustForm.resetFields()
      fetchDetail(currentDetail.id)
    } catch (error) {
      console.error('责任调整提交失败:', error)
    }
  }

  const columns: ColumnsType<RentOverdueRecordDto> = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      fixed: 'left' as const,
    },
    {
      title: '租客',
      dataIndex: 'tenantName',
      key: 'tenantName',
      width: 100,
    },
    {
      title: '逾期金额',
      dataIndex: 'overdueAmount',
      key: 'overdueAmount',
      width: 120,
      render: (value: number) => (
        <Text type="danger" strong>
          {formatCurrency(value)}
        </Text>
      ),
      sorter: true,
    },
    {
      title: '逾期天数',
      dataIndex: 'overdueDays',
      key: 'overdueDays',
      width: 100,
      align: 'center' as const,
      render: (days: number) => (
        <Tag color={days > 30 ? 'red' : days > 15 ? 'orange' : 'warning'}>{days} 天</Tag>
      ),
      sorter: true,
    },
    {
      title: '应缴日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string) => formatDateOnly(date),
    },
    {
      title: '上报时间',
      dataIndex: 'reportedAt',
      key: 'reportedAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
      sorter: true,
    },
    {
      title: '受影响对象',
      key: 'affectedParties',
      width: 110,
      align: 'center' as const,
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <span>{record.affectedParties?.length || 0}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isResolved',
      key: 'isResolved',
      width: 100,
      render: (resolved: boolean) =>
        resolved ? <Tag color="success">已处理</Tag> : <Tag color="error">未处理</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => fetchDetail(record.id)}
        >
          详情
        </Button>
      ),
    },
  ]

  const renderAffectedPartiesTab = () => {
    if (!currentDetail) return null
    const parties = currentDetail.affectedParties || []

    return (
      <div>
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button type="primary" icon={<PlusOutlined />} disabled>
            添加受影响对象
          </Button>
        </div>
        {parties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            暂无受影响对象
          </div>
        ) : (
          <List
            itemLayout="vertical"
            dataSource={parties}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                extra={
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenSupplementModal(item)}
                  >
                    补充说明
                  </Button>
                }
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color="blue">{formatPartyType(item.partyType as PartyType)}</Tag>
                      <strong>{item.partyName}</strong>
                      <Text type="secondary">({item.role})</Text>
                      {item.hasSupplement && <Tag color="green">已补充</Tag>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={8}>
                      <Text>联系方式: {item.contactInfo}</Text>
                      <Text>影响描述: {item.impactDescription}</Text>
                      {item.supplementNote && (
                        <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                          <Text type="secondary">补充说明:</Text>
                          <div style={{ marginTop: 4 }}>{item.supplementNote}</div>
                          {item.supplementedBy && (
                            <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                              {item.supplementedBy} 于 {formatDateTime(item.supplementedAt)} 补充
                            </div>
                          )}
                        </div>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    )
  }

  const renderResponsibilityTab = () => {
    if (!currentDetail) return null
    const adjustments = currentDetail.responsibilityAdjustments || []

    return (
      <div>
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button type="primary" icon={<SwapOutlined />} onClick={handleOpenAdjustModal}>
            调整责任归属
          </Button>
        </div>
        {adjustments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            暂无责任调整记录
          </div>
        ) : (
          <Table
            rowKey="id"
            dataSource={adjustments}
            pagination={false}
            columns={[
              {
                title: '原责任',
                dataIndex: 'originalResponsibility',
                key: 'originalResponsibility',
                render: (v: ResponsibilityParty) => (
                  <Text type="danger" delete>
                    {formatResponsibilityParty(v)}
                  </Text>
                ),
              },
              {
                title: '新责任',
                dataIndex: 'newResponsibility',
                key: 'newResponsibility',
                render: (v: ResponsibilityParty) => (
                  <Text strong style={{ color: '#1677ff' }}>
                    {formatResponsibilityParty(v)}
                  </Text>
                ),
              },
              {
                title: '调整原因',
                dataIndex: 'adjustReason',
                key: 'adjustReason',
              },
              {
                title: '调整人',
                dataIndex: 'adjustedByName',
                key: 'adjustedByName',
              },
              {
                title: '调整时间',
                dataIndex: 'adjustedAt',
                key: 'adjustedAt',
                render: (v: string) => formatDateTime(v),
              },
              {
                title: '审批状态',
                dataIndex: 'approvalStatus',
                key: 'approvalStatus',
                render: (v: ApprovalStatus) => {
                  const info = formatApprovalStatus(v)
                  return <Tag color={info.color as 'warning' | 'success' | 'error'}>{info.text}</Tag>
                },
              },
              {
                title: '审批人',
                dataIndex: 'approverName',
                key: 'approverName',
                render: (v: string | null) => v || '-',
              },
              {
                title: '审批备注',
                dataIndex: 'approvalNote',
                key: 'approvalNote',
                render: (v: string | null) => v || '-',
              },
            ]}
          />
        )}
      </div>
    )
  }

  const renderTimelineTab = () => {
    return <Timeline events={timelineEvents} loading={timelineLoading} />
  }

  const detailTabs = [
    {
      key: 'affected',
      label: (
        <span>
          <UserOutlined />
          受影响对象
        </span>
      ),
      children: renderAffectedPartiesTab(),
    },
    {
      key: 'responsibility',
      label: (
        <span>
          <SwapOutlined />
          责任调整记录
        </span>
      ),
      children: renderResponsibilityTab(),
    },
    {
      key: 'timeline',
      label: (
        <span>
          <ClockCircleOutlined />
          操作记录
        </span>
      ),
      children: renderTimelineTab(),
    },
  ]

  return (
    <div>
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="逾期记录总数" value={stats.totalOverdue} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="未处理"
                value={stats.unresolvedCount}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="逾期总金额"
                value={stats.totalOverdueAmount}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="平均逾期天数"
                value={stats.averageOverdueDays}
                precision={1}
                suffix="天"
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline">
          <Form.Item name="searchKeyword" label="关键词">
            <Input placeholder="订单号/租客" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="isResolved" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 140 }}>
              <Option value={false}>未处理</Option>
              <Option value={true}>已处理</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reportedAtRange" label="上报日期">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pageNumber,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, size) => {
              setPageNumber(page)
              setPageSize(size)
            },
          }}
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            onClick: () => fetchDetail(record.id),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <ClockCircleOutlined style={{ color: '#ff4d4f' }} />
            <Title level={5} style={{ margin: 0 }}>
              租金逾期详情
            </Title>
          </Space>
        }
        width={900}
        open={detailVisible}
        onClose={handleCloseDetail}
        extra={
          currentDetail && (
            <Tag color={currentDetail.isResolved ? 'success' : 'error'}>
              {currentDetail.isResolved ? '已处理' : '未处理'}
            </Tag>
          )
        }
      >
        {currentDetail && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">
                {currentDetail.orderNumber}
              </Descriptions.Item>
              <Descriptions.Item label="租客姓名">
                {currentDetail.tenantName}
              </Descriptions.Item>
              <Descriptions.Item label="逾期金额">
                <Text type="danger" strong>
                  {formatCurrency(currentDetail.overdueAmount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="逾期天数">
                <Tag color={currentDetail.overdueDays > 30 ? 'red' : currentDetail.overdueDays > 15 ? 'orange' : 'warning'}>
                  {currentDetail.overdueDays} 天
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="应缴日期">
                {formatDateOnly(currentDetail.dueDate)}
              </Descriptions.Item>
              <Descriptions.Item label="上报时间">
                {formatDateTime(currentDetail.reportedAt)}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '16px 0' }} />

            <Tabs defaultActiveKey="affected" items={detailTabs} />
          </>
        )}
      </Drawer>

      <Modal
        title="补充说明"
        open={supplementModalVisible}
        onOk={handleSupplementSubmit}
        onCancel={() => {
          setSupplementModalVisible(false)
          setCurrentAffectedParty(null)
          supplementForm.resetFields()
        }}
        okText="提交"
        cancelText="取消"
      >
        {currentAffectedParty && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">对象：</Text>
            <Space>
              <Tag color="blue">{formatPartyType(currentAffectedParty.partyType as PartyType)}</Tag>
              <Text strong>{currentAffectedParty.partyName}</Text>
            </Space>
          </div>
        )}
        <Form form={supplementForm} layout="vertical">
          <Form.Item
            name="supplementNote"
            label="补充说明内容"
            rules={[{ required: true, message: '请输入补充说明' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入补充说明内容..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="调整责任归属"
        open={adjustModalVisible}
        onOk={handleAdjustSubmit}
        onCancel={() => {
          setAdjustModalVisible(false)
          adjustForm.resetFields()
        }}
        okText="提交"
        cancelText="取消"
      >
        <Form form={adjustForm} layout="vertical">
          <Form.Item
            name="originalResponsibility"
            label="原责任归属"
            rules={[{ required: true, message: '请选择原责任归属' }]}
          >
            <Select placeholder="请选择原责任归属">
              {Object.entries(responsibilityPartyMap).map(([value, label]) => (
                <Option key={value} value={Number(value)}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="newResponsibility"
            label="新责任归属"
            rules={[{ required: true, message: '请选择新责任归属' }]}
          >
            <Select placeholder="请选择新责任归属">
              {Object.entries(responsibilityPartyMap).map(([value, label]) => (
                <Option key={value} value={Number(value)}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="adjustReason"
            label="调整原因"
            rules={[{ required: true, message: '请输入调整原因' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入调整原因..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OverdueList
