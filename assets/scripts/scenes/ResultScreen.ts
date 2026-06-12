import { _decorator, Component, Node, Label, Button, Sprite, Color, ScrollView, Prefab, instantiate, Vec3, UITransform, director } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { GameManager } from '../core/GameManager';
import { LevelManager } from '../game/LevelManager';
import { AchievementManager } from '../game/AchievementManager';
import { LevelResult, PlayerCardPoint } from '../models/GameStats';
import { LevelObjective, LevelConfig } from '../models/Level';
import { AchievementConfig } from '../models/Achievement';
const { ccclass, property } = _decorator;

@ccclass('ObjectiveScoreItem')
export class ObjectiveScoreItem extends Component {
    @property(Label)
    public nameLabel: Label | null = null;

    @property(Label)
    public scoreLabel: Label | null = null;

    @property(Sprite)
    public progressBar: Sprite | null = null;

    setData(objective: LevelObjective, score: number) {
        if (this.nameLabel) this.nameLabel.string = objective.description;

        const ratio = score / (objective.weight * 100);
        if (this.scoreLabel) {
            const displayScore = Math.floor(score);
            this.scoreLabel.string = `${displayScore}分`;
            this.scoreLabel.color = ratio >= 0.8 ? new Color(80, 200, 80) :
                                    ratio >= 0.6 ? new Color(255, 180, 50) :
                                    new Color(255, 100, 100);
        }

        if (this.progressBar) {
            const uiTransform = this.progressBar.getComponent(UITransform);
            if (uiTransform) {
                const originalWidth = 200;
                uiTransform.setContentSize(originalWidth * Math.min(1, ratio * 1.25), uiTransform.contentSize.height);
            }
        }
    }
}

@ccclass('CardPointItem')
export class CardPointItem extends Component {
    @property(Label)
    public timeLabel: Label | null = null;

    @property(Label)
    public descLabel: Label | null = null;

    @property(Sprite)
    public typeIcon: Sprite | null = null;

    setData(point: PlayerCardPoint) {
        const date = new Date(point.time);
        if (this.timeLabel) {
            this.timeLabel.string = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        }

        if (this.descLabel) this.descLabel.string = point.description;

        if (this.typeIcon) {
            let color: Color;
            switch (point.type) {
                case 'success':
                    color = new Color(80, 200, 80);
                    break;
                case 'mistake':
                    color = new Color(255, 100, 100);
                    break;
                case 'event':
                    color = new Color(255, 180, 50);
                    break;
                default:
                    color = new Color(100, 150, 255);
            }
            this.typeIcon.color = color;
        }
    }
}

@ccclass('ResultScreen')
export class ResultScreen extends Component {
    @property(Node)
    public modal: Node | null = null;

    @property(Label)
    public resultTitle: Label | null = null;

    @property(Label)
    public levelNameLabel: Label | null = null;

    @property(Label)
    public totalScoreLabel: Label | null = null;

    @property(Label)
    public completionTimeLabel: Label | null = null;

    @property(Label)
    public turnoverLabel: Label | null = null;

    @property(Label)
    public totalCostLabel: Label | null = null;

    @property(Label)
    public accuracyLabel: Label | null = null;

    @property(Label)
    public shortageLabel: Label | null = null;

    @property(Node)
    public objectivesContainer: Node | null = null;

    @property(ScrollView)
    public cardPointsScroll: ScrollView | null = null;

    @property(Node)
    public cardPointsContainer: Node | null = null;

    @property(Node)
    public achievementsContainer: Node | null = null;

    @property(Prefab)
    public objectiveItemPrefab: Prefab | null = null;

    @property(Prefab)
    public cardPointItemPrefab: Prefab | null = null;

    @property(Prefab)
    public achievementItemPrefab: Prefab | null = null;

    @property(Button)
    public continueBtn: Button | null = null;

    @property(Button)
    public retryBtn: Button | null = null;

    @property(Button)
    public backBtn: Button | null = null;

    @property
    public objectiveItemGap: number = 10;

    @property
    public objectiveItemHeight: number = 50;

    @property
    public cardPointGap: number = 6;

    @property
    public cardPointHeight: number = 36;

    private _result: LevelResult | null = null;

    onLoad() {
        EventManager.getInstance().on(GameEvents.GAME_END, this.onGameEnd.bind(this));
        this.node.on('setup_result', (result: LevelResult) => this.onGameEnd(result), this);

        if (this.continueBtn) {
            this.continueBtn.node.on(Button.EventType.CLICK, this.onContinue, this);
        }
        if (this.retryBtn) {
            this.retryBtn.node.on(Button.EventType.CLICK, this.onRetry, this);
        }
        if (this.backBtn) {
            this.backBtn.node.on(Button.EventType.CLICK, this.onBack, this);
        }

        this.hide();
    }

    onDestroy() {
        EventManager.getInstance().off(GameEvents.GAME_END, this.onGameEnd.bind(this));

        if (this.continueBtn) {
            this.continueBtn.node.off(Button.EventType.CLICK, this.onContinue, this);
        }
        if (this.retryBtn) {
            this.retryBtn.node.off(Button.EventType.CLICK, this.onRetry, this);
        }
        if (this.backBtn) {
            this.backBtn.node.off(Button.EventType.CLICK, this.onBack, this);
        }
    }

    private onGameEnd(result: LevelResult): void {
        this._result = result;
        this.show();
        this.buildDisplay();
    }

    private buildDisplay(): void {
        if (!this._result) return;

        const level = ConfigManager.getInstance().findById<LevelConfig>(ConfigKeys.LEVELS, this._result.levelId);

        if (this.resultTitle) {
            this.resultTitle.string = this._result.isPassed ? '关卡通关！' : '挑战失败';
            this.resultTitle.color = this._result.isPassed ? new Color(80, 200, 80) : new Color(255, 100, 100);
        }

        if (this.levelNameLabel && level) {
            this.levelNameLabel.string = level.name;
        }

        if (this.totalScoreLabel) {
            this.totalScoreLabel.string = `${this._result.totalScore}分`;
            this.totalScoreLabel.color = this._result.totalScore >= 80 ? new Color(80, 200, 80) :
                                          this._result.totalScore >= 60 ? new Color(255, 180, 50) :
                                          new Color(255, 100, 100);
        }

        const minutes = Math.floor(this._result.completionTimeSeconds / 60);
        const seconds = this._result.completionTimeSeconds % 60;
        if (this.completionTimeLabel) {
            this.completionTimeLabel.string = `${minutes}分${seconds}秒`;
        }

        if (this.turnoverLabel) {
            this.turnoverLabel.string = `${this._result.averageTurnoverDays.toFixed(1)}天`;
        }

        if (this.totalCostLabel) {
            this.totalCostLabel.string = `¥${this._result.totalCost.toLocaleString()}`;
        }

        if (this.accuracyLabel) {
            this.accuracyLabel.string = `${this._result.inventoryAccuracy.toFixed(1)}%`;
            this.accuracyLabel.color = this._result.inventoryAccuracy >= 95 ? new Color(80, 200, 80) :
                                        this._result.inventoryAccuracy >= 90 ? new Color(255, 180, 50) :
                                        new Color(255, 100, 100);
        }

        if (this.shortageLabel) {
            this.shortageLabel.string = `${this._result.shortageCount}次`;
            this.shortageLabel.color = this._result.shortageCount === 0 ? new Color(80, 200, 80) : new Color(255, 100, 100);
        }

        this.buildObjectives();
        this.buildCardPoints();
        this.buildAchievements();
    }

    private buildObjectives(): void {
        if (!this._result || !this.objectivesContainer || !this.objectiveItemPrefab || !this._result.levelId) return;

        this.objectivesContainer.removeAllChildren();

        const level = ConfigManager.getInstance().findById<LevelConfig>(ConfigKeys.LEVELS, this._result.levelId);
        if (!level) return;

        let yOffset = -this.objectiveItemHeight / 2 - this.objectiveItemGap;

        const uiTransform = this.objectivesContainer.getComponent(UITransform);
        if (uiTransform) {
            const totalHeight = level.objectives.length * (this.objectiveItemHeight + this.objectiveItemGap) + this.objectiveItemGap;
            uiTransform.setContentSize(uiTransform.contentSize.width, totalHeight);
        }

        for (const obj of level.objectives) {
            const score = this._result.objectiveScores[obj.id] || 0;

            const itemNode = instantiate(this.objectiveItemPrefab);
            itemNode.setParent(this.objectivesContainer);
            itemNode.setPosition(new Vec3(0, yOffset, 0));

            const item = itemNode.getComponent(ObjectiveScoreItem);
            if (item) {
                item.setData(obj, score);
            }

            yOffset -= this.objectiveItemHeight + this.objectiveItemGap;
        }
    }

    private buildCardPoints(): void {
        if (!this._result || !this.cardPointsContainer || !this.cardPointItemPrefab) return;

        this.cardPointsContainer.removeAllChildren();

        const points = this._result.cardPoints.slice(-20).reverse();
        let yOffset = -this.cardPointHeight / 2 - this.cardPointGap;

        const uiTransform = this.cardPointsContainer.getComponent(UITransform);
        if (uiTransform) {
            const totalHeight = Math.max(10, points.length) * (this.cardPointHeight + this.cardPointGap) + this.cardPointGap;
            uiTransform.setContentSize(uiTransform.contentSize.width, Math.max(100, totalHeight));
        }

        for (const point of points) {
            const itemNode = instantiate(this.cardPointItemPrefab);
            itemNode.setParent(this.cardPointsContainer);
            itemNode.setPosition(new Vec3(0, yOffset, 0));

            const item = itemNode.getComponent(CardPointItem);
            if (item) {
                item.setData(point);
            }

            yOffset -= this.cardPointHeight + this.cardPointGap;
        }
    }

    private buildAchievements(): void {
        if (!this._result || !this.achievementsContainer || !this.achievementItemPrefab) return;

        this.achievementsContainer.removeAllChildren();

        const unlockedIds = AchievementManager.getInstance().getUnlockedAchievements().map(a => a.achievementId);
        const achievements = unlockedIds
            .map(id => ConfigManager.getInstance().findById<AchievementConfig>(ConfigKeys.ACHIEVEMENTS, id))
            .filter(Boolean) as AchievementConfig[];

        for (let i = 0; i < achievements.length; i++) {
            const itemNode = instantiate(this.achievementItemPrefab);
            itemNode.setParent(this.achievementsContainer);

            const label = itemNode.getComponentInChildren(Label);
            if (label) label.string = achievements[i].name;
        }
    }

    public show(): void {
        this.node.active = true;
        if (this.modal) this.modal.active = true;
    }

    public hide(): void {
        this.node.active = false;
        if (this.modal) this.modal.active = false;
    }

    private onContinue(): void {
        this.hide();
        const allLevels = ConfigManager.getInstance().getListConfig<LevelConfig>(ConfigKeys.LEVELS);
        const currentIndex = allLevels.findIndex(l => l.id === this._result?.levelId);
        if (currentIndex >= 0 && currentIndex < allLevels.length - 1) {
            EventManager.getInstance().emit('goto_level', allLevels[currentIndex + 1].id);
        }
    }

    private onRetry(): void {
        this.hide();
        if (this._result) {
            EventManager.getInstance().emit('retry_level', this._result.levelId);
        }
    }

    private onBack(): void {
        this.hide();
        director.loadScene('MainMenu');
    }
}
