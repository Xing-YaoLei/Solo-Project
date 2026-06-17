'use client'

import { useEffect, useState } from 'react'
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Building2,
  Users,
  MoreHorizontal,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { contractsApi } from '@/lib/api'
import { formatDate, formatMoney, getStatusColor, getStatusLabel } from '@/lib/utils'

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchContracts()
  }, [page, keyword, statusFilter])

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (keyword) params.keyword = keyword
      if (statusFilter) params.status = statusFilter
      const result: any = await contractsApi.getContracts(params)
      setContracts(result.list || [])
      setTotal(result.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">合同管理</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {total} 份合同</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新建合同
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索合同编号、租客姓名..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={statusFilter === '' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('')}
              >
                全部
              </Badge>
              <Badge
                variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('ACTIVE')}
              >
                有效
              </Badge>
              <Badge
                variant={statusFilter === 'DRAFT' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('DRAFT')}
              >
                草稿
              </Badge>
              <Badge
                variant={statusFilter === 'PENDING_RENEWAL' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('PENDING_RENEWAL')}
              >
                待续签
              </Badge>
              <Badge
                variant={statusFilter === 'EXPIRED' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('EXPIRED')}
              >
                已过期
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">合同列表</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无合同数据</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">合同编号</th>
                  <th className="text-left py-3 px-2 font-medium">房源</th>
                  <th className="text-left py-3 px-2 font-medium">租客</th>
                  <th className="text-left py-3 px-2 font-medium">月租金</th>
                  <th className="text-left py-3 px-2 font-medium">租期</th>
                  <th className="text-left py-3 px-2 font-medium">版本</th>
                  <th className="text-left py-3 px-2 font-medium">状态</th>
                  <th className="text-right py-3 px-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div className="font-medium">{contract.contractNo}</div>
                      <div className="text-xs text-muted-foreground">
                        创建于 {formatDate(contract.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-32">
                          {contract.property?.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{contract.tenant?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-medium text-primary">
                      {formatMoney(contract.monthlyRent)}/月
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs">
                          {formatDate(contract.startDate)} ~ {formatDate(contract.endDate)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="outline">v{contract.version}</Badge>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          contract.status
                        )}`}
                      >
                        {getStatusLabel(contract.status)}
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
                          <DropdownMenuItem>新建版本</DropdownMenuItem>
                          <DropdownMenuItem>续签合同</DropdownMenuItem>
                          <DropdownMenuItem>终止合同</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex justify-center mt-6">
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
                disabled={contracts.length < pageSize}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
