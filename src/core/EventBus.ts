export enum GameEvent {
  SCENE_CHANGED = 'scene:changed',
  LEVEL_STARTED = 'level:started',
  LEVEL_SELECTED = 'level:selected',
  TASK_SELECTED = 'task:selected',
  TASK_ACCEPTED = 'task:accepted',
  TASK_COMPLETED = 'task:completed',
  TASK_FAILED = 'task:failed',
  CLUE_DISCOVERED = 'clue:discovered',
  CLUE_MISSED = 'clue:missed',
  ACTION_EXECUTED = 'action:executed',
  ACTION_FAILED = 'action:failed',
  CHANGE_ORDER_CREATED = 'change_order:created',
  CHANGE_ORDER_SIGNED = 'change_order:signed',
  CHANGE_ORDER_REJECTED = 'change_order:rejected',
  CHANGE_ORDER_UPDATED = 'change_order:updated',
  INSPECTION_STARTED = 'inspection:started',
  INSPECTION_COMPLETED = 'inspection:completed',
  INSPECTION_FAILED = 'inspection:failed',
  MATERIAL_DELAYED = 'material:delayed',
  SCORE_UPDATED = 'score:updated',
  BUDGET_UPDATED = 'budget:updated',
  PHASE_CHANGED = 'phase:changed',
  PHASE_COMPLETED = 'phase:completed',
  MISTAKE_MADE = 'mistake:made',
  DECISION_MADE = 'decision:made',
  TUTORIAL_STEP = 'tutorial:step',
  AUDIO_PLAY = 'audio:play',
  AUDIO_STOP = 'audio:stop',
  SETTINGS_CHANGED = 'settings:changed',
  GAME_PAUSED = 'game:paused',
  GAME_RESUMED = 'game:resumed',
}

interface EventCallback<T = unknown> {
  (data: T): void;
}

interface EventSubscriber {
  callback: EventCallback<unknown>;
  priority: number;
  once: boolean;
}

const DEFAULT_PRIORITY = 10;

export class EventBus {
  private static instance: EventBus | null = null;
  private subscribers: Map<string, Set<EventSubscriber>> = new Map();
  private eventHistory: { event: string; data: unknown; timestamp: number }[] = [];
  private maxHistorySize = 100;
  private paused = false;
  private queuedEvents: { event: string; data: unknown }[] = [];

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  private constructor() {}

  on<T = unknown>(
    event: string,
    callback: EventCallback<T>,
    priority: number = DEFAULT_PRIORITY
  ): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    const subscriber: EventSubscriber = {
      callback: callback as EventCallback<unknown>,
      priority,
      once: false,
    };

    this.subscribers.get(event)!.add(subscriber);

    return () => this.off(event, callback);
  }

  once<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    const subscriber: EventSubscriber = {
      callback: callback as EventCallback<unknown>,
      priority: DEFAULT_PRIORITY,
      once: true,
    };

    this.subscribers.get(event)!.add(subscriber);

    return () => this.off(event, callback);
  }

  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    const subscribers = this.subscribers.get(event);
    if (!subscribers) return;

    for (const subscriber of subscribers) {
      if (subscriber.callback === callback) {
        subscribers.delete(subscriber);
        break;
      }
    }

    if (subscribers.size === 0) {
      this.subscribers.delete(event);
    }
  }

  emit<T = unknown>(event: string, data?: T): boolean {
    if (this.paused) {
      this.queuedEvents.push({ event, data });
      return false;
    }

    this.recordHistory(event, data);

    const subscribers = this.subscribers.get(event);
    if (!subscribers || subscribers.size === 0) {
      return true;
    }

    const sortedSubscribers = Array.from(subscribers).sort(
      (a, b) => a.priority - b.priority
    );

    const toRemove: EventSubscriber[] = [];

    for (const subscriber of sortedSubscribers) {
      try {
        subscriber.callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in subscriber for event "${event}":`, error);
      }

      if (subscriber.once) {
        toRemove.push(subscriber);
      }
    }

    for (const subscriber of toRemove) {
      subscribers.delete(subscriber);
    }

    if (subscribers.size === 0) {
      this.subscribers.delete(event);
    }

    return true;
  }

  clear(event?: string): void {
    if (event) {
      this.subscribers.delete(event);
    } else {
      this.subscribers.clear();
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    this.flushQueue();
  }

  private flushQueue(): void {
    while (this.queuedEvents.length > 0) {
      const { event, data } = this.queuedEvents.shift()!;
      this.emit(event, data);
    }
  }

  private recordHistory(event: string, data: unknown): void {
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now(),
    });

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  getHistory(): { event: string; data: unknown; timestamp: number }[] {
    return [...this.eventHistory];
  }

  hasSubscribers(event: string): boolean {
    const subscribers = this.subscribers.get(event);
    return !!subscribers && subscribers.size > 0;
  }

  getSubscriberCount(event: string): number {
    const subscribers = this.subscribers.get(event);
    return subscribers ? subscribers.size : 0;
  }
}

export const eventBus = EventBus.getInstance();
