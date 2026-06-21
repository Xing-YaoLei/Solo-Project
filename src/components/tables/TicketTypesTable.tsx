'use client';

import { useState } from 'react';
import { ArrowUpDown, Tag, Clock, Users, Info } from 'lucide-react';
import type { TicketTypeDetail } from '@/types';
import { formatCurrency, formatPercent, formatDate, cn } from '@/lib/utils';

interface TicketTypesTableProps {
  data: TicketTypeDetail[];
  className?: string;
}

type SortField = 'name' | 'price' | 'soldCount' | 'occupancyRate' | 'remainingCount';
type SortOrder = 'asc' | 'desc';

export function TicketTypesTable({ data, className }: TicketTypesTableProps) {
  const [sortField, setSortField] = useState<SortField>('occupancyRate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'soldCount':
        comparison = a.soldCount - b.soldCount;
        break;
      case 'occupancyRate':
        comparison = a.occupancyRate - b.occupancyRate;
        break;
      case 'remainingCount':
        comparison = a.remainingCount - b.remainingCount;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-white transition-colors"
    >
      {label}
      <ArrowUpDown className={cn(
        'h-3 w-3 transition-colors',
        sortField === field ? 'text-primary' : 'text-neutral-500'
      )} />
    </button>
  );

  const getRateColor = (rate: number): string => {
    if (rate >= 0.85) return 'bg-success';
    if (rate >= 0.6) return 'bg-primary';
    if (rate >= 0.4) return 'bg-warning';
    return 'bg-neutral-500';
  };

  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="table-container max-h-[600px]">
        <table className="table">
          <thead>
            <tr>
              <th>
                <SortHeader field="name" label="票种名称" />
              </th>
              <th>
                <SortHeader field="price" label="售价" />
              </th>
              <th>原价</th>
              <th>折扣</th>
              <th>总库存</th>
              <th>
                <SortHeader field="soldCount" label="已售" />
              </th>
              <th>锁座</th>
              <th>
                <SortHeader field="remainingCount" label="剩余" />
              </th>
              <th className="min-w-[150px]">
                <SortHeader field="occupancyRate" label="上座率" />
              </th>
              <th>限购</th>
              <th>销售时间</th>
              <th>限制规则</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((ticket, index) => (
              <tr key={ticket.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-in">
                <td>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: ticket.price >= 1000 ? 'rgba(16, 185, 129, 0.2)' :
                          ticket.price >= 600 ? 'rgba(59, 130, 246, 0.2)' :
                          ticket.price >= 400 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                      }}
                    >
                      <Tag className="h-4 w-4" style={{
                        color: ticket.price >= 1000 ? '#10B981' :
                          ticket.price >= 600 ? '#3B82F6' :
                          ticket.price >= 400 ? '#F59E0B' : '#64748B',
                      }} />
                    </div>
                    <div>
                      <div className="font-medium text-white">{ticket.name}</div>
                      {ticket.description && (
                        <div className="text-xs text-neutral-500">{ticket.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="font-mono font-medium text-white">{formatCurrency(ticket.price)}</td>
                <td className="font-mono text-neutral-500 line-through">{formatCurrency(ticket.originalPrice)}</td>
                <td>
                  {ticket.discount > 0 ? (
                    <span className="badge-danger">{formatPercent(ticket.discount)} OFF</span>
                  ) : (
                    <span className="text-neutral-500">原价</span>
                  )}
                </td>
                <td className="font-mono text-neutral-300">{ticket.totalStock.toLocaleString()}</td>
                <td className="font-mono font-medium text-success">{ticket.soldCount.toLocaleString()}</td>
                <td className="font-mono text-warning">{ticket.lockedCount.toLocaleString()}</td>
                <td className="font-mono text-neutral-300">{ticket.remainingCount.toLocaleString()}</td>
                <td>
                  <div className="space-y-1">
                    <div className="progress-bar">
                      <div
                        className={cn('progress-bar-fill', getRateColor(ticket.occupancyRate))}
                        style={{ width: `${ticket.occupancyRate * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-white">{formatPercent(ticket.occupancyRate)}</span>
                      <span className="text-neutral-500">
                        {ticket.soldCount}/{ticket.totalStock}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="font-mono text-neutral-300">每人{ticket.maxPerOrder}张</span>
                </td>
                <td>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1 text-neutral-400">
                      <Clock className="h-3 w-3" />
                      <span>开始：{formatDate(ticket.saleStartTime).split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-400">
                      <Clock className="h-3 w-3" />
                      <span>结束：{formatDate(ticket.saleEndTime).split(' ')[0]}</span>
                    </div>
                  </div>
                </td>
                <td>
                  {ticket.restrictions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {ticket.restrictions.map((r, i) => (
                        <span key={i} className="badge-neutral text-xs">
                          <Info className="h-3 w-3 mr-1 inline" />
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-neutral-500 text-xs">无限制</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
