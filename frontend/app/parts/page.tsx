'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import { formatCurrency } from '@/lib/utils';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useDataTable } from '@/hooks/useDataTable';
import type { Part } from '@/lib/types';
import { partApi } from '@/lib/api-endpoints';
import { cn } from '@/lib/utils';

const categoryOptions = [
  { value: '', label: '全部分类' },
  { value: '滤清器', label: '滤清器' },
  { value: '刹车系统', label: '刹车系统' },
  { value: '油品', label: '油品' },
  { value: '点火系统', label: '点火系统' },
];

export default function PartsPage() {
  const { isAuthorized } = useProtectedRoute({
    allowedRoles: ['PARTS_CLERK', 'MANAGER'],
  });
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!isAuthorized) return;
    setLoading(true);
    partApi
      .getAll({ page: currentPage, pageSize, category: categoryFilter || undefined })
      .then((res) => {
        setParts(res.data);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [isAuthorized, currentPage, categoryFilter]);

  const filteredData = parts.filter((part) => {
    const matchesSearch =
      !searchQuery ||
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = !lowStockOnly || part.stock < part.minStock;
    return matchesSearch && matchesLowStock;
  });

  const paginatedData = filteredData;

  if (!isAuthorized) {
    return null;
  }

  const columns = [
    { key: 'partNumber', title: '配件编号' },
    { key: 'name', title: '配件名称' },
    { key: 'category', title: '分类' },
    {
      key: 'unitPrice',
      title: '售价',
      render: (row: Part) => formatCurrency(row.unitPrice),
    },
    {
      key: 'stock',
      title: '库存',
      render: (row: Part) => (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-medium',
              row.stock < row.minStock
                ? 'text-red-600'
                : 'text-slate-900'
            )}
          >
            {row.stock} {row.unit}
          </span>
          {row.stock < row.minStock && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>
      ),
    },
    { key: 'location', title: '库位' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>配件库存</CardTitle>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新增配件
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索配件..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="sm:w-40">
                <Select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={categoryOptions}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                仅显示库存预警
              </label>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">加载中...</div>
          ) : (
            <DataTable columns={columns} data={paginatedData} />
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
