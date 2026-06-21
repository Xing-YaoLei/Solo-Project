'use client';

import { useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Smile,
  Clock,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { KpiCard } from '@/components/KpiCard';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { AttendancePieChart } from '@/components/charts/AttendancePieChart';
import { BarChart } from '@/components/charts/BarChart';
import { FilterBar } from '@/components/filters/FilterBar';
import { ExportButtons } from '@/components/ExportButtons';
import { HearingTable } from '@/components/HearingTable';
import { useFilterStore } from '@/store/useFilterStore';
import {
  getFilteredHearings,
  getAttendanceStats,
  getDailyHearingsCount,
  getCaseTypeDistribution,
} from '@/services/hearingsService';
import { getFunnelData, getKpiData } from '@/data/mockData';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { filters } = useFilterStore();

  const filteredHearings = useMemo(
    () => getFilteredHearings(filters),
    [filters]
  );

  const attendanceStats = useMemo(
    () => getAttendanceStats(filteredHearings),
    [filteredHearings]
  );

  const dailyCounts = useMemo(
    () => getDailyHearingsCount(filteredHearings),
    [filteredHearings]
  );

  const caseTypeDistribution = useMemo(
    () => getCaseTypeDistribution(filteredHearings),
    [filteredHearings]
  );

  const kpiData = getKpiData();
  const funnelData = getFunnelData();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            开庭日历漏斗报表
          </h1>
          <p className="mt-1 text-slate-500">
            实时分析开庭数据，追踪流程转化，识别异常问题
          </p>
        </div>
        <ExportButtons data={filteredHearings} title="开庭日历报表" />
      </div>

      <FilterBar />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="总开庭数"
          value={filteredHearings.length}
          icon={<Calendar className="h-5 w-5" />}
          trend={5.2}
          color="primary"
        />
        <KpiCard
          title="到场率"
          value={kpiData.attendanceRate}
          icon={<Users className="h-5 w-5" />}
          trend={2.1}
          isPercentage
          color="success"
        />
        <KpiCard
          title="冲突率"
          value={kpiData.conflictRate}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={-1.5}
          isPercentage
          color="warning"
        />
        <KpiCard
          title="平均满意度"
          value={kpiData.avgSatisfaction.toFixed(1)}
          icon={<Smile className="h-5 w-5" />}
          trend={0.8}
          suffix="/5"
          color="primary"
        />
        <KpiCard
          title="待处理冲突"
          value={kpiData.pendingConflicts}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={-2.0}
          color="danger"
        />
        <KpiCard
          title="延期开庭"
          value={kpiData.postponedCount}
          icon={<Clock className="h-5 w-5" />}
          trend={3.5}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary-500" />
              流程转化漏斗
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={funnelData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-500" />
              到场状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AttendancePieChart data={attendanceStats} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-500" />
              每日开庭数趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={dailyCounts.map((d) => ({
                name: formatDate(d.date),
                value: d.count,
              }))}
              color="#1e3a5f"
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary-500" />
              案件类型分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={caseTypeDistribution}
              color="#0d9488"
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-500" />
            开庭记录明细
            <span className="ml-2 text-sm font-normal text-slate-500">
              共 {filteredHearings.length} 条记录
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HearingTable hearings={filteredHearings} />
        </CardContent>
      </Card>
    </div>
  );
}
