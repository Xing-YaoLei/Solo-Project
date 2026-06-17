import { _decorator, Component, Node, Label, Sprite, Color, Button, Prefab, instantiate, Vec3, Layers, UITransform, Graphics, director, find } from 'cc';
import { game } from '../Game';
import { SaveManager } from '../core/SaveManager';
import { DataManager } from '../data/DataManager';
import { EventManager, GameEventType } from '../core/EventManager';
import { Logger } from '../core/Logger';
import { findGameScene } from './GameScene';
const { ccclass, property } = _decorator;

@ccclass('MainMenuUI')
export class MainMenuUI extends Component {
    @property(Node)
    titleArea: Node | null = null;

    @property(Node)
    buttonsArea: Node | null = null;

    @property(Node)
    statsArea: Node | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    subtitleLabel: Label | null = null;

    @property(Label)
    playerNameLabel: Label | null = null;

    @property(Label)
    totalScoreLabel: Label | null = null;

    @property(Label)
    firstSolveRateLabel: Label | null = null;

    @property(Label)
    levelsCompletedLabel: Label | null = null;

    @property(Prefab)
    levelSelectPrefab: Prefab | null = null;

    @property(Button)
    startButton: Button | null = null;

    @property(Button)
    continueButton: Button | null = null;

    @property(Button)
    reviewButton: Button | null = null;

    @property(Button)
    leaderboardButton: Button | null = null;

    @property(Button)
    tutorialButton: Button | null = null;

    @property(Button)
    settingsButton: Button | null = null;

    private saveManager: SaveManager;
    private dataManager: DataManager;
    private eventManager: EventManager;

    onLoad() {
        this.saveManager = SaveManager.getInstance();
        this.dataManager = DataManager.getInstance();
        this.eventManager = EventManager.getInstance();

        this.saveManager.loadFromStorage();
        this.buildDefaultUI();
        this.render();
        this.setupButtons();
    }

    private buildDefaultUI() {
        const root = this.node;
        const rootUi = root.getComponent(UITransform) || root.addComponent(UITransform);
        if (rootUi.contentSize.width < 100) rootUi.setContentSize(1920, 1080);

        const bg = root.getComponent(Sprite) || root.addComponent(Sprite);
        bg.color = new Color(240, 245, 255);

        if (!this.titleArea) {
            this.titleArea = new Node('TitleArea');
            this.titleArea.layer = Layers.Enum.UI_2D;
            const tUi = this.titleArea.addComponent(UITransform);
            tUi.setContentSize(800, 200);
            this.titleArea.setPosition(new Vec3(0, 300, 0));
            root.addChild(this.titleArea);
            this.buildTitleArea();
        }

        if (!this.buttonsArea) {
            this.buttonsArea = new Node('ButtonsArea');
            this.buttonsArea.layer = Layers.Enum.UI_2D;
            const bUi = this.buttonsArea.addComponent(UITransform);
            bUi.setContentSize(400, 400);
            this.buttonsArea.setPosition(new Vec3(0, 0, 0));
            root.addChild(this.buttonsArea);
            this.buildButtonsArea();
        }

        if (!this.statsArea) {
            this.statsArea = new Node('StatsArea');
            this.statsArea.layer = Layers.Enum.UI_2D;
            const sUi = this.statsArea.addComponent(UITransform);
            sUi.setContentSize(500, 120);
            this.statsArea.setPosition(new Vec3(0, -350, 0));
            root.addChild(this.statsArea);
            this.buildStatsArea();
        }
    }

    private buildTitleArea() {
        if (!this.titleArea) return;

        const titleNode = new Node('Title');
        titleNode.layer = Layers.Enum.UI_2D;
        const tUi = titleNode.addComponent(UITransform);
        tUi.setContentSize(800, 80);
        const tLbl = titleNode.addComponent(Label);
        tLbl.string = '🏢 物业园区报修中心';
        tLbl.fontSize = 48;
        tLbl.color = new Color(40, 80, 160);
        titleNode.setPosition(new Vec3(0, 40, 0));
        this.titleArea.addChild(titleNode);
        this.titleLabel = tLbl;

        const subtitleNode = new Node('Subtitle');
        subtitleNode.layer = Layers.Enum.UI_2D;
        const sUi = subtitleNode.addComponent(UITransform);
        sUi.setContentSize(800, 40);
        const sLbl = subtitleNode.addComponent(Label);
        sLbl.string = '工单调度经营模拟游戏';
        sLbl.fontSize = 24;
        sLbl.color = new Color(100, 120, 180);
        subtitleNode.setPosition(new Vec3(0, -30, 0));
        this.titleArea.addChild(subtitleNode);
        this.subtitleLabel = sLbl;

        const versionNode = new Node('Version');
        versionNode.layer = Layers.Enum.UI_2D;
        const vUi = versionNode.addComponent(UITransform);
        vUi.setContentSize(400, 30);
        const vLbl = versionNode.addComponent(Label);
        vLbl.string = 'v1.0.0 | Cocos Creator 3.8 + TypeScript + Tiled';
        vLbl.fontSize = 14;
        vLbl.color = new Color(150, 160, 200);
        versionNode.setPosition(new Vec3(0, -80, 0));
        this.titleArea.addChild(versionNode);
    }

    private buildButtonsArea() {
        if (!this.buttonsArea) return;

        const buttons = [
            { id: 'start', label: '🎮 开始游戏', color: new Color(60, 150, 230), y: 120 },
            { id: 'continue', label: '▶️ 继续游戏', color: new Color(80, 180, 120), y: 50 },
            { id: 'tutorial', label: '📖 新手教程', color: new Color(255, 180, 60), y: -20 },
            { id: 'review', label: '📊 训练复盘', color: new Color(220, 120, 180), y: -90 },
            { id: 'leaderboard', label: '🏆 排行榜', color: new Color(150, 100, 200), y: -160 }
        ];

        buttons.forEach(cfg => {
            const btn = this.createMenuButton(cfg.id, cfg.label, cfg.color, cfg.y);
            this.buttonsArea!.addChild(btn);
        });
    }

    private createMenuButton(id: string, label: string, color: Color, y: number): Node {
        const node = new Node(`Button_${id}`);
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(320, 56);
        const bg = node.addComponent(Sprite);
        bg.color = color;
        bg.type = Sprite.Type.SLICED;

        const g = node.addComponent(Graphics);
        g.lineWidth = 2;
        g.strokeColor = new Color(color.r - 30, color.g - 30, color.b - 30);
        g.roundRect(-158, -26, 316, 52, 12);
        g.stroke();

        const btn = node.addComponent(Button);
        btn.transition = Button.Transition.COLOR;
        btn.normalColor = color;
        btn.hoverColor = new Color(Math.min(255, color.r + 30), Math.min(255, color.g + 30), Math.min(255, color.b + 30));
        btn.pressedColor = new Color(color.r - 20, color.g - 20, color.b - 20);

        const lbl = node.addComponent(Label);
        lbl.string = label;
        lbl.fontSize = 22;
        lbl.color = new Color(255, 255, 255);

        node.setPosition(new Vec3(0, y, 0));

        (this as any)[`${id}Button`] = btn;
        return node;
    }

    private buildStatsArea() {
        if (!this.statsArea) return;

        const bg = this.statsArea.getComponent(Sprite) || this.statsArea.addComponent(Sprite);
        bg.color = new Color(255, 255, 255, 200);
        bg.type = Sprite.Type.SLICED;
        const g = this.statsArea.addComponent(Graphics);
        g.lineWidth = 1;
        g.strokeColor = new Color(220, 220, 230);
        g.roundRect(-248, -58, 496, 116, 10);
        g.stroke();

        const items = [
            { key: 'playerName', label: '玩家', prefix: '👤' },
            { key: 'totalScore', label: '总得分', prefix: '⭐' },
            { key: 'firstSolveRate', label: '首次解决率', prefix: '🎯' },
            { key: 'levelsCompleted', label: '已通关', prefix: '🏁' }
        ];

        const cellW = 120;
        const startX = -180;

        items.forEach((item, i) => {
            const cell = new Node(`Stat_${item.key}`);
            cell.layer = Layers.Enum.UI_2D;
            const cUi = cell.addComponent(UITransform);
            cUi.setContentSize(cellW, 100);

            const labelNode = new Node('Label');
            labelNode.layer = Layers.Enum.UI_2D;
            const lUi = labelNode.addComponent(UITransform);
            lUi.setContentSize(cellW, 20);
            const lLbl = labelNode.addComponent(Label);
            lLbl.string = `${item.prefix} ${item.label}`;
            lLbl.fontSize = 12;
            lLbl.color = new Color(140, 140, 160);
            labelNode.setPosition(new Vec3(0, 25, 0));
            cell.addChild(labelNode);

            const valueNode = new Node('Value');
            valueNode.layer = Layers.Enum.UI_2D;
            const vUi = valueNode.addComponent(UITransform);
            vUi.setContentSize(cellW, 40);
            const vLbl = valueNode.addComponent(Label);
            vLbl.string = '-';
            vLbl.fontSize = 24;
            vLbl.color = new Color(50, 60, 100);
            valueNode.setPosition(new Vec3(0, -10, 0));
            cell.addChild(valueNode);

            cell.setPosition(new Vec3(startX + i * cellW, 0, 0));
            this.statsArea!.addChild(cell);

            (this as any)[`${item.key}Label`] = vLbl;
        });
    }

    private render() {
        const profile = this.saveManager.getProfile();
        if (this.playerNameLabel) this.playerNameLabel.string = profile.playerName;
        if (this.totalScoreLabel) this.totalScoreLabel.string = `${profile.totalScore}`;
        if (this.firstSolveRateLabel) this.firstSolveRateLabel.string = `${Math.round(profile.firstSolveRate * 100)}%`;
        if (this.levelsCompletedLabel) this.levelsCompletedLabel.string = `${profile.totalLevelsCompleted} / 6`;
    }

    private setupButtons() {
        if (this.startButton) {
            this.startButton.node.on(Button.EventType.CLICK, () => this.onStartGame(), this);
        }
        if (this.continueButton) {
            this.continueButton.node.on(Button.EventType.CLICK, () => this.onContinueGame(), this);
        }
        if (this.tutorialButton) {
            this.tutorialButton.node.on(Button.EventType.CLICK, () => this.onOpenTutorial(), this);
        }
        if (this.reviewButton) {
            this.reviewButton.node.on(Button.EventType.CLICK, () => this.onOpenReview(), this);
        }
        if (this.leaderboardButton) {
            this.leaderboardButton.node.on(Button.EventType.CLICK, () => this.onOpenLeaderboard(), this);
        }
        if (this.settingsButton) {
            this.settingsButton.node.on(Button.EventType.CLICK, () => this.onOpenSettings(), this);
        }
    }

    private onStartGame() {
        Logger.info('[主菜单] 开始新游戏');
        this.saveManager.resetProgress();
        this.startLevel(1);
    }

    private onContinueGame() {
        Logger.info('[主菜单] 继续游戏');
        const profile = this.saveManager.getProfile();
        const nextLevel = Math.min(profile.totalLevelsCompleted + 1, 6);
        const levelToStart = profile.totalLevelsCompleted > 0 ? nextLevel : 1;
        this.startLevel(levelToStart);
    }

    private startLevel(levelId: number) {
        this.node.active = false;
        this.scheduleOnce(async () => {
            await game.initialize();
            director.loadScene('Game', () => {
                Logger.info(`[主菜单] 已加载游戏场景，关卡: ${levelId}`);
                this.scheduleOnce(() => {
                    const scene = findGameScene();
                    if (scene) {
                        this.eventManager.emit(GameEventType.GAME_START, { levelId });
                    }
                }, 0.3);
            });
        }, 0.1);
    }

    private onOpenTutorial() {
        Logger.info('[主菜单] 打开教程');
        this.startLevel(1);
        this.scheduleOnce(() => {
            const scene = findGameScene();
            if (scene) {
                scene.spawnTutorialPanel();
            }
        }, 0.5);
    }

    private onOpenReview() {
        Logger.info('[主菜单] 打开复盘');
        this.node.active = false;
        this.scheduleOnce(async () => {
            await game.initialize();
            director.loadScene('Game', () => {
                this.scheduleOnce(() => {
                    const scene = findGameScene();
                    if (scene) {
                        scene.spawnReviewPanel();
                    }
                }, 0.3);
            });
        }, 0.1);
    }

    private onOpenLeaderboard() {
        Logger.info('[主菜单] 打开排行榜');
        this.showNotification('🏆 排行榜', '排行榜功能开发中...', 'info');
    }

    private onOpenSettings() {
        Logger.info('[主菜单] 打开设置');
        this.showNotification('⚙️ 设置', '设置功能开发中...', 'info');
    }

    private showNotification(title: string, message: string, type: string) {
        const existing = find('Canvas/NotificationLayer');
        if (existing) {
            const notif = new Node('Notification');
            notif.layer = Layers.Enum.UI_2D;
            const ui = notif.addComponent(UITransform);
            ui.setContentSize(300, 60);
            const bg = notif.addComponent(Sprite);
            bg.color = new Color(80, 140, 230);
            bg.type = Sprite.Type.SLICED;
            const lbl = notif.addComponent(Label);
            lbl.string = `${title} - ${message}`;
            lbl.color = new Color(255, 255, 255);
            lbl.fontSize = 14;
            notif.setPosition(new Vec3(0, 300, 0));
            existing.addChild(notif);
            this.scheduleOnce(() => notif.destroy(), 2);
        } else {
            Logger.info(`[通知] ${title}: ${message}`);
        }
    }

    update(dt: number) {
        if (Math.random() < 0.01) {
            this.render();
        }
    }
}
