import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { mockDailyMetrics, mockResponsibleMetrics } from '@/data/mockData';
import { useAppStore } from '@/store/useAppStore';
import type { ReportFilter } from '@/types';

type Dimension = ReportFilter['dimension'];

const dimensionLabels: Record<Dimension, string> = {
  on_time_rate: '准时率',
  date: '日期',
  responsible: '负责人',
};

const groupByLabels: Record<ReportFilter['groupBy'], string> = {
  day: '日',
  week: '周',
  month: '月',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-800 border border-navy-700/50 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-gray-300 text-xs mb-1 font-mono-data">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: <span className="font-mono-data">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-800 border border-navy-700/50 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-gray-300 text-xs mb-1 font-mono-data">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: <span className="font-mono-data">{entry.value}%</span>
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const currentUser = useAppStore((s) => s.currentUser);

  const [dimension, setDimension] = useState<Dimension>('on_time_rate');
  const [dateRange, setDateRange] = useState({ start: '2026-06-12', end: '2026-06-18' });
  const [groupBy, setGroupBy] = useState<ReportFilter['groupBy']>('day');
  const [responsibleId, setResponsibleId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [drillDownPerson, setDrillDownPerson] = useState<string>('');

  const filteredDailyMetrics = useMemo(() => {
    return mockDailyMetrics.filter((m) => m.date >= dateRange.start && m.date <= dateRange.end);
  }, [dateRange]);

  const summaryMetrics = useMemo(() => {
    const total = filteredDailyMetrics.reduce((s, m) => s + m.total, 0);
    const onTime = filteredDailyMetrics.reduce((s, m) => s + m.onTime, 0);
    const delayed = filteredDailyMetrics.reduce((s, m) => s + m.delayed, 0);
    const rate = total > 0 ? ((onTime / total) * 100) : 0;
    return { total, onTime, delayed, rate };
  }, [filteredDailyMetrics]);

  const trendData = useMemo(() => {
    return filteredDailyMetrics.map((m) => ({
      date: m.date.slice(5),
      onTimeRate: +((m.onTime / m.total) * 100).toFixed(1),
    }));
  }, [filteredDailyMetrics]);

  const personDailyMetrics = useMemo(() => {
    if (!drillDownPerson) return filteredDailyMetrics;
    return filteredDailyMetrics.map((m) => ({
      ...m,
      total: Math.round(m.total * 0.4),
      onTime: Math.round(m.onTime * 0.4),
      delayed: Math.round(m.delayed * 0.4),
    }));
  }, [filteredDailyMetrics, drillDownPerson]);

  const isExportDisabled = currentUser.role === 'tenant';
  const exportTooltip = isExportDisabled ? '无导出权限' : '';
  const shouldMaskCost = currentUser.role === 'maintenance';
  const shouldHideCost = currentUser.role === 'tenant';

  const handleBarClick = (data: any) => {
    if (data?.date) {
      setSelectedDate(data.date.length < 10 ? `2026-${data.date}` : data.date);
      setDimension('date');
    }
  };

  const handlePersonDrillDown = (name: string) => {
    setDrillDownPerson(name);
  };

  const handleExport = () => {
    if (isExportDisabled) return;
  };

  const renderBreadcrumb = (segments: string[]) => (
    <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-600">/</span>}
          <span className={i === segments.length - 1 ? 'text-amber-500 font-medium' : ''}>{seg}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="p-4 h-full overflow-y-auto scrollbar-thin">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading font-bold text-white text-lg">报表分析</h1>
      </div>

      <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-navy-900 rounded-lg p-1">
            {(Object.keys(dimensionLabels) as Dimension[]).map((dim) => (
              <button
                key={dim}
                onClick={() => {
                  setDimension(dim);
                  if (dim !== 'date') setSelectedDate('');
                  if (dim !== 'responsible') setDrillDownPerson('');
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  dimension === dim
                    ? 'bg-amber-500 text-navy-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {dimensionLabels[dim]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="bg-navy-900 border border-navy-700/50 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500/50"
            />
            <span className="text-gray-500 text-xs">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="bg-navy-900 border border-navy-700/50 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as ReportFilter['groupBy'])}
            className="bg-navy-900 border border-navy-700/50 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500/50"
          >
            {Object.entries(groupByLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={responsibleId}
            onChange={(e) => setResponsibleId(e.target.value)}
            className="bg-navy-900 border border-navy-700/50 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500/50"
          >
            <option value="">全部负责人</option>
            {mockResponsibleMetrics.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          <div className="ml-auto relative group">
            <button
              onClick={handleExport}
              disabled={isExportDisabled}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isExportDisabled
                  ? 'bg-navy-700 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-500 text-navy-900 hover:bg-amber-400'
              }`}
            >
              导出
            </button>
            {isExportDisabled && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-navy-700 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {exportTooltip}
              </div>
            )}
          </div>
        </div>
      </div>

      {dimension === 'on_time_rate' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4">
              <p className="text-xs text-gray-400 mb-1">总工单数</p>
              <p className="font-mono-data text-2xl font-bold text-white">{summaryMetrics.total}</p>
            </div>
            <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4">
              <p className="text-xs text-gray-400 mb-1">准时率</p>
              <div className="flex items-center gap-2">
                <p className="font-mono-data text-2xl font-bold text-amber-500">
                  {summaryMetrics.rate.toFixed(1)}%
                </p>
                {summaryMetrics.rate >= 80 ? (
                  <span className="text-status-success text-xs">↑</span>
                ) : (
                  <span className="text-status-danger text-xs">↓</span>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4">
              <p className="text-xs text-gray-400 mb-1">延误数</p>
              <p className="font-mono-data text-2xl font-bold text-status-danger">{summaryMetrics.delayed}</p>
            </div>
          </div>

          <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4">
            <h2 className="font-heading font-semibold text-white text-sm mb-3">工单完成趋势</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={filteredDailyMetrics} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="#253A5E" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                <Bar dataKey="total" name="总数" fill="#3D5A86" radius={[2, 2, 0, 0]} cursor="pointer" />
                <Bar dataKey="onTime" name="准时" fill="#2ECC71" radius={[2, 2, 0, 0]} cursor="pointer" />
                <Bar dataKey="delayed" name="延误" fill="#E74C3C" radius={[2, 2, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {dimension === 'date' && (
        <>
          {renderBreadcrumb(['报表', '日期', selectedDate || '全部'])}

          <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 mb-4">
            <h2 className="font-heading font-semibold text-white text-sm mb-3">
              {selectedDate ? `${selectedDate} 工单分布` : '工单分布'}
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={selectedDate ? filteredDailyMetrics.filter((m) => m.date === selectedDate) : filteredDailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#253A5E" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                <Bar dataKey="total" name="总数" fill="#3D5A86" radius={[2, 2, 0, 0]} />
                <Bar dataKey="onTime" name="准时" fill="#2ECC71" radius={[2, 2, 0, 0]} />
                <Bar dataKey="delayed" name="延误" fill="#E74C3C" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 mb-4">
            <h2 className="font-heading font-semibold text-white text-sm mb-3">准时率趋势</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#253A5E" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} domain={[60, 100]} />
                <Tooltip content={<CustomLineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="onTimeRate"
                  name="准时率"
                  stroke="#E8A838"
                  strokeWidth={2}
                  dot={{ fill: '#E8A838', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4">
            <h2 className="font-heading font-semibold text-white text-sm mb-3">每日明细</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-navy-700/50">
                    <th className="text-left py-2.5 px-3 font-medium">日期</th>
                    <th className="text-right py-2.5 px-3 font-medium">总数</th>
                    <th className="text-right py-2.5 px-3 font-medium">准时</th>
                    <th className="text-right py-2.5 px-3 font-medium">延误</th>
                    <th className="text-right py-2.5 px-3 font-medium">准时率</th>
                    {!shouldHideCost && (
                      <th className="text-right py-2.5 px-3 font-medium">费用</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredDailyMetrics.map((m) => (
                    <tr key={m.date} className="border-b border-navy-700/30 hover:bg-navy-700/20">
                      <td className="py-2.5 px-3 font-mono-data text-gray-200">{m.date}</td>
                      <td className="py-2.5 px-3 font-mono-data text-gray-300 text-right">{m.total}</td>
                      <td className="py-2.5 px-3 font-mono-data text-status-success text-right">{m.onTime}</td>
                      <td className="py-2.5 px-3 font-mono-data text-status-danger text-right">{m.delayed}</td>
                      <td className="py-2.5 px-3 font-mono-data text-right">
                        <span className={((m.onTime / m.total) * 100) >= 80 ? 'text-status-success' : 'text-status-danger'}>
                          {((m.onTime / m.total) * 100).toFixed(1)}%
                        </span>
                      </td>
                      {!shouldHideCost && (
                        <td className="py-2.5 px-3 font-mono-data text-gray-300 text-right">
                          {shouldMaskCost ? '***' : `¥${(m.total * 150).toFixed(0)}`}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {dimension === 'responsible' && (
        <>
          {renderBreadcrumb(['报表', '负责人', drillDownPerson || '全部'])}

          <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 mb-4">
            <h2 className="font-heading font-semibold text-white text-sm mb-3">负责人准时率对比</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={mockResponsibleMetrics}
                layout="vertical"
                margin={{ left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#253A5E" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip content={<CustomLineTooltip />} />
                <Bar dataKey="onTimeRate" name="准时率" fill="#E8A838" radius={[0, 2, 2, 0]} barSize={20} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 mb-4">
            <h2 className="font-heading font-semibold text-white text-sm mb-3">负责人明细</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-navy-700/50">
                    <th className="text-left py-2.5 px-3 font-medium">姓名</th>
                    <th className="text-right py-2.5 px-3 font-medium">总数</th>
                    <th className="text-right py-2.5 px-3 font-medium">准时</th>
                    <th className="text-right py-2.5 px-3 font-medium">准时率</th>
                    {!shouldHideCost && (
                      <th className="text-right py-2.5 px-3 font-medium">费用</th>
                    )}
                    <th className="text-right py-2.5 px-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {mockResponsibleMetrics.map((r) => (
                    <tr key={r.id} className="border-b border-navy-700/30 hover:bg-navy-700/20">
                      <td className="py-2.5 px-3 text-gray-200 font-medium">{r.name}</td>
                      <td className="py-2.5 px-3 font-mono-data text-gray-300 text-right">{r.total}</td>
                      <td className="py-2.5 px-3 font-mono-data text-status-success text-right">{r.onTime}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-navy-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${r.onTimeRate >= 85 ? 'bg-status-success' : r.onTimeRate >= 75 ? 'bg-amber-500' : 'bg-status-danger'}`}
                              style={{ width: `${r.onTimeRate}%` }}
                            />
                          </div>
                          <span className={`font-mono-data ${r.onTimeRate >= 85 ? 'text-status-success' : r.onTimeRate >= 75 ? 'text-amber-500' : 'text-status-danger'}`}>
                            {r.onTimeRate}%
                          </span>
                        </div>
                      </td>
                      {!shouldHideCost && (
                        <td className="py-2.5 px-3 font-mono-data text-gray-300 text-right">
                          {shouldMaskCost ? '***' : `¥${(r.total * 180).toFixed(0)}`}
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handlePersonDrillDown(r.name)}
                          className="text-amber-500 hover:text-amber-400 text-xs transition-colors"
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {drillDownPerson && (
            <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-semibold text-white text-sm">
                  {drillDownPerson} - 工单详情
                </h2>
                <button
                  onClick={() => setDrillDownPerson('')}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  返回
                </button>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={personDailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253A5E" />
                  <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                  <Bar dataKey="total" name="总数" fill="#3D5A86" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="onTime" name="准时" fill="#2ECC71" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="delayed" name="延误" fill="#E74C3C" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
