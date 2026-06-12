import { _decorator, Component, Node, Label, Button, Sprite, Color, Vec3, UITransform, tween, UIOpacity, Prefab, instantiate } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { RandomEventManager } from '../game/RandomEventManager';
import { ActiveRandomEvent, RandomEventConfig, RandomEventType } from '../models/RandomEvent';
const { ccclass, property } = _decorator;

@ccclass('EventBannerItem')
export class EventBannerItem extends Component {
    @property(Label)
    public nameLabel: Label | null = null;

    @property(Label)
    public descLabel: Label | null = null;

    @property(Label)
    public timeLabel: Label | null = null;

    @property(Label)
    public severityLabel: Label | null = null;

    @property(Sprite)
    public iconSprite: Sprite | null = null;

    @property(Sprite)
    public background: Sprite | null = null;

    @property(Button)
    public detailBtn: Button | null = null;

    private _activeEvent: ActiveRandomEvent | null = null;
    private _config: RandomEventConfig | null = null;

    setData(activeEvent: ActiveRandomEvent, config: RandomEventConfig) {
        this._activeEvent = activeEvent;
        this._config = config;

        if (this.nameLabel) this.nameLabel.string = config.name;
        if (this.descLabel) this.descLabel.string = config.description;

        this.updateSeverityDisplay();
        this.updateTimeDisplay();
    }

    private updateSeverityDisplay(): void {
        if (!this._config) return;

        const severityColors: Record<string, Color> = {
            'low': new Color(80, 150, 255),
            'medium': new Color(255, 180, 50),
            'high': new Color(255, 80, 80)
        };

        const severityTexts: Record<string, string> = {
            'low': '轻微',
            'medium': '中等',
            'high': '紧急'
        };

        const bgColors: Record<string, Color> = {
            'low': new Color(80, 150, 255, 40),
            'medium': new Color(255, 180, 50, 40),
            'high': new Color(255, 80, 80, 50)
        };

        if (this.severityLabel) {
            this.severityLabel.string = severityTexts[this._config.severity] || this._config.severity;
            this.severityLabel.color = severityColors[this._config.severity] || Color.WHITE;
        }

        if (this.background) {
            this.background.color = bgColors[this._config.severity] || new Color(100, 100, 100, 50);
        }

        if (this.iconSprite) {
            this.iconSprite.color = severityColors[this._config.severity] || Color.WHITE;
        }
    }

    public updateTimeDisplay(): void {
        if (!this._activeEvent || !this.timeLabel) return;

        const remaining = Math.max(0, this._activeEvent.endTime - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        this.timeLabel.string = `剩余 ${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    getEventId(): string {
        return this._activeEvent?.eventId || '';
    }

    getConfig(): RandomEventConfig | null {
        return this._config;
    }
}

@ccclass('EventBanner')
export class EventBanner extends Component {
    @property(Node)
    public container: Node | null = null;

    @property(Prefab)
    public eventItemPrefab: Prefab | null = null;

    @property(Node)
    public emptyHint: Node | null = null;

    @property(Button)
    public expandBtn: Node | null = null;

    @property
    public itemGap: number = 8;

    @property
    public itemHeight: number = 70;

    private _items: Map<string, EventBannerItem> = new Map();
    private _isExpanded: boolean = true;

    onLoad() {
        EventManager.getInstance().on(GameEvents.RANDOM_EVENT_TRIGGERED, this.onEventTriggered.bind(this));
        EventManager.getInstance().on(GameEvents.RANDOM_EVENT_RESOLVED, this.onEventResolved.bind(this));
        EventManager.getInstance().on(GameEvents.BATCH_SHORTAGE, this.onBatchShortage.bind(this));

        if (this.expandBtn) {
            this.expandBtn.on(Node.EventType.TOUCH_END, this.toggleExpand, this);
        }

        this.refreshList();
    }

    update(dt: number) {
        for (const item of this._items.values()) {
            item.updateTimeDisplay();
        }
    }

    onDestroy() {
        EventManager.getInstance().off(GameEvents.RANDOM_EVENT_TRIGGERED, this.onEventTriggered.bind(this));
        EventManager.getInstance().off(GameEvents.RANDOM_EVENT_RESOLVED, this.onEventResolved.bind(this));
        EventManager.getInstance().off(GameEvents.BATCH_SHORTAGE, this.onBatchShortage.bind(this));

        if (this.expandBtn) {
            this.expandBtn.off(Node.EventType.TOUCH_END, this.toggleExpand, this);
        }
    }

    private onEventTriggered(data: { event: ActiveRandomEvent; config: RandomEventConfig }): void {
        this.refreshList();
        this.showToastNotification(data.config);

        EventManager.getInstance().emit(GameEvents.SCREEN_SHAKE, {
            duration: 0.3,
            strength: 5
        });
    }

    private onEventResolved(event: ActiveRandomEvent): void {
        this.refreshList();
    }

    private onBatchShortage(data: any): void {
        EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
            message: `批次短缺: ${data.ingredientId || '部分原料'}`,
            type: 'warning'
        });
    }

    private showToastNotification(config: RandomEventConfig): void {
        const typeText = config.type === RandomEventType.BATCH_SHORTAGE ? '【批次短缺】' :
                        config.type === RandomEventType.SUPPLIER_DELAY ? '【物流延误】' :
                        config.type === RandomEventType.PRICE_FLUCTUATION ? '【价格波动】' :
                        config.type === RandomEventType.SURGE_DEMAND ? '【需求激增】' :
                        config.type === RandomEventType.QUALITY_ISSUE ? '【质量问题】' :
                        config.type === RandomEventType.EQUIPMENT_FAILURE ? '【设备故障】' : '【突发事件】';

        EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
            message: `${typeText} ${config.name}`,
            type: 'warning',
            duration: 3
        });
    }

    public refreshList(): void {
        if (!this.container || !this.eventItemPrefab) return;

        this.container.removeAllChildren();
        this._items.clear();

        const activeEvents = RandomEventManager.getInstance().getActiveEvents();

        if (activeEvents.length === 0) {
            if (this.emptyHint) this.emptyHint.active = true;
            return;
        }

        if (this.emptyHint) this.emptyHint.active = false;

        let yOffset = -this.itemHeight / 2 - this.itemGap;

        const uiTransform = this.container.getComponent(UITransform);
        if (uiTransform) {
            const totalHeight = activeEvents.length * (this.itemHeight + this.itemGap) + this.itemGap;
            uiTransform.setContentSize(uiTransform.contentSize.width, totalHeight);
        }

        for (const activeEvent of activeEvents) {
            const config = RandomEventManager.getInstance().getEventConfig(activeEvent.configId);
            if (!config) continue;

            const itemNode = instantiate(this.eventItemPrefab);
            itemNode.setParent(this.container);
            itemNode.setPosition(new Vec3(0, yOffset, 0));

            const item = itemNode.getComponent(EventBannerItem);
            if (item) {
                item.setData(activeEvent, config);
                this._items.set(activeEvent.eventId, item);
            }

            yOffset -= this.itemHeight + this.itemGap;
        }
    }

    private toggleExpand(): void {
        this._isExpanded = !this._isExpanded;

        if (this.container) {
            const targetScale = this._isExpanded ? new Vec3(1, 1, 1) : new Vec3(1, 0, 1);
            tween(this.container)
                .to(0.2, { scale: targetScale }, { easing: 'quadOut' })
                .start();
        }
    }

    public isExpanded(): boolean {
        return this._isExpanded;
    }
}
