// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Users,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { apiEndpoints } from '@/lib/api';
import { formatCurrency, formatDuration, statusConfig } from '@/lib/utils';
import { RefundStatus, RefundStats } from '@solo/shared';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<RefundStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, dashboardRes, trendRes, ordersRes] = await Promise.all([
          apiEndpoints.refundOrders.stats(),
          apiEndpoints.analysis.dashboard(),
          apiEndpoints.analysis.trend({ days: 7 }),
          apiEndpoints.refundOrders.list({ pageSize: 5 }),
        ]);
        setStats(statsRes);
        setDashboardStats(dashboardRes);
        setTrendData(trendRes.trend || []);
        setRecentOrders(ordersRes.items || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
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

  const statCards = [
    {
      label: '全部售后',
      value: stats?.total || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: '待处理',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: '处理中',
      value: stats?.processing || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: '已超时',
      value: stats?.timeout || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: '已关闭',
      value: stats?.closed || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: '30天退款额',
      value: formatCurrency(stats?.totalRefundAmount || 0),
      icon: DollarSign,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      subValue: `平均处理: ${stats?.avgHandlingHours || 0}小时`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
                    {stat.subValue && (
                      <p className="mt-1 text-xs text-gray-400">{stat.subValue}</p>
                    )}
                  </div>
                  <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>近7天处理趋势</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorCount)"
                  name="关闭数"
                />
                <Area
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                  name="退款额"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>处理平均时长（分钟）</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData.filter((d: any) => d.avgDuration > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatDuration(value)} />
                <Bar dataKey="avgDuration" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="平均时长" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>最近售后单</CardTitle>
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                查看全部 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const status = statusConfig[order.status as RefundStatus];
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNo}</p>
                        <p className="text-sm text-gray-500">
                          {order.customerName} · {order.productName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.refundAmount)}
                      </span>
                      <Badge className={status.bgColor} variant="default">
                        {status.label}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
              {recentOrders.length === 0 && (
                <p className="text-center text-gray-400 py-8">暂无售后单</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/orders/new" className="block">
              <Button className="w-full" variant="primary">
                新建售后单
              </Button>
            </Link>
            <Link href="/kanban" className="block">
              <Button className="w-full" variant="secondary">
                查看任务看板
              </Button>
            </Link>
            <Link href="/analysis" className="block">
              <Button className="w-full" variant="outline">
                复盘分析
              </Button>
            </Link>
            <Link href="/config" className="block">
              <Button className="w-full" variant="ghost">
                规则配置
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
