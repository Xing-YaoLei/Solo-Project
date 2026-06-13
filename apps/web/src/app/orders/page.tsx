'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrderFilter } from '@/components/orders/OrderFilter';
import { OrderTable } from '@/components/orders/OrderTable';
import { apiEndpoints } from '@/lib/api';
import type { RefundOrder } from '@solo/shared';

export default function OrdersPage() {
  const [orders, setOrders] = useState<RefundOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        status: filters.status?.join(','),
        page,
        pageSize,
      };
      const res: any = await apiEndpoints.refundOrders.list(params);
      setOrders(res.items || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">售后单列表</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {total} 条记录
          </p>
        </div>
        <Link href="/orders/new">
          <Button variant="primary">
            <Plus className="mr-2 h-4 w-4" />
            新建售后单
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderFilter onFilterChange={handleFilterChange} initialFilters={filters} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <OrderTable orders={orders} onRefresh={fetchOrders} />

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                  <div className="text-sm text-gray-500">
                    第 {page} / {totalPages} 页
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
