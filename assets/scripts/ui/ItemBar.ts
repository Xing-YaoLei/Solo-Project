import { _decorator, Component, Node, Button, Label, Sprite, ProgressBar, tween, Vec3, UIOpacity, Color, Prefab, instantiate } from 'cc';
import { ItemService } from '../services/ItemService';
import { ItemConfig, ItemEffect } from '../types';
import { EventBus, GameEvents } from '../core/EventBus';
import { SettingsManager } from '../config/SettingsManager';
import { ConfigManager } from '../config/ConfigManager';
const { ccclass, property } = _decorator;

@ccclass('ItemSlot')
export class ItemSlot extends Component {
  @property(Button)
  button: Button | null = null;

  @property(Sprite)
  iconSprite: Sprite | null = null;

  @property(Label)
  nameLabel: Label | null = null;

  @property(Label)
  cooldownLabel: Label | null = null;

  @property(ProgressBar)
  cooldownProgress: ProgressBar | null = null;

  @property(Node)
  disabledOverlay: Node | null = null;

  private _itemId: string = '';
  private _config: ItemConfig | null = null;

  get itemId(): string {
    return this._itemId;
  }

  setItem(itemId: string): void {
    this._itemId = itemId;
    this._config = ConfigManager.getInstance().getItemConfig(itemId);
    
    this.updateDisplay();
    
    if (this.button) {
      this.button.node.on(Button.EventType.CLICK, this.onClick, this);
    }
  }

  private updateDisplay(): void {
    if (!this._config) return;

    if (this.nameLabel) {
      this.nameLabel.string = this._config.name;
    }

    this.updateCooldown();
  }

  updateCooldown(): void {
    const itemService = ItemService.getInstance();
    const isOnCooldown = !itemService.canUse(this._itemId);
    const cooldownPercent = itemService.getCooldownPercent(this._itemId);
    const cooldownRemaining = itemService.getCooldownRemaining(this._itemId);

    if (this.disabledOverlay) {
      this.disabledOverlay.active = isOnCooldown;
      
      const opacity = this.disabledOverlay.getComponent(UIOpacity);
      if (opacity) {
        opacity.opacity = isOnCooldown ? 180 : 0;
      }
    }

    if (this.cooldownProgress) {
      this.cooldownProgress.node.active = isOnCooldown;
      this.cooldownProgress.progress = cooldownPercent;
    }

    if (this.cooldownLabel) {
      this.cooldownLabel.node.active = isOnCooldown;
      if (isOnCooldown) {
        this.cooldownLabel.string = `${Math.ceil(cooldownRemaining)}s`;
      }
    }

    if (this.button) {
      this.button.interactable = !isOnCooldown;
    }
  }

  private onClick(): void {
    if (!ItemService.getInstance().canUse(this._itemId)) return;

    const intensity = SettingsManager.getInstance().animationIntensity;
    if (intensity > 0) {
      tween(this.node)
        .to(0.1 * intensity, { scale: new Vec3(0.9, 0.9, 1) })
        .to(0.1 * intensity, { scale: new Vec3(1, 1, 1) })
        .start();
    }

    ItemService.getInstance().useItem(this._itemId);
    SettingsManager.getInstance().vibrate(30);
  }

  showUseAnimation(): void {
    const intensity = SettingsManager.getInstance().animationIntensity;
    if (intensity <= 0) return;

    if (this.iconSprite) {
      const originalColor = this.iconSprite.color.clone();
      
      tween(this.iconSprite)
        .to(0.1 * intensity, { color: new Color(255, 255, 150, 255) })
        .to(0.1 * intensity, { color: originalColor })
        .start();
    }
  }

  onDestroy(): void {
    if (this.button) {
      this.button.node.off(Button.EventType.CLICK, this.onClick, this);
    }
  }
}

@ccclass('ItemBar')
export class ItemBar extends Component {
  @property(Node)
  itemContainer: Node | null = null;

  @property(Prefab)
  itemSlotPrefab: Prefab | null = null;

  private _itemSlots: Map<string, ItemSlot> = new Map();

  onLoad(): void {
    EventBus.instance.on(GameEvents.ITEM_USED, this.onItemUsed.bind(this));
  }

  start(): void {
    this.initializeItems();
  }

  private initializeItems(): void {
    if (!this.itemContainer || !this.itemSlotPrefab) return;

    const items = ConfigManager.getInstance().items;
    
    items.forEach(item => {
      const node = instantiate(this.itemSlotPrefab!);
      const slot = node.getComponent(ItemSlot);
      
      if (slot) {
        slot.setItem(item.id);
        this._itemSlots.set(item.id, slot);
        this.itemContainer!.addChild(node);
      }
    });
  }

  update(dt: number): void {
    this._itemSlots.forEach(slot => {
      slot.updateCooldown();
    });
  }

  private onItemUsed(itemId: string, effect: ItemEffect): void {
    const slot = this._itemSlots.get(itemId);
    if (slot) {
      slot.showUseAnimation();
    }
  }

  reset(): void {
    this._itemSlots.forEach(slot => {
      slot.updateCooldown();
    });
  }

  onDestroy(): void {
    EventBus.instance.off(GameEvents.ITEM_USED, this.onItemUsed.bind(this));
  }
}
