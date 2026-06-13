'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import MetricCard from '@/components/Charts/MetricCard';
import OrderCard from '@/components/Orders/OrderCard';
import {
  DollarSign,
  ClipboardList,
  TrendingUp,
  Star,
  CheckCircle2,
} from 'lucide-react';
import {
  HandOrder,
  TechnicianMetrics,
} from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<TechnicianMetrics | null>(null);
  const [orders, setOrders] = useState<HandOrder[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [metricsRes, ordersRes] = await Promise.all([
          fetch(`/api/technician/metrics?technicianId=${user.id}`),
          fetch(`/api/technician/orders?technicianId=${user.id}`),
        ]);

        const metricsData = await metricsRes.json();
        const ordersData = await ordersRes.json();

        setMetrics(metricsData);
        setOrders(ordersData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [user]);

  const handleMarkAbnormal = async (usageId: string, isAbnormal: boolean, note: string) => {
    try {
      const response = await fetch('/api/inventory-usage/abnormal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usageId,
          isAbnormal,
          note,
          notedBy: user?.id,
        }),
      });

      if (response.ok) {
        setOrders(prev => prev.map(order => ({
          ...order,
          inventoryItems: order.inventoryItems?.map(usage =>
            usage.id === usageId
              ? { ...usage, isAbnormal, abnormalNote: note, notedBy: user?.id, notedAt: new Date() }
              : usage
          ),
        })));
      }
    } catch (error) {
      console.error('Failed to mark abnormal:', error);
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-dark-800 mb-2">
            我的订单
          </h1>
          <p className="text-dark-500">查看您负责的手牌与个人业绩</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          {metrics && (
            <>
              <MetricCard
                title="总产值"
                value={metrics.totalRevenue}
                format="currency"
                icon={DollarSign}
                delay={0}
              />
              <MetricCard
                title="服务单量"
                value={metrics.orderCount}
                format="number"
                icon={ClipboardList}
                delay={100}
              />
              <MetricCard
                title="平均客单价"
                value={metrics.avgOrderValue}
                format="currency"
                icon={TrendingUp}
                delay={200}
              />
              <MetricCard
                title="平均评分"
                value={metrics.avgRating}
                format="number"
                icon={Star}
                delay={300}
              />
              <MetricCard
                title="完成率"
                value={metrics.completionRate}
                format="percent"
                icon={CheckCircle2}
                delay={400}
              />
            </>
          )}
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold text-dark-800 mb-4">
            手牌列表
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <OrderCard order={order} onMarkAbnormal={handleMarkAbnormal} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
