import { useState, useRef, useEffect } from 'react';
import {
  CalendarDays,
  ChevronDown,
  User,
  TrendingUp,
  Calendar,
  BarChart2,
} from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import type { CompareMode } from '@/types';
import { cn } from '@/lib/utils';

interface CompareOption {
  value: CompareMode;
  label: string;
  icon: React.ElementType;
}

const compareOptions: CompareOption[] = [
  { value: 'none', label: '关闭', icon: BarChart2 },
  { value: 'yoy', label: '同比 (YoY)', icon: TrendingUp },
  { value: 'mom', label: '环比 (MoM)', icon: Calendar },
];

export default function Header() {
  const startDate = useAppStore((s) => s.startDate);
  const endDate = useAppStore((s) => s.endDate);
  const setStartDate = useAppStore((s) => s.setStartDate);
  const setEndDate = useAppStore((s) => s.setEndDate);
  const compareMode = useAppStore((s) => s.compareMode);
  const setCompareMode = useAppStore((s) => s.setCompareMode);
  const currentActivityId = useAppStore((s) => s.currentActivityId);
  const currentActivityName = useAppStore((s) => s.currentActivityName);
  const setCurrentActivity = useAppStore((s) => s.setCurrentActivity);
  const activityOptions = useAppStore((s) => s.activityOptions);

  const [activityOpen, setActivityOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const activityRef = useRef<HTMLDivElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (activityRef.current && !activityRef.current.contains(e.target as Node)) {
        setActivityOpen(false);
      }
      if (compareRef.current && !compareRef.current.contains(e.target as Node)) {
        setCompareOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-panel-border/70 bg-ocean-dark/50 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-xl font-semibold text-white tracking-wide glow-text">
          数据运营大屏
        </h1>

        <div className="h-6 w-px bg-white/10" />

        <div ref={activityRef} className="relative">
          <button
            onClick={() => setActivityOpen((v) => !v)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-primary/50 hover:bg-white/10 transition-all duration-200"
          >
            <span className="text-sm text-white/80 max-w-[220px] truncate">
              {currentActivityName}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-white/50 transition-transform duration-200',
                activityOpen && 'rotate-180'
              )}
            />
          </button>

          {activityOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-ocean-light/95 backdrop-blur-xl border border-panel-border shadow-card z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-2.5 border-b border-panel-border/60">
                <span className="text-xs text-white/50 uppercase tracking-wider">
                  切换活动
                </span>
              </div>
              <div className="py-1 max-h-80 overflow-y-auto">
                {activityOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setCurrentActivity(opt.id, opt.name);
                      setActivityOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm transition-colors',
                      opt.id === currentActivityId
                        ? 'bg-cyan-primary/15 text-cyan-glow'
                        : 'text-white/80 hover:bg-white/5'
                    )}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-white/50" />
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 px-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 focus:border-cyan-primary/60 focus:outline-none hover:border-white/30 transition-all w-[120px] appearance-none"
            />
            <span className="text-white/40 text-sm">→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 px-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 focus:border-cyan-primary/60 focus:outline-none hover:border-white/30 transition-all w-[120px] appearance-none"
            />
          </div>
          <span className="text-xs text-white/40 font-medium ml-1">
            {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
          </span>
        </div>

        <div ref={compareRef} className="relative">
          <button
            onClick={() => setCompareOpen((v) => !v)}
            className={cn(
              'chip flex items-center gap-1.5 h-9 px-3.5',
              compareMode === 'none' ? 'chip-inactive' : 'chip-active'
            )}
          >
            {(() => {
              const opt = compareOptions.find((o) => o.value === compareMode)!;
              const Icon = opt.icon;
              return (
                <>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </>
              );
            })()}
            <ChevronDown
              className={cn(
                'w-3 h-3 transition-transform duration-200',
                compareOpen && 'rotate-180'
              )}
            />
          </button>

          {compareOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-ocean-light/95 backdrop-blur-xl border border-panel-border shadow-card z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-2.5 border-b border-panel-border/60">
                <span className="text-xs text-white/50 uppercase tracking-wider">
                  对比模式
                </span>
              </div>
              <div className="py-1">
                {compareOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = opt.value === compareMode;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setCompareMode(opt.value);
                        setCompareOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm transition-colors',
                        active
                          ? 'bg-cyan-primary/15 text-cyan-glow'
                          : 'text-white/80 hover:bg-white/5'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-white/10" />

        <button className="flex items-center gap-2.5 h-9 pl-1 pr-3.5 rounded-full bg-white/5 border border-white/10 hover:border-cyan-primary/50 hover:bg-white/10 transition-all duration-200">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-warning to-red-danger flex items-center justify-center shadow-glow-orange shrink-0">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-white/85">姚乐毅</span>
        </button>
      </div>
    </header>
  );
}
