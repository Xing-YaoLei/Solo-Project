import React, { useEffect, useState } from 'react';
import { BarChart3, MapPin, Calendar, Clock, ArrowUpDown, TrendingUp, Download, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import { getReportsByDuration, getReportsByRegion, getReportsByDate, getReportsComparison, getResponsibility, getCategory } from '../services/api';
import type { DurationReport, RegionReport, DateReport, ComparisonReport } from '../types';
import BarChart from '../components/Charts/BarChart';
import PieChart from '../components/Charts/PieChart';
import KPICard from '../components/KPICard';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'duration' | 'region' | 'date' | 'comparison'>('duration');
  const [region, setRegion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [durationData, setDurationData] = useState<DurationReport | null>(null);
  const [regionData, setRegionData] = useState<RegionReport[]>([]);
  const [dateData, setDateData] = useState<DateReport | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonReport | null>(null);
  const [responsibilityData, setResponsibilityData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = region ? { region } : {};
      const [durationRes, regionRes, dateRes, comparisonRes, respRes, catRes] = await Promise.all([
        getReportsByDuration(params),
        getReportsByRegion(),
        getReportsByDate(),
        getReportsComparison(params),
        getResponsibility(params),
        getCategory(params),
      ]);
      setDurationData(durationRes);
      setRegionData(regionRes);
      setDateData(dateRes);
      setComparisonData(comparisonRes);
      setResponsibilityData(respRes);
      setCategoryData(catRes);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [region]);

  const regions = ['全部', '华东区', '华南区', '华北区', '西南区', '西北区', '华中区', '东北区'];

  const durationBarData = durationData ? {
    categories: durationData.regions,
    series: [
      { name: '<1小时', data: durationData.lessThan1h, color: '#22c55e' },
      { name: '1-3小时', data: durationData.between1_3h, color: '#84cc16' },
      { name: '3-12小时', data: durationData.between3_12h, color: '#eab308' },
      { name: '12-24小时', data: durationData.between12_24h, color: '#f97316' },
      { name: '>24小时', data: durationData.moreThan24h, color: '#ef4444' },
    ]
  } : null;

  const dateBarData = dateData ? {
    categories: dateData.months,
    series: dateData.series.map((s: any, idx: number) => ({
      ...s,
      color: ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'][idx % 7]
    }))
  } : null;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const getChangeBadge = (curr: number, prev: number, inverse = false) => {
    const change = curr - prev;
    const pct = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
    const isGood = inverse ? change <= 0 : change >= 0;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
        isGood ? 'bg-success-500/20 text-success-400' : 'bg-danger-500/20 text-danger-400'
      }`}>
        <ArrowUpDown className="w-3 h-3" />
        {change >= 0 ? '+' : ''}{change} ({pct >= 0 ? '+' : ''}{pct}%)
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">多维报表分析</h1>
          <p className="text-gray-400">按关闭时长、日期、区域多维度比较分析</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={region}
              onChange={e => setRegion(e.target.value === '全部' ? '' : e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
            >
              {regions.map(r => (
                <option key={r} value={r} className="bg-slate-800">{r}</option>
              ))}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all text-sm">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/10 overflow-x-auto">
        {[
          { id: 'duration', label: '关闭时长分布', icon: <Clock className="w-4 h-4" /> },
          { id: 'region', label: '区域对比分析', icon: <MapPin className="w-4 h-4" /> },
          { id: 'date', label: '时间趋势分析', icon: <Calendar className="w-4 h-4" /> },
          { id: 'comparison', label: '同环比比较', icon: <TrendingUp className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl animate-pulse">加载中...</div>
        </div>
      ) : (
        <>
          {activeTab === 'duration' && durationBarData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  icon={<Clock className="w-6 h-6" />}
                  label="平均处理时长"
                  value={formatDuration(durationData?.avgTimes.reduce((a, b) => a + b, 0) / (durationData?.avgTimes.length || 1) || 0)}
                  change={-5}
                  changeLabel="同比"
                  color="info"
                  loading={false}
                />
                <KPICard
                  icon={<CheckCircle className="w-6 h-6" />}
                  label="<1小时占比"
                  value={`${Math.round((durationData?.lessThan1h.reduce((a, b) => a + b, 0) || 0) / (durationData?.lessThan1h.reduce((a, b) => a + b, 0) + durationData?.between1_3h.reduce((a, b) => a + b, 0) + durationData?.between3_12h.reduce((a, b) => a + b, 0) + durationData?.between12_24h.reduce((a, b) => a + b, 0) + durationData?.moreThan24h.reduce((a, b) => a + b, 0) || 1) * 100)}%`}
                  change={8}
                  changeLabel="同比"
                  color="success"
                  loading={false}
                />
                <KPICard
                  icon={<AlertTriangle className="w-6 h-6" />}
                  label=">24小时占比"
                  value={`${Math.round((durationData?.moreThan24h.reduce((a, b) => a + b, 0) || 0) / (durationData?.lessThan1h.reduce((a, b) => a + b, 0) + durationData?.between1_3h.reduce((a, b) => a + b, 0) + durationData?.between3_12h.reduce((a, b) => a + b, 0) + durationData?.between12_24h.reduce((a, b) => a + b, 0) + durationData?.moreThan24h.reduce((a, b) => a + b, 0) || 1) * 100)}%`}
                  change={-3}
                  changeLabel="同比"
                  color="warning"
                  loading={false}
                />
                <KPICard
                  icon={<BarChart3 className="w-6 h-6" />}
                  label="总样本数"
                  value={durationData?.lessThan1h.reduce((a, b) => a + b, 0) || 0}
                  change={15}
                  changeLabel="同比"
                  color="info"
                  loading={false}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">关闭时长分布（按区域）</h3>
                  <BarChart data={durationBarData} height={400} />
                </div>
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">责任归属</h3>
                    <PieChart data={responsibilityData} height={250} />
                  </div>
                  <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">投诉类型</h3>
                    <PieChart data={categoryData} height={250} />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">详细数据</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-white/10">
                        <th className="pb-3 pr-4">区域</th>
                        <th className="pb-3 pr-4 text-right">总数</th>
                        <th className="pb-3 pr-4 text-right">&lt;1小时</th>
                        <th className="pb-3 pr-4 text-right">1-3小时</th>
                        <th className="pb-3 pr-4 text-right">3-12小时</th>
                        <th className="pb-3 pr-4 text-right">12-24小时</th>
                        <th className="pb-3 pr-4 text-right">&gt;24小时</th>
                        <th className="pb-3 text-right">平均时长</th>
                      </tr>
                    </thead>
                    <tbody>
                      {durationData?.regions.map((r, idx) => (
                        <tr key={r} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 pr-4 text-white font-medium">{r}</td>
                          <td className="py-3 pr-4 text-white text-right">{
                            durationData.lessThan1h[idx] + durationData.between1_3h[idx] +
                            durationData.between3_12h[idx] + durationData.between12_24h[idx] +
                            durationData.moreThan24h[idx]
                          }</td>
                          <td className="py-3 pr-4 text-success-400 text-right">{durationData.lessThan1h[idx]}</td>
                          <td className="py-3 pr-4 text-lime-400 text-right">{durationData.between1_3h[idx]}</td>
                          <td className="py-3 pr-4 text-warning-400 text-right">{durationData.between3_12h[idx]}</td>
                          <td className="py-3 pr-4 text-orange-400 text-right">{durationData.between12_24h[idx]}</td>
                          <td className="py-3 pr-4 text-danger-400 text-right">{durationData.moreThan24h[idx]}</td>
                          <td className="py-3 text-white text-right">{formatDuration(durationData.avgTimes[idx])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'region' && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">区域维度对比</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-white/10">
                        <th className="pb-3 pr-4">区域</th>
                        <th className="pb-3 pr-4 text-right">客诉总数</th>
                        <th className="pb-3 pr-4 text-right">已关闭</th>
                        <th className="pb-3 pr-4 text-right">关闭率</th>
                        <th className="pb-3 pr-4 text-right">超时数</th>
                        <th className="pb-3 pr-4 text-right">超时率</th>
                        <th className="pb-3 pr-4 text-right">满意度</th>
                        <th className="pb-3 text-right">平均处理时长</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionData.map((r, idx) => (
                        <tr key={r.region} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 pr-4 text-white font-medium">{r.region}</td>
                          <td className="py-3 pr-4 text-white text-right">{r.total}</td>
                          <td className="py-3 pr-4 text-success-400 text-right">{r.closed}</td>
                          <td className="py-3 pr-4 text-right">{r.closedRate}%</td>
                          <td className="py-3 pr-4 text-danger-400 text-right">{r.overdue}</td>
                          <td className="py-3 pr-4 text-right">{r.overdueRate}%</td>
                          <td className="py-3 pr-4 text-right">
                            <span className={r.satisfactionRate >= 80 ? 'text-success-400' : r.satisfactionRate >= 60 ? 'text-warning-400' : 'text-danger-400'}>
                              {r.satisfactionRate}%
                            </span>
                          </td>
                          <td className="py-3 text-white text-right">{formatDuration(r.avgProcessingTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">客诉总数排名</h3>
                  <BarChart
                    data={{
                      categories: regionData.map(r => r.region),
                      series: [{ name: '客诉总数', data: regionData.map(r => r.total), color: '#3b82f6' }]
                    }}
                    horizontal
                    height={350}
                  />
                </div>
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">平均处理时长对比</h3>
                  <BarChart
                    data={{
                      categories: regionData.map(r => r.region),
                      series: [{ name: '平均时长(分钟)', data: regionData.map(r => r.avgProcessingTime), color: '#22c55e' }]
                    }}
                    horizontal
                    height={350}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'date' && dateBarData && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">月度趋势（按区域）</h3>
                <BarChart data={dateBarData} height={400} />
              </div>

              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">月度明细</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-white/10">
                        <th className="pb-3 pr-4">月份</th>
                        <th className="pb-3 pr-4">区域</th>
                        <th className="pb-3 pr-4 text-right">总数</th>
                        <th className="pb-3 pr-4 text-right">超时数</th>
                        <th className="pb-3 pr-4 text-right">升级数</th>
                        <th className="pb-3 text-right">平均时长</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateData?.rawData.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 pr-4 text-white">{item.month}</td>
                          <td className="py-3 pr-4 text-gray-300">{item.region}</td>
                          <td className="py-3 pr-4 text-white text-right">{item.total}</td>
                          <td className="py-3 pr-4 text-danger-400 text-right">{item.overdue}</td>
                          <td className="py-3 pr-4 text-warning-400 text-right">{item.escalated}</td>
                          <td className="py-3 text-white text-right">{formatDuration(item.avg_time || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && comparisonData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-6 rounded-xl">
                  <h4 className="text-sm text-gray-400 mb-1">本期</h4>
                  <p className="text-white text-xs">{new Date(comparisonData.period1.start).toLocaleDateString('zh-CN')} - {new Date(comparisonData.period1.end).toLocaleDateString('zh-CN')}</p>
                </div>
                <div className="glass-card p-6 rounded-xl">
                  <h4 className="text-sm text-gray-400 mb-1">上期</h4>
                  <p className="text-white text-xs">{new Date(comparisonData.period2.start).toLocaleDateString('zh-CN')} - {new Date(comparisonData.period2.end).toLocaleDateString('zh-CN')}</p>
                </div>
                <div className="glass-card p-6 rounded-xl border-l-4 border-primary-500">
                  <h4 className="text-sm text-gray-400 mb-1">对比说明</h4>
                  <p className="text-white text-xs">本期数据与上期环比对比分析</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  icon={<BarChart3 className="w-6 h-6" />}
                  label="客诉总数"
                  value={comparisonData.period1.total}
                  change={comparisonData.period1.total - comparisonData.period2.total}
                  changeLabel="环比"
                  color="warning"
                  loading={false}
                />
                <KPICard
                  icon={<CheckCircle className="w-6 h-6" />}
                  label="关闭率"
                  value={`${comparisonData.period1.closedRate}%`}
                  change={comparisonData.period1.closedRate - comparisonData.period2.closedRate}
                  changeLabel="环比"
                  color="success"
                  loading={false}
                />
                <KPICard
                  icon={<AlertTriangle className="w-6 h-6" />}
                  label="超时率"
                  value={`${comparisonData.period1.overdueRate}%`}
                  change={comparisonData.period1.overdueRate - comparisonData.period2.overdueRate}
                  changeLabel="环比"
                  color="danger"
                  loading={false}
                />
                <KPICard
                  icon={<Clock className="w-6 h-6" />}
                  label="平均处理时长"
                  value={formatDuration(comparisonData.period1.avgProcessingTime)}
                  change={comparisonData.period1.avgProcessingTime - comparisonData.period2.avgProcessingTime}
                  changeLabel="环比分钟"
                  color="info"
                  loading={false}
                />
              </div>

              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">详细对比</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-white/10">
                        <th className="pb-3 pr-4">指标</th>
                        <th className="pb-3 pr-4 text-right">本期</th>
                        <th className="pb-3 pr-4 text-right">上期</th>
                        <th className="pb-3 text-right">变化</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 pr-4 text-white">客诉总数</td>
                        <td className="py-3 pr-4 text-white text-right font-medium">{comparisonData.period1.total}</td>
                        <td className="py-3 pr-4 text-gray-400 text-right">{comparisonData.period2.total}</td>
                        <td className="py-3 text-right">{getChangeBadge(comparisonData.period1.total, comparisonData.period2.total, true)}</td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 pr-4 text-white">已关闭</td>
                        <td className="py-3 pr-4 text-success-400 text-right font-medium">{comparisonData.period1.closed}</td>
                        <td className="py-3 pr-4 text-gray-400 text-right">{comparisonData.period2.closed}</td>
                        <td className="py-3 text-right">{getChangeBadge(comparisonData.period1.closed, comparisonData.period2.closed)}</td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 pr-4 text-white">关闭率</td>
                        <td className="py-3 pr-4 text-white text-right font-medium">{comparisonData.period1.closedRate}%</td>
                        <td className="py-3 pr-4 text-gray-400 text-right">{comparisonData.period2.closedRate}%</td>
                        <td className="py-3 text-right">{getChangeBadge(comparisonData.period1.closedRate, comparisonData.period2.closedRate)}</td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 pr-4 text-white">超时数</td>
                        <td className="py-3 pr-4 text-danger-400 text-right font-medium">{comparisonData.period1.overdue}</td>
                        <td className="py-3 pr-4 text-gray-400 text-right">{comparisonData.period2.overdue}</td>
                        <td className="py-3 text-right">{getChangeBadge(comparisonData.period1.overdue, comparisonData.period2.overdue, true)}</td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 pr-4 text-white">超时率</td>
                        <td className="py-3 pr-4 text-danger-400 text-right font-medium">{comparisonData.period1.overdueRate}%</td>
                        <td className="py-3 pr-4 text-gray-400 text-right">{comparisonData.period2.overdueRate}%</td>
                        <td className="py-3 text-right">{getChangeBadge(comparisonData.period1.overdueRate, comparisonData.period2.overdueRate, true)}</td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 pr-4 text-white">升级数</td>
                        <td className="py-3 pr-4 text-warning-400 text-right font-medium">{comparisonData.period1.escalated}</td>
                        <td className="py-3 pr-4 text-gray-400 text-right">{comparisonData.period2.escalated}</td>
                        <td className="py-3 text-right">{getChangeBadge(comparisonData.period1.escalated, comparisonData.period2.escalated, true)}</td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 pr-4 text-white">平均处理时长</td>
                        <td className="py-3 pr-4 text-white text-right font-medium">{formatDuration(comparisonData.period1.avgProcessingTime)}</td>
                        <td className="py-3 pr-4 text-gray-400 text-right">{formatDuration(comparisonData.period2.avgProcessingTime)}</td>
                        <td className="py-3 text-right">{getChangeBadge(comparisonData.period1.avgProcessingTime, comparisonData.period2.avgProcessingTime, true)}</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="py-3 pr-4 text-white">客户满意度</td>
                        <td className="py-3 pr-4 text-success-400 text-right font-medium">{comparisonData.period1.satisfactionRate}%</td>
                        <td className="py-3 pr-4 text-gray-400 text-right">{comparisonData.period2.satisfactionRate}%</td>
                        <td className="py-3 text-right">{getChangeBadge(comparisonData.period1.satisfactionRate, comparisonData.period2.satisfactionRate)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
