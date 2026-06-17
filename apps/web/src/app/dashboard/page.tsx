'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  ListTodo,
  Wrench,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { reportsApi, tasksApi, propertiesApi, tenantsApi, financeApi } from '@/lib/api'
import { formatMoney, getStatusColor, getStatusLabel } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [overdueTasks, setOverdueTasks] = useState<any[]>([])
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const { viewRole } = useAppStore()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboard, overdue, tasks] = await Promise.all([
          reportsApi.getDashboard({ viewRole }),
          tasksApi.getOverdueTasks({ viewRole }),
          tasksApi.getTasks({ pageSize: 5, viewRole }),
        ])
        setStats(dashboard)
        setOverdueTasks(Array.isArray(overdue) ? overdue : [])
        setRecentTasks((tasks as any)?.list || [])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [viewRole])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  const occupancyData = stats?.properties?.byStatus?.map((item: any) => ({
    name: getStatusLabel(item.status),
    value: item._count,
  })) || []

  const statCards = [
    {
      title: '房源总数',
      value: stats?.properties?.total || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/properties',
    },
    {
      title: '在租房源',
      value: stats?.properties?.occupied || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/properties?status=OCCUPIED',
      subtext: `出租率 ${(stats?.properties?.occupancyRate || 0).toFixed(1)}%`,
    },
    {
      title: '租客总数',
      value: stats?.tenants?.total || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/tenants',
    },
    {
      title: '合同总数',
      value: stats?.tasks?.total || 0,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      link: '/contracts',
    },
    {
      title: '待办任务',
      value: stats?.tasks?.total || 0,
      icon: ListTodo,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      link: '/tasks',
    },
    {
      title: '累计收入',
      value: formatMoney(stats?.finance?.totalIncome || 0),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      link: '/finance',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">工作台</h1>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </div>
      </div>

      {overdueTasks.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <span className="font-medium text-red-800">
                您有 {overdueTasks.length} 条逾期待处理事项
              </span>
            </div>
            <Button variant="destructive" size="sm" asChild>
              <Link href="/tasks?pool=overdue">立即处理</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <Link key={card.title} href={card.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="mt-2 text-2xl font-bold">{card.value}</p>
                    {card.subtext && (
                      <p className="mt-1 text-xs text-muted-foreground">{card.subtext}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">任务概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.tasks?.byStatus || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" tickFormatter={(v) => getStatusLabel(v)} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => [value + ' 条', '数量']}
                    labelFormatter={(label) => getStatusLabel(label)}
                  />
                  <Bar dataKey="_count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">房源状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {occupancyData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {occupancyData.map((item: any, index: number) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">最近任务</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tasks">查看全部</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        task.type === 'RENT_OVERDUE'
                          ? 'bg-red-100 text-red-600'
                          : task.type === 'MAINTENANCE'
                          ? 'bg-orange-100 text-orange-600'
                          : task.type === 'PROPERTY_LISTING'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {task.type === 'RENT_OVERDUE' ? (
                        <DollarSign className="h-4 w-4" />
                      ) : task.type === 'MAINTENANCE' ? (
                        <Wrench className="h-4 w-4" />
                      ) : task.type === 'PROPERTY_LISTING' ? (
                        <Building2 className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {getStatusLabel(task.type)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">逾期提醒</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tasks?pool=overdue">全部逾期</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                暂无逾期事项
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTasks.slice(0, 5).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.property?.title || ''}
                        </p>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" asChild>
                      <Link href={`/tasks?pool=overdue&taskId=${task.id}`}>处理</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
