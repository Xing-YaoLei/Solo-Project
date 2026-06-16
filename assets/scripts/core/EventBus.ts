import { GameEventType } from '../data/enums/GameEventType';

type EventCallback = (...args: any[]) => void;

export class EventBus {
    private static _instance: EventBus | null = null;
    private listeners: Map<GameEventType, EventCallback[]> = new Map();

    public static get instance(): EventBus {
        if (!EventBus._instance) {
            EventBus._instance = new EventBus();
        }
        return EventBus._instance;
    }

    public on(eventType: GameEventType, callback: EventCallback): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType)!.push(callback);
    }

    public off(eventType: GameEventType, callback: EventCallback): void {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    public emit(eventType: GameEventType, ...args: any[]): void {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event listener for ${eventType}:`, error);
                }
            });
        }
    }

    public clear(): void {
        this.listeners.clear();
    }

    public clearEvent(eventType: GameEventType): void {
        this.listeners.delete(eventType);
    }
}
