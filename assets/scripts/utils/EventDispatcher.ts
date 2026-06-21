type EventCallback = (event: any) => void;

export class EventDispatcher {
    private static instance: EventDispatcher;
    private listeners: Map<string, Array<{ callback: EventCallback; target: any }>> = new Map();

    private constructor() {}

    static getInstance(): EventDispatcher {
        if (!EventDispatcher.instance) {
            EventDispatcher.instance = new EventDispatcher();
        }
        return EventDispatcher.instance;
    }

    on(eventName: string, callback: EventCallback, target: any): void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }

        const listeners = this.listeners.get(eventName)!;
        const existingIndex = listeners.findIndex(
            l => l.callback === callback && l.target === target
        );

        if (existingIndex === -1) {
            listeners.push({ callback, target });
        }
    }

    off(eventName: string, callback: EventCallback, target: any): void {
        const listeners = this.listeners.get(eventName);
        if (!listeners) return;

        const index = listeners.findIndex(
            l => l.callback === callback && l.target === target
        );

        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    emit(eventName: string, eventData: any = null): void {
        const listeners = this.listeners.get(eventName);
        if (!listeners || listeners.length === 0) return;

        listeners.forEach(({ callback, target }) => {
            try {
                callback.call(target, eventData);
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
    }

    once(eventName: string, callback: EventCallback, target: any): void {
        const wrapper = (event: any) => {
            callback.call(target, event);
            this.off(eventName, wrapper, target);
        };
        this.on(eventName, wrapper, target);
    }

    removeAllListeners(eventName?: string): void {
        if (eventName) {
            this.listeners.delete(eventName);
        } else {
            this.listeners.clear();
        }
    }

    getListenerCount(eventName: string): number {
        const listeners = this.listeners.get(eventName);
        return listeners ? listeners.length : 0;
    }

    hasListeners(eventName: string): boolean {
        return this.getListenerCount(eventName) > 0;
    }
}
