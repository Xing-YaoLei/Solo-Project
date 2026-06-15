import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Monitor, Smartphone, Volume2, VolumeX, Info } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    isTouchMode,
    sensitivity,
    soundEnabled,
    musicVolume,
    sfxVolume,
    setTouchMode,
    setSensitivity,
    setSoundEnabled,
    setMusicVolume,
    setSfxVolume,
  } = useSettingsStore();

  const [controlMode, setControlMode] = useState<'auto' | 'keyboard' | 'touch'>(
    isTouchMode ? 'touch' : 'keyboard'
  );

  const handleBack = () => {
    navigate('/');
  };

  const handleControlModeChange = (mode: 'auto' | 'keyboard' | 'touch') => {
    setControlMode(mode);
    setTouchMode(mode === 'touch');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-stone-400 hover:text-stone-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回主菜单
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-100 font-serif mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-amber-400" />
            游戏设置
          </h1>
          <p className="text-stone-400">调整控制方式和音效，获得最佳游戏体验</p>
        </div>

        <div className="space-y-6">
          <div className="bg-stone-800/60 rounded-2xl p-6 border border-stone-700/50 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-stone-100 font-serif mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-sky-400" />
              控制方式
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: 'keyboard', label: '键鼠', icon: '⌨️' },
                { value: 'touch', label: '触屏', icon: '👆' },
                { value: 'auto', label: '自动', icon: '🔄' },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => handleControlModeChange(mode.value as any)}
                  className={`p-4 rounded-xl border transition-all ${
                    controlMode === mode.value
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                      : 'bg-stone-700/30 border-stone-600/30 text-stone-400 hover:bg-stone-700/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{mode.icon}</div>
                  <div className="text-sm font-medium">{mode.label}</div>
                </button>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-stone-300 text-sm">视角灵敏度</label>
                <span className="text-amber-400 font-mono text-sm">
                  {sensitivity.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={3}
                step={0.1}
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs text-stone-500 mt-1">
                <span>慢</span>
                <span>快</span>
              </div>
            </div>
          </div>

          <div className="bg-stone-800/60 rounded-2xl p-6 border border-stone-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-100 font-serif flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-stone-500" />
                )}
                音效设置
              </h2>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  soundEnabled ? 'bg-emerald-500' : 'bg-stone-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className={`space-y-4 ${!soundEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-stone-300 text-sm">背景音乐</label>
                  <span className="text-stone-400 font-mono text-sm">
                    {Math.round(musicVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-stone-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-stone-300 text-sm">音效</label>
                  <span className="text-stone-400 font-mono text-sm">
                    {Math.round(sfxVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-stone-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="bg-stone-800/60 rounded-2xl p-6 border border-stone-700/50 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-stone-100 font-serif mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-violet-400" />
              操作说明
            </h2>
            <div className="space-y-3 text-stone-400 text-sm">
              <div className="flex items-start gap-3">
                <span className="w-20 flex-shrink-0 text-stone-500">鼠标拖动</span>
                <span>旋转视角，观察教室环境</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 flex-shrink-0 text-stone-500">点击课桌</span>
                <span>选择学生，查看详细信息</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 flex-shrink-0 text-stone-500">阶段切换</span>
                <span>观察名单 → 处理成绩 → 审核材料</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 flex-shrink-0 text-stone-500">材料缺失</span>
                <span>选择返回修正或跳过（扣分）</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 flex-shrink-0 text-stone-500">触屏操作</span>
                <span>单指滑动旋转视角，双指缩放</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleBack}
            className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-lg font-semibold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-amber-500/20"
          >
            保存并返回
          </button>
        </div>
      </div>
    </div>
  );
}
