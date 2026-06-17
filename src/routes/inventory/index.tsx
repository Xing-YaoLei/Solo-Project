import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus, Eye, ArrowUpDown, Package, User, MapPin, Calendar } from 'lucide-react';
import { AdvancedFilter } from '@/components/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { api } from '@/services/api';
import { useAppStore } from '@/store/appStore';
import type { MaterialBatch, PaginatedResponse } from '@/types';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/inventory/')({
  component: InventoryListPage,
});

function InventoryListPage() {
  const [data, setData] = useState<PaginatedResponse<MaterialBatch> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('inDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const filters = useAppStore(state => state.inventoryFilters);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, sortBy, sortOrder, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.getInventory({
        ...filters,
        page,
        pageSize,
        sortBy,
        sortOrder,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
    >
      {label}
      <ArrowUpDown className={cn(
        'w-3 h-3 transition-colors',
        sortBy === field ? 'text-primary-600' : 'text-gray-400'
      )} />
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">库存台账</h1>
          <p className="text-gray-500 mt-1">管理所有材料批次的入库、领用和调拨记录</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          材料入库
        </button>
      </div>

      <AdvancedFilter />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-header">
                  <SortHeader field="batchNo" label="批次号" />
                </th>
                <th className="table-header">材料名称</th>
                <th className="table-header">规格</th>
                <th className="table-header">
                  <SortHeader field="quantity" label="数量" />
                </th>
                <th className="table-header">
                  <SortHeader field="supplierName" label="供应商" />
                </th>
                <th className="table-header">
                  <SortHeader field="region" label="区域" />
                </th>
                <th className="table-header">负责人</th>
                <th className="table-header">
                  <SortHeader field="inDate" label="入库日期" />
                </th>
                <th className="table-header">
                  <SortHeader field="expectedTurnoverDays" label="预计周转" />
                </th>
                <th className="table-header">状态</th>
                <th className="table-header text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="h-5 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="table-cell text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>暂无数据</p>
                  </td>
                </tr>
              ) : (
                data?.items.map((batch, index) => (
                  <tr
                    key={batch.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <td className="table-cell">
                      <span className="font-mono text-sm font-medium text-primary-600">{batch.batchNo}</span>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{batch.materialName}</div>
                      <div className="text-xs text-gray-500">{batch.category}</div>
                    </td>
                    <td className="table-cell text-gray-500 text-sm">{batch.specification}</td>
                    <td className="table-cell">
                      <span className="font-medium">{batch.quantity}</span>
                      <span className="text-gray-500 text-sm ml-1">{batch.unit}</span>
                    </td>
                    <td className="table-cell text-gray-600">{batch.supplierName}</td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {batch.region}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <User className="w-3 h-3" />
                        {batch.responsiblePerson}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {batch.inDate}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={cn(
                        'font-medium',
                        batch.actualTurnoverDays && batch.actualTurnoverDays > batch.expectedTurnoverDays
                          ? 'text-red-600'
                          : 'text-gray-600'
                      )}>
                        {batch.expectedTurnoverDays}天
                      </span>
                      {batch.actualTurnoverDays && (
                        <div className="text-xs text-gray-400">实际: {batch.actualTurnoverDays}天</div>
                      )}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={batch.status} />
                    </td>
                    <td className="table-cell text-right">
                      <Link
                        to="/inventory/$batchId"
                        params={{ batchId: batch.id }}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        详情
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data.total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}
