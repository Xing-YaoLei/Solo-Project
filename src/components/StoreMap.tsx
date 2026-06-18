import { useMemo, useState } from 'react';
import type { Store } from '@shared/types';
import { RISK_COLORS, RISK_LABELS } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { MapPin, AlertTriangle, Package, Shield } from 'lucide-react';

interface Props {
  stores: Store[];
  onSelect?: (store: Store) => void;
  className?: string;
}

const MAPBOX_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN;

export function StoreMap({ stores, onSelect, className }: Props) {
  if (MAPBOX_TOKEN) {
    return <MapboxMap stores={stores} onSelect={onSelect} className={className} />;
  }
  return <SvgFallbackMap stores={stores} onSelect={onSelect} className={className} />;
}

function SvgFallbackMap({ stores, onSelect, className }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { viewW, viewH, project, bounds } = useMemo(() => {
    const lngs = stores.map((s) => s.lng);
    const lats = stores.map((s) => s.lat);
    const minLng = Math.min(...lngs) - 2;
    const maxLng = Math.max(...lngs) + 2;
    const minLat = Math.min(...lats) - 2;
    const maxLat = Math.max(...lats) + 2;
    const w = 800;
    const h = 520;
    const pad = 40;
    const project = (lng: number, lat: number) => {
      const x = pad + ((lng - minLng) / (maxLng - minLng)) * (w - pad * 2);
      const y = h - pad - ((lat - minLat) / (maxLat - minLat)) * (h - pad * 2);
      return { x, y };
    };
    return { viewW: w, viewH: h, project, bounds: { minLng, maxLng, minLat, maxLat } };
  }, [stores]);

  const maxStock = Math.max(...stores.map((s) => s.inStockCount), 1);

  const handleClick = (s: Store) => {
    setSelectedId(s.id);
    onSelect?.(s);
  };

  return (
    <div className={cn('relative w-full h-full min-h-[480px] rounded-2xl bg-surface-card border border-surface-border overflow-hidden', className)}>
      <div className="absolute inset-0 bg-glow-top pointer-events-none" />
      <svg viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.15)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </radialGradient>
        </defs>
        <rect width={viewW} height={viewH} fill="url(#grid)" />
        <rect x="20" y="20" width={viewW - 40} height={viewH - 40} rx="16" fill="url(#glow)" stroke="rgba(255,255,255,0.04)" />

        {stores.map((s) => {
          const { x, y } = project(s.lng, s.lat);
          const r = 6 + (s.inStockCount / maxStock) * 22;
          const color = RISK_COLORS[s.riskScore > 75 ? 'critical' : s.riskScore > 55 ? 'high' : s.riskScore > 40 ? 'medium' : 'low'];
          const isHigh = s.riskScore > 55;
          const isHover = hoverId === s.id || selectedId === s.id;
          return (
            <g key={s.id} className="cursor-pointer" onMouseEnter={() => setHoverId(s.id)} onMouseLeave={() => setHoverId(null)} onClick={() => handleClick(s)}>
              {isHigh && (
                <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth="2" opacity="0.5" className="animate-ping-ring origin-center" style={{ transformOrigin: `${x}px ${y}px` }} />
              )}
              <circle cx={x} cy={y} r={r + 6} fill={color} opacity={isHover ? 0.22 : 0.12} />
              <circle cx={x} cy={y} r={r} fill={color} opacity={isHover ? 0.9 : 0.78} stroke={isHover ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth={isHover ? 2 : 1} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700" style={{ pointerEvents: 'none' }}>
                {s.inStockCount}
              </text>
            </g>
          );
        })}
      </svg>

      {stores.map((s) => {
        const { x, y } = project(s.lng, s.lat);
        if (hoverId !== s.id && selectedId !== s.id) return null;
        const color = RISK_COLORS[s.riskScore > 75 ? 'critical' : s.riskScore > 55 ? 'high' : s.riskScore > 40 ? 'medium' : 'low'];
        const levelLabel = RISK_LABELS[s.riskScore > 75 ? 'critical' : s.riskScore > 55 ? 'high' : s.riskScore > 40 ? 'medium' : 'low'];
        const pctX = (x / viewW) * 100;
        const pctY = (y / viewH) * 100;
        return (
          <div
            key={`tip-${s.id}`}
            className="absolute z-20 pointer-events-none w-56 rounded-xl bg-surface-elevated/95 backdrop-blur-xl border border-surface-border shadow-card p-3 animate-slide-up"
            style={{
              left: `${pctX}%`,
              top: `${pctY}%`,
              transform: 'translate(-50%, calc(-100% - 18px))',
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin size={12} style={{ color }} />
              <span className="text-sm font-semibold text-white truncate">{s.name}</span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2">{s.region} · {s.code}</div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <div className="text-slate-500">在库</div>
                <div className="text-slate-200 font-semibold flex items-center gap-1"><Package size={10} />{s.inStockCount}</div>
              </div>
              <div>
                <div className="text-slate-500">预警</div>
                <div className="text-rose-400 font-semibold flex items-center gap-1"><AlertTriangle size={10} />{s.alertCount}</div>
              </div>
              <div>
                <div className="text-slate-500">风险</div>
                <div className="font-semibold flex items-center gap-1" style={{ color }}><Shield size={10} />{s.riskScore}</div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-500">风险等级: <span style={{ color }}>{levelLabel}</span></div>
          </div>
        );
      })}

      <div className="absolute top-4 left-4 bg-surface-elevated/80 backdrop-blur-xl border border-surface-border rounded-xl px-3 py-2">
        <div className="text-xs font-semibold text-white mb-1.5">门店分布图</div>
        <div className="flex gap-3 text-[10px]">
          {(['low', 'medium', 'high', 'critical'] as const).map((l) => (
            <div key={l} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[l] }} />
              <span className="text-slate-400">{RISK_LABELS[l]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapboxMap({ stores, className }: Props) {
  return (
    <div className={cn('w-full h-full min-h-[480px] rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center text-slate-500 text-sm', className)}>
      Mapbox Map (requires token) - {stores.length} stores
    </div>
  );
}
