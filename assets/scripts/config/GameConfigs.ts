import ingredients from '../../configs/ingredients.json';
import suppliers from '../../configs/suppliers.json';
import stores from '../../configs/stores.json';
import levels from '../../configs/levels.json';
import items from '../../configs/items.json';
import achievements from '../../configs/achievements.json';
import randomEvents from '../../configs/randomEvents.json';
import tutorials from '../../configs/tutorials.json';
import { ConfigKeys, ConfigManager } from '../core/ConfigManager';

export const GameConfigs: Record<string, any> = {
    [ConfigKeys.INGREDIENTS]: ingredients,
    [ConfigKeys.SUPPLIERS]: suppliers,
    [ConfigKeys.STORES]: stores,
    [ConfigKeys.LEVELS]: levels,
    [ConfigKeys.ITEMS]: items,
    [ConfigKeys.ACHIEVEMENTS]: achievements,
    [ConfigKeys.RANDOM_EVENTS]: randomEvents,
    [ConfigKeys.TUTORIALS]: tutorials
};

export function loadAllConfigs(): void {
    ConfigManager.getInstance().loadAll(GameConfigs);
}

export default GameConfigs;
