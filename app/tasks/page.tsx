'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Search,
  Filter,
  ChevronRight,
  Package,
  Clock,
  ChevronLeft,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
  cn,
  formatDuration,
  formatDate,
  formatRelativeTime,
  getTaskTypeLabel,
  getTaskStatusLabel,
  getStatusColor,
  getDamageLevelLabel,
  getPriorityColor,
  getPriorityLabel,
} from '@/lib/utils'
import type { Task, TaskWithOrder } from '@/types'

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
]

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'item_damage', label: '物品损坏' },
  { value: 'dispatch_timeout', label: '派单超时' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: '全部优先级' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(20)
  const [activeTab, setActiveTab] = useState('all')
  const [summary, setSummary] = useState({
    pendingCount: 0,
    processingCount: 0,
    highPriorityCount: 0,
  })

  const fetchTasks = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(status && { status }),
      ...(type && { type }),
      ...(priority && { priority }),
    })

    try {
      const response = await fetch(`/api/tasks?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.data || [])
        setTotal(data.total || 0)
        setSummary(data.summary || {
          pendingCount: 0,
          processingCount: 0,
          highPriorityCount: 0,
        })
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [status, type, priority, activeTab])

  useEffect(() => {
    if (activeTab === 'pending') {
      setStatus('pending')
      setType('')
    } else if (activeTab === 'processing') {
      setStatus('processing')
      setType('')
    } else if (activeTab === 'damage') {
      setType('item_damage')
      setStatus('')
    } else if (activeTab === 'timeout') {
      setType('dispatch_timeout')
      setStatus('')
    } else {
      setStatus('')
      setType('')
    }
  }, [activeTab])

  useEffect(() => {
    fetchTasks()
  }, [page, status, type, priority])

  const filteredTasks = tasks.filter(task => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      task.title.toLowerCase().includes(term) ||
      task.description?.toLowerCase().includes(term) ||
      task.orderId.toLowerCase().includes(term)
    )
  })

  const totalPages = Math.ceil(total / pageSize)

  const handleRowClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`)
  }

  const statsCards = [
    {
      label: '待处理',
      value: summary.pendingCount,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      label: '处理中',
      value: summary.processingCount,
      icon: Loader,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      label: '高优先级',
      value: summary.highPriorityCount,
      icon: AlertTriangle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
    },
    {
      label: '今日新增',
      value: Math.floor(summary.pendingCount * 0.3),
      icon: Plus,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <AlertCircle className="h-7 w-7 text-destructive" />
            任务中心
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理物品损坏和派单超时的备注任务
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            共 {total} 条任务
          </Badge>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.05 }}
          >
            <Card className={cn('border', card.borderColor)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {card.label}
                    </p>
                    <p className={cn('font-mono text-2xl font-bold mt-1', card.color)}>
                      {card.value}
                    </p>
                  </div>
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', card.bgColor)}>
                    <card.icon className={cn('h-5 w-5', card.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">全部任务</TabsTrigger>
                <TabsTrigger value="pending">待处理</TabsTrigger>
                <TabsTrigger value="processing">处理中</TabsTrigger>
                <TabsTrigger value="damage">物品损坏</TabsTrigger>
                <TabsTrigger value="timeout">派单超时</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索任务标题、描述、订单ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={STATUS_OPTIONS}
                  className="w-32"
                />
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  options={TYPE_OPTIONS}
                  className="w-32"
                />
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  options={PRIORITY_OPTIONS}
                  className="w-32"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              任务列表
            </CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    任务类型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    任务标题
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    优先级
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    负责人
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    详情
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredTasks.length > 0 ? (
                  filteredTasks.map((task, index) => (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/20 cursor-pointer transition-colors group"
                      onClick={() => handleRowClick(task.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center',
                            task.type === 'dispatch_timeout'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-red-500/20 text-red-400'
                          )}>
                            {task.type === 'dispatch_timeout' ? (
                              <Clock className="h-4 w-4" />
                            ) : (
                              <Package className="h-4 w-4" />
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {getTaskTypeLabel(task.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {task.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('text-xs', getStatusColor(task.status))}>
                          {getTaskStatusLabel(task.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {task.assigneeName ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                              <User className="h-3 w-3 text-primary-foreground" />
                            </div>
                            <span className="text-sm">{task.assigneeName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">未分配</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs">
                          {task.type === 'dispatch_timeout' && task.dispatchDuration && (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(task.dispatchDuration)}
                            </Badge>
                          )}
                          {task.type === 'item_damage' && task.damageLevel && (
                            <Badge variant="destructive" className="gap-1">
                              <Package className="h-3 w-3" />
                              {getDamageLevelLabel(task.damageLevel)}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {formatRelativeTime(task.createdAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(task.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(task.id)
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-12 w-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">暂无任务数据</p>
                        <p className="text-xs text-muted-foreground">
                          请尝试调整筛选条件
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-border/50">
              <div className="text-sm text-muted-foreground">
                显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} 条，共 {total} 条
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
