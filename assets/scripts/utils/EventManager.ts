export type EventCallback = (...args: any[]) => void;

interface EventHandler {
  callback: EventCallback;
  target: any;
}

export class EventManager {
  private static _instance: EventManager | null = null;
  private _events: Map<string, EventHandler[]> = new Map();

  public static get instance(): EventManager {
    if (!this._instance) {
      this._instance = new EventManager();
    }
    return this._instance;
  }

  public on(eventName: string, callback: EventCallback, target?: any): void {
    if (!this._events.has(eventName)) {
      this._events.set(eventName, []);
    }
    this._events.get(eventName)!.push({ callback, target: target || null });
  }

  public off(eventName: string, target?: any): void {
    const handlers = this._events.get(eventName);
    if (!handlers) return;

    if (target) {
      const filtered = handlers.filter(h => h.target !== target);
      if (filtered.length === 0) {
        this._events.delete(eventName);
      } else {
        this._events.set(eventName, filtered);
      }
    } else {
      this._events.delete(eventName);
    }
  }

  public emit(eventName: string, ...args: any[]): void {
    const handlers = this._events.get(eventName);
    if (!handlers) return;

    for (const handler of handlers) {
      if (handler.target) {
        handler.callback.apply(handler.target, args);
      } else {
        handler.callback(...args);
      }
    }
  }

  public clear(): void {
    this._events.clear();
  }

  public clearTarget(target: any): void {
    for (const [eventName, handlers] of this._events) {
      const filtered = handlers.filter(h => h.target !== target);
      if (filtered.length === 0) {
        this._events.delete(eventName);
      } else {
        this._events.set(eventName, filtered);
      }
    }
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
  UI_SHOW_MENU: 'ui_show_menu',
  UI_SHOW_LEVEL_SELECT: 'ui_show_level_select',
  UI_SHOW_LEADERBOARD: 'ui_show_leaderboard',
  UI_SHOW_TUTORIAL: 'ui_show_tutorial',
  UI_SHOW_RESULT: 'ui_show_result',
  TUTORIAL_STEP_CHANGED: 'tutorial_step_changed',
  TUTORIAL_COMPLETED: 'tutorial_completed',
};
