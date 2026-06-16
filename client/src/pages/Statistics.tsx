import { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Button,
  Select,
  DatePicker,
  Form,
  Space,
  Progress,
  Tag,
  List,
  Typography,
} from 'antd'
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  PhoneOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  getStatisticsOverview,
  getPrescriptionTrend,
  getStoreStatistics,
  getStores,
} from '@/api/business'
import { useUserStore } from '@/store/user'
import { UserRole, PrescriptionStatus } from '@/types'
import type {
  StatisticsDto,
  PrescriptionStatisticsDto,
  StoreStatisticsDto,
  Store,
  StatisticsQuery,
} from '@/types'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { Title, Text } = Typography

const Statistics = () => {
  const navigate = useNavigate()
  const { hasRole } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<StatisticsDto | null>(null)
  const [trendData, setTrendData] = useState<PrescriptionStatisticsDto[]>([])
  const [storeData, setStoreData] = useState<StoreStatisticsDto[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [query, setQuery] = useState<StatisticsQuery>({})
  const [form] = Form.useForm()

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [query])

  const fetchStores = async () => {
    try {
      const data = await getStores()
      setStores(data)
    } catch (error) {
      console.error('Fetch stores error:', error)
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [overview, trend, storeStats] = await Promise.all([
        getStatisticsOverview(query),
        getPrescriptionTrend(query),
        hasRole([UserRole.StoreManager, UserRole.Headquarters])
          ? getStoreStatistics(query)
          : Promise.resolve([]),
      ])
      setStatistics(overview)
      setTrendData(trend)
      setStoreData(storeStats)
    } catch (error) {
      console.error('Fetch statistics error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (values: any) => {
    const newQuery: StatisticsQuery = {}
    if (values.storeId) newQuery.storeId = values.storeId
    if (values.dateRange) {
      newQuery.startDate = values.dateRange[0].format('YYYY-MM-DD')
      newQuery.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }
    setQuery(newQuery)
  }

  const handleReset = () => {
    form.resetFields()
    setQuery({})
  }

  const handleViewPrescriptions = (storeId?: number, status?: PrescriptionStatus) => {
    const params = new URLSearchParams()
    if (storeId) params.set('storeId', String(storeId))
    if (status !== undefined) params.set('status', String(status))
    navigate(`/prescriptions?${params.toString()}`)
  }

  const statCards = statistics
    ? [
        {
          title: '处方总数',
          value: statistics.totalPrescriptions,
          icon: <FileTextOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
          color: '#1677ff',
          clickable: true,
        },
        {
          title: '待处理',
          value: statistics.pendingCount + statistics.reviewingCount,
          icon: <ClockCircleOutlined style={{ fontSize: 28, color: '#fa8c16' }} />,
          color: '#fa8c16',
          clickable: true,
          status: PrescriptionStatus.Reviewing,
        },
        {
          title: '审核通过',
          value: statistics.approvedCount + statistics.completedCount,
          icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
          color: '#52c41a',
          clickable: true,
          status: PrescriptionStatus.Approved,
        },
        {
          title: '审核拒绝',
          value: statistics.rejectedCount,
          icon: <CloseCircleOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />,
          color: '#ff4d4f',
          clickable: true,
          status: PrescriptionStatus.Rejected,
        },
        {
          title: '处方不清',
          value: statistics.unclearCount,
          icon: <ExclamationCircleOutlined style={{ fontSize: 28, color: '#faad14' }} />,
          color: '#faad14',
          clickable: true,
          status: PrescriptionStatus.Unclear,
        },
        {
          title: '回访完成',
          value: statistics.followUpCompletedCount,
          icon: <PhoneOutlined style={{ fontSize: 28, color: '#13c2c2' }} />,
          color: '#13c2c2',
          clickable: false,
        },
      ]
    : []

  const trendColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '处方总数',
      dataIndex: 'totalCount',
      width: 100,
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: '审核通过',
      dataIndex: 'approvedCount',
      width: 100,
      render: (v: number) => <span style={{ color: '#52c41a' }}>{v}</span>,
    },
    {
      title: '审核拒绝',
      dataIndex: 'rejectedCount',
      width: 100,
      render: (v: number) => <span style={{ color: '#ff4d4f' }}>{v}</span>,
    },
    {
      title: '处方不清',
      dataIndex: 'unclearCount',
      width: 100,
      render: (v: number) => <span style={{ color: '#faad14' }}>{v}</span>,
    },
    {
      title: '通过率',
      dataIndex: 'totalCount',
      width: 200,
      render: (_: number, record: PrescriptionStatisticsDto) => {
        const rate = record.totalCount > 0 ? (record.approvedCount / record.totalCount) * 100 : 0
        return <Progress percent={Math.round(rate)} size="small" />
      },
    },
  ]

  const storeColumns = [
    { title: '门店', dataIndex: 'storeName', width: 160 },
    {
      title: '处方总数',
      dataIndex: 'totalCount',
      width: 100,
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: '通过数',
      dataIndex: 'approvedCount',
      width: 100,
      render: (v: number) => <span style={{ color: '#52c41a' }}>{v}</span>,
    },
    {
      title: '通过率',
      dataIndex: 'approvalRate',
      width: 200,
      render: (v: number) => <Progress percent={Math.round(v)} size="small" />,
    },
    {
      title: '回访完成',
      dataIndex: 'followUpCompletedCount',
      width: 100,
      render: (v: number) => <Tag color="cyan">{v}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: StoreStatisticsDto) => (
        <Button type="link" size="small" onClick={() => handleViewPrescriptions(record.storeId)}>
          查看处方
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">统计报表</div>
        <Button icon={<ReloadOutlined />} onClick={fetchAllData}>
          刷新
        </Button>
      </div>

      <div className="filter-section">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          {hasRole([UserRole.Headquarters]) && (
            <Form.Item name="storeId" label="门店">
              <Select placeholder="全部" style={{ width: 160 }} allowClear>
                {stores.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker />
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

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={12} sm={8} md={4} key={index}>
            <Card
              hoverable={card.clickable}
              onClick={() => card.clickable && handleViewPrescriptions(undefined, card.status)}
              style={{ cursor: card.clickable ? 'pointer' : 'default' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ marginRight: 16 }}>{card.icon}</div>
                <div>
                  <Statistic
                    title={card.title}
                    value={card.value}
                    valueStyle={{ color: card.color, fontSize: 22, fontWeight: 600 }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={hasRole([UserRole.StoreManager, UserRole.Headquarters]) ? 14 : 24}>
          <Card title="处方趋势" size="small">
            <Table
              rowKey="date"
              dataSource={trendData}
              columns={trendColumns}
              pagination={false}
              size="small"
              loading={loading}
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>

        {hasRole([UserRole.StoreManager, UserRole.Headquarters]) && (
          <Col xs={24} lg={10}>
            <Card title="门店统计" size="small">
              <Table
                rowKey="storeId"
                dataSource={storeData}
                columns={storeColumns}
                pagination={false}
                size="small"
                loading={loading}
                scroll={{ y: 400 }}
              />
            </Card>
          </Col>
        )}
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="状态分布" size="small">
            {statistics && (
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8} md={6}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#f5f5f5', borderRadius: 6 }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#1677ff', marginBottom: 4 }}>
                      {statistics.totalPrescriptions}
                    </div>
                    <div style={{ color: '#8c8c8c' }}>处方总数</div>
                  </div>
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#e6f7ff', borderRadius: 6 }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff', marginBottom: 4 }}>
                      {statistics.pendingCount}
                    </div>
                    <div style={{ color: '#595959' }}>待提交</div>
                  </div>
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#fff7e6', borderRadius: 6 }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16', marginBottom: 4 }}>
                      {statistics.reviewingCount}
                    </div>
                    <div style={{ color: '#595959' }}>审核中</div>
                  </div>
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#f6ffed', borderRadius: 6 }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a', marginBottom: 4 }}>
                      {statistics.approvedCount + statistics.completedCount}
                    </div>
                    <div style={{ color: '#595959' }}>已通过</div>
                  </div>
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#fff1f0', borderRadius: 6 }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f', marginBottom: 4 }}>
                      {statistics.rejectedCount}
                    </div>
                    <div style={{ color: '#595959' }}>已拒绝</div>
                  </div>
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#fffbe6', borderRadius: 6 }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#faad14', marginBottom: 4 }}>
                      {statistics.unclearCount}
                    </div>
                    <div style={{ color: '#595959' }}>处方不清</div>
                  </div>
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#fff7e6', borderRadius: 6 }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16', marginBottom: 4 }}>
                      {statistics.supplementRequiredCount}
                    </div>
                    <div style={{ color: '#595959' }}>需补充资料</div>
                  </div>
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#e6fffb', borderRadius: 6 }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#13c2c2', marginBottom: 4 }}>
                      {statistics.followUpCompletedCount}
                    </div>
                    <div style={{ color: '#595959' }}>回访完成</div>
                  </div>
                </Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Statistics
