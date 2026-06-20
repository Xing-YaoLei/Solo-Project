import { useState, useEffect } from 'react';
import Chart from '@/components/Chart';
import { getCalibers, getVerificationEfficiency } from '@/api';
import type { CaliberVersion, VerificationData } from '@/types';

type Dimension = '按日期' | '按区域' | '按票种';

const DIMENSION_MAP: Record<Dimension, string> = {
  '按日期': 'date',
  '按区域': 'area',
  '按票种': 'ticket_type',
};

export default function Verification() {
  const [calibers, setCalibers] = useState<CaliberVersion[]>([]);
  const [selectedCaliber, setSelectedCaliber] = useState<string>('');
  const [dimension, setDimension] = useState<Dimension>('按日期');
  const [efficiencyData, setEfficiencyData] = useState<VerificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [caliberLoading, setCaliberLoading] = useState(true);

  useEffect(() => {
    getCalibers()
      .then((res) => {
        const data = res.data ?? [];
        setCalibers(data);
        if (data.length > 0) setSelectedCaliber(data[0].version);
      })
      .catch(() => setCalibers([]))
      .finally(() => setCaliberLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCaliber) return;
    setLoading(true);
    getVerificationEfficiency({ caliber: selectedCaliber })
      .then((res) => setEfficiencyData(res.data ?? []))
      .catch(() => setEfficiencyData([]))
      .finally(() => setLoading(false));
  }, [selectedCaliber]);

  const filteredData = efficiencyData.filter(
    (d) => d.dimension === DIMENSION_MAP[dimension]
  );

  const chartOption = {
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    legend: {
      data: ['总票数', '已核销', '核销率'],
      textStyle: { color: '#94A3B8' },
    },
    grid: { left: 48, right: 48, top: 48, bottom: 32 },
    xAxis: {
      type: 'category' as const,
      data: filteredData.map((d) => d.dimensionValue),
      axisLabel: { color: '#94A3B8' },
    },
    yAxis: [
      {
        type: 'value' as const,
        name: '票数',
        axisLabel: { color: '#94A3B8' },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
      },
      {
        type: 'value' as const,
        name: '核销率',
        axisLabel: { color: '#94A3B8', formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '总票数',
        type: 'bar' as const,
        data: filteredData.map((d) => d.totalTickets),
        itemStyle: { color: '#06B6D4', borderRadius: [4, 4, 0, 0] },
        barGap: '10%' as const,
      },
      {
        name: '已核销',
        type: 'bar' as const,
        data: filteredData.map((d) => d.verifiedTickets),
        itemStyle: { color: '#22C55E', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '核销率',
        type: 'line' as const,
        yAxisIndex: 1,
        data: filteredData.map((d) => (d.verificationRate * 100).toFixed(1)),
        itemStyle: { color: '#F97316' },
        lineStyle: { color: '#F97316', width: 2 },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-display text-2xl font-bold text-slate-100">核销效率</h1>
        <div className="flex flex-wrap gap-2">
          {caliberLoading ? (
            <div className="h-8 w-32 animate-pulse rounded-lg bg-white/5" />
          ) : (
            calibers.map((c) => (
              <button
                key={c.version}
                onClick={() => setSelectedCaliber(c.version)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                  selectedCaliber === c.version
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300'
                }`}
              >
                <span className="font-mono text-xs">{c.version}</span>
                <span className="ml-1.5">{c.name}</span>
                <span className="ml-1.5 text-xs opacity-60">{c.effectiveDate}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {(['按日期', '按区域', '按票种'] as Dimension[]).map((d) => (
          <button
            key={d}
            onClick={() => setDimension(d)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              dimension === d
                ? 'bg-cyan-400/15 text-cyan-400'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card flex h-80 items-center justify-center rounded-xl">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : (
        <Chart option={chartOption} className="h-80" />
      )}

      <div className="glass-card rounded-xl border border-white/5 p-6">
        <h2 className="font-display mb-4 text-lg font-semibold text-slate-100">
          口径变更记录
        </h2>
        <div className="relative ml-4 border-l-2 border-white/10 pl-6">
          {calibers.map((c, i) => (
            <div key={c.version} className="relative mb-6 last:mb-0">
              <div
                className={`absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 ${
                  selectedCaliber === c.version
                    ? 'border-cyan-400 bg-cyan-400'
                    : 'border-slate-600 bg-slate-800'
                }`}
              />
              {i < calibers.length - 1 && (
                <div className="absolute -left-[1.15rem] top-4 h-full w-0.5 bg-white/10" />
              )}
              <div
                className={`rounded-lg border p-4 ${
                  selectedCaliber === c.version
                    ? 'border-cyan-400/30 bg-cyan-400/5'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-cyan-400/15 px-2 py-0.5 font-mono text-xs text-cyan-400">
                    {c.version}
                  </span>
                  <span className="font-medium text-slate-200">{c.name}</span>
                  <span className="text-xs text-slate-500">{c.effectiveDate}</span>
                  {selectedCaliber === c.version && (
                    <span className="rounded bg-cyan-400/15 px-2 py-0.5 text-xs text-cyan-400">
                      当前
                    </span>
                  )}
                </div>
                <div className="mb-2 rounded bg-black/30 px-3 py-2">
                  <code className="font-mono text-sm text-cyan-300">{c.formula}</code>
                </div>
                <p className="text-sm text-slate-400">{c.changeReason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
