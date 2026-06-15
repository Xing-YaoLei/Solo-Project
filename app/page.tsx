import {
  FileCheck,
  Users,
  AlertTriangle,
  Building2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import KPICard from '@/components/ui/KPICard';
import ReviewTrendChart from '@/components/charts/ReviewTrendChart';
import { getKPIData, getTrendData, getAnomalyExplanation } from '@/lib/mockData';

export default function DashboardPage() {
  const kpiData = getKPIData();
  const trendData = getTrendData();

  const anomalies = trendData.filter(d => d.isAnomaly).map(d => ({
    ...d,
    explanation: getAnomalyExplanation(d.month),
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-gray-900 mb-2">
          教务成绩复核趋势看板
        </h1>
        <p className="text-gray-500">
          实时监控成绩复核动态，多源数据对照，教室利用率改善复盘
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <KPICard
          title="复核申请总数"
          value={kpiData.totalApplications}
          unit=""
          suffix=" 件"
          trend={8.5}
          trendLabel="较上月"
          icon={<FileCheck className="w-6 h-6" />}
          color="blue"
          delay={100}
        />
        <KPICard
          title="复核通过率"
          value={kpiData.passRate}
          suffix="%"
          trend={3.2}
          trendLabel="较上月"
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
          delay={200}
        />
        <KPICard
          title="材料缺失数"
          value={kpiData.missingMaterials}
          suffix=" 件"
          trend={-5.8}
          trendLabel="较上月"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="amber"
          delay={300}
        />
        <KPICard
          title="教室利用率"
          value={kpiData.classroomUtilization}
          suffix="%"
          trend={kpiData.utilizationMoM}
          trendLabel="环比"
          icon={<Building2 className="w-6 h-6" />}
          color="purple"
          delay={400}
        />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <KPICard
          title="覆盖学生数"
          value={kpiData.totalStudents}
          suffix=" 人"
          icon={<Users className="w-6 h-6" />}
          color="blue"
          delay={500}
        />
        <KPICard
          title="待审核数"
          value={kpiData.pendingReviews}
          suffix=" 件"
          icon={<Clock className="w-6 h-6" />}
          color="red"
          delay={600}
        />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 card-gradient p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">复核申请趋势</h2>
              <p className="text-sm text-gray-500">近12个月申请数、通过数、材料缺失数</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">同比</span>
              <span className="text-sm font-semibold text-emerald-600">+12.3%</span>
            </div>
          </div>
          <ReviewTrendChart data={trendData} />
        </div>

        <div className="card-gradient p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">异常预警</h2>
          </div>

          <div className="space-y-4">
            {anomalies.map((anomaly, idx) => (
              <div
                key={anomaly.month}
                className="p-4 bg-red-50 border border-red-100 rounded-lg animate-fade-in"
                style={{ animationDelay: `${(idx + 1) * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-red-700">
                      {anomaly.month}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold font-mono text-red-600">
                        {anomaly.applications}
                      </span>
                      <span className="text-xs text-gray-500">件申请</span>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-breathe" />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {anomaly.anomalyReason}
                </p>
                {anomaly.explanation && (
                  <div className="text-xs text-gray-500">
                    偏离预期 {anomaly.explanation.deviationPercent}%，
                    {anomaly.explanation.supervisorQuotaImpact.impactDescription}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">教室利用率改善</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-600">
                +{kpiData.utilizationYoY}%
              </span>
              <span className="text-sm text-gray-500">同比</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              已超过 {kpiData.classroomUtilization >= 65 ? '目标值 65%' : `目标值 65%，还差 ${(65 - kpiData.classroomUtilization).toFixed(1)}%`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-4 card-gradient p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">多源数据对照说明</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                  学
                </div>
                <span className="font-medium text-gray-800">学生申请表</span>
              </div>
              <p className="text-sm text-gray-600">学生提交的原始复核申请数据</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                  卡
                </div>
                <span className="font-medium text-gray-800">一卡通版本</span>
              </div>
              <p className="text-sm text-gray-600">校园一卡通系统中的数据版本</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                  教
                </div>
                <span className="font-medium text-gray-800">教务库口径</span>
              </div>
              <p className="text-sm text-gray-600">教务管理系统中的官方数据</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
