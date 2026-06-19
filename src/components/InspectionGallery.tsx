'use client';

import { AlertTriangle, Eye } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';
import { useRouter } from 'next/navigation';
import { ANNOTATION_TYPE_LABELS } from '@/types';

export function InspectionGallery() {
  const { inspections, isLoading } = useDashboardStore();
  const router = useRouter();

  if (isLoading || inspections.length === 0) {
    return (
      <div className="h-[340px] animate-pulse rounded-xl border border-industrial-700 bg-industrial-800" />
    );
  }

  const anomalyCount = inspections.filter((i) => i.hasAnomaly).length;

  return (
    <div className="rounded-xl border border-industrial-700 bg-gradient-to-br from-industrial-800/80 to-industrial-900/80">
      <div className="flex items-center justify-between border-b border-industrial-700 px-5 py-4">
        <div>
          <h3 className="font-display text-sm font-bold tracking-wide text-white">质检照片异常标注</h3>
          <p className="mt-0.5 text-[11px] text-industrial-400">
            点击照片查看异常标注详情
          </p>
        </div>
        <div className="flex items-center gap-2">
          {anomalyCount > 0 && (
            <span className="flex items-center gap-1 rounded-md border border-risk-danger/50 bg-risk-danger/10 px-2.5 py-1 text-[11px] font-semibold text-risk-danger">
              <AlertTriangle className="h-3 w-3" />
              {anomalyCount} 处异常
            </span>
          )}
          <span className="rounded-md bg-industrial-700/60 px-2 py-1 text-[11px] text-industrial-300">
            共 {inspections.length} 张
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-3">
        {inspections.map((ins) => (
          <div
            key={ins.id}
            onClick={() => router.push(`/inspection/${ins.id}`)}
            className={`group relative cursor-pointer overflow-hidden rounded-lg border transition-all hover:scale-[1.02] hover:shadow-xl ${
              ins.hasAnomaly
                ? 'border-risk-danger/60 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
                : 'border-industrial-700 hover:border-risk-info/50'
            }`}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-industrial-800">
              <img
                src={ins.photoUrl}
                alt={`质检-${ins.vehiclePlate}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {ins.hasAnomaly && (
                <>
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-risk-danger/90 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                    <AlertTriangle className="h-3 w-3" />
                    异常
                  </div>
                  {ins.annotations.map((ann, idx) => (
                    <div
                      key={ann.id}
                      className="absolute border-2 border-risk-danger bg-risk-danger/20"
                      style={{
                        left: `${ann.x}%`,
                        top: `${ann.y}%`,
                        width: `${ann.width}%`,
                        height: `${ann.height}%`,
                      }}
                      title={ANNOTATION_TYPE_LABELS[ann.type]}
                    >
                      <span className="absolute -top-4 left-0 rounded bg-risk-danger px-1 text-[9px] font-bold text-white">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </>
              )}

              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-mono text-xs font-bold text-white">{ins.vehiclePlate}</p>
                    <p className="text-[10px] text-industrial-300">
                      {new Date(ins.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-white/10 p-1.5 backdrop-blur opacity-0 transition-opacity group-hover:opacity-100">
                    <Eye className="h-3 w-3 text-white" />
                  </div>
                </div>
                {ins.hasAnomaly && ins.annotations.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {ins.annotations.slice(0, 2).map((a) => (
                      <span
                        key={a.id}
                        className="rounded bg-risk-danger/30 px-1.5 py-0.5 text-[9px] text-risk-danger"
                      >
                        {ANNOTATION_TYPE_LABELS[a.type]}
                      </span>
                    ))}
                    {ins.annotations.length > 2 && (
                      <span className="rounded bg-industrial-600/50 px-1.5 py-0.5 text-[9px] text-industrial-300">
                        +{ins.annotations.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
