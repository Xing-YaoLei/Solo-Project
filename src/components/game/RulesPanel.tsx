import { motion } from 'framer-motion';
import { Ticket, Users, AlertCircle, ChevronLeft } from 'lucide-react';
import type { TicketRule } from '../../types';

interface RulesPanelProps {
  rules: TicketRule[];
  totalSeatsByType: Record<string, { assigned: number; total: number }>;
  isOpen: boolean;
  onToggle: () => void;
}

export function RulesPanel({ rules, totalSeatsByType, isOpen, onToggle }: RulesPanelProps) {
  return (
    <>
      <motion.button
        onClick={onToggle}
        className={`
          absolute top-20 left-4 z-15 p-2 rounded-lg backdrop-blur-xl
          bg-slate-900/70 border border-slate-700/50 text-slate-300
          hover:bg-slate-800/80 hover:text-amber-400 transition-all
          ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        whileHover={{ x: 2 }}
      >
        <Ticket className="w-5 h-5" />
      </motion.button>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute top-0 left-0 h-full w-72 z-20 pointer-events-auto"
      >
        <div className="h-full backdrop-blur-2xl bg-slate-900/85 border-r border-slate-700/50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-white tracking-wide">票种规则</h3>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {rules.map((rule) => {
              const stats = totalSeatsByType[rule.type] || { assigned: 0, total: 0 };
              const percent = stats.total > 0 ? Math.round((stats.assigned / stats.total) * 100) : 0;
              const isOverQuota = stats.assigned > rule.quota;

              return (
                <motion.div
                  key={rule.type}
                  layout
                  className="rounded-xl bg-slate-800/50 border border-slate-700/60 overflow-hidden"
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded shadow-lg"
                          style={{ backgroundColor: rule.color, boxShadow: `0 0 12px ${rule.color}55` }}
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{rule.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{rule.rowRange[0]}排 ~ {rule.rowRange[1]}排</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold font-mono text-amber-400">¥{rule.price.toLocaleString()}</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">{rule.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Users className="w-3 h-3" /> 配额使用
                        </span>
                        <span className={`font-mono font-bold ${isOverQuota ? 'text-rose-400' : 'text-slate-200'}`}>
                          {stats.assigned}/{rule.quota}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${isOverQuota ? 'bg-rose-500' : ''}`}
                          style={{ backgroundColor: isOverQuota ? undefined : rule.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, percent)}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>

                      {rule.specialRules && rule.specialRules.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-slate-700/50 space-y-1">
                          {rule.specialRules.map((specialRule, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
                              <span>{specialRule}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-700/50 text-center">
            <div className="text-[10px] text-slate-500">仔细阅读规则，避免违规扣分</div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
