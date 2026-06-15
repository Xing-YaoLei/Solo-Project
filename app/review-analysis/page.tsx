'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileCheck,
  AlertTriangle,
  PieChart,
  ArrowRight,
  Filter,
  Database,
  RefreshCw,
  Building2,
} from 'lucide-react';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import ReviewTrendChart from '@/components/charts/ReviewTrendChart';
import MaterialGapChart from '@/components/charts/MaterialGapChart';
import {
  getTrendData,
  getMaterialGapData,
  getReviewReasonData,
} from '@/lib/mockData';
import type { MultiSourceData, TrendDataPoint, MaterialGapData, ReviewReasonData } from '@/types';
import clsx from 'clsx';

const COLORS = ['#2d5a87', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];

export default function ReviewAnalysisPage() {
  const [selectedSource, setSelectedSource] = useState<'all' | 'inconsistent'>('all');
  const [selectedCollege, setSelectedCollege] = useState<string>('all');
  const [dataSourceMode, setDataSourceMode] = useState<'mock' | 'prisma'>('mock');
  const [colleges, setColleges] = useState<string[]>([]);

  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [multiSourceData, setMultiSourceData] = useState<MultiSourceData[]>([]);
  const [materialGapData, setMaterialGapData] = useState<MaterialGapData[]>([]);
  const [reviewReasonData, setReviewReasonData] = useState<ReviewReasonData[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMultiSourceData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (selectedSource === 'inconsistent') params.set('inconsistent', 'true');
      if (selectedCollege !== 'all') params.set('college', selectedCollege);

      const res = await fetch(`/api/multi-source?${params.toString()}`);
      if (!res.ok) throw new Error(`API 返回 ${res.status}`);

      const json = await res.json();
      setMultiSourceData(json.multiSourceData);
      setColleges(json.colleges);
      setDataSourceMode(json.mode);
    } catch (e) {
      console.error('加载三源对照数据失败:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSource, selectedCollege]);

  useEffect(() => {
    setTrendData(getTrendData());
    setMaterialGapData(getMaterialGapData());
    setReviewReasonData(getReviewReasonData());
    loadMultiSourceData();
  }, [loadMultiSourceData]);

  const handleRefresh = () => {
    loadMultiSourceData(true);
  };

  const inconsistentCount = multiSourceData.filter(d => !d.isConsistent).length;

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">正在加载成绩复核分析数据...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gray-900 mb-2">
            成绩复核分析
          </h1>
          <p className="text-gray-500">
            多源数据对照分析、材料缺失缺口、复核原因分布
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium',
            dataSourceMode === 'prisma'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          )}>
            <Database className="w-4 h-4" />
            <span>
              数据源: {dataSourceMode === 'prisma' ? 'Prisma/PostgreSQL' : '内置 Mock 数据'}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all text-xs font-medium"
          >
            <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
            {refreshing ? '刷新中...' : '刷新数据'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-gray-500">总对照记录</span>
          </div>
          <div className="text-2xl font-bold font-mono text-gray-900">{multiSourceData.length}</div>
        </div>
        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">不一致记录</span>
          </div>
          <div className="text-2xl font-bold font-mono text-red-600">{inconsistentCount}</div>
        </div>
        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-gray-500">一致率</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {multiSourceData.length > 0
              ? (((multiSourceData.length - inconsistentCount) / multiSourceData.length) * 100).toFixed(1)
              : '0.0'}%
          </div>
        </div>
      </div>

      <div className="card-gradient p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">复核申请趋势</h2>
            <p className="text-sm text-gray-500">含材料缺失缺口标注与异常点分析</p>
          </div>
        </div>
        <ReviewTrendChart data={trendData} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="card-gradient p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">复核原因分布</h2>
              <p className="text-sm text-gray-500">按复核申请原因统计</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={reviewReasonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  animationDuration={1500}
                  label={({ reason, percent }) => `${reason} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                >
                  {reviewReasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="custom-tooltip">
                          <p className="font-semibold text-gray-900 mb-1">{data.reason}</p>
                          <div className="text-sm">
                            <span className="text-gray-500">数量: </span>
                            <span className="font-mono font-medium">{data.count}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">占比: </span>
                            <span className="font-mono font-medium">{data.percentage}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {reviewReasonData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-gray-600">{item.reason}</span>
                <span className="font-mono text-gray-900 ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-gradient p-6">
          <MaterialGapChart data={materialGapData} />
        </div>
      </div>

      <div className="card-gradient p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">多源数据对照</h2>
            <p className="text-sm text-gray-500">
              学生申请表、一卡通版本、教务库口径三方数据对照
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="all">全部学院</option>
                {colleges.map(college => (
                  <option key={college} value={college}>{college}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedSource('all')}
                  className={clsx(
                    'px-3 py-1 text-xs font-medium rounded-md transition-all',
                    selectedSource === 'all'
                      ? 'bg-white shadow text-primary-700'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  全部
                </button>
                <button
                  onClick={() => setSelectedSource('inconsistent')}
                  className={clsx(
                    'px-3 py-1 text-xs font-medium rounded-md transition-all',
                    selectedSource === 'inconsistent'
                      ? 'bg-white shadow text-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  不一致 ({inconsistentCount})
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-header">学生信息</th>
                <th className="table-header text-center" colSpan={2}>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    学生申请表
                  </div>
                </th>
                <th className="table-header text-center" colSpan={2}>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    一卡通版本
                  </div>
                </th>
                <th className="table-header text-center" colSpan={2}>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    教务库口径
                  </div>
                </th>
                <th className="table-header text-center">一致性</th>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="table-header"></th>
                <th className="table-header text-center text-xs">成绩</th>
                <th className="table-header text-center text-xs">状态</th>
                <th className="table-header text-center text-xs">成绩</th>
                <th className="table-header text-center text-xs">状态</th>
                <th className="table-header text-center text-xs">成绩</th>
                <th className="table-header text-center text-xs">状态</th>
                <th className="table-header text-center"></th>
              </tr>
            </thead>
            <tbody>
              {multiSourceData.map((row, idx) => (
                <tr key={row.studentId} className={clsx(
                  'table-row',
                  idx % 2 === 1 && 'table-row-alt',
                  !row.isConsistent && 'bg-red-50/30'
                )}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 text-sm font-bold">
                        {row.studentName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{row.studentName}</div>
                        <div className="text-xs text-gray-500 font-mono">{row.studentNo}</div>
                      </div>
                    </div>
                  </td>
                  <td className={clsx(
                    'table-cell text-center font-mono',
                    !row.isConsistent && row.inconsistencyFields.includes('成绩') && 'inconsistent-cell'
                  )}>
                    {row.application.score}
                  </td>
                  <td className={clsx(
                    'table-cell text-center',
                    !row.isConsistent && row.inconsistencyFields.includes('状态') && 'inconsistent-cell'
                  )}>
                    <span className="text-xs text-gray-600">{row.application.status}</span>
                  </td>
                  <td className={clsx(
                    'table-cell text-center font-mono',
                    row.campusCard.score !== row.application.score && 'inconsistent-cell'
                  )}>
                    {row.campusCard.score}
                    {row.campusCard.score !== row.application.score && (
                      <ArrowRight className="inline w-3 h-3 ml-1 text-red-500" />
                    )}
                  </td>
                  <td className="table-cell text-center">
                    <span className="text-xs text-gray-600">{row.campusCard.status}</span>
                  </td>
                  <td className={clsx(
                    'table-cell text-center font-mono',
                    row.academicSystem.score !== row.application.score && 'inconsistent-cell'
                  )}>
                    {row.academicSystem.score}
                    {row.academicSystem.score !== row.application.score && (
                      <ArrowRight className="inline w-3 h-3 ml-1 text-red-500" />
                    )}
                  </td>
                  <td className="table-cell text-center">
                    <span className="text-xs text-gray-600">{row.academicSystem.status}</span>
                  </td>
                  <td className="table-cell text-center">
                    {row.isConsistent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                        ✓ 一致
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium animate-breathe">
                        <AlertTriangle className="w-3 h-3" />
                        不一致
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {multiSourceData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无符合筛选条件的数据</p>
            <p className="text-xs mt-1 text-gray-400">请尝试切换筛选条件或检查数据源配置</p>
          </div>
        )}

        {inconsistentCount > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100 animate-fade-in">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">发现 {inconsistentCount} 条数据不一致记录</p>
                <p className="text-xs text-red-600">
                  红色闪烁单元格表示该字段在不同数据源中存在差异。请重点关注这些记录并进行人工核对。
                </p>
              </div>
            </div>
          </div>
        )}

        {dataSourceMode === 'mock' && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2">
            <Database className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-medium mb-0.5">当前使用内置模拟数据</p>
              <p>
                如需连接真实 PostgreSQL/Supabase 数据库，请在 <code className="bg-amber-100 px-1 rounded">.env.local</code> 中配置：
                <br />1. <code className="bg-amber-100 px-1 rounded">DATABASE_URL</code> 指向您的 PostgreSQL
                <br />2. <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_DATA_SOURCE=prisma</code> 启用 Prisma 模式
                <br />然后运行 <code className="bg-amber-100 px-1 rounded">npm run prisma:generate &amp;&amp; npm run prisma:push &amp;&amp; npm run prisma:seed</code>
              </p>
            </div>
          </div>
        )}

        {dataSourceMode === 'prisma' && (
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-start gap-2">
            <Database className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800">
              <p className="font-medium mb-0.5">已连接 Prisma/PostgreSQL 数据源</p>
              <p>
                三源对照数据来自数据库中的 <code className="bg-emerald-100 px-1 rounded">DataVersion</code> 表，
                对照记录由 <code className="bg-emerald-100 px-1 rounded">seed.ts</code> 初始化生成。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
