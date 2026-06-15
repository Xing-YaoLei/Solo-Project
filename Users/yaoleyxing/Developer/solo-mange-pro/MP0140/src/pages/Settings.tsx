import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Smartphone, Sparkles, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

export default function Settings() {
  const navigate = useNavigate();
  const { settings, setSettings, resetSettings } = useGameStore();

  const animationOptions = [
    { value: 'off', label: '关闭', desc: '无动画效果，最安静' },
    { value: 'low', label: '轻微', desc: '少量动画，不易察觉' },
    { value: 'medium', label: '标准', desc: '平衡的动画体验' },
    { value: 'high', label: '丰富', desc: '完整动画效果' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回首页</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">系统设置</h1>
        <p className="text-gray-500 mb-8">
          根据使用场景调整效果，办公室环境建议关闭声音和震动
        </p>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                  settings.soundEnabled ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {settings.soundEnabled
                    ? <Volume2 className="w-6 h-6 text-blue-600" />
                    : <VolumeX className="w-6 h-6 text-gray-400" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">游戏声音</h3>
                  <p className="text-sm text-gray-500">控制所有游戏音效的播放</p>
                </div>
              </div>
              <button
                onClick={() => setSettings({ soundEnabled: !settings.soundEnabled })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${
                  settings.soundEnabled ? 'left-7' : 'left-0.5'
                }`} />
              </button>
            </div>

            <div className={`transition-all duration-300 ${settings.soundEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <label className="block text-sm text-gray-600 mb-2">音量大小</label>
              <div className="flex items-center gap-4">
                <VolumeX className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.soundVolume}
                  onChange={(e) => setSettings({ soundVolume: parseFloat(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <Volume2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 w-10 text-right font-mono">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                  settings.vibrationEnabled ? 'bg-orange-100' : 'bg-gray-100'
                }`}>
                  <Smartphone className={`w-6 h-6 transition-colors ${
                    settings.vibrationEnabled ? 'text-orange-600' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">触觉震动</h3>
                  <p className="text-sm text-gray-500">操作反馈震动，手机更有手感</p>
                </div>
              </div>
              <button
                onClick={() => setSettings({ vibrationEnabled: !settings.vibrationEnabled })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.vibrationEnabled ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${
                  settings.vibrationEnabled ? 'left-7' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">动画强度</h3>
                <p className="text-sm text-gray-500">控制游戏中动画效果的丰富程度</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {animationOptions.map((opt) => {
                const active = settings.animationIntensity === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSettings({ animationIntensity: opt.value as any })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      active
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <p className={`font-semibold mb-0.5 ${active ? 'text-purple-700' : 'text-gray-700'}`}>
                      {opt.label}
                    </p>
                    <p className={`text-xs ${active ? 'text-purple-600' : 'text-gray-500'}`}>
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                  settings.showHints ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {settings.showHints
                    ? <Eye className="w-6 h-6 text-green-600" />
                    : <EyeOff className="w-6 h-6 text-gray-400" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">操作提示</h3>
                  <p className="text-sm text-gray-500">游戏中显示操作指引和提示</p>
                </div>
              </div>
              <button
                onClick={() => setSettings({ showHints: !settings.showHints })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.showHints ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${
                  settings.showHints ? 'left-7' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
            <h4 className="font-semibold text-gray-800 mb-2">🏢 办公室模式预设</h4>
            <p className="text-sm text-gray-600 mb-4">一键开启安静模式，不打扰同事</p>
            <button
              onClick={() => setSettings({
                soundEnabled: false,
                vibrationEnabled: false,
                animationIntensity: 'low',
                showHints: true,
              })}
              className="w-full py-2.5 bg-white border border-blue-200 text-blue-700 rounded-xl font-medium hover:bg-blue-50 transition-colors"
            >
              应用安静模式
            </button>
          </div>

          <button
            onClick={resetSettings}
            className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-gray-600 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>恢复默认设置</span>
          </button>
        </div>
      </div>
    </div>
  );
}
