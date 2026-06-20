import { motion } from 'framer-motion';
import { Check, Lock, QrCode, BarChart3 } from 'lucide-react';
import type { GamePhase } from '../../types';

interface PhaseStepperProps {
  currentPhase: GamePhase;
  onPhaseChange?: (phase: GamePhase) => void;
  canAdvance: boolean;
}

const PHASES: { phase: GamePhase; label: string; icon: typeof Check; step: number }[] = [
  { phase: 'RULES', label: '票种规则', icon: BarChart3, step: 1 },
  { phase: 'LOCKING', label: '锁座分配', icon: Lock, step: 2 },
  { phase: 'CHECKING', label: '核销评分', icon: QrCode, step: 3 },
  { phase: 'REVIEW', label: '复盘分析', icon: Check, step: 4 },
];

export function PhaseStepper({ currentPhase, onPhaseChange, canAdvance }: PhaseStepperProps) {
  const currentStep = PHASES.find((p) => p.phase === currentPhase)?.step ?? 1;

  return (
    <div className="w-full px-4 py-3">
      <div className="relative flex items-center justify-between max-w-3xl mx-auto">
        {PHASES.map((p, idx) => {
          const Icon = p.icon;
          const isActive = p.phase === currentPhase;
          const isCompleted = currentStep > p.step;
          const isClickable = isCompleted || (canAdvance && idx === currentStep);

          return (
            <div key={p.phase} className="flex flex-col items-center relative z-10 flex-1">
              {idx < PHASES.length - 1 && (
                <div className="absolute top-4 left-1/2 w-full h-0.5 bg-slate-700">
                  {isCompleted && (
                    <motion.div
                      className="absolute inset-0 h-full bg-gradient-to-r from-amber-500 to-amber-400"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      style={{ transformOrigin: 'left center' }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  )}
                </div>
              )}

              <motion.button
                onClick={() => isClickable && onPhaseChange?.(p.phase)}
                whileHover={isClickable ? { scale: 1.1 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
                className={`
                  relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-300 border-2
                  ${isActive
                    ? 'bg-amber-500 border-amber-400 text-slate-900 shadow-lg shadow-amber-500/40'
                    : isCompleted
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-500'
                  }
                  ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-amber-300"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>

              <motion.span
                className={`mt-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-amber-400'
                    : isCompleted
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
                animate={isActive ? { y: 0, opacity: 1 } : {}}
              >
                {p.label}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
