'use client';

import { useMemo, useState } from 'react';
import { GitCompare, Clock, Database, History } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataCompareTable } from '@/components/DataCompareTable';
import { ExportButtons } from '@/components/ExportButtons';
import { getCompareData, getDataVersions } from '@/services/compareService';
import { getFilteredHearings } from '@/services/hearingsService';
import { useFilterStore } from '@/store/useFilterStore';
import { formatDateTime, getDataSourceLabel } from '@/lib/utils';
import { mockDataVersions } from '@/data/mockData';

export default function DataComparePage() {
  const { filters } = useFilterStore();
  const [selectedVersions, setSelectedVersions] = useState<{
    caseSystem?: string;
    calendarTool?: string;
    emailAttachment?: string;
  }>({});

  const compareData = useMemo(() => getCompareData(), []);
  const dataVersions = useMemo(() => getDataVersions(), []);
  const filteredHearings = useMemo(
    () => getFilteredHearings(filters),
    [filters]
  );

  const discrepancyCount = compareData.discrepancies.length;
  const uniqueHearingIds = new Set(
    compareData.discrepancies.map((d) => d.hearingId)
  ).size;

  const sourceStats = [
    {
      source: 'CASE_SYSTEM' as const,
      count: compareData.caseSystemData.length,
      version: mockDataVersions.find((v) => v.source === 'CASE_SYSTEM')?.version,
    },
    {
      source: 'CALENDAR_TOOL' as const,
      count: compareData.calendarToolData.length,
      version: mockDataVersions.find((v) => v.source === 'CALENDAR_TOOL')?.version,
    },
    {
      source: 'EMAIL_ATTACHMENT' as const,
      count: compareData.emailAttachmentData.length,
      version: mockDataVersions.find((v) => v.source === 'EMAIL_ATTACHMENT')?.version,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            数据口径对比
          </h1>
          <p className="mt-1 text-slate-500">
            对比案件系统、日历工具和邮件附件三方数据，识别差异
          </p>
        </div>
        <ExportButtons data={filteredHearings} title="数据口径对比" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {sourceStats.map((stat) => (
          <Card key={stat.source}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {getDataSourceLabel(stat.source)}
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-slate-900">
                    {stat.count}
                    <span className="text-sm font-normal text-slate-500">
                      {' '}条记录
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400 font-mono">
                    版本: {stat.version}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <Database className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500 text-white">
                <GitCompare className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700">
                  数据差异数量
                </p>
                <p className="font-display text-3xl font-bold text-amber-900">
                  {discrepancyCount}
                </p>
                <p className="text-sm text-amber-600">
                  涉及 {uniqueHearingIds} 条开庭记录
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary-500" />
              版本历史
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dataVersions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        version.source === 'CASE_SYSTEM'
                          ? 'default'
                          : version.source === 'CALENDAR_TOOL'
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {getDataSourceLabel(version.source)}
                    </Badge>
                    <div>
                      <p className="font-mono text-sm font-medium text-slate-700">
                        {version.version}
                      </p>
                      <p className="text-xs text-slate-500">
                        导入时间: {formatDateTime(version.importDate)}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    对比
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary-500" />
            三方数据对比详情
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataCompareTable
            caseSystemData={compareData.caseSystemData}
            calendarToolData={compareData.calendarToolData}
            emailAttachmentData={compareData.emailAttachmentData}
            discrepancies={compareData.discrepancies}
          />
        </CardContent>
      </Card>
    </div>
  );
}
