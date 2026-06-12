import { _decorator, Component, Node, Label, Button, Sprite, Color, Vec3, UITransform, tween, UIOpacity } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ItemManager } from '../game/ItemManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { ItemConfig } from '../models/Item';
const { ccclass, property } = _decorator;

@ccclass('ItemSlot')
export class ItemSlot extends Component {
    @property(Sprite)
    public iconSprite: Sprite | null = null;

    @property(Label)
    public countLabel: Label | null = null;

    @property(Label)
    public nameLabel: Label | null = null;

    @property(Sprite)
    public cooldownMask: Sprite | null = null;

    @property(Label)
    public cooldownLabel: Label | null = null;

    @property(Button)
    public useBtn: Button | null = null;

    private _itemConfig: ItemConfig | null = null;

    setData(config: ItemConfig) {
        this._itemConfig = config;

        if (this.nameLabel) this.nameLabel.string = config.name;
        this.refreshDisplay();
    }

    refreshDisplay(): void {
        if (!this._itemConfig) return;

        const count = ItemManager.getInstance().getItemCount(this._itemConfig.id);
        if (this.countLabel) {
            this.countLabel.string = `x${count}`;
        }

        const cooldown = ItemManager.getInstance().getRemainingCooldown(this._itemConfig.id);
        const cooldownPercent = ItemManager.getInstance().getCooldownPercent(this._itemConfig.id);

        if (this.cooldownMask) {
            this.cooldownMask.fillRange = cooldownPercent;
            this.cooldownMask.node.active = cooldown > 0;
        }

        if (this.cooldownLabel) {
            if (cooldown > 0) {
                this.cooldownLabel.string = `${Math.ceil(cooldown / 1000)}s`;
                this.cooldownLabel.node.active = true;
            } else {
                this.cooldownLabel.node.active = false;
            }
        }

        if (this.useBtn) {
            this.useBtn.interactable = count > 0 && cooldown <= 0;
        }
    }

    onLoad() {
        if (this.useBtn) {
            this.useBtn.node.on(Button.EventType.CLICK, this.onUse, this);
        }
    }

    onDestroy() {
        if (this.useBtn) {
            this.useBtn.node.off(Button.EventType.CLICK, this.onUse, this);
        }
    }

    private onUse(): void {
        if (!this._itemConfig) return;

        const success = ItemManager.getInstance().useItem(this._itemConfig.id);
        if (success) {
            EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
                message: `使用了 ${this._itemConfig.name}`,
                type: 'success'
            });
        } else {
            EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
                message: '道具暂时无法使用',
                type: 'warning'
            });
        }

        this.refreshDisplay();
    }
}

@ccclass('ItemBar')
export class ItemBar extends Component {
    @property(Node)
    public slotsContainer: Node | null = null;

    @property(Node)
    public slotTemplate: Node | null = null;

    @property(Button)
    public expandBtn: Button | null = null;

    private _slots: ItemSlot[] = [];
    private _isExpanded: boolean = true;

    onLoad() {
        EventManager.getInstance().on(GameEvents.ITEM_USED, this.onItemUsed.bind(this));
        EventManager.getInstance().on(GameEvents.ITEM_COOLDOWN_CHANGED, this.onCooldownChanged.bind(this));

        if (this.expandBtn) {
            this.expandBtn.node.on(Button.EventType.CLICK, this.toggleExpand, this);
        }
    }

    start() {
        this.buildSlots();
    }

    update(dt: number) {
        for (const slot of this._slots) {
            slot.refreshDisplay();
        }
    }

    onDestroy() {
        EventManager.getInstance().off(GameEvents.ITEM_USED, this.onItemUsed.bind(this));
        EventManager.getInstance().off(GameEvents.ITEM_COOLDOWN_CHANGED, this.onCooldownChanged.bind(this));

        if (this.expandBtn) {
            this.expandBtn.node.off(Button.EventType.CLICK, this.toggleExpand, this);
        }
    }

    private buildSlots(): void {
        if (!this.slotsContainer || !this.slotTemplate) return;

        this.slotsContainer.removeAllChildren();
        this._slots = [];

        const items = ItemManager.getInstance().getAvailableItems();
        const gap = 12;
        const slotSize = 80;

        items.forEach((config, index) => {
            const slotNode = this.slotTemplate.clone();
            slotNode.active = true;
            slotNode.setParent(this.slotsContainer);
            slotNode.setPosition(new Vec3(index * (slotSize + gap) + slotSize / 2 + gap, 0, 0));

            const slot = slotNode.getComponent(ItemSlot);
            if (slot) {
                slot.setData(config);
                this._slots.push(slot);
            }
        });
    }

    private onItemUsed(data: any): void {
        this.refreshAll();
    }

    private onCooldownChanged(data: any): void {
        this.refreshAll();
    }

    private refreshAll(): void {
        for (const slot of this._slots) {
            slot.refreshDisplay();
        }
    }

    private toggleExpand(): void {
        this._isExpanded = !this._isExpanded;

        if (this.slotsContainer) {
            const targetScale = this._isExpanded ? new Vec3(1, 1, 1) : new Vec3(1, 0, 1);
            tween(this.slotsContainer)
                .to(0.2, { scale: targetScale }, { easing: 'quadOut' })
                .start();
        }
    }
}
