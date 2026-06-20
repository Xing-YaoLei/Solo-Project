import { motion, AnimatePresence } from 'motion/react'
import { X, ChevronRight, ChevronLeft, Sparkles, MapPin, FileText, Armchair, CheckCircle } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { tutorialSteps } from '@/data/gameData'

interface TutorialOverlayProps {
  onClose: () => void
}

const STEP_ICONS = [Sparkles, MapPin, FileText, Armchair, CheckCircle]

export default function TutorialOverlay({ onClose: _onClose }: TutorialOverlayProps) {
  const tutorialStep = useGameStore((s) => s.tutorialStep)
  const setTutorialStep = useGameStore((s) => s.setTutorialStep)
  const completeTutorial = useGameStore((s) => s.completeTutorial)

  const currentStep = tutorialSteps[tutorialStep]
  const totalSteps = tutorialSteps.length
  const isLast = tutorialStep >= totalSteps - 1
  const StepIcon = STEP_ICONS[tutorialStep] || Sparkles

  const handleNext = () => {
    if (isLast) {
      completeTutorial()
    } else {
      setTutorialStep(tutorialStep + 1)
    }
  }

  const handlePrev = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1)
    }
  }

  const handleSkip = () => {
    completeTutorial()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        <div className="absolute inset-0 bg-black/50 pointer-events-auto" />

        <motion.div
          key={tutorialStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 250 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[420px] pointer-events-auto"
        >
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-1 bg-white/5"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((tutorialStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-vivid-orange to-golden"
              />
            </div>

            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-vivid-orange/20 to-golden/20 border border-vivid-orange/30 flex items-center justify-center flex-shrink-0">
                <StepIcon size={22} className="text-golden" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-vivid-orange bg-vivid-orange/10 px-2 py-0.5 rounded-full">
                    第 {tutorialStep + 1} / {totalSteps} 步
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-1.5">
                  {currentStep?.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentStep?.description}
                </p>
              </div>
            </div>

            {tutorialStep === 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="glass-card rounded-xl p-4 mb-5"
              >
                <div className="text-[10px] font-display text-slate-400 mb-2">
                  💡 热力等级说明
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { level: 'low', label: '低热度', desc: '客流稀少，可快速通过', color: '#22c55e' },
                    { level: 'medium', label: '中热度', desc: '正常客流，平稳运营', color: '#eab308' },
                    { level: 'high', label: '高热度', desc: '客流密集，注意引导', color: '#f97316' },
                    { level: 'critical', label: '极高热度', desc: '拥堵风险，需分流处理', color: '#ef4444' },
                  ].map((item) => (
                    <div key={item.level} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}
                      />
                      <div>
                        <div className="text-[11px] font-display text-white">{item.label}</div>
                        <div className="text-[9px] text-slate-400">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {tutorialStep === 2 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="glass-card rounded-xl p-4 mb-5"
              >
                <div className="text-[10px] font-display text-slate-400 mb-2">
                  🎯 路线选择策略
                </div>
                <ul className="space-y-1.5">
                  <li className="text-[11px] text-slate-300 flex items-start gap-1.5">
                    <span className="text-golden mt-0.5">•</span>
                    高热度区域优先选择高二消潜力路线
                  </li>
                  <li className="text-[11px] text-slate-300 flex items-start gap-1.5">
                    <span className="text-golden mt-0.5">•</span>
                    拥堵时降低风险等级，避免行程超时
                  </li>
                  <li className="text-[11px] text-slate-300 flex items-start gap-1.5">
                    <span className="text-golden mt-0.5">•</span>
                    经典路线平衡各项指标，适合新手
                  </li>
                </ul>
              </motion.div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrev}
                disabled={tutorialStep === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-display text-slate-400 hover:text-white hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
                上一步
              </button>

              <div className="flex items-center gap-1.5">
                {tutorialSteps.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      width: i === tutorialStep ? 20 : 8,
                      backgroundColor: i <= tutorialStep ? '#FF6B35' : 'rgba(255,255,255,0.15)',
                    }}
                    transition={{ duration: 0.25 }}
                    className="h-2 rounded-full"
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-display font-semibold text-white bg-gradient-to-r from-vivid-orange to-golden hover:shadow-lg hover:shadow-vivid-orange/30 transition active:scale-[0.98]"
              >
                {isLast ? '开始训练' : '下一步'}
                {!isLast && <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
