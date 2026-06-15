import { Singleton } from '../core/Singleton';
import { EventBus, GameEvents } from '../core/EventBus';
import { ConfigManager } from '../config/ConfigManager';
import { AnalyticsEvent } from '../types';

export class AnalyticsService extends Singleton<AnalyticsService> {
  private _events: AnalyticsEvent[] = [];
  private _enabled: boolean = true;

  get events(): AnalyticsEvent[] {
    return [...this._events];
  }

  init(): void {
    this._enabled = ConfigManager.getInstance().analyticsConfig.enabled;
    EventBus.instance.on(GameEvents.ANALYTICS_EVENT, this.track.bind(this));
  }

  track(event: string, data: Record<string, unknown> = {}): void {
    if (!this._enabled) return;

    const config = ConfigManager.getInstance().analyticsConfig;
    if (config.events.length > 0 && !config.events.includes(event)) {
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      timestamp: Date.now(),
      data,
    };

    this._events.push(analyticsEvent);
    this.dispatch(analyticsEvent);
  }

  private dispatch(event: AnalyticsEvent): void {
    console.log('[Analytics]', event.event, event.data);
  }

  trackGameStart(difficulty: string): void {
    this.track('game_start', { difficulty });
  }

  trackGameEnd(success: boolean, stats: Record<string, unknown>): void {
    this.track('game_end', { success, ...stats });
  }

  trackCoursePlaced(courseId: string, classroomId: string, weekday: number, timeSlot: number): void {
    this.track('course_placed', { courseId, classroomId, weekday, timeSlot });
  }

  trackCourseRemoved(courseId: string, classroomId: string): void {
    this.track('course_removed', { courseId, classroomId });
  }

  trackConflictOccurred(conflictType: string, classroomId?: string, courseId?: string): void {
    this.track('conflict_occurred', { type: conflictType, classroomId, courseId });
  }

  trackConflictResolved(conflictId: string, resolution: string): void {
    this.track('conflict_resolved', { conflictId, resolution });
  }

  trackItemUsed(itemId: string): void {
    this.track('item_used', { itemId });
  }

  trackAchievementUnlocked(achievementId: string): void {
    this.track('achievement_unlocked', { achievementId });
  }

  trackTutorialStep(step: number, completed: boolean): void {
    this.track('tutorial_step', { step, completed });
  }

  trackBottleneck(position: { x: number; y: number }, duration: number, action: string): void {
    this.track('bottleneck', { position, duration, action });
  }

  getEventCount(eventName: string): number {
    return this._events.filter(e => e.event === eventName).length;
  }

  export(): string {
    return JSON.stringify(this._events, null, 2);
  }

  clear(): void {
    this._events = [];
  }

  destroy(): void {
    EventBus.instance.off(GameEvents.ANALYTICS_EVENT);
    this.clear();
  }
}
