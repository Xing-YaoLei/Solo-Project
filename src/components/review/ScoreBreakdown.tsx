import { motion } from 'framer-motion';
import { ArrowRight, Undo2, Plus, Minus, Clock } from 'lucide-react';
import type { DecisionLog } from '../../types';

interface ScoreBreakdownProps {
  decisionHistory: DecisionLog[];
  breakdown: { label: string; value: number }[];
  totalScore: number;
  onRollback: (decisionId: string) => void;
}

const PHASE_COLORS: Record<string, string> = {
  RULES: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  LOCKING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CHECKING: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  REVIEW: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const PHASE_LABELS: Record<string, string> = {
  RULES: '规则',
  LOCKING: '锁座',
  CHECKING: '核销',
  REVIEW: '复盘',
};

export function ScoreBreakdown({ decisionHistory, breakdown, totalScore, onRollback }: ScoreBreakdownProps) {
  const sumBreakdown = breakdown.reduce((sum, b) => sum + b.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-5">
        <h3 className="font-bold text-white text-lg mb-4">得分构成</h3>

        <div className="space-y-2">
          {breakdown.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900/50"
            >
              <div className="flex items-center gap-2">
                {item.value >= 0 ? (
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Minus className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span className="text-sm text-slate-300">{item.label}</span>
              </div>
              <span
                className={`font-mono font-bold text-sm ${
                  item.value > 0
                    ? 'text-emerald-400'
                    : item.value < 0
                    ? 'text-rose-400'
                    : 'text-slate-500'
                }`}
              >
                {item.value >= 0 ? '+' : ''}{item.value.toLocaleString()}
              </span>
            </motion.div>
          ))}

          <div className="my-3 border-t border-slate-700/60" />

          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-500/5 border border-amber-500/30">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">最终得分</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {totalScore.toLocaleString()}
              </span>
              {sumBreakdown !== totalScore && (
                <div className="text-[10px] text-slate-500">
                  (合计 {sumBreakdown.toLocaleString()})
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-lg">决策日志</h3>
          <span className="text-xs text-slate-400 bg-slate-900/60 px-2 py-1 rounded">
            {decisionHistory.length} 项
          </span>
        </div>

        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {decisionHistory.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">暂无决策记录</div>
          )}

          {decisionHistory.map((log, idx) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`
                p-3 rounded-xl border transition-all group
                ${log.canRollback
                  ? 'bg-slate-900/40 border-slate-700/50 hover:border-amber-500/40'
                  : 'bg-slate-900/20 border-slate-800/40 opacity-75'
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${PHASE_COLORS[log.phase] || ''}`}>
                      {PHASE_LABELS[log.phase] || log.phase}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    {log.scoreDelta !== 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          log.scoreDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {log.scoreDelta > 0 ? '+' : ''}{log.scoreDelta}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{log.description}</p>
                  {log.seatIds.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {log.seatIds.slice(0, 8).map((sid) => (
                        <span key={sid} className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                          {sid}
                        </span>
                      ))}
                      {log.seatIds.length > 8 && (
                        <span className="text-[9px] text-slate-500">+{log.seatIds.length - 8}</span>
                      )}
                    </div>
                  )}
                </div>

                {log.canRollback && (
                  <button
                    onClick={() => onRollback(log.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-slate-500 hover:text-amber-400 hover:bg-amber-500/10"
                    title="回退到此决策"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
