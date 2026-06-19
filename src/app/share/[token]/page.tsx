"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Wrench,
  Clock,
  AlertTriangle,
  Activity,
  BarChart3,
  Shield,
  XCircle,
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { QuotationTrendChart } from "@/components/QuotationTrendChart";
import { InspectionChart } from "@/components/InspectionChart";
import { VehicleTable } from "@/components/VehicleTable";
import { DiagnosisChart } from "@/components/DiagnosisChart";
import { UserRole, roleNames } from "@/types";
import { getRolePermissions } from "@/types";
import {
  OverviewData,
  QuotationTrendResponse,
  InspectionResponse,
  VehicleResponse,
  DiagnosisResponse,
} from "@/types";
import { formatPercent, formatNumber } from "@/utils/format";

export default function SharePage() {
  const params = useParams();
  const token = params?.token as string;

  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [role, setRole] = useState<UserRole>("external");
  const [loading, setLoading] = useState(true);

  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [quotationData, setQuotationData] =
    useState<QuotationTrendResponse | null>(null);
  const [inspectionData, setInspectionData] =
    useState<InspectionResponse | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleResponse | null>(null);
  const [diagnosisData, setDiagnosisData] =
    useState<DiagnosisResponse | null>(null);

  const permissions = getRolePermissions(role);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/share/validate?token=${token}`);
        const data = await response.json();

        if (data.valid) {
          setIsValid(true);
          setRole(data.role || "advisor");
        } else {
          setIsValid(false);
        }
      } catch (error) {
        console.error("Validate token error:", error);
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  useEffect(() => {
    if (!isValid) return;

    const fetchData = async () => {
      try {
        const [overview, quotation, inspection, vehicles, diagnosis] =
          await Promise.all([
            fetch(`/api/reports/overview?role=${role}`).then((res) =>
              res.json()
            ),
            fetch(`/api/reports/quotation-trend?role=${role}`).then((res) =>
              res.json()
            ),
            fetch(`/api/reports/inspection?role=${role}`).then((res) =>
              res.json()
            ),
            fetch(`/api/reports/vehicles?role=${role}`).then((res) =>
              res.json()
            ),
            fetch(`/api/reports/diagnosis?role=${role}`).then((res) =>
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
      }
    };

    fetchData();
  }, [isValid, role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-industrial-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display mb-2">
            分享链接无效
          </h1>
          <p className="text-slate-400 mb-8">
            该分享链接已过期或不存在，请联系发送者获取新的分享链接。
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3 bg-industrial-500 hover:bg-industrial-600 text-white font-medium rounded-xl transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

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
                  分享链接 · 只读视图
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                {roleNames[role]} 视图
              </span>
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
              icon={<Wrench className="w-5 h-5" />}
              colorScheme="industrial"
              subtitle="本月累计"
              delay={0}
            />
            <KpiCard
              title="平均维修时长"
              value={overviewData.avgRepairDuration}
              unit="小时"
              icon={<Clock className="w-5 h-5" />}
              colorScheme="success"
              subtitle="较上月"
              delay={100}
            />
            <KpiCard
              title="返修率"
              value={formatPercent(overviewData.reworkRate, 1)}
              icon={<AlertTriangle className="w-5 h-5" />}
              colorScheme="danger"
              subtitle="30天内同故障"
              delay={200}
            />
            <KpiCard
              title="工位利用率"
              value={formatPercent(overviewData.stationUtilization, 1)}
              icon={<Activity className="w-5 h-5" />}
              colorScheme="default"
              subtitle="日均工位占用"
              delay={300}
            />
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {permissions.canViewQuotation && quotationData && (
            <QuotationTrendChart
              data={quotationData.data}
              lastUpdated={quotationData.lastUpdated}
              canViewFullAmount={permissions.canViewFullAmount}
            />
          )}

          {permissions.canViewInspection && inspectionData && (
            <InspectionChart
              summary={inspectionData.summary}
              issues={inspectionData.issues}
              lastUpdated={inspectionData.lastUpdated}
              canViewDetail={permissions.canViewInspectionDetail}
            />
          )}
        </div>

        {permissions.canViewVehicles && vehicleData && (
          <div className="mb-8">
            <VehicleTable
              data={vehicleData.data}
              lastUpdated={vehicleData.lastUpdated}
              canViewParts={permissions.canViewParts}
            />
          </div>
        )}

        {permissions.canViewDiagnosis && diagnosisData && (
          <DiagnosisChart
            abnormalItems={diagnosisData.abnormalItems}
            trend={diagnosisData.trend}
            lastUpdated={diagnosisData.lastUpdated}
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
                该分享链接权限不足，请联系管理员获取更高权限
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
            © 2024 汽车维修工位排班漏斗报表系统 · 分享链接仅用于数据查看
          </p>
        </div>
      </footer>
    </div>
  );
}
