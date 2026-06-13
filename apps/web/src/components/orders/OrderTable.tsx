// @ts-nocheck
'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, User, Flag, AlertTriangle, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { apiEndpoints } from '@/lib/api';
import {
  statusConfig,
  responsibilityConfig,
  formatCurrency,
  formatDate,
  formatDuration,
  getDeadlineStatus,
  cn,
} from '@/lib/utils';
import type { RefundOrder } from '@solo/shared';

interface OrderTableProps {
  orders: RefundOrder[];
  onRefresh?: () => void;
}

export function OrderTable({ orders, onRefresh }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Search className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg">暂无匹配的售后单</p>
        <p className="text-sm">尝试调整筛选条件</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              售后单号
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              客户信息
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              商品信息
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              问题标签
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              状态
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              责任归属
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              处理人
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              区域
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              退款金额
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              处理时限
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              处理时长
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {orders.map((order) => {
            const status = statusConfig[order.status];
            const resp = order.responsibility ? responsibilityConfig[order.responsibility] : null;
            const deadlineStatus = getDeadlineStatus(order.deadline, order.isTimeout);

            return (
              <tr
                key={order.id}
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  order.isTimeout && 'bg-red-50/50',
                  order.isUrgent && !order.isTimeout && 'bg-yellow-50/30',
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {order.isUrgent && <Flag className="h-3.5 w-3.5 text-red-500" />}
                    {order.isTimeout && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {order.orderNo}
                    </Link>
                  </div>
                  <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{order.customerName}</div>
                  <div className="text-xs text-gray-500">{order.customerPhone}</div>
                  <div className="text-xs text-gray-400">{order.community}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 line-clamp-1 max-w-[180px]">
                    {order.productName}
                  </div>
                  {order.productSku && (
                    <div className="text-xs text-gray-400">SKU: {order.productSku}</div>
                  )}
                  <div className="text-xs text-gray-400">x{order.quantity}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[140px]">
                    {order.problemTags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" size="sm">
                        {tag}
                      </Badge>
                    ))}
                    {order.problemTags?.length > 2 && (
                      <Badge variant="secondary" size="sm">
                        +{order.problemTags.length - 2}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={status.bgColor}>{status.label}</Badge>
                </td>
                <td className="px-4 py-3">
                  {resp ? (
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', resp.color)} />
                      <span className="text-sm text-gray-700">{resp.label}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {order.assignee ? (
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm text-gray-700">{order.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">待分配</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700">{order.region}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">
                    {formatCurrency(order.refundAmount)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className={cn('flex items-center gap-1 text-sm', deadlineStatus.color)}>
                    <Clock className="h-3.5 w-3.5" />
                    <span>{deadlineStatus.label}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(order.deadline, 'MM-DD HH:mm')}
                  </div>
                  {order.isTimeout && (
                    <Badge variant="danger" size="sm" className="mt-1">
                      超时{order.timeoutCount}次
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {order.handlingDurationMinutes ? (
                    <span className="text-sm text-gray-700">
                      {formatDuration(order.handlingDurationMinutes)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    查看
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Search(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
