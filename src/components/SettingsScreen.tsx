import { useGameStore } from '../store/gameStore'

export function SettingsScreen() {
  const { settings, updateSettings, exitToMenu, playSound } = useGameStore()

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value })
    if (key === 'soundEnabled' && value) {
      playSound('click')
    }
  }

  const handleVolumeChange = (key: 'soundVolume' | 'musicVolume', value: number) => {
    updateSettings({ [key]: value })
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 z-20 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">⚙️ 设置</h1>
            <p className="text-gray-400">根据你的喜好调整游戏体验</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-6">🔊 音频设置</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">音效</div>
                  <div className="text-gray-400 text-sm">播放操作音效和提示音</div>
                </div>
                <button
                  onClick={() => handleToggle('soundEnabled', !settings.soundEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors relative
                    ${settings.soundEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <div 
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform
                      ${settings.soundEnabled ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              {settings.soundEnabled && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">音效音量</span>
                    <span className="text-gray-400">{Math.round(settings.soundVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.soundVolume}
                    onChange={(e) => handleVolumeChange('soundVolume', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">背景音乐</div>
                  <div className="text-gray-400 text-sm">播放舒缓的背景音乐</div>
                </div>
                <button
                  onClick={() => handleToggle('musicEnabled', !settings.musicEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors relative
                    ${settings.musicEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <div 
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform
                      ${settings.musicEnabled ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              {settings.musicEnabled && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">音乐音量</span>
                    <span className="text-gray-400">{Math.round(settings.musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.musicVolume}
                    onChange={(e) => handleVolumeChange('musicVolume', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-6">🎬 视觉设置</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">动画效果</div>
                  <div className="text-gray-400 text-sm">启用3D动画和过渡效果</div>
                </div>
                <button
                  onClick={() => handleToggle('animationEnabled', !settings.animationEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors relative
                    ${settings.animationEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <div 
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform
                      ${settings.animationEnabled ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-6">📳 震动反馈</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">震动反馈</div>
                  <div className="text-gray-400 text-sm">在支持的设备上提供触觉反馈</div>
                </div>
                <button
                  onClick={() => handleToggle('vibrationEnabled', !settings.vibrationEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors relative
                    ${settings.vibrationEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <div 
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform
                      ${settings.vibrationEnabled ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">💡 安静模式</h3>
            <p className="text-gray-300 text-sm">
              关闭音效、音乐和震动，适合在工作间隙安静练习。
              你可以单独调整这些设置，或者一键关闭所有：
            </p>
            <button
              onClick={() => {
                updateSettings({
                  soundEnabled: false,
                  musicEnabled: false,
                  vibrationEnabled: false
                })
              }}
              className="mt-4 px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
            >
              🤫 一键开启安静模式
            </button>
          </div>

          <div className="flex justify-center">
            <button
              onClick={exitToMenu}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors"
            >
              ← 返回菜单
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
