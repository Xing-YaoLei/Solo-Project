'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Search,
  Filter,
  ChevronRight,
  Package,
  Clock,
  AlertTriangle,
  ChevronLeft,
  MapPin,
  User,
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
  formatCurrency,
  formatDuration,
  formatDate,
  getOrderStatusLabel,
  getStatusColor,
  getDamageLevelLabel,
} from '@/lib/utils'
import type { Order } from '@/types'

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待接单' },
  { value: 'accepted', label: '已接单' },
  { value: 'picked', label: '已取货' },
  { value: 'delivered', label: '已送达' },
  { value: 'cancelled', label: '已取消' },
]

const DAMAGE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'true', label: '有损坏' },
  { value: 'false', label: '无损坏' },
]

const TIMEOUT_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'true', label: '超时订单' },
]

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('')
  const [hasItemDamage, setHasItemDamage] = useState('')
  const [hasDispatchTimeout, setHasDispatchTimeout] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(20)
  const [activeTab, setActiveTab] = useState('all')

  const fetchOrders = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(status && { status }),
      ...(hasItemDamage && { hasItemDamage }),
      ...(hasDispatchTimeout && { hasDispatchTimeout }),
    })

    try {
      const response = await fetch(`/api/orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.data || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [status, hasItemDamage, hasDispatchTimeout, activeTab])

  useEffect(() => {
    if (activeTab === 'damaged') {
      setHasItemDamage('true')
      setHasDispatchTimeout('')
    } else if (activeTab === 'timeout') {
      setHasDispatchTimeout('true')
      setHasItemDamage('')
    } else {
      setHasItemDamage('')
      setHasDispatchTimeout('')
    }
  }, [activeTab])

  useEffect(() => {
    fetchOrders()
  }, [page, status, hasItemDamage, hasDispatchTimeout])

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      order.orderNo.toLowerCase().includes(term) ||
      order.routeName.toLowerCase().includes(term) ||
      order.riderName.toLowerCase().includes(term) ||
      order.customerName.toLowerCase().includes(term)
    )
  })

  const totalPages = Math.ceil(total / pageSize)

  const handleRowClick = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

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
            <FileText className="h-7 w-7 text-primary" />
            订单明细
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看所有订单记录，追踪客服记录和处理结论
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" />
            共 {total} 条订单
          </Badge>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">全部订单</TabsTrigger>
                <TabsTrigger value="damaged">物品损坏</TabsTrigger>
                <TabsTrigger value="timeout">派单超时</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索订单号、路线、骑手、客户..."
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
                  className="w-40"
                />
                <Select
                  value={hasItemDamage}
                  onChange={(e) => setHasItemDamage(e.target.value)}
                  options={DAMAGE_OPTIONS}
                  className="w-32"
                />
                <Select
                  value={hasDispatchTimeout}
                  onChange={(e) => setHasDispatchTimeout(e.target.value)}
                  options={TIMEOUT_OPTIONS}
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
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              订单列表
            </CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    订单号
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    路线
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    骑手
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    客户
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    订单金额
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    补贴金额
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    派单时长
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    物品状态
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    订单状态
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
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/20 cursor-pointer transition-colors group"
                      onClick={() => handleRowClick(order.id)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium">
                          {order.orderNo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {order.routeName}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {order.riderName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {order.customerName}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-primary">
                          {formatCurrency(order.subsidyAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className={cn(
                            'h-3.5 w-3.5',
                            (order.dispatchDuration || 0) > 1800 ? 'text-destructive' : 'text-muted-foreground'
                          )} />
                          <span className={cn(
                            'font-mono text-sm',
                            (order.dispatchDuration || 0) > 1800 && 'text-destructive'
                          )}>
                            {order.dispatchDuration ? formatDuration(order.dispatchDuration) : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {order.hasItemDamage ? (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <Package className="h-3 w-3" />
                            {order.itemDamageLevel ? getDamageLevelLabel(order.itemDamageLevel) : '损坏'}
                          </Badge>
                        ) : (
                          <Badge variant="success" className="gap-1 text-xs">
                            <Package className="h-3 w-3" />
                            正常
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('text-xs', getStatusColor(order.status))}>
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(order.id)
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-12 w-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">暂无订单数据</p>
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
