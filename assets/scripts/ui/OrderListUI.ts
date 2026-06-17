import { _decorator, Component, Node, Label, Sprite, Color, Prefab, instantiate, Button, Vec3, Layout, UIOpacity, ScrollView, UITransform, Layers } from 'cc';
import { game } from '../Game';
import { OrderManager } from '../game/OrderManager';
import { IActiveOrder, OrderPriority, getPriorityColor, getStatusText, getCategoryText, getOrderByPriority } from '../types/GameTypes';
import { EventManager, GameEventType } from '../core/EventManager';
import { Logger } from '../core/Logger';
import { findGameScene } from '../scenes/GameScene';
const { ccclass, property } = _decorator;

@ccclass('OrderListUI')
export class OrderListUI extends Component {
    @property(Node)
    contentNode: Node | null = null;

    @property(Prefab)
    orderItemPrefab: Prefab | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    countLabel: Label | null = null;

    @property(ScrollView)
    scrollView: ScrollView | null = null;

    @property(Button)
    refreshButton: Button | null = null;

    private orderManager: OrderManager;
    private eventManager: EventManager;
    private orderItems: Map<string, Node> = new Map();
    private selectedOrderId: string | null = null;

    onLoad() {
        this.orderManager = game.getOrderManager();
        this.eventManager = EventManager.getInstance();

        if (this.titleLabel) {
            this.titleLabel.string = '📋 工单列表';
        }

        this.setupListeners();
        this.refreshList();
    }

    start() {
        if (this.refreshButton) {
            this.refreshButton.node.on(Button.EventType.CLICK, () => {
                this.refreshList();
            }, this);
        }
        this.setupEventListeners();
    }

    private setupListeners() {}

    private setupEventListeners() {
        this.eventManager.on(GameEventType.ORDER_RECEIVED, () => this.refreshList());
        this.eventManager.on(GameEventType.ORDER_ASSIGNED, () => this.refreshList());
        this.eventManager.on(GameEventType.ORDER_COMPLETED, () => this.scheduleOnce(() => this.refreshList(), 0.2));
        this.eventManager.on(GameEventType.ORDER_FAILED, () => this.scheduleOnce(() => this.refreshList(), 0.2));
        this.eventManager.on(GameEventType.ORDER_TIMEOUT, () => this.refreshList());
    }

    public refreshList() {
        if (!this.contentNode) {
            this.contentNode = this.node.getChildByName('Content') || this.node.getChildByName('ScrollView')?.getChildByName('View')?.getChildByName('Content') || this.node;
        }

        this.clearItems();

        const orders = this.orderManager.getAllActiveOrders();
        if (this.countLabel) {
            this.countLabel.string = `(${orders.length})`;
        }

        if (orders.length === 0) {
            this.showEmptyState();
            return;
        }

        orders.sort((a, b) => getOrderByPriority(b.priority) - getOrderByPriority(a.priority));
        orders.forEach((order, index) => {
            this.createOrderItem(order, index);
        });
    }

    private clearItems() {
        this.orderItems.forEach(item => {
            if (item.isValid) item.destroy();
        });
        this.orderItems.clear();
    }

    private showEmptyState() {
        if (!this.contentNode) return;
        const emptyNode = new Node('EmptyState');
        emptyNode.layer = Layers.Enum.UI_2D;
        emptyNode.addComponent(UITransform);
        const label = emptyNode.addComponent(Label);
        label.string = '暂无工单\n等待新的报修...';
        label.fontSize = 20;
        label.lineHeight = 28;
        label.color = new Color(180, 180, 180);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        this.contentNode.addChild(emptyNode);
        emptyNode.setPosition(new Vec3(0, -50, 0));
    }

    private createOrderItem(order: IActiveOrder, index: number) {
        let itemNode: Node;
        if (this.orderItemPrefab) {
            itemNode = instantiate(this.orderItemPrefab);
        } else {
            itemNode = this.createSimpleOrderItem(order, index);
        }
        itemNode.name = `OrderItem_${order.id}`;

        this.populateOrderItem(itemNode, order, index);
        this.bindOrderItemClick(itemNode, order);
        this.highlightIfSelected(itemNode, order);

        if (this.contentNode) {
            this.contentNode.addChild(itemNode);
        }
        this.orderItems.set(order.id, itemNode);
    }

    private createSimpleOrderItem(order: IActiveOrder, index: number): Node {
        const node = new Node(`OrderItem_${order.id}`);
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(320, 100);
        ui.anchorY = 1;

        const bg = node.addComponent(Sprite);
        bg.type = Sprite.Type.SLICED;
        bg.color = this.getOrderBgColor(order);

        const btn = node.addComponent(Button);
        btn.transition = Button.Transition.COLOR;
        btn.normalColor = new Color(255, 255, 255, 255);
        btn.pressedColor = new Color(230, 230, 230, 255);
        btn.hoverColor = new Color(245, 245, 245, 255);
        btn.disabledColor = new Color(200, 200, 200, 255);

        const titleNode = new Node('Title');
        titleNode.layer = Layers.Enum.UI_2D;
        const titleUi = titleNode.addComponent(UITransform);
        titleUi.setContentSize(300, 28);
        titleUi.anchorY = 1;
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = this.buildTitle(order);
        titleLabel.fontSize = 16;
        titleLabel.color = new Color(50, 50, 50);
        titleNode.setPosition(new Vec3(10, -10, 0));
        node.addChild(titleNode);

        const descNode = new Node('Desc');
        descNode.layer = Layers.Enum.UI_2D;
        const descUi = descNode.addComponent(UITransform);
        descUi.setContentSize(300, 22);
        descUi.anchorY = 1;
        const descLabel = descNode.addComponent(Label);
        descLabel.string = `${order.location.building} ${order.location.floor} | ${getCategoryText(order.category)}`;
        descLabel.fontSize = 13;
        descLabel.color = new Color(120, 120, 120);
        descNode.setPosition(new Vec3(10, -40, 0));
        node.addChild(descNode);

        const statusNode = new Node('Status');
        statusNode.layer = Layers.Enum.UI_2D;
        const statusUi = statusNode.addComponent(UITransform);
        statusUi.setContentSize(300, 22);
        statusUi.anchorY = 1;
        const statusLabel = statusNode.addComponent(Label);
        statusLabel.string = this.buildStatusLine(order);
        statusLabel.fontSize = 12;
        statusLabel.color = this.getStatusColor(order.status);
        statusNode.setPosition(new Vec3(10, -68, 0));
        node.addChild(statusNode);

        return node;
    }

    private buildTitle(order: IActiveOrder): string {
        const priorityIcons: Record<OrderPriority, string> = {
            urgent: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '🟢'
        };
        return `${priorityIcons[order.priority]} ${order.title}`;
    }

    private buildStatusLine(order: IActiveOrder): string {
        const status = getStatusText(order.status);
        const remaining = Math.max(0, Math.floor((order.deadline - Date.now()) / 1000));
        const min = Math.floor(remaining / 60);
        const sec = remaining % 60;
        const timeStr = remaining > 0 ? `⏱ ${min}:${sec.toString().padStart(2, '0')}` : '⏰ 已超时';
        return `${status}  |  ${timeStr}  |  报修人：${order.reporter}`;
    }

    private populateOrderItem(node: Node, order: IActiveOrder, index: number) {
        const labels = node.getComponentsInChildren(Label);
        if (labels.length >= 3) {
            labels[0].string = this.buildTitle(order);
            labels[1].string = `${order.location.building} ${order.location.floor} | ${getCategoryText(order.category)}`;
            labels[2].string = this.buildStatusLine(order);
            labels[2].color = this.getStatusColor(order.status);
        }
        const bg = node.getComponent(Sprite);
        if (bg) {
            bg.color = this.getOrderBgColor(order);
        }
    }

    private bindOrderItemClick(node: Node, order: IActiveOrder) {
        const btn = node.getComponent(Button);
        if (btn) {
            btn.node.on(Button.EventType.CLICK, () => {
                Logger.info('点击工单:', order.id, order.title);
                this.selectedOrderId = order.id;
                this.orderManager.acceptOrder(order.id);
                this.refreshList();

                const scene = findGameScene();
                if (scene) {
                    scene.spawnOrderPanel();
                    scene.spawnCluePanel();
                    scene.spawnChoiceDialog();
                }
            }, this);
        }
    }

    private highlightIfSelected(node: Node, order: IActiveOrder) {
        const opacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        if (this.selectedOrderId === order.id) {
            opacity.opacity = 255;
            const bg = node.getComponent(Sprite);
            if (bg) bg.color = new Color(220, 240, 255, 255);
        } else if (order.status === 'completed' || order.status === 'failed' || order.status === 'timeout') {
            opacity.opacity = 180;
        }
    }

    private getOrderBgColor(order: IActiveOrder): Color {
        if (order.status === 'completed') return new Color(235, 250, 235, 255);
        if (order.status === 'failed') return new Color(255, 235, 235, 255);
        if (order.status === 'timeout') return new Color(255, 240, 220, 255);

        const priorityBg: Record<OrderPriority, Color> = {
            urgent: new Color(255, 240, 240, 255),
            high: new Color(255, 248, 230, 255),
            medium: new Color(255, 254, 235, 255),
            low: new Color(240, 250, 240, 255)
        };
        return priorityBg[order.priority];
    }

    private getStatusColor(status: string): Color {
        const map: Record<string, Color> = {
            pending: new Color(100, 100, 150),
            assigned: new Color(60, 120, 220),
            in_progress: new Color(220, 140, 40),
            completed: new Color(60, 180, 100),
            failed: new Color(220, 60, 60),
            timeout: new Color(200, 80, 40)
        };
        return map[status] || new Color(150, 150, 150);
    }

    public getSelectedOrderId(): string | null {
        return this.selectedOrderId;
    }

    update(dt: number) {
        this.updateCountdowns();
    }

    private lastUpdateTime = 0;
    private updateCountdowns() {
        this.lastUpdateTime += dt;
        if (this.lastUpdateTime < 1) return;
        this.lastUpdateTime = 0;
        this.orderItems.forEach((node, orderId) => {
            const order = this.orderManager.getActiveOrder(orderId);
            if (!order) return;
            const labels = node.getComponentsInChildren(Label);
            if (labels.length >= 3) {
                labels[2].string = this.buildStatusLine(order);
                labels[2].color = this.getStatusColor(order.status);
            }
        });
    }

    onDestroy() {
        this.eventManager.removeAllListeners();
    }
}
