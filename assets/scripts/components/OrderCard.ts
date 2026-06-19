import { _decorator, Component, Node, Label, Color, Sprite, Vec3, EventTouch, UITransform, tween, UIOpacity } from "cc";
import { Order, OrderStatus, OrderPriority } from "../models/Order";
import { Channel } from "../models/Channel";
import { GameManager } from "../managers/GameManager";
import { AudioManager } from "../utils/AudioManager";
import { VibrationManager } from "../utils/VibrationManager";

const { ccclass, property } = _decorator;

const PRIORITY_COLORS: Record<OrderPriority, Color> = {
    [OrderPriority.LOW]: new Color(76, 175, 80, 255),
    [OrderPriority.NORMAL]: new Color(33, 150, 243, 255),
    [OrderPriority.HIGH]: new Color(255, 152, 0, 255),
    [OrderPriority.URGENT]: new Color(244, 67, 54, 255)
};

@ccclass("OrderCard")
export class OrderCard extends Component {
    private orderData: Order | null = null;
    private channelInfo: Channel | null = null;
    private isDragging: boolean = false;
    private dragOffset: Vec3 = new Vec3();
    private originalPos: Vec3 = new Vec3();
    private onConfirm: ((orderId: string, roomId: string) => void) | null = null;
    private onReject: ((orderId: string) => void) | null = null;
    private onDragStart: ((order: Order) => void) | null = null;
    private onDragEnd: ((order: Order, worldPos: Vec3) => void) | null = null;
    private remainingTime: number = 0;

    public init(order: Order, channel: Channel | null): void {
        this.orderData = order;
        this.channelInfo = channel;

        this.updateVisual();

        if (order.expireAt) {
            this.remainingTime = (order.expireAt - Date.now()) / 1000;
        }
    }

    private updateVisual(): void {
        if (!this.orderData) return;

        const channelNode = this.node.getChildByName("channel");
        if (channelNode) {
            const label = channelNode.getComponent(Label);
            if (label && this.channelInfo) {
                label.string = this.channelInfo.name;
                const sp = channelNode.getComponent(Sprite);
                if (sp) {
                    const c = new Color();
                    Color.fromHex(c, this.channelInfo.color);
                    sp.color = c;
                }
            }
        }

        const guestNode = this.node.getChildByName("guest");
        if (guestNode) {
            const label = guestNode.getComponent(Label);
            if (label) {
                label.string = this.orderData.guestName;
            }
        }

        const dateNode = this.node.getChildByName("dates");
        if (dateNode) {
            const label = dateNode.getComponent(Label);
            if (label) {
                label.string = `${this.orderData.checkIn.slice(5)} → ${this.orderData.checkOut.slice(5)}`;
            }
        }

        const roomTypeNode = this.node.getChildByName("roomType");
        if (roomTypeNode) {
            const label = roomTypeNode.getComponent(Label);
            if (label) {
                const typeNames: Record<string, string> = {
                    standard: "标准间", deluxe: "豪华间", suite: "套房", family: "家庭房"
                };
                label.string = typeNames[this.orderData.roomType] || this.orderData.roomType;
            }
        }

        const priceNode = this.node.getChildByName("price");
        if (priceNode) {
            const label = priceNode.getComponent(Label);
            if (label) {
                label.string = `¥${this.orderData.price}`;
            }
        }

        const priorityNode = this.node.getChildByName("priority");
        if (priorityNode) {
            const bg = priorityNode.getComponent(Sprite);
            if (bg) {
                bg.color = PRIORITY_COLORS[this.orderData.priority];
            }
        }

        const vipNode = this.node.getChildByName("vip");
        if (vipNode) {
            vipNode.active = this.orderData.isVip;
        }

        const timerNode = this.node.getChildByName("timer");
        if (timerNode) {
            const label = timerNode.getComponent(Label);
            if (label && this.remainingTime > 0) {
                label.string = `${Math.ceil(this.remainingTime)}s`;
            }
        }
    }

    update(dt: number): void {
        if (!this.orderData || this.orderData.status !== OrderStatus.PENDING) return;

        if (this.remainingTime > 0) {
            this.remainingTime -= dt;
            const timerNode = this.node.getChildByName("timer");
            if (timerNode) {
                const label = timerNode.getComponent(Label);
                if (label) {
                    label.string = `${Math.max(0, Math.ceil(this.remainingTime))}s`;
                    if (this.remainingTime < 10) {
                        label.color = Color.RED;
                    }
                }
            }
        }
    }

    public playNewOrderAnimation(intensity: number): void {
        const gm = GameManager.instance;
        const settings = gm?.getSettings();

        if (settings?.soundEnabled) {
            AudioManager.instance?.playSfx("new_order");
        }

        if (settings?.vibrationEnabled) {
            VibrationManager.instance?.light();
        }

        const finalScale = 1.0;
        const animIntensity = Math.min(1.0, Math.max(0.0, intensity));
        const overshoot = 1.0 + animIntensity * 0.3;

        tween(this.node)
            .set({ scale: new Vec3(0, 0, 1) })
            .to(0.3, { scale: new Vec3(overshoot, overshoot, 1) }, { easing: "backOut" })
            .to(0.1, { scale: new Vec3(finalScale, finalScale, 1) })
            .start();
    }

    public playExpireAnimation(intensity: number): void {
        const gm = GameManager.instance;
        const settings = gm?.getSettings();

        if (settings?.soundEnabled) {
            AudioManager.instance?.playSfx("order_expire");
        }

        if (settings?.vibrationEnabled) {
            VibrationManager.instance?.medium();
        }

        const animIntensity = Math.min(1.0, Math.max(0.0, intensity));
        const opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);

        tween(this.node)
            .to(0.3 * animIntensity, { scale: new Vec3(0.8, 0.8, 1) }, { easing: "backIn" })
            .call(() => {
                opacity.opacity = 128;
            })
            .delay(0.5)
            .call(() => {
                this.node.destroy();
            })
            .start();
    }

    onEnable(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onDisable(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    private onTouchStart(event: EventTouch): void {
        this.isDragging = false;
        const uiPos = event.getUILocation();
        this.dragOffset.set(
            this.node.position.x - uiPos.x,
            this.node.position.y - uiPos.y,
            0
        );
        this.originalPos.set(this.node.position);
    }

    private onTouchMove(event: EventTouch): void {
        const uiPos = event.getUILocation();
        const dx = uiPos.x + this.dragOffset.x - this.originalPos.x;
        const dy = uiPos.y + this.dragOffset.y - this.originalPos.y;

        if (!this.isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            this.isDragging = true;
            if (this.onDragStart && this.orderData) {
                this.onDragStart(this.orderData);
            }
        }

        if (this.isDragging) {
            this.node.setPosition(uiPos.x + this.dragOffset.x, uiPos.y + this.dragOffset.y, 0);
        }
    }

    private onTouchEnd(event: EventTouch): void {
        if (this.isDragging) {
            const uiPos = event.getUILocation();
            const worldPos = new Vec3(uiPos.x, uiPos.y, 0);
            if (this.onDragEnd && this.orderData) {
                this.onDragEnd(this.orderData, worldPos);
            }
            this.node.setPosition(this.originalPos);
        }
        this.isDragging = false;
    }

    private onTouchCancel(event: EventTouch): void {
        if (this.isDragging) {
            this.node.setPosition(this.originalPos);
        }
        this.isDragging = false;
    }

    public getOrderData(): Order | null {
        return this.orderData;
    }

    public setOnConfirm(cb: (orderId: string, roomId: string) => void): void {
        this.onConfirm = cb;
    }

    public setOnReject(cb: (orderId: string) => void): void {
        this.onReject = cb;
    }

    public setOnDragStart(cb: (order: Order) => void): void {
        this.onDragStart = cb;
    }

    public setOnDragEnd(cb: (order: Order, worldPos: Vec3) => void): void {
        this.onDragEnd = cb;
    }
}

@ccclass("OrderPanel")
export class OrderPanel extends Component {
    private cards: Map<string, OrderCard> = new Map();
    private ordersParent: Node | null = null;

    public init(): void {
        this.cards.clear();
        this.ordersParent = this.node.getChildByName("orders");
    }

    public addOrderCard(order: Order, channel: Channel | null): void {
        if (!this.ordersParent) return;

        const cardNode = new Node(`order_${order.id}`);
        cardNode.addComponent(UITransform).setContentSize(200, 80);
        cardNode.addComponent(Sprite);

        const channelNode = new Node("channel");
        channelNode.addComponent(UITransform).setContentSize(60, 20);
        channelNode.addComponent(Label).fontSize = 12;
        channelNode.parent = cardNode;

        const guestNode = new Node("guest");
        guestNode.addComponent(UITransform).setContentSize(80, 20);
        guestNode.addComponent(Label).fontSize = 14;
        guestNode.setPosition(-60, 10, 0);
        guestNode.parent = cardNode;

        const dateNode = new Node("dates");
        dateNode.addComponent(UITransform).setContentSize(120, 16);
        dateNode.addComponent(Label).fontSize = 11;
        dateNode.setPosition(0, -5, 0);
        dateNode.parent = cardNode;

        const roomTypeNode = new Node("roomType");
        roomTypeNode.addComponent(UITransform).setContentSize(60, 16);
        roomTypeNode.addComponent(Label).fontSize = 11;
        roomTypeNode.setPosition(-50, -20, 0);
        roomTypeNode.parent = cardNode;

        const priceNode = new Node("price");
        priceNode.addComponent(UITransform).setContentSize(60, 20);
        priceNode.addComponent(Label).fontSize = 14;
        priceNode.setPosition(60, 10, 0);
        priceNode.parent = cardNode;

        const priorityNode = new Node("priority");
        priorityNode.addComponent(UITransform).setContentSize(8, 8);
        priorityNode.addComponent(Sprite);
        priorityNode.setPosition(90, 30, 0);
        priorityNode.parent = cardNode;

        const vipNode = new Node("vip");
        vipNode.addComponent(UITransform).setContentSize(30, 16);
        const vipLabel = vipNode.addComponent(Label);
        vipLabel.fontSize = 10;
        vipLabel.string = "VIP";
        vipNode.setPosition(70, 25, 0);
        vipNode.parent = cardNode;

        const timerNode = new Node("timer");
        timerNode.addComponent(UITransform).setContentSize(40, 16);
        timerNode.addComponent(Label).fontSize = 11;
        timerNode.setPosition(75, -20, 0);
        timerNode.parent = cardNode;

        const card = cardNode.addComponent(OrderCard);
        card.init(order, channel);

        const index = this.cards.size;
        cardNode.setPosition(0, -index * 90, 0);
        cardNode.parent = this.ordersParent;

        const gm = GameManager.instance;
        const settings = gm?.getSettings();
        card.playNewOrderAnimation(settings?.animationIntensity ?? 1.0);

        this.cards.set(order.id, card);
    }

    public removeOrderCard(orderId: string): void {
        const card = this.cards.get(orderId);
        if (card) {
            const gm = GameManager.instance;
            const settings = gm?.getSettings();
            card.playExpireAnimation(settings?.animationIntensity ?? 1.0);
            this.cards.delete(orderId);
        }
    }

    public getOrderCard(orderId: string): OrderCard | undefined {
        return this.cards.get(orderId);
    }

    public clear(): void {
        for (const [id, card] of this.cards) {
            card.node.destroy();
        }
        this.cards.clear();
    }
}
