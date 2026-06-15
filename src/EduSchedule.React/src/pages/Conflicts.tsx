import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Select,
  Space,
  message,
  Tag,
  Input,
  Card,
  Statistic,
  Row,
  Col,
  Tooltip,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  FilterOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { conflictLevelLabels, conflictStatusLabels } from '../utils/enumLabels'
import type { Conflict } from '../types'

const { Option } = Select

const Conflicts = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>()
  const [levelFilter, setLevelFilter] = useState<string>()
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    loadData()
  }, [page, pageSize, searchText, statusFilter, levelFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [conflictsRes, statsRes] = await Promise.all([
        api.conflicts.getList({
          page,
          pageSize,
          search: searchText,
          status: statusFilter,
          conflictLevel: levelFilter,
        }),
        api.conflicts.getStats(),
      ])

      setConflicts(conflictsRes.data.items)
      setTotal(conflictsRes.data.total)
      setStats(statsRes.data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (id: number) => {
    navigate(`/conflicts/${id}`)
  }

  const handleAssign = async (id: number) => {
    try {
      await api.conflicts.assign(id, { assigneeId: 1 })
      message.success('已分配')
      loadData()
    } catch (error) {
      message.error('分配失败')
    }
  }

  const getConflictLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Low: 'success',
      Medium: 'warning',
      High: 'orange',
      Critical: 'error',
    }
    return colors[level] || 'default'
  }

  const getConflictLevelSort = (level: string) => {
    const sortOrder: Record<string, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    }
    return sortOrder[level] || 0
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Pending: 'processing',
      UnderReview: 'warning',
      Resolved: 'success',
      Escalated: 'error',
      Rejected: 'default',
    }
    return colors[status] || 'default'
  }

  const columns = [
    {
      title: '风险等级',
      dataIndex: 'conflictLevel',
      key: 'conflictLevel',
      width: 100,
      sorter: (a: Conflict, b: Conflict) =>
        getConflictLevelSort(b.conflictLevel) - getConflictLevelSort(a.conflictLevel),
      render: (level: string) => (
        <div className={`conflict-level-${level.toLowerCase()}`} style={{ fontWeight: 600 }}>
          <Tag color={getConflictLevelColor(level)} icon={<WarningOutlined />}>
            {conflictLevelLabels[level]}
          </Tag>
        </div>
      ),
    },
    {
      title: '冲突类型',
      dataIndex: 'conflictType',
      key: 'conflictType',
      width: 120,
      render: (type: string) => {
        const typeLabels: Record<string, string> = {
          Classroom: '教室冲突',
          Teacher: '教师冲突',
          Student: '学生冲突',
          Time: '时间冲突',
        }
        return typeLabels[type] || type
      },
    },
    {
      title: '冲突描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
      render: (text: string, record: Conflict) => (
        <Tooltip title={text}>
          <div>
            <div>{text}</div>
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              涉及课程: {record.schedule1Course} / {record.schedule2Course}
            </div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: '涉及教室',
      key: 'classrooms',
      width: 150,
      render: (_: any, record: Conflict) => (
        <div>
          <div>{record.schedule1Classroom}</div>
          {record.schedule1Classroom !== record.schedule2Classroom && (
            <div style={{ color: '#999', fontSize: 12 }}>{record.schedule2Classroom}</div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{conflictStatusLabels[status]}</Tag>
      ),
    },
    {
      title: '处理人',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 100,
      render: (name: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {name ? (
            <>
              <UserOutlined /> {name}
            </>
          ) : (
            <Tag color="default">未分配</Tag>
          )}
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ClockCircleOutlined style={{ color: '#999' }} />
          {new Date(date).toLocaleDateString()}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: Conflict) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            详情
          </Button>
          {!record.assigneeId && (
            <Button
              type="link"
              size="small"
              onClick={() => handleAssign(record.id)}
            >
              分配给我
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pending || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高风险"
              value={stats.highRisk || 0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中"
              value={stats.underReview || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已解决"
              value={stats.resolved || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Input.Search
              placeholder="搜索冲突描述或课程"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              style={{ width: 250 }}
              onSearch={(value) => {
                setSearchText(value)
                setPage(1)
              }}
            />
            <Select
              placeholder="状态筛选"
              style={{ width: 120 }}
              allowClear
              prefix={<FilterOutlined />}
              onChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            >
              <Option value="Pending">待处理</Option>
              <Option value="UnderReview">处理中</Option>
              <Option value="Resolved">已解决</Option>
              <Option value="Escalated">已升级</Option>
              <Option value="Rejected">已驳回</Option>
            </Select>
            <Select
              placeholder="风险等级"
              style={{ width: 120 }}
              allowClear
              onChange={(value) => {
                setLevelFilter(value)
                setPage(1)
              }}
            >
              <Option value="Critical">紧急</Option>
              <Option value="High">高</Option>
              <Option value="Medium">中</Option>
              <Option value="Low">低</Option>
            </Select>
          </Space>
          <Button type="primary" onClick={() => loadData()}>
            刷新
          </Button>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={conflicts}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条记录`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />
    </div>
  )
}

export default Conflicts
