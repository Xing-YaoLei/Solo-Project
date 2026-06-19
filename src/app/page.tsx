'use client';

import { useEffect } from 'react';
import { TopBar } from '@/components/TopBar';
import { WarningCards } from '@/components/WarningCards';
import { WorkorderTrendChart } from '@/components/WorkorderTrendChart';
import { InventoryPieChart } from '@/components/InventoryPieChart';
import { QuoteTable } from '@/components/QuoteTable';
import { InspectionGallery } from '@/components/InspectionGallery';
import { ExportModal } from '@/components/ExportModal';
import { ShareModal } from '@/components/ShareModal';
import { useDashboardStore } from '@/store/dashboard';

export default function Home() {
  const { loadAllData, isLoading } = useDashboardStore();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="min-h-screen bg-industrial-900">
      <TopBar />

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold tracking-wide text-white">
            工位排班风险监测仪表盘
          </h2>
          <p className="mt-1 text-xs text-industrial-400">
            实时整合收银流水、保险材料、配件系统数据，识别并预警维修质量与运营风险
          </p>
        </div>

        <div className="space-y-6">
          <WarningCards />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <WorkorderTrendChart />
            <InventoryPieChart />
          </div>

          <QuoteTable />

          <InspectionGallery />
        </div>
      </main>

      <ExportModal />
      <ShareModal />
    </div>
  );
}
