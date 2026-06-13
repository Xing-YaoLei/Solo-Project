'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import ConsumptionChart from '@/components/Charts/ConsumptionChart';
import FunnelChart from '@/components/Charts/FunnelChart';
import InventoryRankChart from '@/components/Charts/InventoryRankChart';
import FollowupTrendChart from '@/components/Charts/FollowupTrendChart';
import {
  ConsumptionData,
  FunnelData,
  InventoryRank,
  FollowupTrend,
  PhotoFunnelData,
} from '@/types';

export default function AnalyticsPage() {
  const [consumptionData, setConsumptionData] = useState<ConsumptionData[]>([]);
  const [photoFunnelData, setPhotoFunnelData] = useState<PhotoFunnelData[]>([]);
  const [inventoryRank, setInventoryRank] = useState<InventoryRank[]>([]);
  const [followupTrend, setFollowupTrend] = useState<FollowupTrend[]>([]);
  const [consumptionDimension, setConsumptionDimension] = useState<'item' | 'amount' | 'time'>('item');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consumptionRes, photoRes, inventoryRes, followupRes] = await Promise.all([
          fetch(`/api/analytics/consumption?dimension=${consumptionDimension}`),
          fetch('/api/analytics/photo-funnel'),
          fetch('/api/analytics/inventory-rank'),
          fetch('/api/analytics/followup-trend'),
        ]);

        const consumptionData = await consumptionRes.json();
        const photoData = await photoRes.json();
        const inventoryData = await inventoryRes.json();
        const followupData = await followupRes.json();

        setConsumptionData(consumptionData);
        setPhotoFunnelData(photoData);
        setInventoryRank(inventoryData);
        setFollowupTrend(followupData);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      }
    };

    fetchData();
  }, [consumptionDimension]);

  const handleDimensionChange = async (dim: 'item' | 'amount' | 'time') => {
    setConsumptionDimension(dim);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-dark-800 mb-2">
            数据分析
          </h1>
          <p className="text-dark-500">深入分析门店消费趋势与运营数据</p>
        </div>

        <div className="space-y-6">
          {consumptionData.length > 0 && (
            <ConsumptionChart
              data={consumptionData}
              onDimensionChange={handleDimensionChange}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {photoFunnelData.length > 0 && (
              <FunnelChart data={photoFunnelData} title="效果照片漏斗" />
            )}
            {inventoryRank.length > 0 && (
              <InventoryRankChart data={inventoryRank} />
            )}
          </div>

          {followupTrend.length > 0 && (
            <FollowupTrendChart data={followupTrend} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
