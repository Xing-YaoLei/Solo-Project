'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Search,
  Plus,
  Phone,
  Building2,
  FileText,
  MoreHorizontal,
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
import { tenantsApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    fetchTenants()
  }, [page, keyword])

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (keyword) params.keyword = keyword
      const result: any = await tenantsApi.getTenants(params)
      setTenants(result.list || [])
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
          <h1 className="text-2xl font-bold">租客档案</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {total} 位租客</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增租客
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索租客姓名、手机号..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">租客列表</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无租客数据</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">租客信息</th>
                  <th className="text-left py-3 px-2 font-medium">手机号</th>
                  <th className="text-left py-3 px-2 font-medium">租住房屋</th>
                  <th className="text-left py-3 px-2 font-medium">入住时间</th>
                  <th className="text-left py-3 px-2 font-medium">状态</th>
                  <th className="text-right py-3 px-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tenant.idCardNo || '身份证未上传'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{tenant.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      {tenant.property ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{tenant.property.title}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">未租住</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {tenant.createdAt ? formatDate(tenant.createdAt) : '-'}
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={tenant.propertyId ? 'default' : 'outline'}
                        className={
                          tenant.propertyId
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : ''
                        }
                      >
                        {tenant.propertyId ? '在住' : '未入住'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>查看档案</DropdownMenuItem>
                          <DropdownMenuItem>编辑信息</DropdownMenuItem>
                          <DropdownMenuItem>查看合同</DropdownMenuItem>
                          <DropdownMenuItem>缴费记录</DropdownMenuItem>
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
                disabled={tenants.length < pageSize}
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
