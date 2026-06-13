import React, { useState, useEffect } from 'react'
import { DatePicker, Input, Table, Tag, Button, Space } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { analyticsAPI } from '../services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Search } = Input

function VerificationRecords() {
  const navigate = useNavigate()
  const [records, setRecords] = useState({ total: 0, items: [] })
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    loadRecords()
  }, [dateRange, page, pageSize])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const data = await analyticsAPI.getVerificationRecords({
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
        page,
        page_size: pageSize,
      })
      setRecords(data)
    } catch (e) {
      console.error('加载核销记录失败:', e)
      loadMockRecords()
    }
    setLoading(false)
  }

  const loadMockRecords = () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      record_id: i + 1,
      record_no: `CR2024000${i + 1}`,
      member_id: (i % 10) + 1,
      membership_id: (i % 5) + 1,
      course_id: (i % 15) + 1,
      verification_type: ['course', 'access', 'manual'][i % 3],
      verification_type_name: ['课程核销', '门禁核销', '手动核销'][i % 3],
      consume_sessions: 1,
      verify_time: dayjs().subtract(i, 'day').hour(10 + (i % 8)).format('YYYY-MM-DD HH:mm:ss'),
      verify_date: dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
      operator_name: ['前台小王', '前台小李', '系统自动'][i % 3],
      device_location: ['一楼前台', '二楼前台', '私教区入口', '团课教室'][i % 4],
    }))
    setRecords({ total: 200, page: 1, page_size: 20, items })
  }

  const columns = [
    { title: '核销单号', dataIndex: 'record_no', key: 'record_no', width: 140 },
    {
      title: '核销类型',
      dataIndex: 'verification_type_name',
      key: 'verification_type_name',
      width: 100,
      render: (name, record) => {
        const colorMap = { course: 'blue', access: 'green', manual: 'orange' }
        return <Tag color={colorMap[record.verification_type]}>{name}</Tag>
      },
    },
    { title: '会员ID', dataIndex: 'member_id', key: 'member_id', width: 80 },
    { title: '会籍ID', dataIndex: 'membership_id', key: 'membership_id', width: 80 },
    { title: '课程ID', dataIndex: 'course_id', key: 'course_id', width: 80 },
    { title: '消耗课时', dataIndex: 'consume_sessions', key: 'consume_sessions', width: 80 },
    { title: '核销时间', dataIndex: 'verify_time', key: 'verify_time', width: 180 },
    { title: '操作员', dataIndex: 'operator_name', key: 'operator_name', width: 100 },
    { title: '核销地点', dataIndex: 'device_location', key: 'device_location', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/members/${record.member_id}`)}>
            会员详情
          </Button>
        </Space>
      ),
    },
  ]

  const totalSessions = records.items.reduce((sum, r) => sum + r.consume_sessions, 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">核销记录</h1>
        <p className="page-desc">
          所有课程核销记录，支持按时间筛选，可追溯到具体课程和会员档案
        </p>
      </div>

      <div className="member-table">
        <div className="filter-bar">
          <RangePicker
            value={dateRange}
            onChange={(dates) => { setDateRange(dates); setPage(1) }}
          />
          <Search
            placeholder="搜索会员/核销单号"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 240 }}
            onSearch={(v) => { setKeyword(v); setPage(1) }}
          />
          <span style={{ marginLeft: 'auto', color: '#666' }}>
            共核销 <b style={{ color: '#1890ff' }}>{records.total}</b> 次，
            消耗 <b style={{ color: '#faad14' }}>{records.total * 1}</b> 课时
          </span>
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={records.items}
          rowKey="record_id"
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: records.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </div>
    </div>
  )
}

export default VerificationRecords
