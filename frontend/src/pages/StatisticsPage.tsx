import { useState } from 'react'
import {
  App, Button, Card, Col, DatePicker, Descriptions, Divider, Form, Modal,
  Row, Select, Space, Statistic, Table, Tabs, Tag, Typography,
} from 'antd'
import {
  DownloadOutlined, BarChartOutlined, TeamOutlined,
  CalendarOutlined, UserOutlined, WarningOutlined,
  CheckCircleOutlined, ExportOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, Area,
} from 'recharts'
import { masterDataApi, statisticsApi } from '../services/api'
import { BookingStatusText, MonthlyStatistics } from '../types'
import { saveAs } from 'file-saver'

const { Option } = Select
const { Title, Text } = Typography
const { MonthPicker } = DatePicker

const COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#ff4d4f', '#722ed1', '#13c2c2']

function StatisticsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const now = dayjs()
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(now)
  const [scenicSpotId, setScenicSpotId] = useState<string | undefined>()
  const [exportOpen, setExportOpen] = useState(false)
  const [exportForm] = Form.useForm()
  const [exportType, setExportType] = useState<'bookings' | 'monthly'>('monthly')

  const spotsQuery = useQuery({
    queryKey: ['scenic-spots'],
    queryFn: () => masterDataApi.getScenicSpots().catch(() => []),
  })

  const statsQuery = useQuery({
    queryKey: ['monthly-stats', selectedMonth.year(), selectedMonth.month() + 1, scenicSpotId],
    queryFn: () => statisticsApi.getMonthlyStatistics(
      selectedMonth.year(),
      selectedMonth.month() + 1,
      scenicSpotId,
    ).catch(() => null),
  })

  const exportMutation = useMutation({
    mutationFn: async (values: any) => {
      const year = selectedMonth.year()
      const month = selectedMonth.month() + 1
      const filterCriteria = {
        year,
        month,
        scenicSpotId: values.scenicSpotId,
        status: values.status,
      }
      const response = exportType === 'monthly'
        ? await statisticsApi.exportMonthlyReport({
            year,
            month,
            scenicSpotId: values.scenicSpotId,
            filterCriteria,
            generatedBy: '运营管理员',
            format: values.format || 'excel',
          })
        : await statisticsApi.exportBookings({
            filterCriteria,
            generatedBy: '运营管理员',
            format: values.format || 'excel',
          })
      return response
    },
    onSuccess: (response: any) => {
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const year = selectedMonth.year()
      const month = selectedMonth.month() + 1
      const prefix = exportType === 'monthly' ? '月度复盘报告' : '预约记录明细'
      const fileName = `${prefix}_${year}${String(month).padStart(2, '0')}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
      saveAs(blob, fileName)

      let filterSummary = `时间：${year}年${month}月`
      if (scenicSpotId) {
        const s = spotsQuery.data?.find((sp) => sp.id === scenicSpotId)
        if (s) filterSummary += `，景区：${s.name}`
      }

      message.success(
        {
          content: (
            <div>
              <div><strong>导出成功：{fileName}</strong></div>
              <div className="export-metadata" style={{ marginTop: 8, textAlign: 'left' }}>
                <div><strong>📊 筛选口径：</strong>{filterSummary}</div>
                <div><strong>⏰ 生成时间：</strong>{dayjs().format('YYYY-MM-DD HH:mm:ss')}</div>
                <div><strong>👤 操作者：</strong>运营管理员</div>
              </div>
            </div>
          ),
          duration: 5,
        } as any,
      )
      setExportOpen(false)
      exportForm.resetFields()
    },
    onError: () => message.error('导出失败'),
  })

  const stats: MonthlyStatistics | null = statsQuery.data || null
  const spots = spotsQuery.data || []

  const dailyChartData = stats?.dailyData?.map((d) => ({
    name: d.dateDisplay,
    预约数: d.totalBookings,
    到场数: d.arrivedCount,
    未到场数: d.noShowCount,
    取消数: d.cancelledCount,
    到场率: Math.round(d.arrivalRate * 100) / 100,
  })) || []

  const spotChartData = stats?.spotData?.map((s) => ({
    name: s.scenicSpotName,
    预约数: s.totalBookings,
    到场数: s.arrivedCount,
    未到场数: s.noShowCount,
    游客数: s.totalVisitors,
    到场率: Math.round(s.arrivalRate * 100) / 100,
    收入: s.revenue,
  })) || []

  const statusPieData = stats ? [
    { name: BookingStatusText[4], value: stats.arrivedCount, color: '#52c41a' },
    { name: BookingStatusText[5], value: stats.noShowCount, color: '#fa8c16' },
    { name: BookingStatusText[3], value: stats.cancelledCount, color: '#bfbfbf' },
    { name: BookingStatusText[2], value: stats.rescheduledCount, color: '#722ed1' },
    { name: BookingStatusText[1], value: stats.confirmedBookings, color: '#1677ff' },
  ].filter((d) => d.value > 0) : []

  return (
    <div style={{ padding: 24 }}>
      <Card className="page-container" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col xs={24} sm={16}>
            <Space wrap>
              <div>
                <Text strong style={{ marginRight: 8 }}>月份</Text>
                <MonthPicker
                  allowClear={false}
                  value={selectedMonth}
                  onChange={(v) => v && setSelectedMonth(v)}
                  style={{ width: 180 }}
                />
              </div>
              <div>
                <Text strong style={{ marginRight: 8 }}>景区</Text>
                <Select
                  allowClear
                  placeholder="全部景区"
                  style={{ width: 200 }}
                  value={scenicSpotId}
                  onChange={(v) => setScenicSpotId(v)}
                >
                  {spots.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                </Select>
              </div>
              <Button type="primary" icon={<BarChartOutlined />}
                onClick={() => queryClient.invalidateQueries({ queryKey: ['monthly-stats'] })}>
                刷新数据
              </Button>
            </Space>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right', marginTop: 12 }}>
            <Space>
              <Button
                icon={<ExportOutlined />}
                onClick={() => { setExportType('bookings'); setExportOpen(true) }}
              >
                导出明细
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => { setExportType('monthly'); setExportOpen(true) }}
              >
                导出复盘报告
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {stats ? (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={8} lg={4}>
              <Card className="stat-card" style={{ borderLeft: '4px solid #1677ff' }}>
                <CalendarOutlined style={{ fontSize: 20, color: '#1677ff' }} />
                <div className="stat-value" style={{ color: '#1677ff' }}>{stats.totalBookings}</div>
                <div className="stat-label">总预约数</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card className="stat-card" style={{ borderLeft: '4px solid #52c41a' }}>
                <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                <div className="stat-value" style={{ color: '#52c41a' }}>{stats.arrivedCount}</div>
                <div className="stat-label">到场数</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card className="stat-card" style={{ borderLeft: '4px solid #fa8c16' }}>
                <UserOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
                <div className="stat-value" style={{ color: '#fa8c16' }}>{stats.noShowCount}</div>
                <div className="stat-label">未到场</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card className="stat-card" style={{ borderLeft: '4px solid #722ed1' }}>
                <TeamOutlined style={{ fontSize: 20, color: '#722ed1' }} />
                <div className="stat-value" style={{ color: '#722ed1' }}>
                  {Math.round(stats.arrivalRate * 100) / 100}%
                </div>
                <div className="stat-label"><strong>到场率（核心）</strong></div>
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card className="stat-card" style={{ borderLeft: '4px solid #13c2c2' }}>
                <TeamOutlined style={{ fontSize: 20, color: '#13c2c2' }} />
                <div className="stat-value" style={{ color: '#13c2c2' }}>{stats.totalVisitors}</div>
                <div className="stat-label">总游客人次</div>
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card className="stat-card" style={{ borderLeft: '4px solid #faad14' }}>
                <WarningOutlined style={{ fontSize: 20, color: '#faad14' }} />
                <div className="stat-value" style={{ color: '#faad14' }}>
                  {stats.conflictCount}/{stats.resolvedConflictCount}
                </div>
                <div className="stat-label">冲突（总数/已解决）</div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={16}>
              <Card className="page-container" title="📅 每日到场趋势（核心指标）" extra={<Tag color="green">日到场率</Tag>}>
                <div style={{ width: '100%', height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="预约数" fill="#1677ff" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="到场数" fill="#52c41a" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="未到场数" fill="#fa8c16" radius={[4, 4, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="到场率"
                        stroke="#722ed1"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card className="page-container" title="📊 预约状态分布">
                <div style={{ width: '100%', height: 340 }}>
                  {statusPieData.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: 120, color: '#999' }}>暂无数据</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                          outerRadius={90}
                          dataKey="value"
                        >
                          {statusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </Col>
          </Row>

          {spotChartData.length > 0 && (
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24}>
                <Card className="page-container" title="🏞️ 各景区维度对比">
                  <Tabs
                    defaultActiveKey="rate"
                    items={[
                      {
                        key: 'rate',
                        label: '各景区到场率对比',
                        children: (
                          <div style={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={spotChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip formatter={(v: any) => [`${v}%`, '到场率']} />
                                <Bar dataKey="到场率" name="到场率(%)" fill="#52c41a" radius={[6, 6, 0, 0]}>
                                  {spotChartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ),
                      },
                      {
                        key: 'numbers',
                        label: '各景区游客/预约对比',
                        children: (
                          <div style={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={spotChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="预约数" fill="#1677ff" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="到场数" fill="#52c41a" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="游客数" fill="#13c2c2" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ),
                      },
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card className="page-container" title="📆 每日明细" extra={<Tag color="blue">{stats.monthDisplay}</Tag>}>
                <Table
                  size="small"
                  rowKey="date"
                  pagination={false}
                  scroll={{ y: 400 }}
                  dataSource={stats.dailyData || []}
                  summary={(pageData) => {
                    const totalBookings = pageData.reduce((s, d) => s + d.totalBookings, 0)
                    const totalArrived = pageData.reduce((s, d) => s + d.arrivedCount, 0)
                    const totalVisitors = pageData.reduce((s, d) => s + d.totalVisitors, 0)
                    return (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={2}><strong>合计 / 平均</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={2}><strong>{totalBookings}</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={3}><strong style={{ color: '#52c41a' }}>{totalArrived}</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={4}><strong>{stats.noShowCount}</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={5}><strong>{stats.cancelledCount}</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={6}>
                            <strong style={{ color: '#722ed1' }}>{Math.round(stats.arrivalRate * 100) / 100}%</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={7}><strong>{totalVisitors}</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={8}><strong>¥{stats.totalRevenue.toFixed(0)}</strong></Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )
                  }}
                  columns={[
                    { title: '日期', dataIndex: 'dateDisplay', key: 'd', width: 110, fixed: 'left' as const },
                    { title: '星期', key: 'w', width: 70, render: (_, r) => dayjs(r.date).format('ddd') },
                    { title: '预约数', dataIndex: 'totalBookings', key: 'b', width: 80, sorter: (a, b) => a.totalBookings - b.totalBookings },
                    { title: '到场数', dataIndex: 'arrivedCount', key: 'a', width: 80, render: (v) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{v}</span>, sorter: (a, b) => a.arrivedCount - b.arrivedCount },
                    { title: '未到场', dataIndex: 'noShowCount', key: 'ns', width: 80, render: (v) => v > 0 ? <span style={{ color: '#fa8c16' }}>{v}</span> : v },
                    { title: '取消', dataIndex: 'cancelledCount', key: 'c', width: 70 },
                    { title: '到场率', key: 'r', width: 90,
                      render: (_, r) => {
                        const rate = Math.round(r.arrivalRate * 100) / 100
                        const color = rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red'
                        return <Tag color={color}><strong>{rate}%</strong></Tag>
                      },
                      sorter: (a, b) => a.arrivalRate - b.arrivalRate,
                    },
                    { title: '游客人次', dataIndex: 'totalVisitors', key: 'v', width: 90 },
                    { title: '收入', key: 'rev', width: 110, render: (_, r) => `¥${r.revenue.toFixed(2)}`, sorter: (a, b) => a.revenue - b.revenue },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card className="page-container" title="🎯 月度汇总">
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="月份">{stats.monthDisplay}</Descriptions.Item>
                  <Descriptions.Item label="总预约数">{stats.totalBookings} 单</Descriptions.Item>
                  <Descriptions.Item label="已确认预约">{stats.confirmedBookings} 单</Descriptions.Item>
                  <Descriptions.Item label="改约次数">{stats.rescheduledCount} 次</Descriptions.Item>
                  <Descriptions.Item label="到场数" contentStyle={{ color: '#52c41a', fontWeight: 600 }}>
                    {stats.arrivedCount} 单
                  </Descriptions.Item>
                  <Descriptions.Item label="未到场数" contentStyle={{ color: '#fa8c16' }}>
                    {stats.noShowCount} 单
                  </Descriptions.Item>
                  <Descriptions.Item label="取消数">{stats.cancelledCount} 单</Descriptions.Item>
                  <Divider style={{ margin: 0 }} />
                  <Descriptions.Item label="到场率（核心）" contentStyle={{ background: '#f6ffed', color: '#52c41a', fontWeight: 700, fontSize: 18 }}>
                    {Math.round(stats.arrivalRate * 100) / 100}%
                  </Descriptions.Item>
                  <Descriptions.Item label="未到场率">{Math.round(stats.noShowRate * 100) / 100}%</Descriptions.Item>
                  <Descriptions.Item label="取消率">{Math.round(stats.cancellationRate * 100) / 100}%</Descriptions.Item>
                  <Divider style={{ margin: 0 }} />
                  <Descriptions.Item label="总游客人次">{stats.totalVisitors} 人次</Descriptions.Item>
                  <Descriptions.Item label="累计收入">¥{stats.totalRevenue.toFixed(2)}</Descriptions.Item>
                  <Divider style={{ margin: 0 }} />
                  <Descriptions.Item label="冲突总数">{stats.conflictCount} 起</Descriptions.Item>
                  <Descriptions.Item label="已解决冲突">
                    {stats.resolvedConflictCount} 起
                    {stats.conflictCount > 0 && (
                      <Tag color="green" style={{ marginLeft: 8 }}>
                        解决率 {Math.round((stats.resolvedConflictCount / stats.conflictCount) * 100)}%
                      </Tag>
                    )}
                  </Descriptions.Item>
                </Descriptions>

                {spotChartData.length > 0 && (
                  <>
                    <Divider orientation="left">各景区到场率</Divider>
                    <Table
                      size="small"
                      rowKey="scenicSpotId"
                      pagination={false}
                      dataSource={stats.spotData || []}
                      columns={[
                        { title: '景区', dataIndex: 'scenicSpotName', key: 'n' },
                        { title: '到场率', key: 'r', width: 100,
                          render: (_, r) => {
                            const rate = Math.round(r.arrivalRate * 100) / 100
                            const color = rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red'
                            return <Tag color={color}><strong>{rate}%</strong></Tag>
                          } },
                        { title: '到场数', dataIndex: 'arrivedCount', key: 'a', width: 80 },
                      ]}
                    />
                  </>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      ) : (
        <Card className="page-container" loading={statsQuery.isLoading}>
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
            <BarChartOutlined style={{ fontSize: 64, opacity: 0.2 }} />
            <div style={{ marginTop: 12 }}>
              {statsQuery.isLoading ? '加载中...' : `暂无${selectedMonth.format('YYYY年M月')}的统计数据`}
            </div>
          </div>
        </Card>
      )}

      <Card
        title={<span><ExportOutlined style={{ color: '#1677ff' }} /> 导出文件说明（自动写入）</span>}
        size="small"
        className="page-container"
        style={{ marginTop: 16 }}
      >
        <Row gutter={[24, 8]}>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8 }}><strong>📊 筛选口径</strong></div>
            <Text type="secondary">
              自动记录查询条件：月份、景区范围、状态筛选、搜索关键词等
            </Text>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8 }}><strong>⏰ 生成时间</strong></div>
            <Text type="secondary">
              精确到秒：{dayjs().format('YYYY-MM-DD HH:mm:ss')}（导出时实时生成）
            </Text>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8 }}><strong>👤 操作者</strong></div>
            <Text type="secondary">
              记录当前登录用户，便于追溯导出责任人
            </Text>
          </Col>
        </Row>
      </Card>

      <Modal
        title={exportType === 'monthly' ? '导出月度复盘报告' : '导出预约记录明细'}
        open={exportOpen}
        onCancel={() => setExportOpen(false)}
        onOk={exportForm.submit}
        confirmLoading={exportMutation.isPending}
        width={560}
      >
        <Form form={exportForm} layout="vertical" onFinish={(v) => exportMutation.mutate(v)}>
          <div className="export-metadata" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>📋 本次导出将自动写入以下元数据：</div>
            <div>• <strong>筛选口径</strong>：{selectedMonth.format('YYYY年M月')}
              {scenicSpotId ? `，景区：${spots.find((s) => s.id === scenicSpotId)?.name}` : '，全部景区'}
              {exportType === 'bookings' ? ' + 所选条件' : ''}
            </div>
            <div>• <strong>生成时间</strong>：{dayjs().format('YYYY-MM-DD HH:mm:ss')}</div>
            <div>• <strong>操作者</strong>：运营管理员</div>
          </div>
          <Row gutter={16}>
            {exportType === 'bookings' && (
              <>
                <Col span={12}>
                  <Form.Item label="预约状态" name="status">
                    <Select allowClear placeholder="全部">
                      {Object.entries(BookingStatusText).map(([k, v]) => (
                        <Option key={k} value={Number(k)}>{v}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}
            <Col span={24}>
              <Form.Item label="景区过滤" name="scenicSpotId" initialValue={scenicSpotId}>
                <Select allowClear placeholder="全部景区">
                  {spots.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="导出格式" name="format" initialValue="excel">
                <Select>
                  <Option value="excel">Excel (.xlsx)</Option>
                  <Option value="csv">CSV (.csv)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default StatisticsPage
