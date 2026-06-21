import React, { useState, useMemo, useCallback } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, FileText, Filter, SortAsc } from 'lucide-react';
import ChartCard from './ChartCard';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusLabel,
  getInvoiceStatusColor,
  getInvoiceSourceLabel,
} from '@/utils/format';
import { cn } from '@/lib/utils';
import type { InvoiceDetailItem, InvoiceStatus, InvoiceSource } from '@/types';

export interface InvoiceDetailTableProps {
  data: InvoiceDetailItem[];
  lastUpdated?: string;
  loading?: boolean;
  onRefresh?: () => void;
  onRowClick?: (invoice: InvoiceDetailItem) => void;
  pageSize?: number;
  className?: string;
}

type SortField = 'invoice_no' | 'case_name' | 'invoice_date' | 'amount' | 'status' | 'source';
type SortOrder = 'asc' | 'desc';

export const InvoiceDetailTable: React.FC<InvoiceDetailTableProps> = ({
  data,
  lastUpdated,
  loading = false,
  onRefresh,
  onRowClick,
  pageSize = 10,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('invoice_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<InvoiceSource | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions: { value: InvoiceStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待支付' },
    { value: 'paid', label: '已支付' },
    { value: 'overdue', label: '已逾期' },
    { value: 'cancelled', label: '已取消' },
  ];

  const sourceOptions: { value: InvoiceSource | 'all'; label: string }[] = [
    { value: 'all', label: '全部来源' },
    { value: 'manual', label: '手动录入' },
    { value: 'email', label: '邮件解析' },
    { value: 'import', label: '批量导入' },
    { value: 'api', label: 'API同步' },
  ];

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.case_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [data, searchTerm, statusFilter, sourceFilter]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'invoice_no':
          comparison = a.invoice_no.localeCompare(b.invoice_no);
          break;
        case 'case_name':
          comparison = a.case_name.localeCompare(b.case_name);
          break;
        case 'invoice_date':
          comparison = new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'source':
          comparison = a.source.localeCompare(b.source);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortOrder]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <SortAsc className="w-4 h-4 opacity-30" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-[#d4af37]" />
    ) : (
      <ChevronDown className="w-4 h-4 text-[#d4af37]" />
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSourceFilter('all');
    setCurrentPage(1);
  };

  return (
    <ChartCard
      title="单据明细"
      lastUpdated={lastUpdated}
      loading={loading}
      onRefresh={onRefresh}
      className={className}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="搜索单据号或案件名称..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#0f2540] border border-[#334155] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
              showFilters
                ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]'
                : 'bg-[#0f2540] border-[#334155] text-[#94a3b8] hover:border-[#d4af37]'
            )}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">筛选</span>
          </button>

          {(statusFilter !== 'all' || sourceFilter !== 'all' || searchTerm) && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-[#94a3b8] hover:text-[#d4af37] transition-colors"
            >
              重置
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-4 p-4 bg-[#0f2540] rounded-lg border border-[#334155]">
            <div className="flex items-center gap-2">
              <label className="text-sm text-[#94a3b8]">状态:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as InvoiceStatus | 'all');
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-[#1e3a5f] border border-[#334155] rounded-lg text-white text-sm focus:outline-none focus:border-[#d4af37]"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-[#94a3b8]">来源:</label>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value as InvoiceSource | 'all');
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-[#1e3a5f] border border-[#334155] rounded-lg text-white text-sm focus:outline-none focus:border-[#d4af37]"
              >
                {sourceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-[#334155]">
          <div className="max-h-[400px] overflow-auto">
            <Table className="table-fixed">
              <TableHeader className="sticky top-0 bg-[#1e3a5f] z-10">
                <TableRow className="hover:bg-[#1e3a5f]">
                  <TableHead
                    className="cursor-pointer text-[#94a3b8] hover:text-[#d4af37] transition-colors"
                    onClick={() => handleSort('invoice_no')}
                  >
                    <div className="flex items-center gap-1">
                      单据号
                      <SortIcon field="invoice_no" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-[#94a3b8] hover:text-[#d4af37] transition-colors"
                    onClick={() => handleSort('case_name')}
                  >
                    <div className="flex items-center gap-1">
                      案件名称
                      <SortIcon field="case_name" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-[#94a3b8] hover:text-[#d4af37] transition-colors"
                    onClick={() => handleSort('invoice_date')}
                  >
                    <div className="flex items-center gap-1">
                      单据日期
                      <SortIcon field="invoice_date" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right text-[#94a3b8] hover:text-[#d4af37] transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      金额
                      <SortIcon field="amount" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-[#94a3b8] hover:text-[#d4af37] transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      状态
                      <SortIcon field="status" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-[#94a3b8] hover:text-[#d4af37] transition-colors"
                    onClick={() => handleSort('source')}
                  >
                    <div className="flex items-center gap-1">
                      来源
                      <SortIcon field="source" />
                    </div>
                  </TableHead>
                  <TableHead className="text-[#94a3b8]">附件</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[#94a3b8]">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, index) => (
                    <TableRow
                      key={item.invoice_no}
                      className={cn(
                        'cursor-pointer transition-colors',
                        index % 2 === 0 ? 'bg-[#0f2540]' : 'bg-[#1e3a5f]/50',
                        'hover:bg-[#d4af37]/10 hover:border-[#d4af37]/50'
                      )}
                      onClick={() => onRowClick?.(item)}
                    >
                      <TableCell className="text-white font-mono text-sm">
                        {item.invoice_no}
                      </TableCell>
                      <TableCell className="text-[#e2e8f0] truncate max-w-[200px]">
                        {item.case_name}
                      </TableCell>
                      <TableCell className="text-[#94a3b8]">
                        {formatDate(item.invoice_date)}
                      </TableCell>
                      <TableCell className="text-right text-[#d4af37] font-mono font-medium">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getInvoiceStatusColor(item.status)} variant="secondary">
                          {getInvoiceStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#94a3b8] text-sm">
                        {getInvoiceSourceLabel(item.source)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <FileText className="w-4 h-4 text-[#3b82f6]" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="text-[#94a3b8]">
            共 <span className="text-[#d4af37] font-medium">{sortedData.length}</span> 条记录，
            第 <span className="text-[#d4af37] font-medium">{currentPage}</span> /{' '}
            <span className="text-[#d4af37] font-medium">{totalPages || 1}</span> 页
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-[#334155] text-[#94a3b8] hover:border-[#d4af37] hover:text-[#d4af37] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm transition-colors',
                      currentPage === pageNum
                        ? 'bg-[#d4af37] text-[#0f2540] font-medium'
                        : 'text-[#94a3b8] hover:bg-[#d4af37]/20 hover:text-[#d4af37]'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-[#334155] text-[#94a3b8] hover:border-[#d4af37] hover:text-[#d4af37] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </ChartCard>
  );
};

export default InvoiceDetailTable;
