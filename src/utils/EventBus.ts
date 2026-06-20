type EventCallback = (...args: any[]) => void;

export class EventBus {
  private static instance: EventBus;
  private events: Map<string, EventCallback[]>;

  private constructor() {
    this.events = new Map();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (!callbacks) return;

    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (!callbacks) return;

    callbacks.forEach(callback => {
      callback(...args);
    });
  }

  clear(): void {
    this.events.clear();
  }
}

export const events = EventBus.getInstance();
