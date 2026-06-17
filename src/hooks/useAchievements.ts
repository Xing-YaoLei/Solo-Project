import { useCallback, useEffect, useMemo } from 'react';
import { ACHIEVEMENTS, checkAchievementCondition } from '@/config/achievements';
import { loadAchievements, saveAchievements, loadStats } from '@/utils/storage';
import type { Achievement } from '@/types';
import { useAnalyticsStore } from '@/store/analyticsStore';

export const useAchievements = () => {
  const trackEvent = useAnalyticsStore(state => state.trackEvent);

  const achievements = useMemo((): Achievement[] => {
    const saved = loadAchievements();
    if (saved.length > 0) {
      return saved.map(a => {
        const template = ACHIEVEMENTS.find(t => t.id === a.id);
        return template ? { ...template, isUnlocked: a.isUnlocked, unlockedAt: a.unlockedAt } : a;
      });
    }
    return [...ACHIEVEMENTS];
  }, []);

  const unlockedAchievements = useMemo(() => 
    achievements.filter(a => a.isUnlocked),
    [achievements]
  );

  const lockedAchievements = useMemo(() => 
    achievements.filter(a => !a.isUnlocked),
    [achievements]
  );

  const progress = useMemo(() => {
    const total = achievements.length;
    const unlocked = unlockedAchievements.length;
    return {
      total,
      unlocked,
      percentage: total > 0 ? (unlocked / total) * 100 : 0,
    };
  }, [achievements.length, unlockedAchievements.length]);

  const checkAndUnlockAchievements = useCallback((stats: {
    score: number;
    time: number;
    accuracy: number;
    streak: number;
    difficulty?: string;
    noLagPoints?: boolean;
  }) => {
    const updatedAchievements = achievements.map(achievement => {
      if (achievement.isUnlocked) return achievement;

      let shouldUnlock = checkAchievementCondition(achievement.condition, stats);
      
      if (achievement.id === 'hard_mode_master' && stats.difficulty !== 'hard') {
        shouldUnlock = false;
      }
      if (achievement.id === 'no_lag' && !stats.noLagPoints) {
        shouldUnlock = false;
      }

      if (shouldUnlock) {
        trackEvent('achievement', {
          achievementId: achievement.id,
          achievementName: achievement.name,
        });
        return { ...achievement, isUnlocked: true, unlockedAt: Date.now() };
      }
      return achievement;
    });

    const newlyUnlocked = updatedAchievements.filter(
      (a, i) => a.isUnlocked && !achievements[i].isUnlocked
    );

    saveAchievements(updatedAchievements);
    return newlyUnlocked;
  }, [achievements, trackEvent]);

  const checkGameEndAchievements = useCallback((result: {
    success: boolean;
    score: number;
    time: number;
    accuracy: number;
    difficulty: string;
    lagPointCount: number;
  }) => {
    if (!result.success) return [];

    const stats = loadStats();
    
    return checkAndUnlockAchievements({
      score: result.score,
      time: result.time,
      accuracy: result.accuracy,
      streak: stats.currentStreak,
      difficulty: result.difficulty,
      noLagPoints: result.lagPointCount === 0,
    });
  }, [checkAndUnlockAchievements]);

  const getAchievementById = useCallback((id: string) => {
    return achievements.find(a => a.id === id);
  }, [achievements]);

  const resetAchievements = useCallback(() => {
    const reset = ACHIEVEMENTS.map(a => ({ ...a, isUnlocked: false, unlockedAt: undefined }));
    saveAchievements(reset);
    return reset;
  }, []);

  useEffect(() => {
    const saved = loadAchievements();
    if (saved.length === 0) {
      saveAchievements(ACHIEVEMENTS.map(a => ({ ...a, isUnlocked: false, unlockedAt: undefined })));
    }
  }, []);

  return {
    achievements,
    unlockedAchievements,
    lockedAchievements,
    progress,
    checkAndUnlockAchievements,
    checkGameEndAchievements,
    getAchievementById,
    resetAchievements,
  };
};
