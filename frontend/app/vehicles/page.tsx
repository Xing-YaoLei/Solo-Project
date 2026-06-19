'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import { formatDate } from '@/lib/utils';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useDataTable } from '@/hooks/useDataTable';
import type { Vehicle } from '@/lib/types';

const mockVehicles: Vehicle[] = [
  {
    id: '1',
    licensePlate: '京A12345',
    vin: 'LVSHFFAL9FC123456',
    brand: '大众',
    model: '帕萨特',
    year: 2020,
    color: '黑色',
    mileage: 45000,
    customerId: '1',
    customerName: '张三',
    customerPhone: '13800138001',
    lastServiceDate: '2024-01-10',
    createdAt: '2023-06-15T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '2',
    licensePlate: '京B67890',
    vin: 'LVSHFFAL9FC654321',
    brand: '丰田',
    model: '凯美瑞',
    year: 2021,
    color: '白色',
    mileage: 32000,
    customerId: '2',
    customerName: '李四',
    customerPhone: '13800138002',
    lastServiceDate: '2024-01-05',
    createdAt: '2023-08-20T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: '3',
    licensePlate: '京C11111',
    vin: 'LVSHFFAL9FC111111',
    brand: '本田',
    model: '雅阁',
    year: 2019,
    color: '银色',
    mileage: 68000,
    customerId: '3',
    customerName: '王五',
    customerPhone: '13800138003',
    lastServiceDate: '2023-12-20',
    createdAt: '2022-03-10T00:00:00Z',
    updatedAt: '2023-12-20T00:00:00Z',
  },
  {
    id: '4',
    licensePlate: '京D22222',
    brand: '宝马',
    model: '3系',
    year: 2022,
    color: '蓝色',
    mileage: 15000,
    customerId: '4',
    customerName: '赵六',
    customerPhone: '13800138004',
    createdAt: '2023-11-01T00:00:00Z',
    updatedAt: '2023-11-01T00:00:00Z',
  },
  {
    id: '5',
    licensePlate: '京E33333',
    brand: '奔驰',
    model: 'C级',
    year: 2020,
    color: '黑色',
    mileage: 52000,
    customerId: '5',
    customerName: '孙七',
    customerPhone: '13800138005',
    lastServiceDate: '2024-01-08',
    createdAt: '2022-12-15T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
  },
];

export default function VehiclesPage() {
  const { isAuthorized } = useProtectedRoute({
    allowedRoles: ['advisor', 'manager'],
  });
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = mockVehicles.filter((vehicle) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      vehicle.licensePlate.toLowerCase().includes(query) ||
      vehicle.customerName.toLowerCase().includes(query) ||
      vehicle.brand.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query)
    );
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
    { key: 'licensePlate', title: '车牌号' },
    {
      key: 'brand',
      title: '车型',
      render: (row: Vehicle) => `${row.brand} ${row.model}`,
    },
    { key: 'year', title: '年份' },
    { key: 'color', title: '颜色' },
    {
      key: 'mileage',
      title: '里程',
      render: (row: Vehicle) =>
        row.mileage ? `${row.mileage.toLocaleString()} km` : '-',
    },
    { key: 'customerName', title: '车主' },
    {
      key: 'lastServiceDate',
      title: '上次保养',
      render: (row: Vehicle) => row.lastServiceDate || '-',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>车辆管理</CardTitle>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            登记车辆
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="搜索车辆..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
