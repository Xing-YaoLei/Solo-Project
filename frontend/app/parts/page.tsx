'use client';

import { useState } from 'react';
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
import { cn } from '@/lib/utils';

const mockParts: Part[] = [
  {
    id: '1',
    partNumber: 'P001',
    name: '机油滤清器',
    description: '原厂机油滤清器',
    category: '滤清器',
    brand: '原厂',
    price: 85,
    cost: 45,
    stockQuantity: 120,
    minStockLevel: 50,
    unit: '个',
    location: 'A-01-01',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '2',
    partNumber: 'P002',
    name: '空气滤清器',
    category: '滤清器',
    brand: '原厂',
    price: 120,
    cost: 60,
    stockQuantity: 85,
    minStockLevel: 30,
    unit: '个',
    location: 'A-01-02',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
  },
  {
    id: '3',
    partNumber: 'P003',
    name: '前刹车片',
    category: '刹车系统',
    brand: '博世',
    price: 380,
    cost: 220,
    stockQuantity: 25,
    minStockLevel: 20,
    unit: '套',
    location: 'B-02-01',
    createdAt: '2023-02-15T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: '4',
    partNumber: 'P004',
    name: '全合成机油 5W-30',
    category: '油品',
    brand: '美孚',
    price: 450,
    cost: 280,
    stockQuantity: 12,
    minStockLevel: 30,
    unit: '桶',
    location: 'C-01-01',
    createdAt: '2023-03-01T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
  },
  {
    id: '5',
    partNumber: 'P005',
    name: '火花塞',
    category: '点火系统',
    brand: 'NGK',
    price: 95,
    cost: 50,
    stockQuantity: 200,
    minStockLevel: 80,
    unit: '支',
    location: 'D-03-02',
    createdAt: '2023-04-10T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: '6',
    partNumber: 'P006',
    name: '变速箱油',
    category: '油品',
    brand: '原厂',
    price: 520,
    cost: 300,
    stockQuantity: 8,
    minStockLevel: 15,
    unit: '桶',
    location: 'C-01-02',
    createdAt: '2023-05-20T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
];

const categoryOptions = [
  { value: '', label: '全部分类' },
  { value: '滤清器', label: '滤清器' },
  { value: '刹车系统', label: '刹车系统' },
  { value: '油品', label: '油品' },
  { value: '点火系统', label: '点火系统' },
];

export default function PartsPage() {
  const { isAuthorized } = useProtectedRoute({
    allowedRoles: ['partsClerk', 'manager'],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const filteredData = mockParts.filter((part) => {
    const matchesSearch =
      !searchQuery ||
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || part.category === categoryFilter;
    const matchesLowStock = !lowStockOnly || part.stockQuantity < part.minStockLevel;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const {
    data: paginatedData,
    currentPage,
    totalPages,
    goToPage,
  } = useDataTable({
    data: filteredData,
    pageSize: 10,
  });

  if (!isAuthorized) {
    return null;
  }

  const columns = [
    { key: 'partNumber', title: '配件编号' },
    { key: 'name', title: '配件名称' },
    { key: 'category', title: '分类' },
    { key: 'brand', title: '品牌' },
    {
      key: 'price',
      title: '售价',
      render: (row: Part) => formatCurrency(row.price),
    },
    {
      key: 'stockQuantity',
      title: '库存',
      render: (row: Part) => (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-medium',
              row.stockQuantity < row.minStockLevel
                ? 'text-red-600'
                : 'text-slate-900'
            )}
          >
            {row.stockQuantity} {row.unit}
          </span>
          {row.stockQuantity < row.minStockLevel && (
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
                  onChange={(e) => setCategoryFilter(e.target.value)}
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

          <DataTable columns={columns} data={paginatedData} />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
