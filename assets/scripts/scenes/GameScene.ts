import { _decorator, Component, Node, director, find, instantiate, Prefab, Sprite, Label, Color, UIOpacity, UITransform, Vec3, Layers } from 'cc';
import { game } from '../Game';
import { EventManager, GameEventType } from '../core/EventManager';
import { Logger } from '../core/Logger';
const { ccclass, property } = _decorator;

export interface SceneRefs {
    uiCanvas: Node;
    mapContainer: Node;
    hudLayer: Node;
    dialogLayer: Node;
    notificationLayer: Node;
    tutorialLayer: Node;
}

@ccclass('GameScene')
export class GameScene extends Component {
    @property(Node)
    uiCanvas: Node | null = null;

    @property(Node)
    mapContainer: Node | null = null;

    @property(Node)
    hudLayer: Node | null = null;

    @property(Node)
    dialogLayer: Node | null = null;

    @property(Node)
    notificationLayer: Node | null = null;

    @property(Node)
    tutorialLayer: Node | null = null;

    @property(Prefab)
    orderListPrefab: Prefab | null = null;

    @property(Prefab)
    orderPanelPrefab: Prefab | null = null;

    @property(Prefab)
    hudPanelPrefab: Prefab | null = null;

    @property(Prefab)
    tutorialOverlayPrefab: Prefab | null = null;

    @property(Prefab)
    reviewPanelPrefab: Prefab | null = null;

    @property(Prefab)
    tiledMapPrefab: Prefab | null = null;

    private eventManager: EventManager;
    private refs: SceneRefs;
    private started = false;

    constructor() {
        super();
        this.eventManager = EventManager.getInstance();
        this.refs = {} as SceneRefs;
    }

    onLoad() {
        this.cacheRefs();
        this.setupEventListeners();
        Logger.info('GameScene loaded');
    }

    async start() {
        if (this.started) return;
        this.started = true;

        try {
            await game.initialize();
            this.spawnHUD();
            this.spawnTiledMap();

            const startLevel = 1;
            Logger.info(`Starting game at level ${startLevel} from GameScene`);
            await game.startGame(startLevel);
            this.spawnOrderList();

            if (game.getTutorialManager().shouldShowTutorial()) {
                this.spawnTutorialPanel();
            }
        } catch (error) {
            Logger.error('Failed to start game from scene:', error);
        }
    }

    private cacheRefs() {
        this.refs.uiCanvas = this.uiCanvas || find('Canvas') || this.node;
        this.refs.mapContainer = this.mapContainer || find('Canvas/MapContainer') || this.refs.uiCanvas;
        this.refs.hudLayer = this.hudLayer || this.ensureChild(this.refs.uiCanvas, 'HUDLayer');
        this.refs.dialogLayer = this.dialogLayer || this.ensureChild(this.refs.uiCanvas, 'DialogLayer');
        this.refs.notificationLayer = this.notificationLayer || this.ensureChild(this.refs.uiCanvas, 'NotificationLayer');
        this.refs.tutorialLayer = this.tutorialLayer || this.ensureChild(this.refs.uiCanvas, 'TutorialLayer');
    }

    private ensureChild(parent: Node, name: string): Node {
        let child = parent.getChildByName(name);
        if (!child) {
            child = new Node(name);
            child.addComponent(UITransform);
            const ui = child.getComponent(UITransform);
            if (ui) {
                const parentUi = parent.getComponent(UITransform);
                if (parentUi) {
                    ui.setContentSize(parentUi.contentSize);
                }
            }
            child.layer = Layers.Enum.UI_2D;
            parent.addChild(child);
        }
        return child;
    }

    private setupEventListeners() {
        this.eventManager.on(GameEventType.ORDER_RECEIVED, (event) => {
            Logger.info('[Scene] 新工单收到:', event.data?.order?.title);
            this.showNotification('📩 新工单', event.data?.order?.title, 'info');
        });

        this.eventManager.on(GameEventType.ORDER_COMPLETED, (event) => {
            Logger.info('[Scene] 工单完成:', event.data?.orderId);
            this.showNotification('✅ 工单完成', `+${event.data?.score || 0} 分`, 'success');
        });

        this.eventManager.on(GameEventType.ORDER_FAILED, (event) => {
            const desc = event.data?.penalty?.description || '处理失败';
            const deduction = event.data?.scoreDeduction || 0;
            Logger.warn('[Scene] 工单失败:', desc);
            this.showNotification('❌ 处理失误', `${desc} -${deduction}分`, 'error');
        });

        this.eventManager.on(GameEventType.ORDER_TIMEOUT, (event) => {
            Logger.warn('[Scene] 工单超时:', event.data?.orderId);
            this.showNotification('⏰ 工单超时', '请加快处理速度', 'warning');
        });

        this.eventManager.on(GameEventType.CLUE_DISCOVERED, (event) => {
            Logger.info('[Scene] 发现线索:', event.data?.clue?.title);
            this.showNotification('🔍 发现线索', event.data?.clue?.title, 'success');
        });

        this.eventManager.on(GameEventType.RULE_UNLOCKED, (event) => {
            Logger.info('[Scene] 规则解锁:', event.data?.ruleId);
            this.showNotification('🎯 规则解锁', event.data?.rule?.name || '新规则可用', 'success');
        });

        this.eventManager.on(GameEventType.REVIEW_FAILED, (event) => {
            Logger.warn('[Scene] 复核不通过:', event.data?.errorType);
        });

        this.eventManager.on(GameEventType.LEVEL_COMPLETE, (event) => {
            Logger.info('[Scene] 关卡完成:', event.data?.levelId, '得分:', event.data?.score);
            this.showNotification('🎉 关卡完成', `得分: ${event.data?.score || 0}`, 'success');
            this.spawnReviewPanel();
        });

        this.eventManager.on(GameEventType.LEVEL_FAIL, (event) => {
            Logger.warn('[Scene] 关卡失败:', event.data?.reason);
            this.showNotification('😢 关卡失败', event.data?.reason || '', 'error');
            this.spawnReviewPanel();
        });
    }

    public getRefs(): SceneRefs {
        return this.refs;
    }

    public spawnOrderList() {
        if (!this.orderListPrefab || !this.refs.uiCanvas) return;
        const node = instantiate(this.orderListPrefab);
        node.name = 'OrderList';
        node.setPosition(new Vec3(-700, 0, 0));
        this.refs.uiCanvas.addChild(node);
    }

    public spawnOrderPanel() {
        if (!this.orderPanelPrefab || !this.refs.dialogLayer) return;
        const existing = this.refs.dialogLayer.getChildByName('OrderPanel');
        if (existing) {
            existing.active = true;
            return;
        }
        const node = instantiate(this.orderPanelPrefab);
        node.name = 'OrderPanel';
        node.setPosition(new Vec3(450, 0, 0));
        this.refs.dialogLayer.addChild(node);
    }

    public spawnHUD() {
        if (!this.hudPanelPrefab || !this.refs.hudLayer) return;
        const node = instantiate(this.hudPanelPrefab);
        node.name = 'HUDPanel';
        node.setPosition(Vec3.ZERO);
        this.refs.hudLayer.addChild(node);
    }

    public spawnTutorialPanel() {
        if (!this.tutorialOverlayPrefab || !this.refs.tutorialLayer) return;
        const node = instantiate(this.tutorialOverlayPrefab);
        node.name = 'TutorialOverlay';
        node.setPosition(Vec3.ZERO);
        this.refs.tutorialLayer.addChild(node);
    }

    public spawnReviewPanel() {
        if (!this.reviewPanelPrefab || !this.refs.dialogLayer) return;
        const node = instantiate(this.reviewPanelPrefab);
        node.name = 'ReviewPanel';
        node.setPosition(Vec3.ZERO);
        this.refs.dialogLayer.addChild(node);
    }

    public spawnTiledMap() {
        if (!this.tiledMapPrefab || !this.refs.mapContainer) return;
        const node = instantiate(this.tiledMapPrefab);
        node.name = 'TiledMap';
        node.setPosition(new Vec3(0, -50, 0));
        this.refs.mapContainer.addChild(node);
    }

    public showNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
        if (!this.refs.notificationLayer) {
            Logger.info(`[通知] ${title}: ${message}`);
            return;
        }

        const node = new Node(`Notification_${Date.now()}`);
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(360, 80);
        ui.anchorY = 1;

        const bg = node.addComponent(Sprite);
        bg.type = Sprite.Type.SLICED;
        const colorMap: Record<string, Color> = {
            info: new Color(80, 140, 255, 235),
            success: new Color(80, 200, 120, 235),
            warning: new Color(255, 180, 60, 235),
            error: new Color(220, 80, 80, 235)
        };
        bg.color = colorMap[type] || colorMap.info;

        const titleNode = new Node('Title');
        titleNode.layer = Layers.Enum.UI_2D;
        const tUi = titleNode.addComponent(UITransform);
        tUi.setContentSize(340, 28);
        tUi.anchorY = 1;
        const titleLbl = titleNode.addComponent(Label);
        titleLbl.string = title;
        titleLbl.fontSize = 15;
        titleLbl.color = new Color(255, 255, 255);
        titleLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        titleNode.setPosition(new Vec3(10, -10, 0));
        node.addChild(titleNode);

        const msgNode = new Node('Message');
        msgNode.layer = Layers.Enum.UI_2D;
        const mUi = msgNode.addComponent(UITransform);
        mUi.setContentSize(340, 40);
        mUi.anchorY = 1;
        const msgLbl = msgNode.addComponent(Label);
        msgLbl.string = message;
        msgLbl.fontSize = 12;
        msgLbl.color = new Color(255, 255, 255, 240);
        msgLbl.lineHeight = 18;
        msgLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        msgLbl.verticalAlign = Label.VerticalAlign.TOP;
        msgNode.setPosition(new Vec3(10, -38, 0));
        node.addChild(msgNode);

        const opacity = node.addComponent(UIOpacity);
        opacity.opacity = 0;

        const existingCount = this.refs.notificationLayer.children.length;
        node.setPosition(new Vec3(0, -10 - existingCount * 90, 0));
        this.refs.notificationLayer.addChild(node);

        let t = 0;
        const fadeInDuration = 0.2;
        const showDuration = 2.5;
        const fadeOutDuration = 0.5;
        const total = fadeInDuration + showDuration + fadeOutDuration;
        const scheduler = this.scheduler;
        const callback = () => {
            t += 1 / 60;
            if (t < fadeInDuration) {
                opacity.opacity = Math.round((t / fadeInDuration) * 255);
            } else if (t < fadeInDuration + showDuration) {
                opacity.opacity = 255;
            } else if (t < total) {
                const fadeT = (t - fadeInDuration - showDuration) / fadeOutDuration;
                opacity.opacity = Math.round((1 - fadeT) * 255);
            } else {
                opacity.opacity = 0;
                if (node.isValid) node.destroy();
                scheduler.unschedule(callback, this);
                return;
            }
        };
        scheduler.schedule(callback, this, 1 / 60, false);
    }

    update(dt: number) {
        if (this.started) {
            game.update(dt);
        }
    }

    onDestroy() {
        this.eventManager.removeAllListeners();
    }
}

export function findGameScene(): GameScene | null {
    const canvas = find('Canvas');
    if (!canvas) return null;
    return canvas.getComponent(GameScene) || canvas.getComponentInChildren(GameScene);
}
