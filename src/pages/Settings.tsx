import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Music, Music2, BarChart3, BarChart2, Sparkles, Trash2, Save, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { loadSettings, saveSettings, loadStats, clearAllData } from '@/utils/storage';
import { useReplayStore } from '@/store/replayStore';
import type { Settings as SettingsType } from '@/types';

export const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const clearReplays = useReplayStore(state => state.clearReplays);
  const loadReplays = useReplayStore(state => state.loadReplays);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleToggle = (key: keyof SettingsType) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleSave = () => {
    if (!settings) return;
    saveSettings(settings);
    setSaveMessage('设置已保存');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleReset = () => {
    const defaultSettings: SettingsType = {
      soundEnabled: true,
      musicEnabled: true,
      analyticsEnabled: true,
      postProcessingEnabled: true,
    };
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
    setSaveMessage('设置已重置');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleClearData = () => {
    clearAllData();
    clearReplays();
    loadReplays();
    setShowClearConfirm(false);
    setSaveMessage('所有数据已清除');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const stats = loadStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-white font-orbitron">游戏设置</h1>
              <p className="text-sm text-slate-400">自定义您的游戏体验</p>
            </div>
          </div>
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium"
            >
              {saveMessage}
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {settings && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-white mb-4">音频设置</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    {settings.soundEnabled ? (
                      <Volume2 className="text-blue-400" size={24} />
                    ) : (
                      <VolumeX className="text-slate-500" size={24} />
                    )}
                    <div>
                      <div className="text-white font-medium">音效</div>
                      <div className="text-sm text-slate-400">游戏内交互音效</div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggle('soundEnabled')}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      settings.soundEnabled ? 'bg-blue-500' : 'bg-slate-600'
                    }`}
                  >
                    <motion.div
                      animate={{ x: settings.soundEnabled ? 28 : 2 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                    />
                  </motion.button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    {settings.musicEnabled ? (
                      <Music className="text-purple-400" size={24} />
                    ) : (
                      <Music2 className="text-slate-500" size={24} />
                    )}
                    <div>
                      <div className="text-white font-medium">背景音乐</div>
                      <div className="text-sm text-slate-400">游戏背景音乐和氛围音</div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggle('musicEnabled')}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      settings.musicEnabled ? 'bg-purple-500' : 'bg-slate-600'
                    }`}
                  >
                    <motion.div
                      animate={{ x: settings.musicEnabled ? 28 : 2 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                    />
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-white mb-4">显示设置</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    {settings.postProcessingEnabled ? (
                      <Sparkles className="text-yellow-400" size={24} />
                    ) : (
                      <EyeOff className="text-slate-500" size={24} />
                    )}
                    <div>
                      <div className="text-white font-medium">后处理效果</div>
                      <div className="text-sm text-slate-400">Bloom、Vignette等视觉效果</div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggle('postProcessingEnabled')}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      settings.postProcessingEnabled ? 'bg-yellow-500' : 'bg-slate-600'
                    }`}
                  >
                    <motion.div
                      animate={{ x: settings.postProcessingEnabled ? 28 : 2 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                    />
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-white mb-4">数据与隐私</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    {settings.analyticsEnabled ? (
                      <BarChart3 className="text-green-400" size={24} />
                    ) : (
                      <BarChart2 className="text-slate-500" size={24} />
                    )}
                    <div>
                      <div className="text-white font-medium">数据收集</div>
                      <div className="text-sm text-slate-400">匿名收集游戏数据用于改进体验</div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggle('analyticsEnabled')}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      settings.analyticsEnabled ? 'bg-green-500' : 'bg-slate-600'
                    }`}
                  >
                    <motion.div
                      animate={{ x: settings.analyticsEnabled ? 28 : 2 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                    />
                  </motion.button>
                </div>

                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Trash2 className="text-red-400 mt-1" size={24} />
                      <div>
                        <div className="text-white font-medium">清除所有数据</div>
                        <div className="text-sm text-slate-400">
                          清除所有本地存储数据，包括成就、统计、回放记录和设置
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    {!showClearConfirm ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowClearConfirm(true)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                      >
                        清除数据
                      </motion.button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">确定要清除所有数据吗？</span>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleClearData}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                          确定清除
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowClearConfirm(false)}
                          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors text-sm font-medium"
                        >
                          取消
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-white mb-4">游戏统计</h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.totalGames}</div>
                  <div className="text-xs text-slate-400 mt-1">总场次</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
                  <div className="text-xs text-slate-400 mt-1">胜利</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{stats.bestScore}</div>
                  <div className="text-xs text-slate-400 mt-1">最高分</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">{stats.bestStreak}</div>
                  <div className="text-xs text-slate-400 mt-1">最高连胜</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-600">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">总游戏时长</span>
                  <span className="text-white font-medium">
                    {Math.floor(stats.totalPlayTime / 3600)}小时{Math.floor((stats.totalPlayTime % 3600) / 60)}分钟
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-400">当前连胜</span>
                  <span className="text-white font-medium">{stats.currentStreak}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} />
                保存设置
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReset}
                className="px-6 py-4 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                重置默认
              </motion.button>
            </div>

            <div className="text-center text-sm text-slate-500 pt-4">
              <p>物业园区停车缴费调度 v1.0.0</p>
              <p className="mt-1">使用 Three.js · React Three Fiber · Rapier 构建</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
