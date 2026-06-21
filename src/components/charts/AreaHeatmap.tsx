'use client';

import { useState } from 'react';
import type { AreaHeatmapData } from '@/types';
import { formatPercent, cn } from '@/lib/utils';

interface AreaHeatmapProps {
  data: AreaHeatmapData[];
  className?: string;
}

export function AreaHeatmap({ data, className }: AreaHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ area: string; row: string; rate: number } | null>(null);

  const getColorForRate = (rate: number): string => {
    if (rate >= 0.9) return 'bg-success';
    if (rate >= 0.75) return 'bg-success/70';
    if (rate >= 0.6) return 'bg-primary/70';
    if (rate >= 0.45) return 'bg-warning/70';
    if (rate >= 0.3) return 'bg-warning/40';
    return 'bg-neutral-600/50';
  };

  const getTextColorForRate = (rate: number): string => {
    return rate >= 0.6 ? 'text-white' : 'text-neutral-300';
  };

  return (
    <div className={className}>
      <div className="mb-4 flex items-center gap-6">
        <div className="text-sm text-neutral-400">
          上座率颜色图例：
        </div>
        <div className="flex items-center gap-1">
          {[
            { label: '≥90%', rate: 0.9 },
            { label: '≥75%', rate: 0.75 },
            { label: '≥60%', rate: 0.6 },
            { label: '≥45%', rate: 0.45 },
            { label: '≥30%', rate: 0.3 },
            { label: '<30%', rate: 0.1 },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`h-4 w-6 rounded ${getColorForRate(item.rate)}`} />
              <span className="text-xs text-neutral-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {data.map((area) => (
          <div key={area.area} className="rounded-lg border border-neutral-700/50 bg-neutral-800/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="font-display font-semibold text-white">{area.area}</h4>
                <p className="text-sm text-neutral-400">
                  共 {area.totalSeats} 座
                  {area.soldSeats !== undefined && `，已售 ${area.soldSeats} 座`}
                  {area.occupancyRate !== undefined && `，上座率 ${formatPercent(area.occupancyRate)}`}
                </p>
              </div>
              <div className="progress-bar w-32">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${(area.occupancyRate ?? 0) * 100}%`,
                    backgroundColor: (area.occupancyRate ?? 0) >= 0.75 ? '#10B981' : (area.occupancyRate ?? 0) >= 0.5 ? '#3B82F6' : '#F59E0B',
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              {area.rows.map((row) => {
                const seatSold = row.sold ?? 0;
                const seatRate = row.total > 0 ? seatSold / row.total : 0;
                return (
                <div key={row.row} className="flex items-center gap-2">
                  <span className="w-8 text-right text-xs text-neutral-500">
                    {row.row}排
                  </span>
                  <div className="flex flex-1 gap-0.5">
                    {Array.from({ length: row.total }).map((_, i) => {
                      const seatRate = (row.sold ?? 0) / row.total;
                      const isSold = i < (row.sold ?? 0);
                      return (
                        <div
                          key={i}
                          className={cn(
                            'h-4 flex-1 rounded-sm transition-all duration-200',
                            isSold ? getColorForRate(seatRate) : 'bg-neutral-700/30',
                            'hover:scale-110 hover:z-10 cursor-pointer'
                          )}
                          onMouseEnter={() =>
                            setHoveredCell({
                              area: area.area,
                              row: row.row,
                              rate: seatRate,
                            })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                          title={`${area.area}${row.row}排${i + 1}号${isSold ? ' (已售)' : ' (可售)'}`}
                        />
                      );
                    })}
                  </div>
                  <span className={cn('w-12 text-right text-xs font-mono', getTextColorForRate(row.rate))}>
                    {formatPercent(row.rate)}
                  </span>
                </div>
              );
              })}
            </div>
          </div>
        ))}
      </div>

      {hoveredCell && (
        <div className="fixed z-50 pointer-events-none rounded-lg border border-neutral-600 bg-background-light px-3 py-2 shadow-xl">
          <p className="text-sm text-white font-medium">
            {hoveredCell.area} {hoveredCell.row}排
          </p>
          <p className="text-xs text-neutral-400">
            上座率：{formatPercent(hoveredCell.rate)}
          </p>
        </div>
      )}
    </div>
  );
}
