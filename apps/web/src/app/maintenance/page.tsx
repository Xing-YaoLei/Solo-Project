'use client'

import { useEffect, useState } from 'react'
import {
  Wrench,
  Search,
  Plus,
  Building2,
  MoreHorizontal,
  Clock,
  User,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { maintenanceApi } from '@/lib/api'
import { formatDate, formatMoney, getStatusColor, getStatusLabel } from '@/lib/utils'

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState('records')
  const [records, setRecords] = useState<any[]>([])
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    if (activeTab === 'records') {
      fetchRecords()
    } else {
      fetchWorkOrders()
    }
  }, [activeTab, page, keyword])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const result: any = await maintenanceApi.getRecords({ page, pageSize })
      setRecords(result.list || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkOrders = async () => {
    setLoading(true)
    try {
      const result: any = await maintenanceApi.getWorkOrders({ page, pageSize })
      setWorkOrders(result.list || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">维修记录</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新建维修记录
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索维修记录..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="records">维修记录</TabsTrigger>
          <TabsTrigger value="workorders">工单列表</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : records.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无维修记录
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">房源</th>
                      <th className="text-left py-3 px-2 font-medium">类型</th>
                      <th className="text-left py-3 px-2 font-medium">描述</th>
                      <th className="text-left py-3 px-2 font-medium">费用</th>
                      <th className="text-left py-3 px-2 font-medium">报修时间</th>
                      <th className="text-left py-3 px-2 font-medium">状态</th>
                      <th className="text-right py-3 px-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{record.property?.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline">{record.type}</Badge>
                        </td>
                        <td className="py-3 px-2 max-w-xs truncate">
                          {record.description}
                        </td>
                        <td className="py-3 px-2">
                          {record.cost ? formatMoney(record.cost) : '-'}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {formatDate(record.reportedAt)}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              record.status
                            )}`}
                          >
                            {getStatusLabel(record.status)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>查看详情</DropdownMenuItem>
                              <DropdownMenuItem>创建工单</DropdownMenuItem>
                              <DropdownMenuItem>编辑记录</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workorders">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : workOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无工单</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">工单</th>
                      <th className="text-left py-3 px-2 font-medium">房源</th>
                      <th className="text-left py-3 px-2 font-medium">维修员</th>
                      <th className="text-left py-3 px-2 font-medium">优先级</th>
                      <th className="text-left py-3 px-2 font-medium">状态</th>
                      <th className="text-left py-3 px-2 font-medium">创建时间</th>
                      <th className="text-right py-3 px-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">
                          {order.description?.slice(0, 20)}...
                        </td>
                        <td className="py-3 px-2">
                          {order.record?.property?.title}
                        </td>
                        <td className="py-3 px-2">
                          {order.worker ? (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{order.worker.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">未分派</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              order.priority
                            )}`}
                          >
                            {getStatusLabel(order.priority)}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>查看详情</DropdownMenuItem>
                              <DropdownMenuItem>分派维修员</DropdownMenuItem>
                              <DropdownMenuItem>标记完成</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
