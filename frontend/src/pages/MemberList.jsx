import React, { useState, useEffect } from 'react'
import { Input, Select, Table, Tag, Space, Button } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { memberAPI } from '../services/api'
import dayjs from 'dayjs'

const { Search } = Input
const { Option } = Select

function MemberList() {
  const navigate = useNavigate()
  const [members, setMembers] = useState({ total: 0, items: [] })
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState()
  const [level, setLevel] = useState()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    loadMembers()
  }, [keyword, status, level, page, pageSize])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const data = await memberAPI.list({
        keyword,
        status,
        level,
        page,
        page_size: pageSize,
      })
      setMembers(data)
    } catch (e) {
      console.error('加载会员列表失败:', e)
      loadMockMembers()
    }
    setLoading(false)
  }

  const loadMockMembers = () => {
    const mockData = {
      total: 30,
      page: 1,
      page_size: 20,
      items: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        member_no: `M202400${i + 1}`,
        name: `会员${i + 1}`,
        phone: `138${String(10000000 + i * 1000).slice(0, 8)}`,
        level: ['normal', 'silver', 'gold', 'platinum'][i % 4],
        status: i < 25 ? 'active' : 'expired',
        coach_name: ['张教练', '李教练', '王教练', '陈教练'][i % 4],
        remaining_sessions: Math.floor(Math.random() * 50),
        next_expiry_date: dayjs().add(Math.floor(Math.random() * 120) - 30, 'day').format('YYYY-MM-DD'),
        total_purchased_amount: Math.floor(Math.random() * 50000) + 3000,
      })),
    }
    setMembers(mockData)
  }

  const columns = [
    { title: '会员号', dataIndex: 'member_no', key: 'member_no', width: 120 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level) => {
        const colorMap = { normal: 'default', silver: 'blue', gold: 'gold', platinum: 'purple' }
        const nameMap = { normal: '普通', silver: '银卡', gold: '金卡', platinum: '钻石' }
        return <Tag color={colorMap[level]}>{nameMap[level]}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        const map = { active: '正常', expired: '已过期', frozen: '已冻结', cancelled: '已取消' }
        const color = { active: 'green', expired: 'red', frozen: 'orange', cancelled: 'default' }
        return <Tag color={color[status]}>{map[status]}</Tag>
      },
    },
    { title: '专属教练', dataIndex: 'coach_name', key: 'coach_name', width: 100 },
    { title: '剩余课时', dataIndex: 'remaining_sessions', key: 'remaining_sessions', width: 80 },
    {
      title: '到期时间',
      dataIndex: 'next_expiry_date',
      key: 'next_expiry_date',
      width: 120,
      render: (date) => {
        const days = dayjs(date).diff(dayjs(), 'day')
        let color = 'green'
        if (days <= 0) color = 'red'
        else if (days <= 30) color = 'orange'
        return <Tag color={color}>{date}</Tag>
      },
    },
    {
      title: '累计消费',
      dataIndex: 'total_purchased_amount',
      key: 'total_purchased_amount',
      width: 100,
      render: (val) => `¥${val.toLocaleString()}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/members/${record.id}`)}>
            详情
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">会员档案</h1>
        <p className="page-desc">查看所有会员信息，支持搜索和筛选，点击可查看详细档案</p>
      </div>

      <div className="member-table">
        <div className="filter-bar">
          <Search
            placeholder="搜索会员号/姓名/手机号"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            style={{ width: 280 }}
            onSearch={(value) => { setKeyword(value); setPage(1) }}
          />
          <Select
            placeholder="会员状态"
            allowClear
            style={{ width: 120 }}
            onChange={(v) => { setStatus(v); setPage(1) }}
          >
            <Option value="active">正常</Option>
            <Option value="expired">已过期</Option>
            <Option value="frozen">已冻结</Option>
          </Select>
          <Select
            placeholder="会员等级"
            allowClear
            style={{ width: 120 }}
            onChange={(v) => { setLevel(v); setPage(1) }}
          >
            <Option value="normal">普通</Option>
            <Option value="silver">银卡</Option>
            <Option value="gold">金卡</Option>
            <Option value="platinum">钻石</Option>
          </Select>
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={members.items}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: members.total,
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

export default MemberList
