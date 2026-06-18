import { useState } from 'react'
import { Wrench, Car, Banknote, Clock, Target, ChevronRight } from 'lucide-react'

interface TutorialOverlayProps {
  onClose: () => void
}

interface Step {
  title: string
  text: string
  icon: typeof Wrench
  spotlight?: { top: string; left: string; width: string; height: string; label?: string }
  tab?: 'checklist' | 'testDrive' | 'quotation' | 'top' | 'bottom'
}

const steps: Step[] = [
  {
    title: '欢迎来到车源上架模拟',
    text: '你是一名二手车评估师，需要在限时内完成车源上架前的审核工作。让我们从整备清单开始熟悉流程！',
    icon: Target,
    tab: 'top',
  },
  {
    title: '🔧 整备清单审核',
    text: '这是整备清单面板。每辆车进厂前需要检查刹车片、机油、轮胎等项目。\n\n**关键规则**：标注的"显示状态"可能与"实际详情"不符！一定要仔细阅读详情文字判断。',
    icon: Wrench,
    tab: 'checklist',
    spotlight: { top: '22%', left: '5%', width: '90%', height: '50%', label: '整备清单区域' },
  },
  {
    title: '判断合格 / 不合格',
    text: '根据详情内容选择：\n\n✅ 合格：详情说明项目正常\n❌ 不合格：详情显示有磨损、不足或异常\n\n不要被表面的标签欺骗，一切以详情为准！',
    icon: Wrench,
    tab: 'checklist',
    spotlight: { top: '65%', left: '10%', width: '80%', height: '15%', label: '决策按钮区' },
  },
  {
    title: '🚗 试驾记录校验',
    text: '试驾记录面板：检查每辆车的加速、制动、转向等试驾数据。\n\n系统录入时可能出现数据造假或录入错误，你需要找出"数据有误"的条目。',
    icon: Car,
    tab: 'testDrive',
  },
  {
    title: '💰 报价历史评估',
    text: '报价面板：根据市场参考价，从四个选项中选出最合理的上架定价。\n\n定价错误会直接影响库存周转速度，越接近市场价越好！',
    icon: Banknote,
    tab: 'quotation',
  },
  {
    title: '⏱ 评分规则',
    text: '最终得分综合三个维度：\n\n1. **速度**：剩余时间越多分越高\n2. **准确率**：少犯错或不犯错\n3. **连击**：连续正确有额外加分\n\n库存周转天数越少，代表经营越好！',
    icon: Clock,
    tab: 'bottom',
  },
]

export default function TutorialOverlay({ onClose }: TutorialOverlayProps) {
  const [stepIdx, setStepIdx] = useState(0)
  const current = steps[stepIdx]
  const isLast = stepIdx === steps.length - 1
  const isFirst = stepIdx === 0

  const handleNext = () => {
    if (isLast) {
      onClose()
    } else {
      setStepIdx((i) => i + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirst) {
      setStepIdx((i) => i - 1)
    }
  }

  const getTabHint = () => {
    switch (current.tab) {
      case 'checklist':
        return '整备清单 · 判断合格/不合格'
      case 'testDrive':
        return '试驾记录 · 找出数据错误'
      case 'quotation':
        return '报价历史 · 选择合理定价'
      case 'top':
        return '倒计时与任务进度'
      case 'bottom':
        return '实时评分面板'
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {current.spotlight && (
        <div
          className="absolute rounded-2xl pointer-events-none animate-pulse-ring"
          style={{
            top: current.spotlight.top,
            left: current.spotlight.left,
            width: current.spotlight.width,
            height: current.spotlight.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)',
            border: '2px dashed rgba(255, 107, 53, 0.8)',
          }}
        >
          {current.spotlight.label && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#ff6b35] text-white text-xs font-bold px-3 py-1 rounded-full">
              {current.spotlight.label}
            </div>
          )}
        </div>
      )}
      {!current.spotlight && <div className="absolute inset-0 bg-black/85" />}

      <div className="relative z-10 w-full max-w-md animate-slideUp">
        <div className="bg-[#1a1a2e] rounded-3xl border border-[#3a3a5a] shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#ff6b35] to-[#ff8f5a] p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <current.icon size={28} />
              </div>
              <div>
                <div className="text-xs opacity-80 mb-1">
                  第 {stepIdx + 1} / {steps.length} 步
                </div>
                <h3 className="text-xl font-bold">{current.title}</h3>
              </div>
            </div>
            {current.tab && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {getTabHint()}
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="text-[#f5f0e8] text-sm leading-relaxed whitespace-pre-line">
              {current.text}
            </div>
          </div>

          <div className="px-6 pb-4">
            <div className="flex gap-1.5 justify-center mb-4">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === stepIdx
                      ? 'w-8 bg-[#ff6b35]'
                      : i < stepIdx
                      ? 'bg-[#ff6b3560]'
                      : 'w-2 bg-[#3a3a5a]'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {!isFirst ? (
                <button
                  onClick={handlePrev}
                  className="flex-1 py-3 bg-[#3a3a5a] text-[#f5f0e8] rounded-xl font-bold text-sm active:scale-95 transition-transform"
                >
                  上一步
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-[#3a3a5a] text-[#f5f0e880] rounded-xl font-bold text-sm active:scale-95 transition-transform"
                >
                  跳过引导
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-[1.5] py-3 bg-[#ff6b35] text-white rounded-xl font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-[#ff6b35]/30"
              >
                {isLast ? '开始游戏！' : '下一步'}
                {!isLast && <ChevronRight size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
