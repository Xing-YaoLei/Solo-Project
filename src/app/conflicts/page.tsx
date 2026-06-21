'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, ConflictBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConflictGapTimeline } from '@/components/ConflictGapTimeline';
import { ExportButtons } from '@/components/ExportButtons';
import { HearingTable } from '@/components/HearingTable';
import { mockConflicts, mockHearings } from '@/data/mockData';
import { useFilterStore } from '@/store/useFilterStore';
import { getFilteredHearings } from '@/services/hearingsService';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Conflict } from '@/types';

export default function ConflictsPage() {
  const { filters } = useFilterStore();
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);

  const filteredHearings = useMemo(
    () => getFilteredHearings(filters),
    [filters]
  );

  const conflictHearings = useMemo(
    () => filteredHearings.filter((h) => h.hasConflict),
    [filteredHearings]
  );

  const statusStats = {
    PENDING: mockConflicts.filter((c) => c.status === 'PENDING').length,
    RESOLVED: mockConflicts.filter((c) => c.status === 'RESOLVED').length,
    ESCALATED: mockConflicts.filter((c) => c.status === 'ESCALATED').length,
  };

  const conflictsWithGaps = mockConflicts.filter(
    (c) => c.dataGapStart && c.dataGapEnd
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            利益冲突管理
          </h1>
          <p className="mt-1 text-slate-500">
            追踪利益冲突案件，标注数据缺口，管理冲突处理状态
          </p>
        </div>
        <ExportButtons data={conflictHearings} title="利益冲突案件" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">待处理冲突</p>
                <p className="mt-1 font-display text-3xl font-bold text-amber-900">
                  {statusStats.PENDING}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">已解决冲突</p>
                <p className="mt-1 font-display text-3xl font-bold text-green-900">
                  {statusStats.RESOLVED}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">已升级冲突</p>
                <p className="mt-1 font-display text-3xl font-bold text-red-900">
                  {statusStats.ESCALATED}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary-500" />
              数据缺口时间线
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConflictGapTimeline conflicts={conflictsWithGaps} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary-500" />
              冲突案件列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[350px] space-y-3 overflow-y-auto">
              {mockConflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-sm cursor-pointer"
                  onClick={() => setSelectedConflict(conflict)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            conflict.conflictType === '利益冲突'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {conflict.conflictType}
                        </Badge>
                        <ConflictBadge status={conflict.status} />
                      </div>
                      <p className="mt-2 font-medium text-slate-900">
                        {conflict.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        创建时间: {formatDateTime(conflict.createdAt)}
                      </p>
                      {conflict.dataGapStart && conflict.dataGapEnd && (
                        <p className="mt-1 text-xs text-red-500">
                          数据缺口: {formatDate(conflict.dataGapStart)} -{' '}
                          {formatDate(conflict.dataGapEnd)}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      详情
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary-500" />
            存在冲突的开庭记录
            <span className="ml-2 text-sm font-normal text-slate-500">
              共 {conflictHearings.length} 条记录
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HearingTable hearings={conflictHearings} />
        </CardContent>
      </Card>

      {selectedConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-display text-xl font-semibold text-slate-900">
              冲突详情
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    selectedConflict.conflictType === '利益冲突'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {selectedConflict.conflictType}
                </Badge>
                <ConflictBadge status={selectedConflict.status} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">冲突描述</p>
                <p className="text-slate-900">{selectedConflict.description}</p>
              </div>
              {selectedConflict.dataGapStart && selectedConflict.dataGapEnd && (
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    数据缺口范围
                  </p>
                  <p className="text-red-600">
                    {formatDate(selectedConflict.dataGapStart)} -{' '}
                    {formatDate(selectedConflict.dataGapEnd)}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">创建时间</p>
                  <p className="text-slate-900">
                    {formatDateTime(selectedConflict.createdAt)}
                  </p>
                </div>
                {selectedConflict.resolvedAt && (
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      解决时间
                    </p>
                    <p className="text-slate-900">
                      {formatDateTime(selectedConflict.resolvedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedConflict(null)}>
                关闭
              </Button>
              <Button>处理冲突</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
