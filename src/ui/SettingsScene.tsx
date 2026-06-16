import React from 'react';
import { ArrowLeft, Volume2, VolumeX, Music, Music2, Sparkles, Smartphone, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { audioUtils } from '@/utils/audio';
import { vibrationUtils } from '@/utils/vibration';

interface SettingsSceneProps {
  onBack: () => void;
}

export const SettingsScene: React.FC<SettingsSceneProps> = ({ onBack }) => {
  const {
    soundEnabled,
    musicEnabled,
    animationEnabled,
    vibrationEnabled,
    volume,
    setSoundEnabled,
    setMusicEnabled,
    setAnimationEnabled,
    setVibrationEnabled,
    setVolume,
    resetSettings,
  } = useSettingsStore();

  const { resetProgress } = usePlayerStore();

  const handleToggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    if (newValue) {
      audioUtils.playClick();
    }
  };

  const handleToggleMusic = () => {
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);
    audioUtils.playClick();
    vibrationUtils.click();
  };

  const handleToggleAnimation = () => {
    const newValue = !animationEnabled;
    setAnimationEnabled(newValue);
    audioUtils.playClick();
    vibrationUtils.click();
  };

  const handleToggleVibration = () => {
    const newValue = !vibrationEnabled;
    setVibrationEnabled(newValue);
    audioUtils.playClick();
    if (newValue) {
      vibrationUtils.click();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioUtils.playClick();
  };

  const handleResetSettings = () => {
    if (confirm('确定要重置所有设置吗？')) {
      resetSettings();
      audioUtils.playClick();
      vibrationUtils.click();
    }
  };

  const handleResetProgress = () => {
    if (confirm('确定要重置所有游戏进度吗？这将删除所有历史记录！')) {
      resetProgress();
      audioUtils.playClick();
      vibrationUtils.click();
    }
  };

  const Switch: React.FC<{
    checked: boolean;
    onChange: () => void;
    label: string;
    description: string;
    icon: React.ReactNode;
    activeColor: string;
  }> = ({ checked, onChange, label, description, icon, activeColor }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${checked ? activeColor : 'bg-gray-100'} transition-colors`}>
          {icon}
        </div>
        <div>
          <div className="font-medium text-gray-800">{label}</div>
          <div className="text-sm text-gray-500">{description}</div>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pharmacy-300 ${
          checked ? 'bg-pharmacy-500' : 'bg-gray-300'
        }`}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => { audioUtils.playClick(); vibrationUtils.click(); onBack(); }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={24} />
            <span className="font-medium">返回菜单</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">游戏设置</h1>
        </div>

        <div className="space-y-4 animate-fade-in">
          <Switch
            checked={soundEnabled}
            onChange={handleToggleSound}
            label="音效"
            description="控制游戏内的操作音效"
            icon={soundEnabled ? <Volume2 size={24} className="text-white" /> : <VolumeX size={24} className="text-gray-400" />}
            activeColor="bg-pharmacy-500"
          />

          <Switch
            checked={musicEnabled}
            onChange={handleToggleMusic}
            label="背景音乐"
            description="控制游戏内的背景音乐"
            icon={musicEnabled ? <Music size={24} className="text-white" /> : <Music2 size={24} className="text-gray-400" />}
            activeColor="bg-purple-500"
          />

          <Switch
            checked={animationEnabled}
            onChange={handleToggleAnimation}
            label="动画效果"
            description="控制界面动画和特效，关闭可提升性能"
            icon={<Sparkles size={24} className={animationEnabled ? 'text-white' : 'text-gray-400'} />}
            activeColor="bg-promo-500"
          />

          <Switch
            checked={vibrationEnabled}
            onChange={handleToggleVibration}
            label="震动反馈"
            description="控制设备震动反馈（仅支持震动的设备）"
            icon={<Smartphone size={24} className={vibrationEnabled ? 'text-white' : 'text-gray-400'} />}
            activeColor="bg-alert-500"
          />

          {soundEnabled && (
            <div className="p-4 bg-white rounded-xl shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Volume2 size={20} className="text-pharmacy-500" />
                  <span className="font-medium text-gray-800">音量</span>
                </div>
                <span className="text-sm text-gray-500">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pharmacy-500"
              />
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">数据管理</h2>
            <div className="space-y-3">
              <button
                onClick={handleResetSettings}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCcw size={20} />
                重置设置为默认值
              </button>
              <button
                onClick={handleResetProgress}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-alert-50 text-alert-600 border border-alert-200 rounded-lg hover:bg-alert-100 transition-colors"
              >
                <RotateCcw size={20} />
                重置所有游戏进度
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-pharmacy-50 rounded-xl border border-pharmacy-200">
            <h3 className="font-bold text-pharmacy-700 mb-2">💡 办公模式提示</h3>
            <p className="text-sm text-pharmacy-600">
              关闭音效和震动后，您可以在办公环境中安静地进行陈列训练。
              游戏会继续记录您的成绩和进度。
            </p>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-bold text-gray-700 mb-2">⌨️ 快捷键</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div><kbd className="px-2 py-1 bg-white rounded shadow-sm">Tab</kbd> 选择卡片</div>
              <div><kbd className="px-2 py-1 bg-white rounded shadow-sm">↑↓←→</kbd> 移动位置</div>
              <div><kbd className="px-2 py-1 bg-white rounded shadow-sm">Enter</kbd> 确认摆放</div>
              <div><kbd className="px-2 py-1 bg-white rounded shadow-sm">Esc</kbd> 暂停/返回</div>
              <div><kbd className="px-2 py-1 bg-white rounded shadow-sm">R</kbd> 快速重玩</div>
              <div><kbd className="px-2 py-1 bg-white rounded shadow-sm">Space</kbd> 继续游戏</div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 mt-8 pb-4">
            药店陈列大师 v1.0.0 | 专业药品陈列培训系统
          </div>
        </div>
      </div>
    </div>
  );
};
