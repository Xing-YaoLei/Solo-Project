'use client';

import { AlertTriangle, Eye, RotateCcw, FileX, Package, ImageIcon, ShieldAlert } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';
import { useRouter } from 'next/navigation';
import { ANNOTATION_TYPE_LABELS } from '@/types';

const ANOMALY_SOURCE_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  image: { label: '图像', icon: <ImageIcon className="h-2.5 w-2.5" />, cls: 'bg-risk-danger/30 text-risk-danger' },
  rework: { label: '返修', icon: <RotateCcw className="h-2.5 w-2.5" />, cls: 'bg-orange-500/30 text-orange-300' },
  insurance_rejected: { label: '拒赔', icon: <FileX className="h-2.5 w-2.5" />, cls: 'bg-rose-500/30 text-rose-300' },
  stock_gap: { label: '缺件', icon: <Package className="h-2.5 w-2.5" />, cls: 'bg-yellow-500/30 text-yellow-300' },
};

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
            异常来源：图像标注 / 返修记录 / 保险拒赔 / 库存缺口
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

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {inspections.map((ins) => {
          const sources = ins.anomalySources || (ins.hasAnomaly ? ['image'] : []);
          const gapParts = ins.partsUsed?.filter((p: any) => p.isStockGap) || [];
          const rejectedMat = ins.insurance?.rejectedMaterials || [];
          const insuranceClaims = ins.insurance?.claims || [];
          return (
            <div
              key={ins.id}
              onClick={() => router.push(`/inspection/${ins.id}`)}
              className={`group relative cursor-pointer overflow-hidden rounded-lg border transition-all hover:scale-[1.01] hover:shadow-xl ${
                ins.hasAnomaly
                  ? 'border-risk-danger/60 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
                  : 'border-industrial-700 hover:border-risk-info/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative aspect-[4/3] w-full flex-shrink-0 overflow-hidden bg-industrial-800 sm:w-40">
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
                      {ins.annotations.slice(0, 3).map((ann, idx) => (
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

                  <div className="absolute inset-x-0 bottom-0 p-2">
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
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 bg-industrial-900/60 p-3">
                  {sources.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {sources.map((s: string) => {
                        const meta = ANOMALY_SOURCE_META[s];
                        if (!meta) return null;
                        return (
                          <span
                            key={s}
                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.cls}`}
                          >
                            {meta.icon}
                            {meta.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {ins.annotations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ins.annotations.slice(0, 3).map((a) => (
                        <span
                          key={a.id}
                          className="rounded bg-risk-danger/30 px-1.5 py-0.5 text-[9px] text-risk-danger"
                        >
                          {ANNOTATION_TYPE_LABELS[a.type]}
                        </span>
                      ))}
                      {ins.annotations.length > 3 && (
                        <span className="rounded bg-industrial-600/50 px-1.5 py-0.5 text-[9px] text-industrial-300">
                          +{ins.annotations.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {insuranceClaims.length > 0 && (
                    <div className="rounded border border-industrial-700 bg-industrial-800/60 p-1.5 text-[10px]">
                      <div className="mb-1 flex items-center gap-1 text-industrial-300">
                        <ShieldAlert className="h-3 w-3 text-risk-info" />
                        保险理赔 {insuranceClaims.length} 件
                      </div>
                      {rejectedMat.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rejectedMat.slice(0, 3).map((m: any, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded bg-risk-danger/20 px-1 py-0.5 text-[9px] text-risk-danger"
                            >
                              拒赔: {m.name || m.item || `材料${i + 1}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {ins.partsUsed && ins.partsUsed.length > 0 && (
                    <div className="rounded border border-industrial-700 bg-industrial-800/60 p-1.5 text-[10px]">
                      <div className="mb-1 flex items-center gap-1 text-industrial-300">
                        <Package className="h-3 w-3 text-risk-warning" />
                        配件消耗 {ins.partsUsed.length} 项
                        {gapParts.length > 0 && (
                          <span className="ml-auto rounded bg-risk-danger/20 px-1.5 py-0.5 font-medium text-risk-danger">
                            {gapParts.length} 件缺口
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ins.partsUsed.slice(0, 3).map((p: any) => (
                          <span
                            key={p.partId}
                            className={`rounded px-1 py-0.5 text-[9px] ${
                              p.isStockGap
                                ? 'bg-risk-danger/20 text-risk-danger'
                                : 'bg-industrial-700/60 text-industrial-300'
                            }`}
                          >
                            <span className="font-mono">{p.sku}</span> ×{p.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {ins.cashier && (
                    <div className="mt-auto flex items-center justify-between text-[10px] text-industrial-400">
                      <span>收银 {ins.cashier.txCount} 笔</span>
                      <span className="font-mono font-semibold text-risk-success">
                        已付 ¥{ins.cashier.totalPaid.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
