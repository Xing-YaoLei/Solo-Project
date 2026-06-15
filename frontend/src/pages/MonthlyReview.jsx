import { useEffect, useState } from 'react'
import { Card, Row, Col, Select, Table, Tag, Statistic, Progress, Empty, Button, Space, message, Tooltip } from 'antd'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import { DownloadOutlined, CalendarOutlined, ApartmentOutlined } from '@ant-design/icons'
import { reportsApi, classroomsApi } from '../services'
import dayjs from 'dayjs'

const COLORS = ['#52c41a', '#1677ff', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa541c']

export default function MonthlyReview() {
  const [year, setYear] = useState(dayjs().year())
  const [month, setMonth] = useState(dayjs().month() + 1)
  const [building, setBuilding] = useState('')
  const [buildings, setBuildings] = useState([])
  const [utilData, setUtilData] = useState([])
  const [monthlySummary, setMonthlySummary] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadBuildings()
  }, [])

  useEffect(() => {
    loadUtilization()
    loadMonthlySummary()
  }, [year, month, building])

  const loadBuildings = async () => {
    try {
      const res = await classroomsApi.buildings()
      setBuildings(res.data.buildings)
    } catch {}
  }

  const loadUtilization = async () => {
    setLoading(true)
    try {
      const res = await reportsApi.classroomUtilization({ year, month, building: building || undefined })
      setUtilData(res.data)
    } catch {}
    setLoading(false)
  }

  const loadMonthlySummary = async () => {
    try {
      const res = await reportsApi.monthlySummary({ year })
      setMonthlySummary(res.data)
    } catch {}
  }

  const overallStats = utilData.length > 0 ? {
    totalClassrooms: utilData.length,
    avgUtilization: (utilData.reduce((a, b) => a + b.utilization_rate, 0) / utilData.length).toFixed(2),
    totalPeriods: utilData.reduce((a, b) => a + b.used_periods, 0),
    overUtilized: utilData.filter(u => u.utilization_rate >= 70).length,
    underUtilized: utilData.filter(u => u.utilization_rate < 40).length,
  } : {}

  const exportReport = async () => {
    try {
      const res = await reportsApi.generate('classroom_utilization', { year, month, building })
      message.success('报表已生成，正在下载...')
      setTimeout(async () => {
        try {
          const dl = await reportsApi.download(res.data.report_id)
          const url = window.URL.createObjectURL(new Blob([dl.data]))
          const a = document.createElement('a')
          a.href = url
          a.download = `教室利用率_${year}年${month}月.xlsx`
          a.click()
          window.URL.revokeObjectURL(url)
        } catch {}
      }, 500)
    } catch {}
  }

  const utilCols = [
    { title: '教学楼', dataIndex: 'building', width: 120 },
    { title: '教室', dataIndex: 'room_no', width: 80 },
    { title: '容量', dataIndex: 'capacity', width: 80 },
    { title: '总节数', dataIndex: 'total_periods', width: 80 },
    { title: '已用节数', dataIndex: 'used_periods', width: 90 },
    { title: '平均出勤', dataIndex: 'avg_attendance', width: 90, render: v => v || '-' },
    { title: '利用率', width: 200, render: (_, r) => {
      const color = r.utilization_rate >= 70 ? '#ff4d4f' : r.utilization_rate >= 50 ? '#faad14' : '#52c41a'
      return (
        <Space>
          <Progress percent={r.utilization_rate} size="small" strokeColor={color} style={{ width: 120 }} />
          <Tag color={r.utilization_rate >= 70 ? 'error' : r.utilization_rate >= 50 ? 'warning' : 'success'}>
            {r.utilization_rate}%
          </Tag>
        </Space>
      )
    } },
  ]

  const pieData = [
    { name: '高利用(≥70%)', value: utilData.filter(u => u.utilization_rate >= 70).length },
    { name: '中利用(50-70%)', value: utilData.filter(u => u.utilization_rate >= 50 && u.utilization_rate < 70).length },
    { name: '低利用(<50%)', value: utilData.filter(u => u.utilization_rate < 50).length },
  ].filter(d => d.value > 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="page-title" style={{ margin: 0 }}>
          月底复盘 · 教室利用率分析
          <Tag color="purple" style={{ marginLeft: 8 }}>核心指标看板</Tag>
        </div>
        <Space>
          <Select
            value={year}
            onChange={setYear}
            style={{ width: 100 }}
            options={Array.from({ length: 5 }, (_, i) => ({ label: `${dayjs().year() - i}年`, value: dayjs().year() - i }))}
          />
          <Select
            value={month}
            onChange={setMonth}
            style={{ width: 100 }}
            options={Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: i + 1 }))}
          />
          <Select
            placeholder="教学楼"
            allowClear
            style={{ width: 150 }}
            value={building || undefined}
            onChange={setBuilding}
            options={buildings.map(b => ({ label: b, value: b }))}
          />
          <Button type="primary" icon={<DownloadOutlined />} onClick={exportReport}>导出复盘报表</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="统计教室数" value={overallStats.totalClassrooms || 0} prefix={<ApartmentOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="平均利用率"
              value={overallStats.avgUtilization || 0}
              suffix="%"
              valueStyle={{ color: parseFloat(overallStats.avgUtilization) >= 60 ? '#52c41a' : '#faad14' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="本月使用总节数" value={overallStats.totalPeriods || 0} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Space>
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>高利用率(≥70%)</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#ff4d4f' }}>{overallStats.overUtilized || 0}间</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>低利用率(<40%)</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#52c41a' }}>{overallStats.underUtilized || 0}间</div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="各教室利用率排行（TOP 20）" size="small" loading={loading}>
            {utilData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={[...utilData].sort((a, b) => b.utilization_rate - a.utilization_rate).slice(0, 20)} margin={{ top: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="room_no" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <RTooltip />
                  <Bar dataKey="utilization_rate" name="利用率(%)" radius={[4, 4, 0, 0]}>
                    {utilData.sort((a, b) => b.utilization_rate - a.utilization_rate).slice(0, 20).map((_, i) => (
                      <Cell key={i} fill={_.utilization_rate >= 70 ? '#ff4d4f' : _.utilization_rate >= 50 ? '#faad14' : '#52c41a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="利用率分布" size="small" loading={loading}>
            {pieData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24}>
          <Card title={`${year}年复核申请月度趋势`} size="small">
            {monthlySummary.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlySummary} margin={{ top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year_month" />
                  <YAxis />
                  <RTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total_reviews" name="申请总数" stroke="#1677ff" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="approved_count" name="通过数" stroke="#52c41a" strokeWidth={2} />
                  <Line type="monotone" dataKey="rejected_count" name="驳回数" stroke="#ff4d4f" strokeWidth={2} />
                  <Line type="monotone" dataKey="materials_missing_count" name="材料缺失" stroke="#faad14" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title={`${year}年${month}月 教室利用率明细表`}
        size="small"
        loading={loading}
        extra={<Tag>共 {utilData.length} 间教室</Tag>}
      >
        <Table
          rowKey="classroom_id"
          size="small"
          dataSource={[...utilData].sort((a, b) => b.utilization_rate - a.utilization_rate)}
          columns={utilCols}
          scroll={{ x: 700 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </div>
  )
}
