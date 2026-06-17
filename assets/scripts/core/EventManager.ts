export enum GameEventType {
    GAME_START = 'GAME_START',
    GAME_PAUSE = 'GAME_PAUSE',
    GAME_RESUME = 'GAME_RESUME',
    GAME_OVER = 'GAME_OVER',
    LEVEL_COMPLETE = 'LEVEL_COMPLETE',
    LEVEL_FAIL = 'LEVEL_FAIL',
    ORDER_RECEIVED = 'ORDER_RECEIVED',
    ORDER_ASSIGNED = 'ORDER_ASSIGNED',
    ORDER_COMPLETED = 'ORDER_COMPLETED',
    ORDER_TIMEOUT = 'ORDER_TIMEOUT',
    ORDER_FAILED = 'ORDER_FAILED',
    CHOICE_MADE = 'CHOICE_MADE',
    CLUE_DISCOVERED = 'CLUE_DISCOVERED',
    RULE_UNLOCKED = 'RULE_UNLOCKED',
    SCORE_UPDATED = 'SCORE_UPDATED',
    TUTORIAL_STEP = 'TUTORIAL_STEP',
    TUTORIAL_COMPLETE = 'TUTORIAL_COMPLETE',
    REVIEW_FAILED = 'REVIEW_FAILED',
    SAVE_COMPLETE = 'SAVE_COMPLETE',
    LOAD_COMPLETE = 'LOAD_COMPLETE'
}

export interface IGameEvent {
    type: GameEventType;
    data?: any;
    timestamp: number;
}

type EventHandler = (event: IGameEvent) => void;

export class EventManager {
    private static instance: EventManager;
    private handlers: Map<GameEventType, EventHandler[]> = new Map();
    private eventHistory: IGameEvent[] = [];
    private readonly maxHistoryLength = 1000;

    private constructor() {}

    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    public on(type: GameEventType, handler: EventHandler): void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type)!.push(handler);
    }

    public off(type: GameEventType, handler: EventHandler): void {
        const handlers = this.handlers.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    public emit(type: GameEventType, data?: any): void {
        const event: IGameEvent = {
            type,
            data,
            timestamp: Date.now()
        };
        this.recordEvent(event);
        
        const handlers = this.handlers.get(type);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event);
                } catch (error) {
                    console.error(`Event handler error for ${type}:`, error);
                }
            });
        }
    }

    private recordEvent(event: IGameEvent): void {
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistoryLength) {
            this.eventHistory.shift();
        }
    }

    public getEventHistory(): IGameEvent[] {
        return [...this.eventHistory];
    }

    public clearHistory(): void {
        this.eventHistory = [];
    }

    public once(type: GameEventType, handler: EventHandler): void {
        const wrapper = (event: IGameEvent) => {
            handler(event);
            this.off(type, wrapper);
        };
        this.on(type, wrapper);
    }

    public removeAllListeners(): void {
        this.handlers.clear();
    }
}
