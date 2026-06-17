import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { GameContainer } from '@/components/layout/GameContainer';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getRandomLoadingTip } from '@/data/mockData';
import { useGameStore } from '@/store/useGameStore';
import { levelManager } from '@/data/levelManager';

const LoadingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLevelId, setPhase } = useGameStore();
  const [progress, setProgress] = useState(0);
  const [tip] = useState(getRandomLoadingTip());
  const [loadingStatus, setLoadingStatus] = useState('正在初始化游戏资源...');

  const level = currentLevelId ? levelManager.getLevelById(currentLevelId) : null;

  useEffect(() => {
    if (!currentLevelId) {
      navigate('/');
      return;
    }

    const loadResources = async () => {
      const stages = [
        { progress: 20, status: '正在加载关卡配置...' },
        { progress: 40, status: '正在初始化游戏场景...' },
        { progress: 60, status: '正在准备租户数据...' },
        { progress: 80, status: '正在生成巡检路线...' },
        { progress: 95, status: '即将开始...' },
        { progress: 100, status: '准备完成！' },
      ];

      for (const stage of stages) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setProgress(stage.progress);
        setLoadingStatus(stage.status);
      }

      await levelManager.loadLevel(currentLevelId);
      
      setTimeout(() => {
        setPhase('inspection');
        navigate('/game/inspection');
      }, 500);
    };

    loadResources();
  }, [currentLevelId, navigate, setPhase]);

  return (
    <GameContainer>
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center max-w-lg w-full">
          <div className="mb-8">
            <Building2 className="w-20 h-20 text-accent-400 mx-auto mb-4 animate-pulse-slow" />
            <h1 className="text-3xl font-bold text-white mb-2">
              {level?.name || '加载中...'}
            </h1>
            <p className="text-gray-400">{level?.description}</p>
          </div>

          <div className="bg-gray-800/60 backdrop-blur-md rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
              <span className="text-white font-medium">{loadingStatus}</span>
            </div>

            <ProgressBar
              value={progress}
              max={100}
              size="lg"
              variant={progress >= 80 ? 'success' : 'default'}
              className="mb-6"
            />

            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-gray-400">加载进度</span>
              <span className="text-white font-mono font-bold">{progress}%</span>
            </div>

            <div className="mt-8 p-4 bg-primary-600/20 rounded-xl border border-primary-500/20">
              <p className="text-sm text-primary-300 italic">
                💡 {tip}
              </p>
            </div>
          </div>

          {level && (
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-800/40 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">
                  {level.contracts.tenants.length}
                </p>
                <p className="text-xs text-gray-400">租户合同</p>
              </div>
              <div className="bg-gray-800/40 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">
                  {level.workOrders.enabled ? level.workOrders.orders.length : 0}
                </p>
                <p className="text-xs text-gray-400">待处理工单</p>
              </div>
              <div className="bg-gray-800/40 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">
                  {Math.floor(level.timeLimit / 60)}
                </p>
                <p className="text-xs text-gray-400">时间限制(分钟)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </GameContainer>
  );
};

export default LoadingPage;
