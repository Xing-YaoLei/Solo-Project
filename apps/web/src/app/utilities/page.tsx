'use client'

import { useEffect, useState } from 'react'
import {
  Zap,
  Search,
  Plus,
  Building2,
  Droplets,
  Gauge,
  MoreHorizontal,
  Calendar,
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
import { utilitiesApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function UtilitiesPage() {
  const [readings, setReadings] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    fetchReadings()
  }, [page, typeFilter])

  const fetchReadings = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (typeFilter) params.type = typeFilter
      const result: any = await utilitiesApi.getReadings(params)
      setReadings(result.list || [])
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
          <h1 className="text-2xl font-bold">水电读数</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {total} 条记录</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          录入读数
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">本月电表抄表</p>
                <p className="text-2xl font-bold mt-2 text-yellow-600">156 次</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">本月水表抄表</p>
                <p className="text-2xl font-bold mt-2 text-blue-600">156 次</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待录入</p>
                <p className="text-2xl font-bold mt-2 text-orange-600">12 套</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Gauge className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Badge
                variant={typeFilter === '' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTypeFilter('')}
              >
                全部
              </Badge>
              <Badge
                variant={typeFilter === 'ELECTRIC' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTypeFilter('ELECTRIC')}
              >
                电表
              </Badge>
              <Badge
                variant={typeFilter === 'WATER' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTypeFilter('WATER')}
              >
                水表
              </Badge>
              <Badge
                variant={typeFilter === 'GAS' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTypeFilter('GAS')}
              >
                燃气
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">读数记录</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : readings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无数据</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">类型</th>
                  <th className="text-left py-3 px-2 font-medium">房源</th>
                  <th className="text-right py-3 px-2 font-medium">上次读数</th>
                  <th className="text-right py-3 px-2 font-medium">本次读数</th>
                  <th className="text-right py-3 px-2 font-medium">用量</th>
                  <th className="text-left py-3 px-2 font-medium">抄表日期</th>
                  <th className="text-left py-3 px-2 font-medium">录入人</th>
                  <th className="text-right py-3 px-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((reading) => (
                  <tr key={reading.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <Badge
                        variant={reading.type === 'ELECTRIC' ? 'default' : 'outline'}
                        className={
                          reading.type === 'WATER'
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : reading.type === 'ELECTRIC'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : ''
                        }
                      >
                        {reading.type === 'ELECTRIC'
                          ? '电表'
                          : reading.type === 'WATER'
                          ? '水表'
                          : '燃气'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{reading.property?.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {reading.previousReading || '-'}
                    </td>
                    <td className="py-3 px-2 text-right font-medium">
                      {reading.reading}
                    </td>
                    <td className="py-3 px-2 text-right text-orange-600">
                      +{reading.usage || 0}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(reading.readingDate)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {reading.recordedBy?.name}
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
                          <DropdownMenuItem>编辑记录</DropdownMenuItem>
                          <DropdownMenuItem>查看照片</DropdownMenuItem>
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
                disabled={readings.length < pageSize}
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
