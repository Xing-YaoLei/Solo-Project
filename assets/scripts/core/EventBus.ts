type EventCallback = (...args: unknown[]) => void;

export class EventBus {
  private static _instance: EventBus;
  private _events: Map<string, EventCallback[]> = new Map();

  static get instance(): EventBus {
    if (!this._instance) {
      this._instance = new EventBus();
    }
    return this._instance;
  }

  on(event: string, callback: EventCallback): void {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }
    this._events.get(event)!.push(callback);
  }

  off(event: string, callback?: EventCallback): void {
    if (!callback) {
      this._events.delete(event);
      return;
    }
    const callbacks = this._events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const callbacks = this._events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }

  clear(): void {
    this._events.clear();
  }
}

export const GameEvents = {
  GAME_START: 'game_start',
  GAME_PAUSE: 'game_pause',
  GAME_RESUME: 'game_resume',
  GAME_END: 'game_end',
  COURSE_DRAG_START: 'course_drag_start',
  COURSE_DRAG_END: 'course_drag_end',
  COURSE_PLACED: 'course_placed',
  COURSE_REMOVED: 'course_removed',
  CONFLICT_OCCURRED: 'conflict_occurred',
  CONFLICT_RESOLVED: 'conflict_resolved',
  STUDENT_COMPLETED: 'student_completed',
  TIME_UPDATE: 'time_update',
  TUTORIAL_STEP: 'tutorial_step',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  ITEM_USED: 'item_used',
  SETTINGS_CHANGED: 'settings_changed',
  ANALYTICS_EVENT: 'analytics_event',
} as const;
