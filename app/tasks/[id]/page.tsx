'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  AlertCircle,
  Package,
  Clock,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  Send,
  MessageSquare,
  Paperclip,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { Select } from '@/components/ui/Select'
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
import type { Task, Order } from '@/types'

const STATUS_OPTIONS = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
]

const ASSIGNEE_OPTIONS = [
  { value: '', label: '未分配' },
  { value: 'auditor-001', label: '审核员小张' },
  { value: 'auditor-002', label: '审核员小李' },
  { value: 'auditor-003', label: '审核员小王' },
]

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolution, setResolution] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState('')

  useEffect(() => {
    const fetchTaskDetail = async () => {
      setLoading(true)
      try {
        const [taskRes, orderRes] = await Promise.all([
          fetch(`/api/tasks/${taskId}`),
          fetch('/api/orders?pageSize=100'),
        ])

        if (taskRes.ok) {
          const taskData = await taskRes.json()
          setTask(taskData)
          setSelectedStatus(taskData.status || 'pending')
          setSelectedAssignee(taskData.assigneeId || '')
        }

        if (orderRes.ok) {
          const orderData = await orderRes.json()
          const relatedOrder = (orderData.data || []).find(
            (o: Order) => o.id === task?.orderId
          )
          setOrder(relatedOrder || null)
        }
      } catch (error) {
        console.error('Failed to fetch task detail:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTaskDetail()
  }, [taskId, task?.orderId])

  const handleUpdateTask = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          assigneeId: selectedAssignee || undefined,
          assigneeName: selectedAssignee
            ? ASSIGNEE_OPTIONS.find(o => o.value === selectedAssignee)?.label
            : undefined,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setTask(data)
      }
    } catch (error) {
      console.error('Failed to update task:', error)
      if (task) {
        setTask({
          ...task,
          status: selectedStatus as any,
          assigneeId: selectedAssignee || undefined,
          assigneeName: selectedAssignee
            ? ASSIGNEE_OPTIONS.find(o => o.value === selectedAssignee)?.label
            : undefined,
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolveTask = async () => {
    if (!resolution.trim()) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution,
          conclusion: resolution,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setTask(data.task)
        setResolution('')
      }
    } catch (error) {
      console.error('Failed to resolve task:', error)
      if (task) {
        setTask({
          ...task,
          status: 'resolved',
          resolution,
          resolvedAt: new Date(),
        })
        setResolution('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">任务不存在</h2>
        <p className="text-muted-foreground mb-4">请检查任务ID是否正确</p>
        <Button onClick={() => router.push('/tasks')}>返回任务列表</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              任务详情
              <span className="font-mono text-lg text-muted-foreground">
                {task.id}
              </span>
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge className={cn('text-xs', getTaskTypeLabel(task.type) === '派单超时' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400')}>
                {getTaskTypeLabel(task.type)}
              </Badge>
              <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
                {getPriorityLabel(task.priority)} 优先级
              </Badge>
              <Badge className={cn('text-xs', getStatusColor(task.status))}>
                {getTaskStatusLabel(task.status)}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {task.type === 'dispatch_timeout' ? (
                  <Clock className="h-5 w-5 text-orange-400" />
                ) : (
                  <Package className="h-5 w-5 text-red-400" />
                )}
                任务信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
                <p className="text-muted-foreground">{task.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">任务类型</span>
                  <span className="font-medium">{getTaskTypeLabel(task.type)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">优先级</span>
                  <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">状态</span>
                  <Badge className={cn('text-xs', getStatusColor(task.status))}>
                    {getTaskStatusLabel(task.status)}
                  </Badge>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">负责人</span>
                  <span className="font-medium">{task.assigneeName || '未分配'}</span>
                </div>
                {task.dispatchDuration && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">派单时长</span>
                    <span className={cn(
                      'font-mono font-medium',
                      task.dispatchDuration > 1800 && 'text-destructive'
                    )}>
                      {formatDuration(task.dispatchDuration)}
                    </span>
                  </div>
                )}
                {task.damageLevel && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">损坏程度</span>
                    <Badge variant="destructive" className="text-xs">
                      {getDamageLevelLabel(task.damageLevel)}
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">创建时间</span>
                  <span className="font-medium">{formatDate(task.createdAt)}</span>
                </div>
                {task.resolvedAt && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">解决时间</span>
                    <span className="font-medium">{formatDate(task.resolvedAt)}</span>
                  </div>
                )}
              </div>

              {task.resolution && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">处理结论</span>
                  </div>
                  <p className="text-sm">{task.resolution}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                关联订单
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order ? (
                <div
                  className="p-4 rounded-xl bg-card/30 border border-border/50 cursor-pointer hover:bg-card/50 transition-colors"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-medium">{order.orderNo}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.routeName} · {order.riderName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono">{order.amount} 元</p>
                      <p className="text-sm text-primary">补贴 {order.subsidyAmount} 元</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={cn('text-xs', getStatusColor(order.status))}>
                      {order.status}
                    </Badge>
                    {order.hasItemDamage && (
                      <Badge variant="destructive" className="text-xs">
                        物品损坏
                      </Badge>
                    )}
                    {(order.dispatchDuration || 0) > 1800 && (
                      <Badge variant="destructive" className="text-xs">
                        派单超时
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无关联订单信息</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                任务处理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">任务状态</label>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  options={STATUS_OPTIONS}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">分配给</label>
                <Select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  options={ASSIGNEE_OPTIONS}
                />
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleUpdateTask}
                disabled={submitting}
              >
                <Send className="h-4 w-4" />
                {submitting ? '保存中...' : '保存修改'}
              </Button>
            </CardContent>
          </Card>

          {task.status !== 'resolved' && task.status !== 'closed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  处理任务
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">处理结论</label>
                  <Textarea
                    placeholder="请输入处理结论，说明问题原因和解决方案..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1 text-muted-foreground flex-1">
                    <Paperclip className="h-4 w-4" />
                    添加附件
                  </Button>
                  <Button
                    variant="default"
                    className="gap-2 flex-1"
                    onClick={handleResolveTask}
                    disabled={!resolution.trim() || submitting}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {submitting ? '处理中...' : '标记解决'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                时间线
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-border" />
                <div className="space-y-6">
                  <div className="relative flex items-start gap-3">
                    <div className="relative z-10 h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-medium">任务创建</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(task.createdAt)}
                      </p>
                    </div>
                  </div>

                  {task.assigneeName && (
                    <div className="relative flex items-start gap-3">
                      <div className="relative z-10 h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-purple-400" />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm font-medium">任务分配</p>
                        <p className="text-xs text-muted-foreground">
                          分配给 {task.assigneeName}
                        </p>
                      </div>
                    </div>
                  )}

                  {task.resolvedAt && (
                    <div className="relative flex items-start gap-3">
                      <div className="relative z-10 h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm font-medium">任务解决</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(task.resolvedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {task.status === 'closed' && (
                    <div className="relative flex items-start gap-3">
                      <div className="relative z-10 h-6 w-6 rounded-full bg-gray-500/20 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm font-medium">任务关闭</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
