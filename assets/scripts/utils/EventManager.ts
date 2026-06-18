export type EventCallback = (...args: any[]) => void;

export class EventManager {
  private static _instance: EventManager | null = null;
  private _events: Map<string, EventCallback[]> = new Map();

  public static get instance(): EventManager {
    if (!this._instance) {
      this._instance = new EventManager();
    }
    return this._instance;
  }

  public on(eventName: string, callback: EventCallback): void {
    if (!this._events.has(eventName)) {
      this._events.set(eventName, []);
    }
    this._events.get(eventName)!.push(callback);
  }

  public off(eventName: string, callback: EventCallback): void {
    const callbacks = this._events.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  public emit(eventName: string, ...args: any[]): void {
    const callbacks = this._events.get(eventName);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(...args);
      }
    }
  }

  public clear(): void {
    this._events.clear();
  }
}

export const GameEvents = {
  GAME_START: 'game_start',
  GAME_PAUSE: 'game_pause',
  GAME_RESUME: 'game_resume',
  GAME_OVER: 'game_over',
  GAME_VICTORY: 'game_victory',
  SCORE_CHANGED: 'score_changed',
  MONEY_CHANGED: 'money_changed',
  TIME_TICK: 'time_tick',
  PHASE_CHANGED: 'phase_changed',
  CLUE_VIEWED: 'clue_viewed',
  CHOICE_MADE: 'choice_made',
  DOCUMENT_UPDATED: 'document_updated',
  MISMATCH_DETECTED: 'mismatch_detected',
  ERROR_RECORDED: 'error_recorded',
  LEVEL_COMPLETED: 'level_completed',
  LEVEL_UNLOCKED: 'level_unlocked',
  INPUT_ACTION: 'input_action',
};
