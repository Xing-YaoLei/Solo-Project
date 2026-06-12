type EventCallback = (...args: any[]) => void;

export class EventManager {
    private static _instance: EventManager | null = null;
    private _listeners: Map<string, EventCallback[]> = new Map();

    public static getInstance(): EventManager {
        if (!this._instance) {
            this._instance = new EventManager();
        }
        return this._instance;
    }

    public on(event: string, callback: EventCallback): void {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event)!.push(callback);
    }

    public off(event: string, callback: EventCallback): void {
        const listeners = this._listeners.get(event);
        if (!listeners) return;
        const index = listeners.indexOf(callback);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    public emit(event: string, ...args: any[]): void {
        const listeners = this._listeners.get(event);
        if (!listeners) return;
        for (const callback of [...listeners]) {
            try {
                callback(...args);
            } catch (e) {
                console.error(`[EventManager] Error in event listener for ${event}:`, e);
            }
        }
    }

    public clear(): void {
        this._listeners.clear();
    }
}

export const GameEvents = {
    GAME_START: 'game_start',
    GAME_PAUSE: 'game_pause',
    GAME_RESUME: 'game_resume',
    GAME_END: 'game_end',

    TIME_TICK: 'time_tick',
    DAY_PASSED: 'day_passed',

    STOCK_CHANGED: 'stock_changed',
    ORDER_CREATED: 'order_created',
    ORDER_STATUS_CHANGED: 'order_status_changed',
    ORDER_DELIVERED: 'order_delivered',

    USAGE_RECORDED: 'usage_recorded',
    INVENTORY_CHECKED: 'inventory_checked',
    INVENTORY_DIFFERENCE_FOUND: 'inventory_difference_found',

    SUPPLIER_SELECTED: 'supplier_selected',
    SUPPLIER_DRAG_START: 'supplier_drag_start',
    SUPPLIER_DRAG_END: 'supplier_drag_end',
    SUPPLIER_DROPPED: 'supplier_dropped',
    SUPPLIER_HOVER: 'supplier_hover',

    RANDOM_EVENT_TRIGGERED: 'random_event_triggered',
    RANDOM_EVENT_RESOLVED: 'random_event_resolved',
    BATCH_SHORTAGE: 'batch_shortage',

    ITEM_USED: 'item_used',
    ITEM_COOLDOWN_CHANGED: 'item_cooldown_changed',

    ACHIEVEMENT_PROGRESS: 'achievement_progress',
    ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',

    LEVEL_OBJECTIVE_PROGRESS: 'level_objective_progress',
    LEVEL_COMPLETED: 'level_completed',

    TUTORIAL_STEP: 'tutorial_step',
    TUTORIAL_COMPLETED: 'tutorial_completed',

    SCREEN_SHAKE: 'screen_shake',
    SHOW_TOAST: 'show_toast',
    SHOW_POPUP: 'show_popup'
};
