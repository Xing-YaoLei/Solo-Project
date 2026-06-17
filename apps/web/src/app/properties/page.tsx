'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  DollarSign,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { propertiesApi } from '@/lib/api'
import { formatMoney, getStatusColor, getStatusLabel } from '@/lib/utils'

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchProperties()
  }, [page, keyword, statusFilter])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (keyword) params.keyword = keyword
      if (statusFilter) params.status = statusFilter

      const result: any = await propertiesApi.getProperties(params)
      setProperties(result.list || [])
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
          <h1 className="text-2xl font-bold">房源管理</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {total} 套房源</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增房源
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索房源编号、地址..."
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
                variant={statusFilter === 'OCCUPIED' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('OCCUPIED')}
              >
                已出租
              </Badge>
              <Badge
                variant={statusFilter === 'VACANT' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('VACANT')}
              >
                空置
              </Badge>
              <Badge
                variant={statusFilter === 'LISTING' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('LISTING')}
              >
                上架中
              </Badge>
              <Badge
                variant={statusFilter === 'MAINTENANCE' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('MAINTENANCE')}
              >
                维修中
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 房源列表 */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">暂无房源数据</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-48 bg-muted">
                {property.photos?.[0]?.url ? (
                  <img
                    src={property.photos[0].url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      property.status
                    )}`}
                  >
                    {getStatusLabel(property.status)}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>查看详情</DropdownMenuItem>
                      <DropdownMenuItem>编辑房源</DropdownMenuItem>
                      <DropdownMenuItem>上传照片</DropdownMenuItem>
                      <DropdownMenuItem>分配管家</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium truncate">{property.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {property.propertyNo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{property.address}</span>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Bed className="h-3 w-3" />
                    <span>{property.bedrooms || '-'}室</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="h-3 w-3" />
                    <span>{property.bathrooms || '-'}卫</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Maximize2 className="h-3 w-3" />
                    <span>{property.area || '-'}㎡</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-baseline gap-1">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold text-primary">
                      {property.monthlyRent || '-'}
                    </span>
                    <span className="text-xs text-muted-foreground">/月</span>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/properties/${property.id}`}>查看</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 分页 */}
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
            disabled={properties.length < pageSize}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}
