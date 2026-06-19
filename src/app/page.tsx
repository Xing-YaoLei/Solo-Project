"use client";

import { useState, useEffect } from "react";
import {
  Wrench,
  Clock,
  AlertTriangle,
  Activity,
  Share2,
  Download,
  BarChart3,
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { ChartCard } from "@/components/ChartCard";
import { QuotationTrendChart } from "@/components/QuotationTrendChart";
import { InspectionChart } from "@/components/InspectionChart";
import { VehicleTable } from "@/components/VehicleTable";
import { DiagnosisChart } from "@/components/DiagnosisChart";
import { ShareModal } from "@/components/ShareModal";
import { RoleSelector } from "@/components/RoleSelector";
import { useAppStore } from "@/store/useAppStore";
import {
  OverviewData,
  QuotationTrendResponse,
  InspectionResponse,
  VehicleResponse,
  DiagnosisResponse,
} from "@/types";
import { formatPercent, formatNumber } from "@/utils/format";

export default function ReportPage() {
  const { currentRole, permissions, shareModalOpen, setShareModalOpen, setRole } =
    useAppStore();

  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [quotationData, setQuotationData] =
    useState<QuotationTrendResponse | null>(null);
  const [inspectionData, setInspectionData] =
    useState<InspectionResponse | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleResponse | null>(null);
  const [diagnosisData, setDiagnosisData] =
    useState<DiagnosisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [overview, quotation, inspection, vehicles, diagnosis] =
        await Promise.all([
          fetch(`/api/reports/overview?role=${currentRole}`).then((res) =>
            res.json()
          ),
          fetch(`/api/reports/quotation-trend?role=${currentRole}`).then(
            (res) => res.json()
          ),
          fetch(`/api/reports/inspection?role=${currentRole}`).then((res) =>
            res.json()
          ),
          fetch(`/api/reports/vehicles?role=${currentRole}`).then((res) =>
            res.json()
          ),
          fetch(`/api/reports/diagnosis?role=${currentRole}`).then((res) =>
            res.json()
          ),
        ]);

      if (!overview.error) setOverviewData(overview);
      if (!quotation.error) setQuotationData(quotation);
      if (!inspection.error) setInspectionData(inspection);
      if (!vehicles.error) setVehicleData(vehicles);
      if (!diagnosis.error) setDiagnosisData(diagnosis);
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [currentRole]);

  const handleExport = () => {
    window.open(`/api/export/excel?role=${currentRole}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-industrial-500 to-industrial-600 shadow-lg shadow-industrial-500/25">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-display">
                  汽车维修工位排班漏斗报表
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  全流程数据可视化 · 多角色权限管控
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <RoleSelector
                currentRole={currentRole}
                onRoleChange={setRole}
                variant="compact"
              />

              {permissions.canExport && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-white/5 transition-all hover:border-white/10"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">导出报表</span>
                </button>
              )}

              <button
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-industrial-500 hover:bg-industrial-600 text-white rounded-xl transition-all shadow-lg shadow-industrial-500/25"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">分享</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        {permissions.canViewOverview && overviewData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard
              title="工单总量"
              value={formatNumber(overviewData.totalWorkOrders)}
              unit="单"
              trend={12.5}
              icon={<Wrench className="w-5 h-5" />}
              colorScheme="industrial"
              subtitle="本月累计"
              delay={0}
            />
            <KpiCard
              title="平均维修时长"
              value={overviewData.avgRepairDuration}
              unit="小时"
              trend={-5.2}
              icon={<Clock className="w-5 h-5" />}
              colorScheme="success"
              subtitle="较上月缩短"
              delay={100}
            />
            <KpiCard
              title="返修率"
              value={formatPercent(overviewData.reworkRate, 1)}
              trend={-2.1}
              icon={<AlertTriangle className="w-5 h-5" />}
              colorScheme="danger"
              subtitle="30天内同故障返修"
              delay={200}
            />
            <KpiCard
              title="工位利用率"
              value={formatPercent(overviewData.stationUtilization, 1)}
              trend={3.8}
              icon={<Activity className="w-5 h-5" />}
              colorScheme="default"
              subtitle="日均工位占用"
              delay={300}
            />
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quotation Trend */}
          {permissions.canViewQuotation && quotationData && (
            <QuotationTrendChart
              data={quotationData.data}
              lastUpdated={quotationData.lastUpdated}
              canViewFullAmount={permissions.canViewFullAmount}
              onRefresh={fetchAllData}
            />
          )}

          {/* Inspection Chart */}
          {permissions.canViewInspection && inspectionData && (
            <InspectionChart
              summary={inspectionData.summary}
              issues={inspectionData.issues}
              lastUpdated={inspectionData.lastUpdated}
              canViewDetail={permissions.canViewInspectionDetail}
              onRefresh={fetchAllData}
            />
          )}
        </div>

        {/* Vehicle Table */}
        {permissions.canViewVehicles && vehicleData && (
          <div className="mb-8">
            <VehicleTable
              data={vehicleData.data}
              lastUpdated={vehicleData.lastUpdated}
              canViewParts={permissions.canViewParts}
              onRefresh={fetchAllData}
            />
          </div>
        )}

        {/* Diagnosis Chart */}
        {permissions.canViewDiagnosis && diagnosisData && (
          <DiagnosisChart
            abnormalItems={diagnosisData.abnormalItems}
            trend={diagnosisData.trend}
            lastUpdated={diagnosisData.lastUpdated}
            onRefresh={fetchAllData}
          />
        )}

        {/* No Permission */}
        {!permissions.canViewOverview &&
          !permissions.canViewQuotation &&
          !permissions.canViewInspection &&
          !permissions.canViewVehicles &&
          !permissions.canViewDiagnosis && (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-slate-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-300 mb-2">
                暂无访问权限
              </h2>
              <p className="text-slate-500">
                请联系管理员获取相应的角色权限
              </p>
            </div>
          )}

        {/* Rework Rate Note */}
        <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-1">
                返修率口径说明
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                返修率 = 返修工单数 / 总工单数量 × 100%。返修判定标准：同一车辆 30
                天内因相同故障再次入场维修。
                保养类工单、主动召回不计入返修率统计。统计周期内完成的所有维修工单均纳入计算范围。
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-slate-600">
            © 2024 汽车维修工位排班漏斗报表系统 · 数据每小时自动更新
          </p>
        </div>
      </footer>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        currentRole={currentRole}
      />
    </div>
  );
}
