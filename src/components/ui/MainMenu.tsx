import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getTrainingLevels, getFreeLevels, Level } from '../../config/levels';
import { GameMode } from '../../types';

interface MainMenuProps {
  onStartGame: (levelId: string, mode: GameMode) => void;
}

export function MainMenu({ onStartGame }: MainMenuProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const initGame = useGameStore(state => state.initGame);

  const trainingLevels = getTrainingLevels();
  const freeLevels = getFreeLevels();

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
    setSelectedLevel(null);
  };

  const handleLevelSelect = (level: Level) => {
    setSelectedLevel(level);
  };

  const handleStartGame = () => {
    if (selectedLevel && selectedMode) {
      initGame(selectedLevel.id, selectedMode);
      onStartGame(selectedLevel.id, selectedMode);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  const currentLevels = selectedMode === 'training' ? trainingLevels : 
                        selectedMode === 'free' ? freeLevels : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🏗️ 家装工地材料进场调度
          </h1>
          <p className="text-xl text-blue-200">
            学习材料进场判断，提升工程监理能力
          </p>
        </div>

        {!selectedMode ? (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <button
              onClick={() => handleModeSelect('training')}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-transparent hover:border-blue-400 transition-all duration-300 text-left group"
            >
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-3xl font-bold text-white mb-2">训练模式</h2>
              <p className="text-blue-200 mb-4">
                循序渐进的关卡设计，从基础到进阶，系统学习材料调度知识
              </p>
              <div className="flex items-center text-blue-300 group-hover:text-white transition-colors">
                <span>开始学习</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="mt-4 flex gap-2">
                {trainingLevels.map((level, i) => (
                  <div
                    key={level.id}
                    className={`w-8 h-8 rounded-full ${getDifficultyColor(level.difficulty)} flex items-center justify-center text-white text-sm font-bold`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </button>

            <button
              onClick={() => handleModeSelect('free')}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-transparent hover:border-purple-400 transition-all duration-300 text-left group"
            >
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-3xl font-bold text-white mb-2">自由练习</h2>
              <p className="text-blue-200 mb-4">
                多种真实场景模拟，自由发挥调度能力，挑战不同难度
              </p>
              <div className="flex items-center text-blue-300 group-hover:text-white transition-colors">
                <span>开始挑战</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="mt-4 flex gap-2">
                {freeLevels.map((level, i) => (
                  <div
                    key={level.id}
                    className={`w-8 h-8 rounded-full ${getDifficultyColor(level.difficulty)} flex items-center justify-center text-white text-sm font-bold`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
            <button
              onClick={() => {
                setSelectedMode(null);
                setSelectedLevel(null);
              }}
              className="flex items-center text-blue-300 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回模式选择
            </button>

            <h2 className="text-3xl font-bold text-white mb-6">
              {selectedMode === 'training' ? '📚 训练关卡' : '🎮 自由挑战'}
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {currentLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleLevelSelect(level)}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                    selectedLevel?.id === level.id
                      ? 'bg-blue-500/30 border-blue-400'
                      : 'bg-white/5 border-transparent hover:border-blue-300/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-white">{level.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getDifficultyColor(level.difficulty)}`}>
                      {getDifficultyText(level.difficulty)}
                    </span>
                  </div>
                  <p className="text-blue-200 text-sm mb-4">{level.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-300">⏱️ {level.targetDays}天</span>
                    <span className="text-blue-300">📦 {level.initialInventory.length}种材料</span>
                  </div>
                  {level.hints.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-yellow-300">💡 本关有 {level.hints.length} 条提示</p>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {selectedLevel && (
              <div className="bg-white/10 rounded-xl p-6 border-2 border-blue-400/50">
                <h3 className="text-2xl font-bold text-white mb-4">
                  即将开始: {selectedLevel.name}
                </h3>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <p className="text-blue-200">
                      <span className="text-blue-300">难度:</span> {getDifficultyText(selectedLevel.difficulty)}
                    </p>
                    <p className="text-blue-200">
                      <span className="text-blue-300">目标天数:</span> {selectedLevel.targetDays}天
                    </p>
                    <p className="text-blue-200">
                      <span className="text-blue-300">供应商数量:</span> {selectedLevel.suppliers.length}家
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-blue-200">
                      <span className="text-blue-300">可用道具:</span> {selectedLevel.availableItems.length}个
                    </p>
                    <p className="text-blue-200">
                      <span className="text-blue-300">初始材料:</span> {selectedLevel.initialInventory.length}种
                    </p>
                  </div>
                </div>
                {selectedLevel.hints.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-yellow-300 font-bold mb-2">💡 提示</h4>
                    <ul className="text-yellow-200 text-sm space-y-1">
                      {selectedLevel.hints.map((hint, i) => (
                        <li key={i}>• {hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={handleStartGame}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 transform hover:scale-105"
                >
                  🚀 开始游戏
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 grid md:grid-cols-4 gap-4 text-center">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-white font-bold">8种材料</div>
            <div className="text-blue-300 text-sm">全面覆盖家装需求</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-3xl mb-2">🏢</div>
            <div className="text-white font-bold">3+供应商</div>
            <div className="text-blue-300 text-sm">真实供应商协调</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-white font-bold">突发事件</div>
            <div className="text-blue-300 text-sm">短缺、延误、质量问题</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-white font-bold">5项成就</div>
            <div className="text-blue-300 text-sm">挑战自我极限</div>
          </div>
        </div>
      </div>
    </div>
  );
}
