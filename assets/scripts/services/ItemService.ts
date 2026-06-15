import { Singleton } from '../core/Singleton';
import { EventBus, GameEvents } from '../core/EventBus';
import { ConfigManager } from '../config/ConfigManager';
import { AnalyticsService } from './AnalyticsService';
import { ItemConfig } from '../types';

interface ItemState {
  config: ItemConfig;
  cooldownRemaining: number;
  uses: number;
}

export class ItemService extends Singleton<ItemService> {
  private _items: Map<string, ItemState> = new Map();
  private _running: boolean = false;

  get items(): ItemState[] {
    return Array.from(this._items.values());
  }

  init(): void {
    const configs = ConfigManager.getInstance().items;
    configs.forEach(config => {
      this._items.set(config.id, {
        config,
        cooldownRemaining: 0,
        uses: 0,
      });
    });
  }

  start(): void {
    this._running = true;
  }

  stop(): void {
    this._running = false;
  }

  update(deltaTime: number): void {
    if (!this._running) return;

    this._items.forEach(item => {
      if (item.cooldownRemaining > 0) {
        item.cooldownRemaining = Math.max(0, item.cooldownRemaining - deltaTime);
      }
    });
  }

  canUse(itemId: string): boolean {
    const item = this._items.get(itemId);
    if (!item) return false;
    return item.cooldownRemaining <= 0;
  }

  getCooldownRemaining(itemId: string): number {
    return this._items.get(itemId)?.cooldownRemaining || 0;
  }

  getCooldownPercent(itemId: string): number {
    const item = this._items.get(itemId);
    if (!item) return 0;
    if (item.config.cooldown <= 0) return 0;
    return item.cooldownRemaining / item.config.cooldown;
  }

  useItem(itemId: string): boolean {
    const item = this._items.get(itemId);
    if (!item || item.cooldownRemaining > 0) {
      return false;
    }

    item.uses++;
    item.cooldownRemaining = item.config.cooldown;

    EventBus.instance.emit(GameEvents.ITEM_USED, itemId, item.config.effect);
    AnalyticsService.getInstance().trackItemUsed(itemId);

    return true;
  }

  resetCooldowns(): void {
    this._items.forEach(item => {
      item.cooldownRemaining = 0;
    });
  }

  reduceCooldown(itemId: string, seconds: number): void {
    const item = this._items.get(itemId);
    if (item && item.cooldownRemaining > 0) {
      item.cooldownRemaining = Math.max(0, item.cooldownRemaining - seconds);
    }
  }

  getItemConfig(itemId: string): ItemConfig | undefined {
    return ConfigManager.getInstance().getItemConfig(itemId);
  }

  reset(): void {
    this._items.forEach(item => {
      item.cooldownRemaining = 0;
      item.uses = 0;
    });
    this._running = false;
  }
}
