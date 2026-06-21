'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  FileText,
  MapPin,
  User,
  Package,
  Clock,
  Wallet,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Send,
  Plus,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import {
  cn,
  formatCurrency,
  formatDuration,
  formatDate,
  formatRelativeTime,
  getOrderStatusLabel,
  getStatusColor,
  getDamageLevelLabel,
  getTaskTypeLabel,
  getPriorityColor,
  getPriorityLabel,
  getTaskStatusLabel,
} from '@/lib/utils'
import type { OrderDetail, CustomerServiceRecord, Task, Conclusion, Payment, Appeal } from '@/types'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('basic')
  const [expandedCs, setExpandedCs] = useState<string | null>(null)
  const [newConclusion, setNewConclusion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [conclusions, setConclusions] = useState<Conclusion[]>([])

  useEffect(() => {
    const fetchOrderDetail = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        if (response.ok) {
          const data = await response.json()
          setOrder(data)
          setConclusions(data.conclusions || [])
        }
      } catch (error) {
        console.error('Failed to fetch order detail:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrderDetail()
  }, [orderId])

  const handleSubmitConclusion = async () => {
    if (!newConclusion.trim()) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/conclusions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          chartPointId: `order-${orderId}`,
          chartType: 'payment_trend',
          content: newConclusion,
          authorId: 'current-user-id',
          authorName: '当前用户',
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setConclusions(prev => [...prev, data.conclusion])
        setNewConclusion('')
      }
    } catch (error) {
      console.error('Failed to submit conclusion:', error)
      const mockConclusion: Conclusion = {
        id: Math.random().toString(36).substring(2, 15),
        orderId,
        chartPointId: `order-${orderId}`,
        chartType: 'payment_trend',
        content: newConclusion,
        authorId: 'current-user-id',
        authorName: '当前用户',
        createdAt: new Date(),
        attachments: [],
      }
      setConclusions(prev => [...prev, mockConclusion])
      setNewConclusion('')
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

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">订单不存在</h2>
        <p className="text-muted-foreground mb-4">请检查订单ID是否正确</p>
        <Button onClick={() => router.push('/orders')}>返回订单列表</Button>
      </div>
    )
  }

  const timelineEvents = [
    {
      label: '订单创建',
      time: order.createdAt,
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      completed: true,
    },
    {
      label: '骑手接单',
      time: order.acceptedAt,
      icon: User,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      completed: !!order.acceptedAt,
    },
    {
      label: '骑手取货',
      time: order.pickedAt,
      icon: Package,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      completed: !!order.pickedAt,
    },
    {
      label: '订单送达',
      time: order.deliveredAt,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      completed: !!order.deliveredAt,
    },
  ]

  const isTimeout = (order.dispatchDuration || 0) > 1800

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
              订单详情
              <span className="font-mono text-lg text-muted-foreground">{order.orderNo}</span>
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge className={cn('text-xs', getStatusColor(order.status))}>
                {getOrderStatusLabel(order.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDate(order.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order.hasItemDamage && (
            <Badge variant="destructive" className="gap-1">
              <Package className="h-3 w-3" />
              物品{getDamageLevelLabel(order.itemDamageLevel || 'moderate')}损坏
            </Badge>
          )}
          {isTimeout && (
            <Badge variant="destructive" className="gap-1">
              <Clock className="h-3 w-3" />
              派单超时 {formatDuration((order.dispatchDuration || 0) - 1800)}
            </Badge>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              配送时间轴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
              <div className="space-y-6">
                {timelineEvents.map((event, index) => (
                  <motion.div
                    key={event.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="relative flex items-start gap-4"
                  >
                    <div className={cn(
                      'relative z-10 h-10 w-10 rounded-full flex items-center justify-center',
                      event.completed ? event.bgColor : 'bg-muted'
                    )}>
                      <event.icon className={cn(
                        'h-5 w-5',
                        event.completed ? event.color : 'text-muted-foreground/50'
                      )} />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'font-medium',
                          !event.completed && 'text-muted-foreground/50'
                        )}>
                          {event.label}
                        </p>
                        {event.completed && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(event.time!)}
                          </span>
                        )}
                      </div>
                      {index === 1 && event.completed && timelineEvents[2].completed && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            派单时长:
                          </span>
                          <Badge
                            variant={isTimeout ? 'destructive' : 'success'}
                            className="text-xs"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(order.dispatchDuration || 0)}
                          </Badge>
                          {isTimeout && (
                            <span className="text-xs text-destructive">
                              超出阈值 {formatDuration((order.dispatchDuration || 0) - 1800)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="payment">支付流水</TabsTrigger>
            <TabsTrigger value="appeal">申诉记录</TabsTrigger>
            <TabsTrigger value="cs">客服记录</TabsTrigger>
            <TabsTrigger value="conclusion">处理结论</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    配送信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">路线</span>
                    <span className="font-medium">{order.routeName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">骑手</span>
                    <span className="font-medium">{order.riderName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">客户</span>
                    <span className="font-medium">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">物品描述</span>
                    <span className="font-medium">{order.itemDescription || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">物品状态</span>
                    <span>
                      {order.hasItemDamage ? (
                        <Badge variant="destructive">
                          {getDamageLevelLabel(order.itemDamageLevel || 'moderate')}损坏
                        </Badge>
                      ) : (
                        <Badge variant="success">正常</Badge>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    费用信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">订单金额</span>
                    <span className="font-mono font-medium">{formatCurrency(order.amount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">补贴金额</span>
                    <span className="font-mono font-medium text-primary">{formatCurrency(order.subsidyAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">实付金额</span>
                    <span className="font-mono font-medium">{formatCurrency(order.amount - order.subsidyAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">派单时长</span>
                    <span className={cn(
                      'font-mono font-medium',
                      isTimeout && 'text-destructive'
                    )}>
                      {formatDuration(order.dispatchDuration || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">超时状态</span>
                    <span>
                      {isTimeout ? (
                        <Badge variant="destructive">已超时</Badge>
                      ) : (
                        <Badge variant="success">正常</Badge>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {order.tasks && order.tasks.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    关联任务
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.tasks.map((task: Task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-card/30 border border-border/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'h-10 w-10 rounded-lg flex items-center justify-center',
                              task.type === 'dispatch_timeout'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-red-500/20 text-red-400'
                            )}>
                              {task.type === 'dispatch_timeout' ? (
                                <Clock className="h-5 w-5" />
                              ) : (
                                <Package className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{task.title}</p>
                                <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
                                  {getPriorityLabel(task.priority)}
                                </Badge>
                                <Badge className={cn('text-xs', getStatusColor(task.status))}>
                                  {getTaskStatusLabel(task.status)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                创建于 {formatRelativeTime(task.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/tasks/${task.id}`)}
                          >
                            查看详情
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="payment" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  支付流水
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.payment ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">交易流水号</span>
                        <span className="font-mono">{(order.payment as Payment).transactionNo}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">支付方式</span>
                        <span>{(order.payment as Payment).paymentMethod}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">支付状态</span>
                        <span>
                          {(order.payment as Payment).status === 'success' ? (
                            <Badge variant="success">支付成功</Badge>
                          ) : (
                            <Badge variant="destructive">支付失败</Badge>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">支付时间</span>
                        <span>{formatDate((order.payment as Payment).paidAt!)}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">订单金额</span>
                        <span className="font-mono">{formatCurrency((order.payment as Payment).amount)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">补贴金额</span>
                        <span className="font-mono text-primary">{formatCurrency((order.payment as Payment).subsidyAmount)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">结算金额</span>
                        <span className="font-mono">{formatCurrency((order.payment as Payment).settlementAmount)}</span>
                      </div>
                      {(order.payment as Payment).abnormalDeduction && (
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                          <div className="flex items-center gap-2 text-destructive mb-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">异常扣款</span>
                          </div>
                          <p className="text-sm">
                            扣款金额: <span className="font-mono">{formatCurrency((order.payment as Payment).abnormalDeduction!)}</span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            扣款原因: {(order.payment as Payment).deductionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">暂无支付记录</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appeal" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  申诉记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.appeal ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground">申诉类型</span>
                          <span>{(order.appeal as Appeal).type === 'damage' ? '物品损坏' : (order.appeal as Appeal).type === 'late_dispatch' ? '配送超时' : '补贴申请'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground">申诉状态</span>
                          <span>
                            <Badge className={cn('text-xs', getStatusColor((order.appeal as Appeal).status))}>
                              {(order.appeal as Appeal).status === 'approved' ? '已通过' : (order.appeal as Appeal).status === 'rejected' ? '已拒绝' : '待审核'}
                            </Badge>
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">申诉时间</span>
                          <span>{formatDate((order.appeal as Appeal).createdAt)}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground">审核人</span>
                          <span>{(order.appeal as Appeal).reviewerId || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">审核时间</span>
                          <span>{(order.appeal as Appeal).reviewedAt ? formatDate((order.appeal as Appeal).reviewedAt!) : '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-card/30 border border-border/50">
                      <h4 className="font-medium mb-2">申诉原因</h4>
                      <p className="text-sm text-muted-foreground">
                        {(order.appeal as Appeal).reason}
                      </p>
                    </div>

                    {(order.appeal as Appeal).reviewComment && (
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                        <h4 className="font-medium mb-2 text-primary">审核意见</h4>
                        <p className="text-sm">
                          {(order.appeal as Appeal).reviewComment}
                        </p>
                      </div>
                    )}

                    {(order.appeal as Appeal).evidenceUrls && (order.appeal as Appeal).evidenceUrls.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          申诉证据 ({(order.appeal as Appeal).evidenceUrls.length} 张)
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {(order.appeal as Appeal).evidenceUrls.map((url: string, i: number) => (
                            <div
                              key={i}
                              className="aspect-square rounded-lg bg-muted flex items-center justify-center border border-border/50"
                            >
                              <Paperclip className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">暂无申诉记录</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  客服记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.customerServiceRecs && order.customerServiceRecs.length > 0 ? (
                  <div className="space-y-4">
                    {order.customerServiceRecs.map((record: CustomerServiceRecord, index: number) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-xl border border-border/50 overflow-hidden"
                      >
                        <div
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedCs(expandedCs === record.id ? null : record.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                              <MessageSquare className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{record.ticketNo}</p>
                                <Badge variant="secondary" className="text-xs">
                                  {record.type === 'damage_report' ? '损坏报告' : record.type === 'complaint' ? '投诉' : record.type === 'appeal' ? '申诉' : '咨询'}
                                </Badge>
                                <Badge className={cn('text-xs', getStatusColor(record.status))}>
                                  {record.status === 'open' ? '处理中' : record.status === 'processing' ? '处理中' : '已关闭'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                客服: {record.operatorName} · {formatRelativeTime(record.createdAt)}
                              </p>
                            </div>
                          </div>
                          {expandedCs === record.id ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>

                        <AnimatePresence>
                          {expandedCs === record.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 border-t border-border/50">
                                <div className="p-4 bg-card/30 rounded-lg mt-4">
                                  <p className="text-sm font-medium mb-1">问题描述:</p>
                                  <p className="text-sm text-muted-foreground">{record.content}</p>
                                </div>

                                {record.chatHistory && (record.chatHistory as any).messages && (
                                  <div className="mt-4">
                                    <p className="text-sm font-medium mb-3">聊天记录:</p>
                                    <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-muted/30 rounded-lg">
                                      {(record.chatHistory as any).messages.map((msg: any, i: number) => (
                                        <div
                                          key={i}
                                          className={cn(
                                            'flex',
                                            msg.from === 'customer' ? 'justify-start' : 'justify-end'
                                          )}
                                        >
                                          <div className={cn(
                                            'max-w-[80%] px-4 py-2 rounded-xl',
                                            msg.from === 'customer'
                                              ? 'bg-card border border-border/50 rounded-tl-none'
                                              : 'bg-primary/20 rounded-tr-none'
                                          )}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {formatDate(msg.time)}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                                  <span>创建时间: {formatDate(record.createdAt)}</span>
                                  {record.closedAt && (
                                    <span>关闭时间: {formatDate(record.closedAt)}</span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">暂无客服记录</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conclusion" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  处理结论
                  <Badge variant="secondary" className="ml-2">
                    {conclusions.length} 条
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {conclusions.length > 0 ? (
                  <div className="space-y-4">
                    {conclusions.map((conclusion, index) => (
                      <motion.div
                        key={conclusion.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-card/30 border border-border/50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{conclusion.authorName}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(conclusion.createdAt)}
                              </p>
                            </div>
                          </div>
                          {conclusion.attachments && conclusion.attachments.length > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <Paperclip className="h-3 w-3" />
                              {conclusion.attachments.length}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">
                          {conclusion.content}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">暂无处理结论</p>
                  </div>
                )}

                <div className="pt-4 border-t border-border/50">
                  <div className="space-y-3">
                    <Textarea
                      placeholder="输入处理结论，分析问题原因并提出改进建议..."
                      value={newConclusion}
                      onChange={(e) => setNewConclusion(e.target.value)}
                      className="min-h-[100px] resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                        <Paperclip className="h-4 w-4" />
                        添加附件
                      </Button>
                      <Button
                        onClick={handleSubmitConclusion}
                        disabled={!newConclusion.trim() || submitting}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {submitting ? '提交中...' : '提交结论'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
