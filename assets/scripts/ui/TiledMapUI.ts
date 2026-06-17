import { _decorator, Component, Node, Label, Sprite, Color, Prefab, instantiate, Vec3, Layers, UITransform, Graphics, Button, find, TiledMap, TiledMapAsset, resources, loader, assetManager } from 'cc';
import { game } from '../Game';
import { TiledMapManager, IMapLocation, IMapMarker } from '../game/TiledMapManager';
import { OrderManager } from '../game/OrderManager';
import { EventManager, GameEventType } from '../core/EventManager';
import { OrderPriority, getPriorityColor, getCategoryText } from '../types/GameTypes';
import { Logger } from '../core/Logger';
import { findGameScene } from '../scenes/GameScene';
const { ccclass, property } = _decorator;

@ccclass('TiledMapUI')
export class TiledMapUI extends Component {
    @property(TiledMapAsset)
    mapAsset: TiledMapAsset | null = null;

    @property(Node)
    markersLayer: Node | null = null;

    @property(Prefab)
    buildingMarkerPrefab: Prefab | null = null;

    @property(Prefab)
    orderMarkerPrefab: Prefab | null = null;

    @property(Prefab)
    workerMarkerPrefab: Prefab | null = null;

    @property(Node)
    infoPanel: Node | null = null;

    @property(Label)
    infoPanelTitle: Label | null = null;

    @property(Label)
    infoPanelContent: Label | null = null;

    @property(Label)
    mapNameLabel: Label | null = null;

    private mapManager: TiledMapManager;
    private orderManager: OrderManager;
    private eventManager: EventManager;
    private markerNodes: Map<string, Node> = new Map();
    private loadedMapId: string | null = null;
    private tilePixelSize = 32;

    onLoad() {
        this.mapManager = game.getMapManager();
        this.orderManager = game.getOrderManager();
        this.eventManager = EventManager.getInstance();

        this.markersLayer = this.markersLayer || this.node.getChildByName('Markers') || this.node;
        this.setupEventListeners();
    }

    async start() {
        const levelId = game.getGameManager().getCurrentLevel();
        const mapResource = game.getDataManager().getMapResourceForLevel(levelId);
        if (mapResource) {
            await this.loadMap(mapResource, levelId.toString());
        }
        this.renderBuildings();
        this.renderOrders();
        this.renderWorkers();
    }

    private setupEventListeners() {
        this.eventManager.on(GameEventType.ORDER_RECEIVED, () => this.scheduleOnce(() => this.renderOrders(), 0.2));
        this.eventManager.on(GameEventType.ORDER_ASSIGNED, () => this.scheduleOnce(() => this.renderOrders(), 0.2));
        this.eventManager.on(GameEventType.ORDER_COMPLETED, () => this.scheduleOnce(() => { this.renderOrders(); this.renderWorkers(); }, 0.2));
        this.eventManager.on(GameEventType.ORDER_FAILED, () => this.scheduleOnce(() => { this.renderOrders(); this.renderWorkers(); }, 0.2));
        this.eventManager.on(GameEventType.ORDER_TIMEOUT, () => this.scheduleOnce(() => this.renderOrders(), 0.2));
    }

    public async loadMap(mapId: string, levelKey: string): Promise<boolean> {
        try {
            await this.mapManager.loadMap(levelKey, mapId);
            this.loadedMapId = levelKey;

            const mapData = this.mapManager.getCurrentMap();
            if (mapData) {
                if (this.mapNameLabel) {
                    this.mapNameLabel.string = `🗺️ ${mapData.name}`;
                }
                Logger.info(`[地图] 已加载: ${mapData.name}`);
            }

            if (this.mapAsset) {
                const existing = this.node.getComponent(TiledMap);
                const tileMap = existing || this.node.addComponent(TiledMap);
                tileMap.tmxAsset = this.mapAsset;
            } else {
                this.renderFallbackMap();
            }

            return true;
        } catch (error) {
            Logger.error('[地图] 加载失败:', error);
            this.renderFallbackMap();
            return false;
        }
    }

    private renderFallbackMap() {
        const mapData = this.mapManager.getCurrentMap();
        if (!mapData) return;

        const gfx = this.node.getComponent(Graphics) || this.node.addComponent(Graphics);
        const ui = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        const w = mapData.width * this.tilePixelSize;
        const h = mapData.height * this.tilePixelSize;
        ui.setContentSize(w, h);

        gfx.fillColor = new Color(230, 245, 230);
        gfx.rect(-w / 2, -h / 2, w, h);
        gfx.fill();

        gfx.fillColor = new Color(200, 220, 200);
        for (let x = -w / 2; x < w / 2; x += 80) {
            gfx.rect(x, -h / 2, 10, h);
            gfx.fill();
        }
        for (let y = -h / 2; y < h / 2; y += 80) {
            gfx.rect(-w / 2, y, w, 10);
            gfx.fill();
        }

        Logger.info('[地图] 使用回退渲染模式');
    }

    public renderBuildings() {
        const mapData = this.mapManager.getCurrentMap();
        if (!mapData) return;

        mapData.locations.forEach(loc => this.renderBuilding(loc));
    }

    private renderBuilding(loc: IMapLocation) {
        let node: Node;
        const key = `building_${loc.id}`;
        if (this.buildingMarkerPrefab) {
            node = instantiate(this.buildingMarkerPrefab);
        } else {
            node = this.createSimpleMarker(
                key,
                new Color(240, 240, 250),
                new Color(120, 120, 180),
                loc.name,
                loc.width,
                loc.height
            );
        }
        node.name = key;

        if (loc.type === 'area') {
            const bg = node.getComponent(Sprite) || node.getComponentInChildren(Sprite) || node.addComponent(Sprite);
            bg.color = new Color(200, 250, 200, 180);
        }

        const mapData = this.mapManager.getCurrentMap();
        if (mapData) {
            const w = mapData.width * this.tilePixelSize;
            const h = mapData.height * this.tilePixelSize;
            node.setPosition(new Vec3(
                -w / 2 + loc.x + loc.width / 2,
                h / 2 - loc.y - loc.height / 2,
                0
            ));
        }

        node.on(Node.EventType.TOUCH_END, () => this.onBuildingClicked(loc), this);

        if (this.markersLayer) this.markersLayer.addChild(node);
        this.markerNodes.set(key, node);
    }

    public renderOrders() {
        this.clearMarkers('order_');
        const orders = this.orderManager.getAllActiveOrders();

        orders.forEach(order => {
            if (order.status === 'completed' || order.status === 'failed') return;

            const key = `order_${order.id}`;
            const mapData = this.mapManager.getCurrentMap();
            if (!mapData) return;

            const loc = this.mapManager.findLocationByBuilding(order.location.building);
            if (!loc) return;

            let node: Node;
            if (this.orderMarkerPrefab) {
                node = instantiate(this.orderMarkerPrefab);
            } else {
                const colors: Record<OrderPriority, Color> = {
                    urgent: new Color(255, 100, 100),
                    high: new Color(255, 170, 80),
                    medium: new Color(255, 220, 80),
                    low: new Color(120, 220, 140)
                };
                node = this.createPulsingMarker(
                    key,
                    colors[order.priority],
                    `📋 ${getCategoryText(order.category)}`,
                    40,
                    40
                );
            }
            node.name = key;

            const w = mapData.width * this.tilePixelSize;
            const h = mapData.height * this.tilePixelSize;
            node.setPosition(new Vec3(
                -w / 2 + loc.x + Math.random() * loc.width,
                h / 2 - loc.y - 20 - Math.random() * 20,
                5
            ));

            node.on(Node.EventType.TOUCH_END, () => this.onOrderMarkerClicked(order.id), this);

            if (this.markersLayer) this.markersLayer.addChild(node);
            this.markerNodes.set(key, node);
        });
    }

    public renderWorkers() {
        this.clearMarkers('worker_');
        const workers = game.getDispatchRuleManager().getAllWorkers();
        const mapData = this.mapManager.getCurrentMap();
        if (!mapData) return;

        const w = mapData.width * this.tilePixelSize;
        const h = mapData.height * this.tilePixelSize;
        const locations = mapData.locations.filter(l => l.type === 'building');

        workers.forEach((worker, idx) => {
            const key = `worker_${worker.id}`;
            const loc = locations[idx % locations.length] || locations[0];
            if (!loc) return;

            let node: Node;
            if (this.workerMarkerPrefab) {
                node = instantiate(this.workerMarkerPrefab);
            } else {
                const skillColor = worker.skills.includes('electrical') ? new Color(255, 230, 130)
                    : worker.skills.includes('plumbing') ? new Color(130, 200, 255)
                        : worker.skills.includes('equipment') ? new Color(200, 170, 255)
                            : worker.skills.includes('structure') ? new Color(210, 170, 120)
                                : new Color(180, 220, 180);
                node = this.createSimpleMarker(
                    key,
                    skillColor,
                    new Color(100, 80, 50),
                    `👷 ${worker.name}${worker.isAvailable ? '' : '(忙碌)'}`,
                    52,
                    52
                );
            }
            node.name = key;

            node.setPosition(new Vec3(
                -w / 2 + loc.x + loc.width / 2 + (idx % 2 === 0 ? -20 : 20),
                h / 2 - loc.y - loc.height + 30,
                3
            ));

            const op = node.getComponent(Sprite) || node.getComponentInChildren(Sprite);
            if (op && !worker.isAvailable) {
                op.color = new Color(op.color.r, op.color.g, op.color.b, 150);
            }

            node.on(Node.EventType.TOUCH_END, () => this.onWorkerClicked(worker.id), this);

            if (this.markersLayer) this.markersLayer.addChild(node);
            this.markerNodes.set(key, node);
        });
    }

    private clearMarkers(prefix: string) {
        const toRemove: string[] = [];
        this.markerNodes.forEach((node, key) => {
            if (key.startsWith(prefix)) {
                if (node.isValid) node.destroy();
                toRemove.push(key);
            }
        });
        toRemove.forEach(k => this.markerNodes.delete(k));
    }

    private createSimpleMarker(id: string, bgColor: Color, borderColor: Color, labelText: string, w: number, h: number): Node {
        const node = new Node(id);
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(w, h);

        const bg = node.addComponent(Sprite);
        bg.color = bgColor;
        bg.type = Sprite.Type.SLICED;

        const g = node.addComponent(Graphics);
        g.lineWidth = 2;
        g.strokeColor = borderColor;
        g.roundRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, 8);
        g.stroke();

        const labelNode = new Node('Label');
        labelNode.layer = Layers.Enum.UI_2D;
        const lUi = labelNode.addComponent(UITransform);
        lUi.setContentSize(w - 8, h - 8);
        const lbl = labelNode.addComponent(Label);
        lbl.string = labelText;
        lbl.fontSize = 11;
        lbl.color = new Color(60, 60, 60);
        lbl.lineHeight = 14;
        lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;
        labelNode.setPosition(Vec3.ZERO);
        node.addChild(labelNode);

        const btn = node.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 1.1;

        return node;
    }

    private createPulsingMarker(id: string, color: Color, labelText: string, w: number, h: number): Node {
        const container = new Node(id);
        container.layer = Layers.Enum.UI_2D;
        const cUi = container.addComponent(UITransform);
        cUi.setContentSize(w + 20, h + 20);

        const pulseNode = new Node('Pulse');
        pulseNode.layer = Layers.Enum.UI_2D;
        const pUi = pulseNode.addComponent(UITransform);
        pUi.setContentSize(w + 16, h + 16);
        const pGfx = pulseNode.addComponent(Graphics);
        pGfx.fillColor = new Color(color.r, color.g, color.b, 60);
        pGfx.circle(0, 0, (w + 16) / 2);
        pGfx.fill();
        const pOp = pulseNode.addComponent(UIOpacityProxy);
        container.addChild(pulseNode);

        let t = 0;
        const scheduler = this.scheduler;
        const cb = () => {
            if (!container.isValid) {
                scheduler.unschedule(cb, this);
                return;
            }
            t += 1 / 30;
            const pulse = 1 + Math.sin(t * 3) * 0.15;
            pulseNode.setScale(pulse, pulse, 1);
            const op = pulseNode.getComponent(UIOpacityProxy) as any;
            if (op && op.node) {
                const existing = op.node.getComponent(Graphics);
                if (existing) {
                    existing.clear();
                    existing.fillColor = new Color(color.r, color.g, color.b, 50 + Math.sin(t * 4) * 30);
                    existing.circle(0, 0, (w + 16) / 2 * pulse);
                    existing.fill();
                }
            }
        };
        scheduler.schedule(cb, this, 1 / 30, false);

        const marker = this.createSimpleMarker('Core', color, new Color(120, 60, 60), labelText, w, h);
        container.addChild(marker);

        return container;
    }

    private onBuildingClicked(loc: IMapLocation) {
        Logger.info('[地图] 点击建筑:', loc.name);
        if (!this.infoPanel) return;
        this.infoPanel.active = true;
        if (this.infoPanelTitle) this.infoPanelTitle.string = `🏢 ${loc.name}`;
        if (this.infoPanelContent) {
            const orders = this.orderManager.getAllActiveOrders().filter(o => o.location.building.includes(loc.name) || loc.name.includes(o.location.building));
            const workers = game.getDispatchRuleManager().getAllWorkers();
            const orderStr = orders.length > 0 ? orders.map(o => `· ${o.title}`).join('\n') : '（无报修工单）';
            this.infoPanelContent.string = 
                `${loc.description || loc.type}\n\n` +
                `📋 当前工单(${orders.length})：\n${orderStr}`;
        }

        const scene = findGameScene();
        if (scene) {
            scene.spawnOrderPanel();
            scene.spawnCluePanel();
            scene.spawnChoiceDialog();
        }
    }

    private onOrderMarkerClicked(orderId: string) {
        Logger.info('[地图] 点击工单:', orderId);
        const order = this.orderManager.getActiveOrder(orderId);
        if (!order) return;
        this.orderManager.acceptOrder(orderId);

        if (this.infoPanel) {
            this.infoPanel.active = true;
            if (this.infoPanelTitle) this.infoPanelTitle.string = `📋 ${order.title}`;
            if (this.infoPanelContent) {
                this.infoPanelContent.string = 
                    `📍 ${order.location.description}\n` +
                    `👤 ${order.reporter}\n\n` +
                    order.description;
            }
        }

        const scene = findGameScene();
        if (scene) {
            scene.spawnOrderPanel();
            scene.spawnCluePanel();
            scene.spawnChoiceDialog();
        }
    }

    private onWorkerClicked(workerId: string) {
        const worker = game.getDispatchRuleManager().getWorker(workerId);
        if (!worker || !this.infoPanel) return;

        this.infoPanel.active = true;
        if (this.infoPanelTitle) this.infoPanelTitle.string = `👷 ${worker.name}`;
        if (this.infoPanelContent) {
            const skillStr = worker.skills.map(s => `${getCategoryText(s)} Lv.${worker.skillLevel.get(s) || 1}`).join('\n· ');
            this.infoPanelContent.string =
                `状态：${worker.isAvailable ? '✅ 可用' : '⏳ 忙碌'}\n` +
                `工作量：${worker.currentLoad} / ${worker.maxLoad}\n\n` +
                `技能：\n· ${skillStr}`;
        }
    }

    onDestroy() {
        this.eventManager.removeAllListeners();
    }
}

class UIOpacityProxy {
    node: any;
    constructor() { this.node = null; }
}
