import { _decorator, Component, Node, resources, TiledMap, TiledLayer, UITransform, Vec3, Label, Color, log, warn, error } from 'cc';
import { ConfigTypes } from '../types/ConfigTypes';
import { ConfigManager } from '../core/ConfigManager';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('SceneController')
export class SceneController extends Component {

    @property(Node)
    tiledMapContainer: Node | null = null;

    @property(Node)
    interactiveObjectsContainer: Node | null = null;

    private currentSceneConfig: ConfigTypes.SceneConfig | null = null;
    private tiledMapNode: Node | null = null;
    private interactiveObjectNodes: Map<string, Node> = new Map();
    private npcNodes: Map<string, Node> = new Map();

    start(): void {
        this.registerGameEvents();
    }

    private registerGameEvents(): void {
        GameManager.instance.eventTarget.on('session_started', this.onSessionStarted, this);
    }

    onDestroy(): void {
        GameManager.instance.eventTarget.off('session_started', this.onSessionStarted, this);
    }

    private onSessionStarted(): void {
        const levelConfig = GameManager.instance.getCurrentLevelConfig();
        if (levelConfig) {
            this.loadScene(levelConfig.sceneId);
        }
    }

    public loadScene(sceneId: string): void {
        const sceneConfig = ConfigManager.instance.getSceneById(sceneId);
        if (!sceneConfig) {
            warn(`[SceneController] 场景配置不存在: ${sceneId}`);
            return;
        }

        this.clearCurrentScene();
        this.currentSceneConfig = sceneConfig;
        log(`[SceneController] 加载场景: ${sceneConfig.name}`);

        this.loadTiledMap(sceneConfig.tiledMap);
        this.createInteractiveObjects(sceneConfig.interactiveObjects);
        this.createNPCs(sceneConfig.npcs);
    }

    private loadTiledMap(mapPath: string): void {
        if (!this.tiledMapContainer) return;

        resources.load(mapPath, (err, tiledMapAsset) => {
            if (err) {
                warn(`[SceneController] Tiled地图加载失败: ${mapPath}`, err);
                this.createPlaceholderMap();
                return;
            }

            this.tiledMapNode = new Node('TiledMap');
            const tiledMap = this.tiledMapNode.addComponent(TiledMap);
            tiledMap.tmxAsset = tiledMapAsset as any;
            this.tiledMapContainer.addChild(this.tiledMapNode);

            this.tiledMapNode.setPosition(new Vec3(0, 0, 0));
        });
    }

    private createPlaceholderMap(): void {
        if (!this.tiledMapContainer) return;

        const placeholder = new Node('MapPlaceholder');
        const uiTransform = placeholder.addComponent(UITransform);
        uiTransform.setContentSize(1280, 600);
        this.tiledMapContainer.addChild(placeholder);

        log('[SceneController] 使用占位地图替代Tiled地图');
    }

    private clearCurrentScene(): void {
        if (this.tiledMapContainer) {
            this.tiledMapContainer.removeAllChildren();
        }
        if (this.interactiveObjectsContainer) {
            this.interactiveObjectsContainer.removeAllChildren();
        }
        this.tiledMapNode = null;
        this.interactiveObjectNodes.clear();
        this.npcNodes.clear();
        this.currentSceneConfig = null;
    }

    private createInteractiveObjects(objects: ConfigTypes.InteractiveObject[]): void {
        if (!this.interactiveObjectsContainer) return;

        objects.forEach((obj, index) => {
            const node = this.createInteractiveObjectNode(obj);
            node.name = obj.id;
            node.setPosition(this.calculateObjectPosition(index, objects.length));

            node.on(Node.EventType.TOUCH_END, () => {
                this.onInteractiveObjectClicked(obj);
            });

            this.interactiveObjectsContainer.addChild(node);
            this.interactiveObjectNodes.set(obj.id, node);
        });
    }

    private createInteractiveObjectNode(obj: ConfigTypes.InteractiveObject): Node {
        const node = new Node(obj.id);
        const ut = node.addComponent(UITransform);
        ut.setContentSize(120, 80);

        const nameLabel = this.addLabel(node, obj.name, 11, new Color(33, 33, 33), 120, 24, 0, -20);
        const typeLabel = this.addLabel(node, obj.type, 9, new Color(100, 100, 100), 120, 20, 0, 10);

        return node;
    }

    private addLabel(parent: Node, text: string, fontSize: number, color: Color, w: number, h: number, x: number, y: number): Label {
        const n = new Node('Label');
        parent.addChild(n);
        const ut = n.addComponent(UITransform);
        ut.setContentSize(w, h);
        n.setPosition(x, y, 0);
        const label = n.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize * 1.2;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.CLAMP;
        label.color = color;
        return label;
    }

    private calculateObjectPosition(index: number, total: number): Vec3 {
        const startX = -400;
        const spacing = 200;
        const y = index % 2 === 0 ? 50 : -50;
        return new Vec3(startX + (index * spacing) % 800, y, 0);
    }

    private createNPCs(npcs: ConfigTypes.NPCConfig[]): void {
        if (!this.interactiveObjectsContainer) return;

        npcs.forEach((npc, index) => {
            const node = this.createNPCNode(npc);
            node.name = npc.id;
            node.setPosition(new Vec3(300 + index * 150, 0, 0));

            node.on(Node.EventType.TOUCH_END, () => {
                this.onNPCClicked(npc);
            });

            this.interactiveObjectsContainer.addChild(node);
            this.npcNodes.set(npc.id, node);
        });
    }

    private createNPCNode(npc: ConfigTypes.NPCConfig): Node {
        const node = new Node(npc.id);
        const ut = node.addComponent(UITransform);
        ut.setContentSize(80, 100);

        const nameLabel = this.addLabel(node, npc.name, 11, new Color(33, 33, 33), 80, 20, 0, -30);
        const roleLabel = this.addLabel(node, npc.role, 9, new Color(100, 100, 100), 80, 20, 0, 10);

        return node;
    }

    private onInteractiveObjectClicked(obj: ConfigTypes.InteractiveObject): void {
        log(`[SceneController] 点击交互对象: ${obj.name}`);

        if (obj.triggerTaskIds && obj.triggerTaskIds.length > 0) {
            const currentTask = GameManager.instance.getCurrentTask();
            if (currentTask && obj.triggerTaskIds.includes(currentTask.id)) {
                log(`[SceneController] 触发关联任务: ${currentTask.name}`);
            } else {
                const taskToTrigger = obj.triggerTaskIds[0];
                const taskConfig = ConfigManager.instance.getTaskById(taskToTrigger);
                if (taskConfig) {
                    warn(`[SceneController] 当前任务不匹配，预期: ${obj.triggerTaskIds.join(',')}`);
                }
            }
        }
    }

    private onNPCClicked(npc: ConfigTypes.NPCConfig): void {
        log(`[SceneController] 点击NPC: ${npc.name} (${npc.role})`);

        if (npc.role === 'PATIENT') {
            const currentTask = GameManager.instance.getCurrentTask();
            if (currentTask && (currentTask.type === 'EVALUATION' || currentTask.type === 'OBSERVATION')) {
                log(`[SceneController] 与患者交互进行评估`);
            }
        }
    }

    public getSceneConfig(): ConfigTypes.SceneConfig | null {
        return this.currentSceneConfig;
    }

    public getInteractiveObjectNode(id: string): Node | null {
        return this.interactiveObjectNodes.get(id) || null;
    }

    public getNPCNode(id: string): Node | null {
        return this.npcNodes.get(id) || null;
    }

    public highlightInteractiveObject(id: string, highlight: boolean): void {
        const node = this.interactiveObjectNodes.get(id);
        if (node) {
            const scale = highlight ? 1.15 : 1.0;
            node.setScale(new Vec3(scale, scale, 1));
        }
    }

    public getTiledLayer(layerName: string): TiledLayer | null {
        if (!this.tiledMapNode) return null;
        const tiledMap = this.tiledMapNode.getComponent(TiledMap);
        if (!tiledMap) return null;
        return tiledMap.getLayer(layerName);
    }
}
