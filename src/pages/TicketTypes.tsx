import { useEffect, useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Chart from '@/components/Chart';
import { getTicketTypes, getOrderTrend, getOrderFunnel } from '@/api';
import type { TicketType, TrendDataPoint } from '@/types';

type SortKey = 'name' | 'price' | 'salesVolume' | 'revenue' | 'verificationRate';
type SortDir = 'asc' | 'desc';
type Granularity = 'day' | 'week' | 'month';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: '票种名称' },
  { key: 'price', label: '价格' },
  { key: 'salesVolume', label: '销量' },
  { key: 'revenue', label: '收入' },
  { key: 'verificationRate', label: '核销率' },
];

function sortData(data: TicketType[], key: SortKey, dir: SortDir): TicketType[] {
  return [...data].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return dir === 'asc'
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });
}

function aggregateByGranularity(
  data: TrendDataPoint[],
  granularity: Granularity,
): TrendDataPoint[] {
  if (granularity === 'day') return data;

  const grouped = new Map<string, TrendDataPoint[]>();

  for (const point of data) {
    const date = new Date(point.date);
    let key: string;

    if (granularity === 'week') {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      key = start.toISOString().slice(0, 10);
    } else {
      key = point.date.slice(0, 7);
    }

    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(point);
  }

  const result: TrendDataPoint[] = [];
  for (const [key, points] of grouped) {
    const bySeries = new Map<string, number[]>();
    for (const p of points) {
      if (!bySeries.has(p.seriesName)) bySeries.set(p.seriesName, []);
      bySeries.get(p.seriesName)!.push(p.value);
    }
    for (const [seriesName, values] of bySeries) {
      result.push({
        date: key,
        value: values.reduce((a, b) => a + b, 0),
        seriesName,
      });
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

function buildOrderTrendOption(data: TrendDataPoint[]): EChartsOption {
  const seriesMap = new Map<string, TrendDataPoint[]>();
  const dateSet = new Set<string>();

  for (const point of data) {
    if (!seriesMap.has(point.seriesName)) seriesMap.set(point.seriesName, []);
    seriesMap.get(point.seriesName)!.push(point);
    dateSet.add(point.date);
  }

  const dates = [...dateSet].sort();

  return {
    title: { text: '订单趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: [...seriesMap.keys()], top: 30 },
    grid: { left: 60, right: 60, top: 70, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: [
      { type: 'value', name: '订单量' },
      { type: 'value', name: '收入', position: 'right' },
    ],
    series: [...seriesMap.entries()].map(([name, points]) => {
      const isRevenue = name.includes('收入');
      return {
        name,
        type: isRevenue ? ('line' as const) : ('bar' as const),
        yAxisIndex: isRevenue ? 1 : 0,
        smooth: true,
        data: dates.map((date) => {
          const p = points.find((pt) => pt.date === date);
          return p ? p.value : null;
        }),
        ...(isRevenue
          ? {
              lineStyle: { width: 2 },
              symbolSize: 4,
              itemStyle: { color: '#F97316' },
            }
          : {
              itemStyle: {
                color: '#06B6D4',
                borderRadius: [4, 4, 0, 0] as [number, number, number, number],
              },
            }),
      };
    }),
  };
}

function buildFunnelOption(
  data: { stages: string[]; values: number[] },
): EChartsOption {
  const { stages, values } = data;

  return {
    title: { text: '销售漏斗', left: 'center' },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const idx = params.dataIndex;
        let result = `${params.name}: ${params.value}`;
        if (idx > 0) {
          const rate = ((values[idx] / values[idx - 1]) * 100).toFixed(1);
          result += `<br/>转化率: ${rate}%`;
        }
        return result;
      },
    },
    series: [
      {
        type: 'funnel',
        left: '10%',
        width: '80%',
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          color: '#E2E8F0',
          formatter: (params: any) => {
            const idx = params.dataIndex;
            let text = `${params.name}\n${params.value}`;
            if (idx > 0) {
              const rate = ((values[idx] / values[idx - 1]) * 100).toFixed(1);
              text += `\n转化 ${rate}%`;
            }
            return text;
          },
        },
        itemStyle: {
          borderColor: 'rgba(6, 182, 212, 0.3)',
          borderWidth: 1,
        },
        data: stages.map((name, i) => ({
          name,
          value: values[i],
          itemStyle: {
            color: {
              type: 'linear' as const,
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                {
                  offset: 0,
                  color: `rgba(6, 182, 212, ${0.9 - i * 0.15})`,
                },
                {
                  offset: 1,
                  color: `rgba(6, 182, 212, ${0.5 - i * 0.1})`,
                },
              ],
            },
          },
        })),
      },
    ],
  };
}

export default function TicketTypes() {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [orderTrend, setOrderTrend] = useState<TrendDataPoint[]>([]);
  const [funnelData, setFunnelData] = useState<{
    stages: string[];
    values: number[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [granularity, setGranularity] = useState<Granularity>('day');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [typesRes, trendRes, funnelRes] = await Promise.all([
          getTicketTypes(),
          getOrderTrend(),
          getOrderFunnel(),
        ]);
        setTicketTypes(typesRes.data);
        setOrderTrend(trendRes.data);
        setFunnelData(funnelRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '数据加载失败');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const sortedTypes = useMemo(
    () => sortData(ticketTypes, sortKey, sortDir),
    [ticketTypes, sortKey, sortDir],
  );

  const aggregatedTrend = useMemo(
    () => aggregateByGranularity(orderTrend, granularity),
    [orderTrend, granularity],
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card flex flex-col items-center justify-center gap-4 rounded-lg border border-orange-500/20 p-8">
        <span className="text-4xl text-orange-400">⚠</span>
        <p className="text-slate-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-cyan-500/20 px-4 py-2 text-sm text-cyan-400 transition-colors hover:bg-cyan-500/30"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-card overflow-hidden rounded-lg border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="cursor-pointer px-4 py-3 font-medium transition-colors hover:text-cyan-400"
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key &&
                        (sortDir === 'asc' ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        ))}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">包含权益</th>
              </tr>
            </thead>
            <tbody>
              {sortedTypes.map((ticket, idx) => (
                <tr
                  key={ticket.id}
                  className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                    idx % 2 === 1 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {ticket.name}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    ¥{ticket.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {ticket.salesVolume.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    ¥{ticket.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {(ticket.verificationRate * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ticket.benefits.map((b) => (
                        <span
                          key={b}
                          className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-400"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-slate-200">
              订单趋势
            </h3>
            <div className="flex rounded-lg border border-white/10 bg-white/5">
              {(['day', 'week', 'month'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    granularity === g
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-slate-300'
                  } ${g === 'day' ? 'rounded-l-lg' : ''} ${g === 'month' ? 'rounded-r-lg' : ''}`}
                >
                  {g === 'day' ? '日' : g === 'week' ? '周' : '月'}
                </button>
              ))}
            </div>
          </div>
          <Chart option={buildOrderTrendOption(aggregatedTrend)} className="h-80" />
        </div>

        {funnelData && (
          <Chart option={buildFunnelOption(funnelData)} className="h-96" />
        )}
      </div>
    </div>
  );
}
