import React, { useState, useEffect } from 'react'
import { DatePicker, Input, Table, Tag, Button, Space, Modal, Descriptions, Drawer } from 'antd'
import { SearchOutlined, EyeOutlined, BookOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { analyticsAPI } from '../services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Search } = Input

function VerificationRecords() {
  const navigate = useNavigate()
  const [records, setRecords] = useState({ total: 0, items: [] })
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState([dayjs().subtract(90, 'day'), dayjs()])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)

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
      const normalized = Array.isArray(data) ? { total: data.length, page: 1, page_size: pageSize, items: data } : (data || { items: [] })
      setRecords(normalized)
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
      member_name: `会员${i + 1}`,
      member_no: `M202400${i + 1}`,
      member_phone: `138${String(10000000 + i * 1000).slice(0, 8)}`,
      membership_id: (i % 5) + 1,
      course_id: (i % 15) + 1,
      course_no: `COURSE${1000 + i}`,
      course_type: ['私教一对一', '团课', '拉伸课'][i % 3],
      course_coach_name: ['张教练', '李教练', '王教练', '陈教练'][i % 4],
      course_date: dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
      course_start_time: `${10 + (i % 8)}:00`,
      course_end_time: `${11 + (i % 8)}:00`,
      course_duration: 60,
      course_status: 'completed',
      course_remark: i % 3 === 0 ? '会员当天状态良好，加练了10分钟' : null,
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

  const handleViewCourseDetail = (record) => {
    setCurrentRecord(record)
    setDetailDrawerVisible(true)
  }

  const columns = [
    { title: '核销单号', dataIndex: 'record_no', key: 'record_no', width: 140, fixed: 'left' },
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
    { title: '会员姓名', dataIndex: 'member_name', key: 'member_name', width: 100, render: (t, r) => t || `会员#${r.member_id}` },
    { title: '会员号', dataIndex: 'member_no', key: 'member_no', width: 110 },
    { title: '手机号', dataIndex: 'member_phone', key: 'member_phone', width: 130 },
    { title: '课程号', dataIndex: 'course_no', key: 'course_no', width: 110 },
    { title: '课程类型', dataIndex: 'course_type', key: 'course_type', width: 110, render: (t) => t || '-' },
    { title: '上课教练', dataIndex: 'course_coach_name', key: 'course_coach_name', width: 100, render: (t) => t || '-' },
    { title: '课程日期', dataIndex: 'course_date', key: 'course_date', width: 110, render: (t) => t || '-' },
    { title: '上课时段', key: 'course_time', width: 110, render: (_, r) => (r.course_start_time && r.course_end_time) ? `${r.course_start_time}-${r.course_end_time}` : '-' },
    { title: '时长(分)', dataIndex: 'course_duration', key: 'course_duration', width: 80, render: (t) => t || '-' },
    { title: '消耗课时', dataIndex: 'consume_sessions', key: 'consume_sessions', width: 80 },
    { title: '核销时间', dataIndex: 'verify_time', key: 'verify_time', width: 170 },
    { title: '操作员', dataIndex: 'operator_name', key: 'operator_name', width: 100 },
    { title: '核销地点', dataIndex: 'device_location', key: 'device_location', width: 110 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<BookOutlined />} onClick={() => handleViewCourseDetail(record)}>
            课程原始记录
          </Button>
          <Button type="link" size="small" icon={<UserOutlined />} onClick={() => navigate(`/members/${record.member_id}`)}>
            会员档案
          </Button>
        </Space>
      ),
    },
  ]

  const totalSessions = records.items.reduce((sum, r) => sum + (r.consume_sessions || 0), 0)

  const renderCourseStatus = (s) => {
    const map = { scheduled: { color: 'blue', name: '待上课' }, completed: { color: 'green', name: '已完成' }, cancelled: { color: 'red', name: '已取消' }, no_show: { color: 'orange', name: '未到店' } }
    const st = map[s] || { color: 'default', name: s || '-' }
    return <Tag color={st.color}>{st.name}</Tag>
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">核销记录</h1>
        <p className="page-desc">
          所有课程核销记录，支持按时间筛选，可追溯到课程表原始记录和会员档案（核销记录 → 课程原始记录 → 会员档案 逐层展开）
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
            消耗 <b style={{ color: '#faad14' }}>{totalSessions}</b> 课时
          </span>
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={records.items}
          rowKey={(r) => r.record_id || r.id || Math.random()}
          scroll={{ x: 1700 }}
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

      <Drawer
        title="课程表原始记录详情"
        placement="right"
        width={620}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setDetailDrawerVisible(false)}>关闭</Button>
            {currentRecord && (
              <Button type="primary" icon={<UserOutlined />} onClick={() => { setDetailDrawerVisible(false); navigate(`/members/${currentRecord.member_id}`) }}>
                跳转会员档案
              </Button>
            )}
          </Space>
        }
      >
        {currentRecord && (
          <div>
            <Descriptions title="核销基本信息" size="small" column={1} bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label="核销单号">{currentRecord.record_no}</Descriptions.Item>
              <Descriptions.Item label="核销类型">{currentRecord.verification_type_name}</Descriptions.Item>
              <Descriptions.Item label="核销时间">{currentRecord.verify_time}</Descriptions.Item>
              <Descriptions.Item label="操作员">{currentRecord.operator_name}</Descriptions.Item>
              <Descriptions.Item label="核销地点">{currentRecord.device_location}</Descriptions.Item>
              <Descriptions.Item label="消耗课时">{currentRecord.consume_sessions} 节</Descriptions.Item>
            </Descriptions>

            <Descriptions title="课程表原始记录" size="small" column={1} bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label="课程号">{currentRecord.course_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="课程类型">{currentRecord.course_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="上课教练">{currentRecord.course_coach_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="课程日期">{currentRecord.course_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="上课时段">
                {(currentRecord.course_start_time && currentRecord.course_end_time) ? `${currentRecord.course_start_time} - ${currentRecord.course_end_time}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="课程时长">{currentRecord.course_duration ? `${currentRecord.course_duration} 分钟` : '-'}</Descriptions.Item>
              <Descriptions.Item label="课程状态">{renderCourseStatus(currentRecord.course_status)}</Descriptions.Item>
              <Descriptions.Item label="课程备注">{currentRecord.course_remark || '无'}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="关联会员（下一层）" size="small" column={1} bordered>
              <Descriptions.Item label="会员ID">{currentRecord.member_id}</Descriptions.Item>
              <Descriptions.Item label="会员号">{currentRecord.member_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="会员姓名">{currentRecord.member_name || `会员#${currentRecord.member_id}`}</Descriptions.Item>
              <Descriptions.Item label="手机号">{currentRecord.member_phone || '-'}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default VerificationRecords
