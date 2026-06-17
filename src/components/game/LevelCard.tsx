import React from 'react';
import { Star, Clock, Trophy, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { levelManager } from '@/data/levelManager';
import { progressStorage } from '@/utils/storage';
import type { LevelConfig } from '@/types';

interface LevelCardProps {
  levelId: string;
  onSelect: (levelId: string) => void;
}

export const LevelCard: React.FC<LevelCardProps> = ({ levelId, onSelect }) => {
  const level = levelManager.getLevelById(levelId);
  const progress = progressStorage.get(levelId);

  if (!level) return null;

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= (progress?.stars ?? 0)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const difficultyStars = (difficulty: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((d) => (
          <div
            key={d}
            className={`w-2 h-2 rounded-full ${
              d <= difficulty ? 'bg-accent-500' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card hover className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{level.name}</CardTitle>
            <CardDescription>{level.description}</CardDescription>
          </div>
          {progress?.completed && (
            <div className="flex flex-col items-end gap-1">
              {renderStars(progress.stars)}
              <span className="text-xs text-gray-400">最高: {progress.bestScore}分</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">
              时限: {Math.floor(level.timeLimit / 60)}分钟
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">租户: {level.contracts.tenants.length}个</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">难度:</span>
            {difficultyStars(level.difficulty)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">工单:</span>
            <span className="text-gray-300">
              {level.workOrders.enabled ? level.workOrders.orders.length + '个' : '无'}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <span className="text-sm text-gray-400">
          已挑战 {progress?.attempts ?? 0} 次
        </span>
        <Button
          onClick={() => onSelect(levelId)}
          variant={progress?.completed ? 'secondary' : 'accent'}
          size="sm"
          keyboardShortcut="Enter"
        >
          <Play className="w-4 h-4 mr-1" />
          {progress?.completed ? '再次挑战' : '开始挑战'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LevelCard;
