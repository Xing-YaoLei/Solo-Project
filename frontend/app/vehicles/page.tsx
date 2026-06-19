'use client';

import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import type { Vehicle } from '@/lib/types';
import { vehicleApi } from '@/lib/api-endpoints';

export default function VehiclesPage() {
  const { isAuthorized } = useProtectedRoute({
    allowedRoles: ['ADVISOR', 'MANAGER'],
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!isAuthorized) return;
    setLoading(true);
    vehicleApi
      .getAll({ page: currentPage, pageSize })
      .then((res) => {
        setVehicles(res.data);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [isAuthorized, currentPage]);

  const filteredData = vehicles.filter((vehicle) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      vehicle.plateNumber.toLowerCase().includes(query) ||
      vehicle.brand.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query) ||
      vehicle.ownerName.toLowerCase().includes(query) ||
      vehicle.ownerPhone.includes(query)
    );
  });

  if (!isAuthorized) {
    return null;
  }

  const columns = [
    { key: 'plateNumber', title: '车牌号' },
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
    { key: 'ownerName', title: '车主' },
    { key: 'ownerPhone', title: '联系电话' },
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
                placeholder="搜索车牌号/车主/车型..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">加载中...</div>
          ) : (
            <DataTable columns={columns} data={filteredData} />
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
