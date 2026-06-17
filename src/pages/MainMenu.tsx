import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Gamepad2, BookOpen, Trophy } from 'lucide-react';
import { GameContainer } from '@/components/layout/GameContainer';
import { LevelCard } from '@/components/game/LevelCard';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { levelManager } from '@/data/levelManager';
import { useGameStore } from '@/store/useGameStore';
import { progressStorage } from '@/utils/storage';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const { startGame } = useGameStore();
  const levels = levelManager.getAllLevels();

  const handleLevelSelect = (levelId: string) => {
    startGame(levelId);
    navigate('/loading');
  };

  const totalCompleted = levels.filter((l) => progressStorage.isCompleted(l.id)).length;
  const totalBestScore = levels.reduce((sum, l) => sum + progressStorage.getBestScore(l.id), 0);

  return (
    <GameContainer>
      <div className="py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Building2 className="w-16 h-16 text-accent-400" />
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                物业园区经营模拟
              </h1>
              <p className="text-xl text-gray-400">
                Property Park Management Simulator
              </p>
            </div>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            通过模拟巡检、合同审批、水电核算等真实业务场景，
            提升你的物业管理决策能力。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Gamepad2 className="w-12 h-12 text-primary-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white">{levels.length}</p>
              <p className="text-gray-400">可用关卡</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Trophy className="w-12 h-12 text-accent-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white">{totalCompleted}</p>
              <p className="text-gray-400">已完成关卡</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <BookOpen className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white">{totalBestScore}</p>
              <p className="text-gray-400">总积分</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Gamepad2 className="w-7 h-7 text-accent-400" />
            选择关卡
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level) => (
              <LevelCard
                key={level.id}
                levelId={level.id}
                onSelect={handleLevelSelect}
              />
            ))}
          </div>
        </div>

        <div className="mt-12 p-6 bg-primary-600/20 rounded-2xl border border-primary-500/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">操作说明</h3>
              <p className="text-gray-300">
                支持键盘和触屏操作。使用数字键 1-4 快速选择选项，
                Enter 确认，Esc 返回或暂停。
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" size="md">
                <BookOpen className="w-4 h-4 mr-2" />
                查看教程
              </Button>
            </div>
          </div>
        </div>
      </div>
    </GameContainer>
  );
};

export default MainMenu;
