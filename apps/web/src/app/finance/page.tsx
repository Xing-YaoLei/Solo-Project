'use client'

import { useEffect, useState } from 'react'
import {
  DollarSign,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Users,
  MoreHorizontal,
  TrendingUp,
  AlertTriangle,
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
import { financeApi } from '@/lib/api'
import { formatDate, formatMoney, getStatusColor, getStatusLabel } from '@/lib/utils'

export default function FinancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchData()
  }, [page, activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [recordsRes, statsRes] = await Promise.all([
        financeApi.getRecords({
          page,
          pageSize,
          direction: activeTab === 'all' ? undefined : activeTab === 'income' ? 'INCOME' : 'EXPENSE',
        }),
        financeApi.getStats(),
      ])
      setRecords((recordsRes as any).list || [])
      setStats(statsRes)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">财务管理</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增记录
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总收入</p>
                <p className="text-2xl font-bold mt-2 text-green-600">
                  {formatMoney(stats?.totalIncome || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ArrowDownRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              较上月增长 12.5%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总支出</p>
                <p className="text-2xl font-bold mt-2 text-red-600">
                  {formatMoney(stats?.totalExpense || 0)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ArrowUpRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">净利润</p>
                <p className="text-2xl font-bold mt-2 text-blue-600">
                  {formatMoney(stats?.netProfit || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待收款</p>
                <p className="text-2xl font-bold mt-2 text-orange-600">
                  {stats?.pendingCount || 0} 笔
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-orange-600 mt-3">
              其中逾期 {stats?.overdueCount || 0} 笔
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部记录</TabsTrigger>
          <TabsTrigger value="income">收入</TabsTrigger>
          <TabsTrigger value="expense">支出</TabsTrigger>
          <TabsTrigger value="overdue">逾期</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <FinanceTable records={records} loading={loading} />
        </TabsContent>
        <TabsContent value="income">
          <FinanceTable records={records} loading={loading} />
        </TabsContent>
        <TabsContent value="expense">
          <FinanceTable records={records} loading={loading} />
        </TabsContent>
        <TabsContent value="overdue">
          <FinanceTable records={records} loading={loading} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            第 {page} 页
          </span>
          <Button
            variant="outline"
            disabled={records.length < pageSize}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}

function FinanceTable({ records, loading }: { records: any[]; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">加载中...</div>
        </CardContent>
      </Card>
    )
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">暂无财务记录</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-2 font-medium">单据编号</th>
              <th className="text-left py-3 px-2 font-medium">类型</th>
              <th className="text-left py-3 px-2 font-medium">房源</th>
              <th className="text-left py-3 px-2 font-medium">租客</th>
              <th className="text-right py-3 px-2 font-medium">金额</th>
              <th className="text-left py-3 px-2 font-medium">状态</th>
              <th className="text-left py-3 px-2 font-medium">到期日</th>
              <th className="text-right py-3 px-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-2 font-medium">{record.recordNo}</td>
                <td className="py-3 px-2">
                  <Badge variant="outline">{record.type}</Badge>
                </td>
                <td className="py-3 px-2">
                  {record.property ? (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-32">
                        {record.property.title}
                      </span>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-3 px-2">
                  {record.tenant ? (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{record.tenant.name}</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-3 px-2 text-right font-medium">
                  <span
                    className={record.direction === 'INCOME' ? 'text-green-600' : 'text-red-600'}
                  >
                    {record.direction === 'INCOME' ? '+' : '-'}
                    {formatMoney(record.amount)}
                  </span>
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
                <td className="py-3 px-2 text-muted-foreground">
                  {record.dueDate ? formatDate(record.dueDate) : '-'}
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
                      {record.status === 'PENDING' && (
                        <DropdownMenuItem>标记已支付</DropdownMenuItem>
                      )}
                      <DropdownMenuItem>发送催缴通知</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
