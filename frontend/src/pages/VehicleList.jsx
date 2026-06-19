import { useState, useEffect } from 'react'
import { Row, Col, Input, Select, Table, Tag, Card } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { vehicleApi } from '../api'

const warningLevelMap = {
  normal: { color: 'success', label: '正常' },
  warning: { color: 'warning', label: '预警' },
  danger: { color: 'error', label: '高危' },
}

export default function VehicleList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [summary, setSummary] = useState(null)
  const [filters, setFilters] = useState({ plate: '', brand: '', warning: undefined })

  useEffect(() => {
    loadData()
    loadSummary()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    const params = {}
    if (filters.plate) params.plate_number = filters.plate
    if (filters.brand) params.brand = filters.brand
    if (filters.warning) params.warning_level = filters.warning
    const result = await vehicleApi.list(params).catch(() => ({ items: [] }))
    setData(result?.items || [])
    setLoading(false)
  }

  const loadSummary = async () => {
    const s = await vehicleApi.getWarningsSummary().catch(() => null)
    setSummary(s)
  }

  const columns = [
    { title: '车牌号', dataIndex: 'plate_number', key: 'plate_number', width: 110 },
    { title: '品牌', dataIndex: 'brand', key: 'brand', width: 80 },
    { title: '车型', dataIndex: 'model', key: 'model' },
    { title: '年款', dataIndex: 'year', key: 'year', width: 70 },
    { title: '颜色', dataIndex: 'color', key: 'color', width: 70 },
    {
      title: '里程(km)',
      dataIndex: 'mileage',
      key: 'mileage',
      render: (v) => (v || 0).toLocaleString(),
      width: 110,
    },
    { title: '车主', dataIndex: 'owner_name', key: 'owner_name', width: 100 },
    {
      title: '维修次数',
      dataIndex: 'repair_count',
      key: 'repair_count',
      width: 90,
      sorter: (a, b) => a.repair_count - b.repair_count,
    },
    {
      title: '累计消费',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v) => `¥${(v || 0).toLocaleString()}`,
      sorter: (a, b) => (a.total_amount || 0) - (b.total_amount || 0),
    },
    {
      title: '最后维修',
      dataIndex: 'last_repair_date',
      key: 'last_repair_date',
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
      width: 110,
    },
    {
      title: '预警级别',
      dataIndex: 'warning_level',
      key: 'warning_level',
      width: 90,
      render: (level) => {
        const cfg = warningLevelMap[level] || warningLevelMap.normal
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <a onClick={() => navigate(`/vehicles/${record.id}`)}>查看档案</a>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">车辆档案</div>
        <div className="page-subtitle">
          管理车辆全生命周期档案，含预警、维修历史、消费记录
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="label">车辆总数</div>
            <div className="value">{summary?.total || '--'}</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="label">高危预警</div>
            <div className="value" style={{ color: '#ff4d4f' }}>
              {summary?.danger || 0}
              <span style={{ fontSize: 13, color: '#999', marginLeft: 6 }}>
                ({summary?.danger_ratio || 0}%)
              </span>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="label">一般预警</div>
            <div className="value" style={{ color: '#faad14' }}>
              {summary?.warning || 0}
              <span style={{ fontSize: 13, color: '#999', marginLeft: 6 }}>
                ({summary?.warning_ratio || 0}%)
              </span>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="label">正常车辆</div>
            <div className="value" style={{ color: '#52c41a' }}>{summary?.normal || 0}</div>
          </div>
        </Col>
      </Row>

      <div className="filter-bar">
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索车牌号"
          style={{ width: 200 }}
          value={filters.plate}
          onChange={(e) => setFilters({ ...filters, plate: e.target.value })}
          allowClear
        />
        <Select
          placeholder="预警级别"
          style={{ width: 150 }}
          allowClear
          value={filters.warning}
          onChange={(v) => setFilters({ ...filters, warning: v })}
          options={[
            { value: 'normal', label: '正常' },
            { value: 'warning', label: '预警' },
            { value: 'danger', label: '高危' },
          ]}
        />
      </div>

      <div className="chart-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          size="small"
        />
      </div>
    </div>
  )
}
