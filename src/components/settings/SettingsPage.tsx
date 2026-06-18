import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useProgressStore } from '@/stores/useProgressStore'
import Toggle from '@/components/common/Toggle'
import { ArrowLeft, Volume2, Vibrate, Sparkles, RotateCcw, AlertTriangle } from 'lucide-react'
import type { AnimationIntensity } from '@/types'

const intensityLabels: Array<{ key: AnimationIntensity; label: string }> = [
  { key: 'low', label: '低' },
  { key: 'medium', label: '中' },
  { key: 'high', label: '高' },
]

export default function SettingsPageComponent() {
  const navigate = useNavigate()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled)
  const vibrationEnabled = useSettingsStore((s) => s.vibrationEnabled)
  const setVibrationEnabled = useSettingsStore((s) => s.setVibrationEnabled)
  const animationIntensity = useSettingsStore((s) => s.animationIntensity)
  const setAnimationIntensity = useSettingsStore((s) => s.setAnimationIntensity)
  const setTutorialCompleted = useSettingsStore((s) => s.setTutorialCompleted)

  const resetProgress = useProgressStore(() => {
    return () => {
      ;(useProgressStore.setState as unknown as (partial: object) => void)({
        levelResults: {},
        unlockedLevel: 1,
      })
    }
  })

  const handleResetAll = () => {
    resetProgress()
    setTutorialCompleted(false)
    setShowResetConfirm(false)
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#f5f0e8] p-6">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg bg-[#3a3a5a] active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">设置</h1>
      </div>

      <div className="max-w-sm mx-auto space-y-4">
        <div className="flex items-center justify-between bg-[#2a2a4a] p-4 rounded-xl border border-[#3a3a5a]">
          <div className="flex items-center gap-3">
            <Volume2 size={20} className="text-[#ff6b35]" />
            <div>
              <div className="font-medium">音效</div>
              <div className="text-xs text-[#f5f0e860]">办公环境可关闭</div>
            </div>
          </div>
          <Toggle enabled={soundEnabled} onChange={setSoundEnabled} label="音效" />
        </div>

        <div className="flex items-center justify-between bg-[#2a2a4a] p-4 rounded-xl border border-[#3a3a5a]">
          <div className="flex items-center gap-3">
            <Vibrate size={20} className="text-[#ff6b35]" />
            <div>
              <div className="font-medium">震动反馈</div>
              <div className="text-xs text-[#f5f0e860]">答题时的触觉反馈</div>
            </div>
          </div>
          <Toggle enabled={vibrationEnabled} onChange={setVibrationEnabled} label="震动" />
        </div>

        <div className="bg-[#2a2a4a] p-4 rounded-xl border border-[#3a3a5a]">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles size={20} className="text-[#ff6b35]" />
            <div>
              <div className="font-medium">动画强度</div>
              <div className="text-xs text-[#f5f0e860]">粒子效果与视觉反馈</div>
            </div>
          </div>
          <div className="flex gap-2">
            {intensityLabels.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setAnimationIntensity(key)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  animationIntensity === key
                    ? 'bg-[#ff6b35] text-white'
                    : 'bg-[#3a3a5a] text-[#f5f0e880] active:scale-95'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-[#3a3a5a]">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#ef444420] text-[#ef4444] rounded-xl font-bold border border-[#ef444440] active:scale-95 transition-transform"
          >
            <RotateCcw size={18} />
            重置游戏进度
          </button>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#1a1a2e] rounded-2xl p-6 max-w-sm w-full border border-[#3a3a5a]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-[#ef444420]">
                <AlertTriangle size={24} className="text-[#ef4444]" />
              </div>
              <h2 className="text-xl font-bold">确认重置？</h2>
            </div>
            <p className="text-sm text-[#f5f0e880] mb-6">
              将清空所有关卡成绩、解锁进度和新手引导记录。此操作不可撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 bg-[#3a3a5a] text-[#f5f0e8] rounded-xl font-bold active:scale-95 transition-transform"
              >
                取消
              </button>
              <button
                onClick={handleResetAll}
                className="flex-1 py-3 bg-[#ef4444] text-white rounded-xl font-bold active:scale-95 transition-transform"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
