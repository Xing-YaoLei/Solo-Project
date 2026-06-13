// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, User, AlertTriangle, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { apiEndpoints } from '@/lib/api';
import {
  statusConfig,
  responsibilityConfig,
  formatCurrency,
  formatRelativeTime,
  getDeadlineStatus,
  cn,
} from '@/lib/utils';
import { RefundStatus } from '@solo/shared';

const KANBAN_COLUMNS = [
  { status: RefundStatus.PENDING },
  { status: RefundStatus.ASSIGNED },
  { status: RefundStatus.PROCESSING },
  { status: RefundStatus.EVIDENCE_UPLOADED },
  { status: RefundStatus.REVIEWING },
  { status: RefundStatus.RETRY },
  { status: RefundStatus.SUPPLEMENT },
  { status: RefundStatus.CLOSED },
];

export default function KanbanPage() {
  const [kanbanData, setKanbanData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: any = await apiEndpoints.refundOrders.kanban();
        setKanbanData(data);
      } catch (error) {
        console.error('Failed to fetch kanban data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((col) => {
          const count = kanbanData[col.status]?.length || 0;
          const status = statusConfig[col.status];
          return (
            <div key={col.status} className="flex items-center gap-2 whitespace-nowrap">
              <div className={cn('h-3 w-3 rounded-full', status.bgColor.replace('bg-', 'bg-').replace('-100', '-500'))} />
              <span className="text-sm font-medium text-gray-700">{status.label}</span>
              <Badge variant="secondary" size="sm">{count}</Badge>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin" style={{ height: 'calc(100vh - 280px)' }}>
        {KANBAN_COLUMNS.map((col) => {
          const orders = kanbanData[col.status] || [];
          const status = statusConfig[col.status];

          return (
            <div
              key={col.status}
              className="flex-shrink-0 w-80 rounded-xl bg-gray-100 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('h-2.5 w-2.5 rounded-full', status.bgColor.replace('bg-', 'bg-').replace('-100', '-500'))} />
                  <span className="font-medium text-gray-700">{status.label}</span>
                </div>
                <Badge variant="secondary">{orders.length}</Badge>
              </div>

              <div className="space-y-3 max-h-full overflow-y-auto scrollbar-thin pr-1">
                {orders.map((order) => {
                  const deadlineStatus = getDeadlineStatus(order.deadline, order.isTimeout);
                  const resp = order.responsibility ? responsibilityConfig[order.responsibility] : null;

                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="block rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{order.orderNo}</span>
                        {order.isUrgent && (
                          <Flag className="h-4 w-4 text-red-500" />
                        )}
                      </div>

                      <h4 className="font-medium text-gray-800 mb-1 line-clamp-1">
                        {order.productName}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {order.reason}
                      </p>

                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {order.problemTags?.slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="outline" size="sm" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">客户</span>
                          <span className="font-medium text-gray-700">{order.customerName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">金额</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(order.refundAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">区域</span>
                          <span className="text-gray-700">{order.region}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        {order.assignee && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="h-3.5 w-3.5" />
                            <span>{order.assignee.name}</span>
                          </div>
                        )}
                        {resp && (
                          <div className="flex items-center gap-2">
                            <div className={cn('h-2 w-2 rounded-full', resp.color)} />
                            <span className="text-xs text-gray-500">{resp.label}责任</span>
                          </div>
                        )}
                        <div className={cn('flex items-center gap-2 text-xs', deadlineStatus.color)}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{deadlineStatus.label}</span>
                          {order.isTimeout && (
                            <Badge variant="danger" size="sm">超时{order.timeoutCount}次</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          创建于 {formatRelativeTime(order.createdAt)}
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {orders.length === 0 && (
                  <div className="rounded-lg bg-white/50 py-8 text-center text-sm text-gray-400">
                    暂无任务
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
