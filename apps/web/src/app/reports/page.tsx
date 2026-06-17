'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BarChart3,
  Building2,
  Users,
  ListTodo,
  DollarSign,
  Calendar,
  Download,
  Filter,
} from 'lucide-react'
import { reportsApi, usersApi } from '@/lib/api'
import { formatMoney, formatNumber } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('occupancy')
  const [period, setPeriod] = useState('MONTHLY')
  const [occupancyData, setOccupancyData] = useState<any>(null)
  const [taskData, setTaskData] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any>(null)
  const [maintenanceData, setMaintenanceData] = useState<any>(null)
  const [managers, setManagers] = useState<any[]>([])
  const [selectedManager, setSelectedManager] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const result: any = await usersApi.getUsersByRole('PROPERTY_MANAGER')
        setManagers(result || [])
      } catch (e) {
        console.error(e)
      }
    }
    fetchManagers()
  }, [])

  useEffect(() => {
    if (activeTab === 'occupancy') {
      fetchOccupancyData()
    } else if (activeTab === 'tasks') {
      fetchTaskData()
    } else if (activeTab === 'revenue') {
      fetchRevenueData()
    } else if (activeTab === 'maintenance') {
      fetchMaintenanceData()
    }
  }, [activeTab, period, selectedManager, startDate, endDate])

  const fetchOccupancyData = async () => {
    try {
      const data = await reportsApi.getOccupancyReport({
        periodType: period,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        managerId: selectedManager || undefined,
      })
      setOccupancyData(data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchTaskData = async () => {
    try {
      const data = await reportsApi.getTaskReport({
        periodType: period,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      setTaskData(data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchRevenueData = async () => {
    try {
      const data = await reportsApi.getRevenueReport({
        periodType: period,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      setRevenueData(data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchMaintenanceData = async () => {
    try {
      const data = await reportsApi.getMaintenanceReport({
        periodType: period,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      setMaintenanceData(data)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">数据报表</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          导出报表
        </Button>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>周期类型</Label>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="DAILY">日报</option>
                <option value="WEEKLY">周报</option>
                <option value="MONTHLY">月报</option>
                <option value="YEARLY">年报</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>开始日期</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>结束日期</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {activeTab === 'occupancy' && (
              <div className="space-y-2">
                <Label>负责人</Label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                >
                  <option value="">全部</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={() => {
              if (activeTab === 'occupancy') fetchOccupancyData()
              else if (activeTab === 'tasks') fetchTaskData()
              else if (activeTab === 'revenue') fetchRevenueData()
              else if (activeTab === 'maintenance') fetchMaintenanceData()
            }}>
              <Filter className="mr-2 h-4 w-4" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="occupancy" className="gap-2">
            <Building2 className="h-4 w-4" />
            出租率报表
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ListTodo className="h-4 w-4" />
            任务报表
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="h-4 w-4" />
            收入报表
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            维修报表
          </TabsTrigger>
        </TabsList>

        <TabsContent value="occupancy">
          <OccupancyReport data={occupancyData} />
        </TabsContent>

        <TabsContent value="tasks">
          <TaskReport data={taskData} />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueReport data={revenueData} />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceReport data={maintenanceData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OccupancyReport({ data }: { data: any }) {
  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  const summary = data.summary || {}
  const byDistrict = data.byDistrict || []
  const byManager = data.byManager || []

  return (
    <div className="space-y-6">
      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">房源总数</div>
            <div className="text-2xl font-bold mt-2">{summary.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">已出租</div>
            <div className="text-2xl font-bold mt-2 text-green-600">
              {summary.occupied || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">空置</div>
            <div className="text-2xl font-bold mt-2 text-yellow-600">
              {summary.vacant || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">出租率</div>
            <div className="text-2xl font-bold mt-2 text-blue-600">
              {(summary.occupancyRate || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 按区域分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">按区域分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byDistrict.map((d: any) => ({
                    name: d.district,
                    总数: d.total,
                    已出租: d.occupied,
                    出租率: d.occupancyRate,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="总数" fill="#3b82f6" />
                  <Bar yAxisId="left" dataKey="已出租" fill="#10b981" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="出租率"
                    stroke="#f59e0b"
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 按负责人分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">按负责人分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {byManager.map((item: any) => (
                <div key={item.manager?.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.manager?.name}</span>
                    <span className="text-muted-foreground">
                      出租率 {item.occupancyRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${item.occupancyRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>已出租 {item.occupied} 套</span>
                    <span>共 {item.total} 套</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详情表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">区域明细</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">区域</th>
                <th className="text-right py-3 px-2 font-medium">房源总数</th>
                <th className="text-right py-3 px-2 font-medium">已出租</th>
                <th className="text-right py-3 px-2 font-medium">空置</th>
                <th className="text-right py-3 px-2 font-medium">出租率</th>
              </tr>
            </thead>
            <tbody>
              {byDistrict.map((item: any) => (
                <tr key={item.district} className="border-b">
                  <td className="py-3 px-2">{item.district}</td>
                  <td className="text-right py-3 px-2">{item.total}</td>
                  <td className="text-right py-3 px-2 text-green-600">
                    {item.occupied}
                  </td>
                  <td className="text-right py-3 px-2 text-yellow-600">
                    {item.total - item.occupied}
                  </td>
                  <td className="text-right py-3 px-2 font-medium">
                    {item.occupancyRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function TaskReport({ data }: { data: any }) {
  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  const summary = data.summary || {}
  const byType = data.byType || []
  const byAssignee = data.byAssignee || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">任务总数</div>
            <div className="text-2xl font-bold mt-2">{summary.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">已完成</div>
            <div className="text-2xl font-bold mt-2 text-green-600">
              {summary.completed || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">进行中</div>
            <div className="text-2xl font-bold mt-2 text-blue-600">
              {summary.inProgress || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">逾期</div>
            <div className="text-2xl font-bold mt-2 text-red-600">
              {summary.overdue || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">任务类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byType.map((item: any) => ({
                      name: item.type,
                      value: item._count,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {byType.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">负责人完成率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {byAssignee.map((item: any) => (
                <div key={item.assignee?.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-3 w-3 text-primary" />
                      </div>
                      <span className="font-medium">{item.assignee?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({item.assignee?.role})
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      完成率 {item.completionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${item.completionRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>已完成 {item.completed} 个</span>
                    <span>共 {item.total} 个</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">完成率明细 - 按负责人下钻</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">负责人</th>
                <th className="text-left py-3 px-2 font-medium">角色</th>
                <th className="text-right py-3 px-2 font-medium">任务总数</th>
                <th className="text-right py-3 px-2 font-medium">已完成</th>
                <th className="text-right py-3 px-2 font-medium">进行中</th>
                <th className="text-right py-3 px-2 font-medium">完成率</th>
              </tr>
            </thead>
            <tbody>
              {byAssignee.map((item: any) => (
                <tr key={item.assignee?.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-2 font-medium">{item.assignee?.name}</td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {item.assignee?.role}
                  </td>
                  <td className="text-right py-3 px-2">{item.total}</td>
                  <td className="text-right py-3 px-2 text-green-600">
                    {item.completed}
                  </td>
                  <td className="text-right py-3 px-2 text-blue-600">
                    {item.total - item.completed}
                  </td>
                  <td className="text-right py-3 px-2 font-medium">
                    {item.completionRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function RevenueReport({ data }: { data: any }) {
  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  const summary = data.summary || {}
  const byType = data.byType || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">总收入</div>
            <div className="text-2xl font-bold mt-2 text-green-600">
              {formatMoney(summary.totalIncome || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">总支出</div>
            <div className="text-2xl font-bold mt-2 text-red-600">
              {formatMoney(summary.totalExpense || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">净利润</div>
            <div className="text-2xl font-bold mt-2 text-blue-600">
              {formatMoney(summary.netProfit || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">收入类型分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byType.map((item: any) => ({
                      name: item.type,
                      value: item._sum?.amount?.toNumber() || 0,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {byType.map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatMoney(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {byType.map((item: any, index: number) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{item.type}</span>
                  </div>
                  <span className="font-medium">
                    {formatMoney(item._sum?.amount?.toNumber() || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MaintenanceReport({ data }: { data: any }) {
  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  const summary = data.summary || {}
  const byWorker = data.byWorker || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">工单总数</div>
            <div className="text-2xl font-bold mt-2">{summary.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">维修总成本</div>
            <div className="text-2xl font-bold mt-2 text-orange-600">
              {formatMoney(summary.totalCost || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">维修员工作量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byWorker.map((item: any) => ({
                  name: item.worker?.name,
                  总数: item.total,
                  已完成: item.completed,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="总数" fill="#3b82f6" />
                <Bar dataKey="已完成" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
