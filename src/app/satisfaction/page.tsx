'use client';

import { useMemo, useState } from 'react';
import {
  Smile,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MessageSquare,
  Target,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SatisfactionTrendChart } from '@/components/charts/SatisfactionTrendChart';
import { BarChart } from '@/components/charts/BarChart';
import { ExportButtons } from '@/components/ExportButtons';
import { FilterBar } from '@/components/filters/FilterBar';
import { mockSatisfactions, mockCases } from '@/data/mockData';
import { useFilterStore } from '@/store/useFilterStore';
import { getFilteredHearings } from '@/services/hearingsService';
import { formatDate, formatDateTime, formatPercentage } from '@/lib/utils';
import type { Satisfaction } from '@/types';

export default function SatisfactionPage() {
  const { filters } = useFilterStore();
  const [selectedSatisfaction, setSelectedSatisfaction] = useState<Satisfaction | null>(null);

  const filteredHearings = useMemo(
    () => getFilteredHearings(filters),
    [filters]
  );

  const filteredCaseIds = useMemo(
    () => new Set(filteredHearings.map((h) => h.caseId)),
    [filteredHearings]
  );

  const filteredSatisfactions = useMemo(
    () =>
      mockSatisfactions.filter((s) =>
        filteredCaseIds.size > 0 ? filteredCaseIds.has(s.caseId) : true
      ),
    [filteredCaseIds]
  );

  const avgRating = useMemo(() => {
    if (filteredSatisfactions.length === 0) return 0;
    return (
      filteredSatisfactions.reduce((sum, s) => sum + s.rating, 0) /
      filteredSatisfactions.length
    );
  }, [filteredSatisfactions]);

  const avgFollowUpRating = useMemo(() => {
    const withFollowUp = filteredSatisfactions.filter((s) => s.followUpRating);
    if (withFollowUp.length === 0) return 0;
    return (
      withFollowUp.reduce((sum, s) => sum + (s.followUpRating || 0), 0) /
      withFollowUp.length
    );
  }, [filteredSatisfactions]);

  const satisfactionRate = useMemo(() => {
    if (filteredSatisfactions.length === 0) return 0;
    return (
      filteredSatisfactions.filter((s) => s.rating >= 4).length /
      filteredSatisfactions.length
    );
  }, [filteredSatisfactions]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    filteredSatisfactions.forEach((s) => {
      dist[s.rating - 1]++;
    });
    return [5, 4, 3, 2, 1].map((rating) => ({
      name: `${rating} 星`,
      value: dist[rating - 1],
      fill: rating >= 4 ? '#10b981' : rating >= 3 ? '#f59e0b' : '#ef4444',
    }));
  }, [filteredSatisfactions]);

  const improvementComparison = useMemo(() => {
    const withImprovement = filteredSatisfactions.filter(
      (s) => s.followUpRating && s.improvementMeasures
    );
    return withImprovement.map((s) => ({
      name: s.clientName,
      初始评分: s.rating,
      跟进评分: s.followUpRating || 0,
      improvement: s.improvementMeasures,
    }));
  }, [filteredSatisfactions]);

  const trend = avgFollowUpRating > 0 ? ((avgFollowUpRating - avgRating) / avgRating) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            客户满意度复盘
          </h1>
          <p className="mt-1 text-slate-500">
            追踪客户满意度变化，评估改进措施效果
          </p>
        </div>
        <ExportButtons data={filteredHearings} title="客户满意度复盘" />
      </div>

      <FilterBar />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">平均满意度</p>
                <p className="mt-1 font-display text-3xl font-bold text-slate-900">
                  {avgRating.toFixed(1)}
                  <span className="text-sm font-normal text-slate-500"> /5</span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white">
                <Smile className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">满意率</p>
                <p className="mt-1 font-display text-3xl font-bold text-slate-900">
                  {formatPercentage(satisfactionRate)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">跟进后评分</p>
                <p className="mt-1 font-display text-3xl font-bold text-slate-900">
                  {avgFollowUpRating.toFixed(1)}
                  <span className="text-sm font-normal text-slate-500"> /5</span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">改善趋势</p>
                <p className="mt-1 flex items-center gap-1 font-display text-3xl font-bold text-slate-900">
                  {trend > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : trend < 0 ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : null}
                  {trend > 0 ? '+' : ''}
                  {trend.toFixed(1)}
                  <span className="text-sm font-normal text-slate-500">%</span>
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${
                  trend >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {trend >= 0 ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <TrendingDown className="h-6 w-6" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5 text-primary-500" />
              满意度趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SatisfactionTrendChart
              data={filteredSatisfactions}
              showFollowUp
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary-500" />
              评分分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={ratingDistribution} height={300} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary-500" />
            改进措施效果追踪
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="h-12 px-4 text-left font-medium text-slate-500">
                    客户
                  </th>
                  <th className="h-12 px-4 text-left font-medium text-slate-500">
                    案件
                  </th>
                  <th className="h-12 px-4 text-left font-medium text-slate-500">
                    初始评分
                  </th>
                  <th className="h-12 px-4 text-left font-medium text-slate-500">
                    跟进评分
                  </th>
                  <th className="h-12 px-4 text-left font-medium text-slate-500">
                    变化
                  </th>
                  <th className="h-12 px-4 text-left font-medium text-slate-500">
                    改进措施
                  </th>
                  <th className="h-12 px-4 text-left font-medium text-slate-500">
                    调查日期
                  </th>
                </tr>
              </thead>
              <tbody>
                {improvementComparison.map((item, index) => {
                  const diff = item.跟进评分 - item.初始评分;
                  return (
                    <tr
                      key={index}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50 cursor-pointer"
                      onClick={() =>
                        setSelectedSatisfaction(
                          filteredSatisfactions.find(
                            (s) => s.clientName === item.name
                          ) || null
                        )
                      }
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{item.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">
                          {
                            mockCases.find(
                              (c) =>
                                c.clientName === item.name
                            )?.caseName
                          }
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.初始评分 >= 4 ? 'success' : item.初始评分 >= 3 ? 'warning' : 'danger'}>
                          {item.初始评分} 星
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.跟进评分 >= 4 ? 'success' : item.跟进评分 >= 3 ? 'warning' : 'danger'}>
                          {item.跟进评分} 星
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`flex items-center gap-1 ${
                            diff > 0
                              ? 'text-green-600'
                              : diff < 0
                              ? 'text-red-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {diff > 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : diff < 0 ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : null}
                          {diff > 0 ? '+' : ''}
                          {diff}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="truncate text-slate-600" title={item.improvement}>
                          {item.improvement}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(
                          filteredSatisfactions.find(
                            (s) => s.clientName === item.name
                          )?.surveyDate || new Date()
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary-500" />
            客户反馈详情
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredSatisfactions.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-sm cursor-pointer"
                onClick={() => setSelectedSatisfaction(s)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{s.clientName}</p>
                      <Badge
                        variant={
                          s.rating >= 4
                            ? 'success'
                            : s.rating >= 3
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {s.rating} 星
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {s.feedback || '暂无文字反馈'}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatDateTime(s.surveyDate)}
                    </p>
                  </div>
                  {s.followUpRating && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">跟进评分</p>
                      <p className="font-display text-xl font-bold text-green-600">
                        {s.followUpRating}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedSatisfaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-display text-xl font-semibold text-slate-900">
              满意度详情
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold">
                  {selectedSatisfaction.clientName[0]}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {selectedSatisfaction.clientName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {
                      mockCases.find(
                        (c) => c.id === selectedSatisfaction.caseId
                      )?.caseName
                    }
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">初始评分</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedSatisfaction.rating} / 5
                  </p>
                </div>
                {selectedSatisfaction.followUpRating && (
                  <div>
                    <p className="text-sm font-medium text-slate-600">跟进评分</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedSatisfaction.followUpRating} / 5
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">客户反馈</p>
                <p className="mt-1 text-slate-700">
                  {selectedSatisfaction.feedback || '暂无文字反馈'}
                </p>
              </div>
              {selectedSatisfaction.improvementMeasures && (
                <div>
                  <p className="text-sm font-medium text-slate-600">改进措施</p>
                  <p className="mt-1 text-slate-700">
                    {selectedSatisfaction.improvementMeasures}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedSatisfaction(null)}>关闭</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
