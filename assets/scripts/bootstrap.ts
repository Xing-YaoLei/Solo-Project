import { EventManager } from './core/EventManager';
import { ConfigManager, ConfigKeys } from './core/ConfigManager';
import { GameManager } from './core/GameManager';
import { TimeManager } from './core/TimeManager';
import { InventoryManager } from './game/InventoryManager';
import { OrderManager } from './game/OrderManager';
import { LevelManager } from './game/LevelManager';
import { AchievementManager } from './game/AchievementManager';
import { RandomEventManager } from './game/RandomEventManager';
import { ItemManager } from './game/ItemManager';
import { ConsumptionManager } from './game/ConsumptionManager';

(globalThis as any).__EVENT_MANAGER_CLASS__ = EventManager;
(globalThis as any).__CONFIG_MANAGER_CLASS__ = ConfigManager;
(globalThis as any).__GAME_MANAGER_CLASS__ = GameManager;
(globalThis as any).__TIME_MANAGER_CLASS__ = TimeManager;
(globalThis as any).__INVENTORY_MANAGER_CLASS__ = InventoryManager;
(globalThis as any).__ORDER_MANAGER_CLASS__ = OrderManager;
(globalThis as any).__LEVEL_MANAGER_CLASS__ = LevelManager;
(globalThis as any).__ACHIEVEMENT_MANAGER_CLASS__ = AchievementManager;
(globalThis as any).__RANDOM_EVENT_MANAGER_CLASS__ = RandomEventManager;
(globalThis as any).__ITEM_MANAGER_CLASS__ = ItemManager;
(globalThis as any).__CONSUMPTION_MANAGER_CLASS__ = ConsumptionManager;

(globalThis as any).__EVENT_MANAGER__ = EventManager.getInstance();
(globalThis as any).__CONFIG_MANAGER__ = ConfigManager.getInstance();
(globalThis as any).__GAME_MANAGER__ = GameManager.getInstance();
(globalThis as any).__TIME_MANAGER__ = TimeManager.getInstance();
(globalThis as any).__INVENTORY_MANAGER__ = InventoryManager.getInstance();
(globalThis as any).__ORDER_MANAGER__ = OrderManager.getInstance();
(globalThis as any).__LEVEL_MANAGER__ = LevelManager.getInstance();
(globalThis as any).__ACHIEVEMENT_MANAGER__ = AchievementManager.getInstance();
(globalThis as any).__RANDOM_EVENT_MANAGER__ = RandomEventManager.getInstance();
(globalThis as any).__ITEM_MANAGER__ = ItemManager.getInstance();
(globalThis as any).__CONSUMPTION_MANAGER__ = ConsumptionManager.getInstance();

export const GameBootstrap = {
    EventManager,
    ConfigManager,
    ConfigKeys,
    GameManager,
    TimeManager,
    InventoryManager,
    OrderManager,
    LevelManager,
    AchievementManager,
    RandomEventManager,
    ItemManager,
    ConsumptionManager
};

export default GameBootstrap;
