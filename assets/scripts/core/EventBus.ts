import { GameEventType } from '../data/enums/GameEventType';

type EventCallback = (...args: any[]) => void;

export class EventBus {
    private static _instance: EventBus | null = null;
    private listeners: Map<GameEventType, { callback: EventCallback; target?: any }[]> = new Map();

    public static get instance(): EventBus {
        if (!EventBus._instance) {
            EventBus._instance = new EventBus();
        }
        return EventBus._instance;
    }

    public on(eventType: GameEventType, callback: EventCallback, target?: any): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType)!.push({ callback, target });
    }

    public off(eventType: GameEventType, callback: EventCallback, target?: any): void {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            const index = callbacks.findIndex(item => item.callback === callback && (target === undefined || item.target === target));
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    public emit(eventType: GameEventType, ...args: any[]): void {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            callbacks.forEach(item => {
                try {
                    item.callback.apply(item.target, args);
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
