import { _decorator } from 'cc';
import { Singleton } from '../core/Singleton';
import { EventBus, GameEvents } from '../core/EventBus';
import { ScheduleManager } from './ScheduleManager';
import { TimeManager } from './TimeManager';
import { ConfigManager } from '../config/ConfigManager';
import { AnalyticsService } from '../services/AnalyticsService';
import { AchievementService } from '../services/AchievementService';
import { GameStatistics, BottleneckPoint, ItemEffect } from '../types';
const { ccclass } = _decorator;

@ccclass('SettlementManager')
export class SettlementManager extends Singleton<SettlementManager> {
  private _statistics: GameStatistics = this.createEmptyStatistics();
  private _bottleneckTracker: BottleneckTracker | null = null;
  private _settled: boolean = false;

  get statistics(): GameStatistics {
    return { ...this._statistics };
  }

  get isSettled(): boolean {
    return this._settled;
  }

  init(): void {
    this._statistics = this.createEmptyStatistics();
    this._settled = false;
    this._bottleneckTracker = new BottleneckTracker();
    this._bottleneckTracker.start();
  }

  private createEmptyStatistics(): GameStatistics {
    return {
      totalTime: 0,
      reviewTime: 0,
      completionTime: 0,
      conflictCount: 0,
      resolvedConflicts: 0,
      studentSatisfaction: 0,
      scheduleQuality: 0,
      bottlenecks: [],
    };
  }

  trackBottleneck(position: { x: number; y: number }, action: string): void {
    if (this._bottleneckTracker) {
      this._bottleneckTracker.trackAction(position, action);
    }
  }

  processItemEffect(effect: ItemEffect): void {
    switch (effect.type) {
      case 'extend_time':
        TimeManager.getInstance().applyItemEffect(effect);
        break;
      case 'resolve_conflict':
        ScheduleManager.getInstance().resolveAllConflicts();
        break;
      case 'boost_satisfaction':
        ScheduleManager.getInstance().boostSatisfaction(effect.value);
        break;
      case 'reveal_preference':
        EventBus.instance.emit('reveal_preferences');
        break;
    }
  }

  calculateSettlement(success: boolean): GameStatistics {
    const scheduleManager = ScheduleManager.getInstance();
    const timeManager = TimeManager.getInstance();
    const config = ConfigManager.getInstance().difficultyConfig;

    this._statistics.totalTime = timeManager.totalGameDuration;
    this._statistics.reviewTime = timeManager.getReviewDuration();
    this._statistics.completionTime = success ? timeManager.timeElapsed : timeManager.totalGameDuration;
    this._statistics.conflictCount = scheduleManager.conflicts.length;
    this._statistics.resolvedConflicts = scheduleManager.conflicts.filter(c => c.resolved).length;
    this._statistics.studentSatisfaction = scheduleManager.getAverageSatisfaction();
    this._statistics.scheduleQuality = scheduleManager.getScheduleQuality();
    
    if (this._bottleneckTracker) {
      this._statistics.bottlenecks = this._bottleneckTracker.getBottlenecks();
      this._bottleneckTracker.stop();
    }

    this._settled = true;

    AnalyticsService.getInstance().trackGameEnd(success, {
      difficulty: config.level,
      ...this._statistics,
    });

    const perfectSchedule = this._statistics.conflictCount === 0;
    
    AchievementService.getInstance().updateProgress('complete_n_games', 
      AchievementService.getInstance().totalGamesCompleted + (success ? 1 : 0));
    
    if (success && perfectSchedule) {
      AchievementService.getInstance().updateProgress('perfect_schedule', 1);
    }
    
    if (success && this._statistics.completionTime <= 120) {
      AchievementService.getInstance().updateProgress('fast_completion', this._statistics.completionTime);
    }

    return this._statistics;
  }

  calculateScore(): number {
    const stats = this._statistics;
    const config = ConfigManager.getInstance().difficultyConfig;
    
    let score = 0;
    
    score += stats.studentSatisfaction * 10;
    score += stats.scheduleQuality * 5;
    
    if (stats.conflictCount > 0) {
      score -= (stats.conflictCount - stats.resolvedConflicts) * 50;
    }
    
    const timeBonus = Math.max(0, (config.timeLimit - stats.completionTime) / config.timeLimit) * 500;
    score += timeBonus;
    
    const difficultyMultiplier = config.level === 'easy' ? 1 : config.level === 'normal' ? 1.5 : 2;
    score *= difficultyMultiplier;
    
    return Math.max(0, Math.floor(score));
  }

  getGrade(): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
    const score = this.calculateScore();
    const config = ConfigManager.getInstance().difficultyConfig;
    const maxPossibleScore = 100 * 10 + 100 * 5 + 500;
    const adjustedScore = score / (config.level === 'easy' ? 1 : config.level === 'normal' ? 1.5 : 2);
    const percentage = adjustedScore / maxPossibleScore;

    if (percentage >= 0.95) return 'S';
    if (percentage >= 0.85) return 'A';
    if (percentage >= 0.70) return 'B';
    if (percentage >= 0.55) return 'C';
    if (percentage >= 0.40) return 'D';
    return 'F';
  }

  isSuccess(): boolean {
    const config = ConfigManager.getInstance().difficultyConfig;
    const scheduleManager = ScheduleManager.getInstance();
    
    const allStudentsComplete = scheduleManager.isComplete();
    const meetsSatisfaction = this._statistics.studentSatisfaction >= config.minSatisfaction;
    const noUnresolvedConflicts = scheduleManager.unresolvedConflicts.length === 0;
    
    return allStudentsComplete && meetsSatisfaction && noUnresolvedConflicts;
  }

  getBottleneckAnalysis(): string[] {
    const analysis: string[] = [];
    const bottlenecks = this._statistics.bottlenecks;

    if (bottlenecks.length === 0) {
      analysis.push('操作流畅，无明显卡点');
      return analysis;
    }

    const longBottlenecks = bottlenecks.filter(b => b.duration > 3);
    if (longBottlenecks.length > 0) {
      const longest = longBottlenecks.reduce((a, b) => a.duration > b.duration ? a : b);
      analysis.push(`最长卡点: ${longest.action} (${longest.duration.toFixed(1)}秒)`);
    }

    const actionCounts = new Map<string, number>();
    bottlenecks.forEach(b => {
      actionCounts.set(b.action, (actionCounts.get(b.action) || 0) + 1);
    });

    const mostCommon = Array.from(actionCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (mostCommon) {
      analysis.push(`最频繁卡点操作: ${mostCommon[0]} (${mostCommon[1]}次)`);
    }

    return analysis;
  }

  reset(): void {
    this._statistics = this.createEmptyStatistics();
    this._settled = false;
    if (this._bottleneckTracker) {
      this._bottleneckTracker.stop();
      this._bottleneckTracker = new BottleneckTracker();
    }
  }
}

class BottleneckTracker {
  private _currentAction: string | null = null;
  private _currentPosition: { x: number; y: number } | null = null;
  private _actionStartTime: number = 0;
  private _bottlenecks: BottleneckPoint[] = [];
  private _running: boolean = false;

  start(): void {
    this._running = true;
    this._bottlenecks = [];
  }

  stop(): void {
    this._running = false;
    this.endCurrentAction();
  }

  trackAction(position: { x: number; y: number }, action: string): void {
    if (!this._running) return;

    if (this._currentAction) {
      this.endCurrentAction();
    }

    this._currentAction = action;
    this._currentPosition = position;
    this._actionStartTime = Date.now();
  }

  private endCurrentAction(): void {
    if (!this._currentAction || !this._currentPosition) return;

    const duration = (Date.now() - this._actionStartTime) / 1000;
    
    if (duration >= 1) {
      this._bottlenecks.push({
        timestamp: this._actionStartTime,
        position: { ...this._currentPosition },
        duration,
        action: this._currentAction,
      });

      AnalyticsService.getInstance().trackBottleneck(
        this._currentPosition,
        duration,
        this._currentAction
      );
    }

    this._currentAction = null;
    this._currentPosition = null;
  }

  getBottlenecks(): BottleneckPoint[] {
    this.endCurrentAction();
    return [...this._bottlenecks];
  }
}
