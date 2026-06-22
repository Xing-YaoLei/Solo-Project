export type EventCallback = (...args: any[]) => void;

interface EventListener {
    callback: EventCallback;
    target: any;
    once: boolean;
}

export class EventManager {
    private static _instance: EventManager | null = null;

    public static get instance(): EventManager {
        if (!EventManager._instance) {
            EventManager._instance = new EventManager();
        }
        return EventManager._instance;
    }

    private _events: Map<string, EventListener[]> = new Map();

    constructor() {
    }

    public on(eventName: string, callback: EventCallback, target?: any): void {
        if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
        }

        const listeners = this._events.get(eventName)!;
        listeners.push({
            callback,
            target: target || null,
            once: false
        });
    }

    public once(eventName: string, callback: EventCallback, target?: any): void {
        if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
        }

        const listeners = this._events.get(eventName)!;
        listeners.push({
            callback,
            target: target || null,
            once: true
        });
    }

    public off(eventName: string, callback: EventCallback, target?: any): void {
        const listeners = this._events.get(eventName);
        if (!listeners) return;

        for (let i = listeners.length - 1; i >= 0; i--) {
            const listener = listeners[i];
            if (listener.callback === callback && 
                (target === undefined || listener.target === target)) {
                listeners.splice(i, 1);
            }
        }

        if (listeners.length === 0) {
            this._events.delete(eventName);
        }
    }

    public emit(eventName: string, ...args: any[]): void {
        const listeners = this._events.get(eventName);
        if (!listeners || listeners.length === 0) return;

        const listenersCopy = [...listeners];

        for (let i = 0; i < listenersCopy.length; i++) {
            const listener = listenersCopy[i];
            try {
                if (listener.target) {
                    listener.callback.apply(listener.target, args);
                } else {
                    listener.callback(...args);
                }
            } catch (e) {
                console.error(`Error in event listener for "${eventName}":`, e);
            }

            if (listener.once) {
                this.off(eventName, listener.callback, listener.target);
            }
        }
    }

    public removeAllListeners(eventName?: string): void {
        if (eventName) {
            this._events.delete(eventName);
        } else {
            this._events.clear();
        }
    }

    public getListenerCount(eventName: string): number {
        const listeners = this._events.get(eventName);
        return listeners ? listeners.length : 0;
    }

    public hasListener(eventName: string): boolean {
        return this.getListenerCount(eventName) > 0;
    }
}

export const GameEvent = {
    CASE_STARTED: 'case_started',
    CASE_ENDED: 'case_ended',
    STAGE_CHANGED: 'stage_changed',
    SCORE_CHANGED: 'score_changed',
    CLUE_DISCOVERED: 'clue_discovered',
    ACTION_TAKEN: 'action_taken',
    LEVEL_UNLOCKED: 'level_unlocked',
    CLIENT_UNLOCKED: 'client_unlocked',
    TUTORIAL_COMPLETE: 'tutorial_complete',
    SETTINGS_CHANGED: 'settings_changed'
};
