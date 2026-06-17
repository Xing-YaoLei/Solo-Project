
import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Tag,
  Space,
  Input,
  Segmented,
  Empty,
  Button,
  Spin,
} from 'antd'
import {
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  RightOutlined,
  HomeOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { todoApi } from '@/api'
import { useAppStore } from '@/store'
import type { TodoTaskDto, TodoStatus, TodoPriority } from '@/types'
import {
  formatTodoStatus,
  formatTodoPriority,
  formatDateOnly,
  getRelativeTime,
} from '@/utils/format'

const { Search } = Input

const TodoList: React.FC = () => {
  const navigate = useNavigate()
  const { setLoading } = useAppStore()
  const [todos, setTodos] = useState<TodoTaskDto[]>([])
  const [status, setStatus] = useState<TodoStatus | 'all'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await todoApi.getMyTodos({
        status: status === 'all' ? undefined : status,
        searchKeyword: searchKeyword || undefined,
        pageSize: 100,
      })
      setTodos(result.items || [])
    } catch (error) {
      console.error('获取待办列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [status, searchKeyword, setLoading])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchData()
    } finally {
      setRefreshing(false)
    }
  }

  const statusOptions = [
    { label: '全部', value: 'all' },
    { label: '待处理', value: 0 },
    { label: '进行中', value: 1 },
    { label: '已完成', value: 2 },
    { label: '已逾期', value: 3 },
  ]

  const getPriorityIcon = (priority: TodoPriority) => {
    switch (priority) {
      case 3:
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      case 2:
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      case 1:
        return <ClockCircleOutlined style={{ color: '#1677ff' }} />
      default:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
    }
  }

  const getBorderColor = (item: TodoTaskDto) => {
    if (item.status === 3) return '#ff4d4f'
    if (item.status === 2) return '#52c41a'
    if (item.status === 1) return '#1677ff'
    switch (item.priority) {
      case 3:
        return '#ff4d4f'
      case 2:
        return '#faad14'
      default:
        return '#e8e8e8'
    }
  }

  return (
    <div>
      <Card style={{ padding: 0, marginBottom: 12 }}>
        <Search
          placeholder="搜索待办"
          allowClear
          size="large"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ marginBottom: 12 }}
          prefix={<SearchOutlined />}
        />
        <Segmented
          value={status}
          onChange={setStatus as (value: any) => void}
          options={statusOptions}
          block
          size="small"
        />
      </Card>

      <div style={{ textAlign: 'right', marginBottom: 12 }}>
        <Button
          type="text"
          icon={<ReloadOutlined spin={refreshing} />}
          onClick={handleRefresh}
        >
          {refreshing ? '刷新中...' : '刷新'}
        </Button>
      </div>

      <Spin spinning={refreshing}>
        {todos.length === 0 ? (
          <Empty description="暂无待办任务" style={{ marginTop: 60 }} />
        ) : (
          <div>
            {todos.map((item) => {
              const statusInfo = formatTodoStatus(item.status as TodoStatus)
              const priorityInfo = formatTodoPriority(item.priority as TodoPriority)
              return (
                <Card
                  key={item.id}
                  size="small"
                  style={{
                    marginBottom: 12,
                    borderLeft: `4px solid ${getBorderColor(item)}`,
                  }}
                  onClick={() => navigate(`/mobile/todos/${item.id}`)}
                  hoverable
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Space direction="vertical" size={4} style={{ flex: 1 }}>
                      <Space>
                        {getPriorityIcon(item.priority as TodoPriority)}
                        <strong style={{ fontSize: 15 }}>{item.title}</strong>
                      </Space>
                      <Space size={8} wrap>
                        <Tag color={statusInfo.color as 'blue' | 'green' | 'red' | 'orange' | 'default'} style={{ margin: 0 }}>
                          {statusInfo.text}
                        </Tag>
                        <Tag color={priorityInfo.color as 'blue' | 'green' | 'red' | 'orange' | 'default'} style={{ margin: 0 }}>
                          {priorityInfo.text}优先级
                        </Tag>
                      </Space>
                      {item.description && (
                        <div style={{ color: '#666', fontSize: 13 }}>{item.description}</div>
                      )}
                      {item.orderNumber && (
                        <Space size={4} style={{ color: '#999', fontSize: 12 }}>
                          <HomeOutlined />
                          <span>{item.apartmentNumber}</span>
                          <span>·</span>
                          <span>{item.orderNumber}</span>
                        </Space>
                      )}
                      <Space size={12} style={{ color: '#999', fontSize: 12 }}>
                        <span>截止: {formatDateOnly(item.dueDate)}</span>
                        <span>{getRelativeTime(item.createdAt)}</span>
                      </Space>
                    </Space>
                    <RightOutlined style={{ color: '#bfbfbf', marginTop: 6 }} />
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Spin>
    </div>
  )
}

export default TodoList
