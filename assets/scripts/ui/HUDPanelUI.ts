import { _decorator, Component, Node, Label, Sprite, Color, Button, ProgressBar, Vec3, Layers, UITransform, Prefab, instantiate, UIOpacity, Graphics } from 'cc';
import { game } from '../Game';
import { EventManager, GameEventType } from '../core/EventManager';
import { SaveManager } from '../core/SaveManager';
import { DataManager } from '../data/DataManager';
import { findGameScene } from '../scenes/GameScene';
import { Logger } from '../core/Logger';
const { ccclass, property } = _decorator;

@ccclass('HUDPanelUI')
export class HUDPanelUI extends Component {
    @property(Label)
    levelLabel: Label | null = null;

    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    targetScoreLabel: Label | null = null;

    @property(Label)
    timerLabel: Label | null = null;

    @property(Label)
    orderCountLabel: Label | null = null;

    @property(Label)
    firstSolveRateLabel: Label | null = null;

    @property(ProgressBar)
    scoreProgress: ProgressBar | null = null;

    @property(ProgressBar)
    timerProgress: ProgressBar | null = null;

    @property(Node)
    scorePopupNode: Node | null = null;

    @property(Button)
    pauseButton: Button | null = null;

    @property(Button)
    menuButton: Button | null = null;

    @property(Button)
    reviewButton: Button | null = null;

    private eventManager: EventManager;
    private saveManager: SaveManager;
    private dataManager: DataManager;
    private levelEndTime = 0;
    private totalTime = 0;
    private currentScore = 0;
    private targetScore = 0;
    private scoreAnimations: any[] = [];

    onLoad() {
        this.eventManager = EventManager.getInstance();
        this.saveManager = SaveManager.getInstance();
        this.dataManager = DataManager.getInstance();

        if (this.pauseButton) {
            this.pauseButton.node.on(Button.EventType.CLICK, () => this.togglePause(), this);
        }
        if (this.menuButton) {
            this.menuButton.node.on(Button.EventType.CLICK, () => this.goToMenu(), this);
        }
        if (this.reviewButton) {
            this.reviewButton.node.on(Button.EventType.CLICK, () => this.openReview(), this);
        }

        this.initializeLevel();
        this.setupEventListeners();
        this.render();
    }

    private initializeLevel() {
        const gm = game.getGameManager();
        const levelId = gm.getCurrentLevel();
        const config = this.dataManager.getLevelConfig(levelId);
        this.targetScore = config?.targetScore || 0;
        this.totalTime = config?.timeLimit || 600;
        this.levelEndTime = Date.now() + this.totalTime * 1000;
        this.currentScore = 0;

        if (this.levelLabel) this.levelLabel.string = `关卡 ${levelId}：${config?.name || ''}`;
        if (this.targetScoreLabel) this.targetScoreLabel.string = `目标：${this.targetScore}`;
    }

    private setupEventListeners() {
        this.eventManager.on(GameEventType.SCORE_UPDATED, (event) => {
            const newScore = event.data?.score || 0;
            const delta = newScore - this.currentScore;
            if (delta !== 0) {
                this.showScorePopup(delta);
            }
            this.currentScore = newScore;
            this.render();
        });

        this.eventManager.on(GameEventType.ORDER_RECEIVED, () => this.renderOrderCount());
        this.eventManager.on(GameEventType.ORDER_COMPLETED, () => this.renderOrderCount());
        this.eventManager.on(GameEventType.ORDER_FAILED, () => this.renderOrderCount());
    }

    public render() {
        this.renderScore();
        this.renderTimer();
        this.renderOrderCount();
        this.renderStats();
    }

    private renderScore() {
        if (this.scoreLabel) {
            this.scoreLabel.string = `${this.currentScore}`;
            this.scoreLabel.color = this.currentScore >= this.targetScore ? new Color(60, 180, 100) : new Color(50, 50, 50);
        }
        if (this.scoreProgress && this.targetScore > 0) {
            this.scoreProgress.progress = Math.min(1.0, this.currentScore / this.targetScore);
        }
    }

    private renderTimer() {
        if (!this.timerLabel) return;
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((this.levelEndTime - now) / 1000));
        const min = Math.floor(remaining / 60);
        const sec = remaining % 60;
        this.timerLabel.string = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        
        if (remaining < 60) {
            this.timerLabel.color = new Color(220, 60, 60);
        } else if (remaining < 180) {
            this.timerLabel.color = new Color(220, 140, 40);
        } else {
            this.timerLabel.color = new Color(60, 60, 60);
        }

        if (this.timerProgress && this.totalTime > 0) {
            this.timerProgress.progress = remaining / this.totalTime;
        }

        if (remaining <= 0 && game.getGameManager().isGamePlaying()) {
            game.getGameManager().failLevel('总时间耗尽');
        }
    }

    private renderOrderCount() {
        if (!this.orderCountLabel) return;
        const pending = game.getOrderManager().getPendingOrders().length;
        const inProgress = game.getOrderManager().getInProgressOrders().length;
        this.orderCountLabel.string = `📋 ${pending} 待处理 | ⚙️ ${inProgress} 处理中`;
    }

    private renderStats() {
        if (!this.firstSolveRateLabel) return;
        const profile = this.saveManager.getProfile();
        const rate = Math.round(profile.firstSolveRate * 100);
        this.firstSolveRateLabel.string = `🎯 首次解决率 ${rate}%`;
    }

    private showScorePopup(delta: number) {
        if (!this.scorePopupNode) {
            Logger.info(`[分数] ${delta > 0 ? '+' : ''}${delta}`);
            return;
        }

        const popup = instantiate(this.scorePopupNode);
        popup.name = `Popup_${Date.now()}`;
        popup.active = true;

        const label = popup.getComponent(Label) || popup.getComponentInChildren(Label);
        if (label) {
            label.string = delta > 0 ? `+${delta}` : `${delta}`;
            label.color = delta > 0 ? new Color(60, 180, 100) : new Color(220, 70, 70);
        }

        const op = popup.getComponent(UIOpacity) || popup.addComponent(UIOpacity);
        op.opacity = 0;
        popup.setPosition(new Vec3(0, 0, 0));
        this.node.addChild(popup);

        let t = 0;
        const duration = 1.2;
        const scheduler = this.scheduler;
        const cb = () => {
            t += 1 / 60;
            if (t < 0.2) {
                op.opacity = Math.round((t / 0.2) * 255);
            } else if (t < duration) {
                const ratio = (t - 0.2) / (duration - 0.2);
                popup.setPosition(new Vec3(0, ratio * 80, 0));
                op.opacity = Math.round((1 - ratio) * 255);
            } else {
                op.opacity = 0;
                if (popup.isValid) popup.destroy();
                scheduler.unschedule(cb, this);
                const idx = this.scoreAnimations.indexOf(cb);
                if (idx >= 0) this.scoreAnimations.splice(idx, 1);
                return;
            }
        };
        this.scoreAnimations.push(cb);
        scheduler.schedule(cb, this, 1 / 60, false);
    }

    private togglePause() {
        const gm = game.getGameManager();
        if (gm.isPaused()) {
            gm.resumeGame();
        } else {
            gm.pauseGame();
        }
        if (this.pauseButton) {
            const lbl = this.pauseButton.node.getComponentInChildren(Label);
            if (lbl) lbl.string = gm.isPaused() ? '▶️ 继续' : '⏸️ 暂停';
        }
    }

    private goToMenu() {
        game.returnToMenu();
    }

    private openReview() {
        const scene = findGameScene();
        if (scene) scene.spawnReviewPanel();
    }

    update(dt: number) {
        this.renderTimer();
    }

    onDestroy() {
        this.eventManager.removeAllListeners();
        this.scoreAnimations.forEach(cb => this.scheduler.unschedule(cb, this));
        this.scoreAnimations = [];
    }
}
