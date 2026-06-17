import { createLazyFileRoute } from '@tanstack/react-router'
import { Card, Row, Col, Statistic, Table, Tag } from 'antd'
import {
  FileTextOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { contractApi, billApi, exceptionApi, reconciliationApi } from '@/api'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'

// @ts-ignore
export const Route = createLazyFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: contracts } = useQuery({
    queryKey: ['contracts', 'overview'],
    queryFn: () => contractApi.getList({ page_size: 5 }),
  })

  const { data: exceptions } = useQuery({
    queryKey: ['exceptions', 'overview'],
    queryFn: () => exceptionApi.getList({ page_size: 5, status: 'pending' }),
  })

  const { data: bills } = useQuery({
    queryKey: ['bills', 'overview'],
    queryFn: () => billApi.getList({ page_size: 10 }),
  })

  const { data: reconciliation } = useQuery({
    queryKey: ['reconciliation', 'overview'],
    queryFn: () => reconciliationApi.getList({ page_size: 5, status: 'pending' }),
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      completed: 'success',
      processing: 'processing',
      closed: 'default',
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: '草稿',
      pending: '待处理',
      approved: '已通过',
      rejected: '已驳回',
      completed: '已完成',
      processing: '处理中',
      closed: '已关闭',
    }
    return texts[status] || status
  }

  const amountChartOption = {
    tooltip: {
      trigger: 'axis',
      formatter: '¥{c}',
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    series: [
      {
        name: '合同金额',
        type: 'bar',
        data: [120000, 190000, 150000, 220000, 280000, 320000],
        itemStyle: { color: '#1677ff' },
      },
      {
        name: '回款金额',
        type: 'line',
        data: [80000, 150000, 120000, 180000, 230000, 260000],
        itemStyle: { color: '#52c41a' },
        smooth: true,
      },
    ],
    legend: {
      data: ['合同金额', '回款金额'],
      bottom: 0,
    },
  }

  const exceptionChartOption = {
    tooltip: {
      trigger: 'item',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: 3, name: '待处理', itemStyle: { color: '#ff4d4f' } },
          { value: 5, name: '处理中', itemStyle: { color: '#faad14' } },
          { value: 12, name: '已解决', itemStyle: { color: '#52c41a' } },
        ],
      },
    ],
  }

  const columns = [
    {
      title: '单据编号',
      dataIndex: 'bill_no',
      key: 'bill_no',
    },
    {
      title: '单据名称',
      dataIndex: 'bill_name',
      key: 'bill_name',
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (val: number) => <span className="amount-highlight">¥{val.toLocaleString()}</span>,
    },
    {
      title: '已付',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      render: (val: number) => <span className="amount-highlight">¥{val.toLocaleString()}</span>,
    },
    {
      title: '未付',
      dataIndex: 'unpaid_amount',
      key: 'unpaid_amount',
      render: (val: number) => (
        <span className={val > 0 ? 'amount-warning' : 'amount-highlight'}>
          ¥{val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
  ]

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={6}>
          <div className="stat-card">
            <Statistic
              title="合同总数"
              value={contracts?.total || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card warning">
            <Statistic
              title="待处理异常"
              value={exceptions?.total || 0}
              prefix={<AlertOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card success">
            <Statistic
              title="已完成对账"
              value={reconciliation?.total || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card error">
            <Statistic
              title="待审批单据"
              value={bills?.items?.filter((b) => b.status === 'pending').length || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card
            title="合同与回款趋势"
            extra={
              // @ts-ignore
              <Link to="/contracts">
                查看全部 <ArrowRightOutlined />
              </Link>
            }
          >
            <ReactECharts option={amountChartOption} style={{ height: '300px' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title="异常单分布"
            extra={
              // @ts-ignore
              <Link to="/exceptions">
                查看全部 <ArrowRightOutlined />
              </Link>
            }
          >
            <ReactECharts option={exceptionChartOption} style={{ height: '300px' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title="最近单据"
            extra={
              // @ts-ignore
              <Link to="/bills">
                查看全部 <ArrowRightOutlined />
              </Link>
            }
          >
            <Table
              dataSource={bills?.items || []}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="待处理对账差异"
            extra={
              // @ts-ignore
              <Link to="/reconciliation">
                查看全部 <ArrowRightOutlined />
              </Link>
            }
          >
            <div className="space-y-3">
              {reconciliation?.items?.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{item.diff_no}</div>
                      <div className="text-sm text-gray-500">
                        差异类型: {item.diff_type}
                      </div>
                    </div>
                    <Tag color="warning">待处理</Tag>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span>
                      预期: <span className="amount-highlight">¥{item.expected_amount.toLocaleString()}</span>
                    </span>
                    <span>
                      实际: <span className="amount-warning">¥{item.actual_amount.toLocaleString()}</span>
                    </span>
                    <span>
                      差异: <span className="amount-error">¥{item.diff_amount.toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              ))}
              {(!reconciliation?.items || reconciliation.items.length === 0) && (
                <div className="text-center text-gray-400 py-8">
                  暂无待处理的对账差异
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
