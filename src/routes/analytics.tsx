import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Clock, AlertTriangle, Package, User, MapPin, Filter, Download } from 'lucide-react';
import { EChart } from '@/components/EChart';
import { api } from '@/services/api';
import type { TurnoverAnalysis, TrendData } from '@/types';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [turnoverAnalysis, setTurnoverAnalysis] = useState<TurnoverAnalysis[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDimension, setActiveDimension] = useState<'material' | 'region' | 'person'>('material');
  const [dateRange, setDateRange] = useState<'7' | '14' | '30' | '90'>('30');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analysisData, trend] = await Promise.all([
        api.getTurnoverAnalysis(),
        api.getTrendData(),
      ]);
      setTurnoverAnalysis(analysisData);
      setTrendData(trend);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalysis = turnoverAnalysis.filter(a => a.dimension === activeDimension);

  const overallStats = {
    avgTurnover: filteredAnalysis.length > 0 
      ? Math.round(filteredAnalysis.reduce((sum, a) => sum + a.avgTurnoverDays, 0) / filteredAnalysis.length * 10) / 10
      : 0,
    totalBatches: filteredAnalysis.reduce((sum, a) => sum + a.totalBatches, 0),
    totalShortages: filteredAnalysis.reduce((sum, a) => sum + a.shortageCount, 0),
    avgComparison: filteredAnalysis.length > 0
      ? Math.round(filteredAnalysis.reduce((sum, a) => sum + a.comparisonLastPeriod, 0) / filteredAnalysis.length * 10) / 10
      : 0,
  };

  const getTrendOption = () => {
    const days = parseInt(dateRange);
    const data = trendData.slice(-days);
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        formatter: (params: any) => {
          const date = params[0].axisValue;
          let html = `<div class="font-medium mb-1">${date}</div>`;
          params.forEach((p: any) => {
            html += `<div class="flex items-center gap-2">
              <span style="background:${p.color};width:8px;height:8px;border-radius:50%;display:inline-block;"></span>
              <span>${p.seriesName}: ${p.value}${p.seriesName.includes('周转') ? ' 天' : ''}</span>
            </div>`;
          });
          return html;
        }
      },
      legend: {
        data: ['周转天数', '短缺频次'],
        top: 0,
        right: 0,
        textStyle: { fontSize: 12, color: '#6b7280' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map(d => d.date.slice(5)),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          name: '周转天数',
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#9ca3af', fontSize: 11 },
          splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
        },
        {
          type: 'value',
          name: '短缺频次',
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#9ca3af', fontSize: 11 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '周转天数',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#1e40af' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(30, 64, 175, 0.25)' },
                { offset: 1, color: 'rgba(30, 64, 175, 0.02)' },
              ],
            },
          },
          data: data.map(d => Math.round(d.turnoverDays * 10) / 10),
        },
        {
          name: '短缺频次',
          type: 'bar',
          yAxisIndex: 1,
          itemStyle: { 
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#ea580c' },
                { offset: 1, color: '#fb923c' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '40%',
          data: data.map(d => d.shortageCount),
        },
      ],
    };
  };

  const getDimensionChartOption = () => {
    const sortedData = [...filteredAnalysis].sort((a, b) => b.avgTurnoverDays - a.avgTurnoverDays);
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        axisPointer: { type: 'shadow' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: sortedData.map(d => d.name),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#374151', fontSize: 12 },
      },
      series: [
        {
          type: 'bar',
          barWidth: '60%',
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: (params: any) => {
              const value = params.value;
              if (value > 25) return '#dc2626';
              if (value > 20) return '#ea580c';
              if (value > 15) return '#059669';
              return '#1e40af';
            },
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c} 天',
            color: '#374151',
            fontSize: 12,
            fontWeight: 500,
          },
          data: sortedData.map(d => d.avgTurnoverDays),
        },
      ],
    };
  };

  const getDistributionOption = () => {
    const materialData = turnoverAnalysis.filter(a => a.dimension === 'material');
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        formatter: '{b}: {c} 批次 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { fontSize: 12, color: '#6b7280' },
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          labelLine: { show: false },
          data: materialData.map((d, i) => ({
            value: d.totalBatches,
            name: d.name,
            itemStyle: {
              color: ['#1e40af', '#059669', '#ea580c', '#7c3aed', '#0891b2'][i % 5],
            },
          })),
        },
      ],
    };
  };

  const dimensionTabs = [
    { key: 'material', label: '按材料', icon: Package },
    { key: 'region', label: '按区域', icon: MapPin },
    { key: 'person', label: '按负责人', icon: User },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">复盘分析</h1>
          <p className="text-gray-500 mt-1">围绕周转天数展开多维度数据分析</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="input w-auto"
          >
            <option value="7">近7天</option>
            <option value="14">近14天</option>
            <option value="30">近30天</option>
            <option value="90">近90天</option>
          </select>
          <button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            导出报告
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">平均周转天数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{overallStats.avgTurnover}</p>
              <div className={cn(
                'flex items-center gap-1 text-sm mt-1',
                overallStats.avgComparison < 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {overallStats.avgComparison < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                较上期 {overallStats.avgComparison > 0 ? '+' : ''}{overallStats.avgComparison} 天
              </div>
            </div>
            <div className="p-2 bg-primary-50 rounded-lg">
              <Clock className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">总批次数量</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{overallStats.totalBatches}</p>
              <p className="text-xs text-gray-400 mt-1">统计周期内</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">短缺次数</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{overallStats.totalShortages}</p>
              <p className="text-xs text-gray-400 mt-1">
                短缺率 {overallStats.totalBatches > 0 
                  ? Math.round(overallStats.totalShortages / overallStats.totalBatches * 100)
                  : 0}%
              </p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">周转效率</p>
              <p className={cn(
                'text-2xl font-bold mt-1',
                overallStats.avgTurnover <= 15 ? 'text-green-600' :
                overallStats.avgTurnover <= 25 ? 'text-blue-600' : 'text-orange-600'
              )}>
                {overallStats.avgTurnover <= 15 ? '优秀' :
                 overallStats.avgTurnover <= 25 ? '良好' : '待优化'}
              </p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    overallStats.avgTurnover <= 15 ? 'bg-green-500' :
                    overallStats.avgTurnover <= 25 ? 'bg-blue-500' : 'bg-orange-500'
                  )}
                  style={{ width: `${Math.min(100, (30 - overallStats.avgTurnover) / 30 * 100)}%` }}
                />
              </div>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">周转天数趋势</h3>
            <p className="text-sm text-gray-500 mt-1">近{dateRange}天周转天数与短缺频次对比</p>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">趋势分析</span>
          </div>
        </div>
        {loading ? (
          <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <EChart option={getTrendOption()} style={{ height: '320px' }} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">维度对比分析</h3>
              <p className="text-sm text-gray-500 mt-1">不同维度的平均周转天数对比</p>
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            {dimensionTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveDimension(tab.key as typeof activeDimension)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeDimension === tab.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <EChart option={getDimensionChartOption()} style={{ height: '320px' }} />
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">材料批次分布</h3>
              <p className="text-sm text-gray-500 mt-1">各材料品类的批次占比</p>
            </div>
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">分布分析</span>
            </div>
          </div>
          {loading ? (
            <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <EChart option={getDistributionOption()} style={{ height: '320px' }} />
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">详细分析报表</h3>
            <p className="text-sm text-gray-500 mt-1">各维度周转天数详细数据</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">按 {activeDimension === 'material' ? '材料' : activeDimension === 'region' ? '区域' : '负责人'} 统计</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-header">
                  {activeDimension === 'material' ? '材料名称' : activeDimension === 'region' ? '区域' : '负责人'}
                </th>
                <th className="table-header">平均周转天数</th>
                <th className="table-header">总批次</th>
                <th className="table-header">短缺次数</th>
                <th className="table-header">较上期变化</th>
                <th className="table-header">周转效率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="h-5 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                [...filteredAnalysis].sort((a, b) => b.avgTurnoverDays - a.avgTurnoverDays).map((item, index) => (
                  <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-medium text-gray-900">{item.name}</td>
                    <td className="table-cell">
                      <span className={cn(
                        'font-bold text-lg',
                        item.avgTurnoverDays > 25 ? 'text-red-600' :
                        item.avgTurnoverDays > 20 ? 'text-orange-600' :
                        item.avgTurnoverDays > 15 ? 'text-blue-600' : 'text-green-600'
                      )}>
                        {item.avgTurnoverDays}
                      </span>
                      <span className="text-gray-400 text-sm ml-1">天</span>
                    </td>
                    <td className="table-cell text-gray-600">{item.totalBatches}</td>
                    <td className="table-cell">
                      {item.shortageCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          {item.shortageCount}
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">0</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={cn(
                        'inline-flex items-center gap-1 font-medium',
                        item.comparisonLastPeriod < 0 ? 'text-green-600' : 
                        item.comparisonLastPeriod > 0 ? 'text-red-600' : 'text-gray-500'
                      )}>
                        {item.comparisonLastPeriod < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : item.comparisonLastPeriod > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : null}
                        {item.comparisonLastPeriod > 0 ? '+' : ''}{item.comparisonLastPeriod} 天
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                        item.avgTurnoverDays <= 15 ? 'bg-green-100 text-green-700' :
                        item.avgTurnoverDays <= 20 ? 'bg-blue-100 text-blue-700' :
                        item.avgTurnoverDays <= 25 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      )}>
                        {item.avgTurnoverDays <= 15 ? '优秀' :
                         item.avgTurnoverDays <= 20 ? '良好' :
                         item.avgTurnoverDays <= 25 ? '一般' : '待优化'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
