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
    private _dynamicObjectiveTemplate: Node | null = null;
    private _dynamicCardPointTemplate: Node | null = null;
    private _dynamicAchievementTemplate: Node | null = null;
    private _templatesCreated: boolean = false;

    public createDynamicTemplates(): void {
        if (this._templatesCreated) return;

        // Objective template
        {
            const root = new Node('ObjectiveItemTemplate');
            const ui = root.addComponent(UITransform);
            ui.setContentSize(680, this.objectiveItemHeight);
            ui.setAnchorPoint(0.5, 0.5);
            const bg = root.addComponent(Sprite);
            bg.sizeMode = Sprite.SizeMode.CUSTOM;
            bg.color = new Color(40, 50, 35, 180);
            bg.type = Sprite.Type.SIMPLE;
            const item = root.addComponent(ObjectiveScoreItem);

            const nameNode = new Node('NameLabel');
            nameNode.setParent(root);
            nameNode.setPosition(new Vec3(-330, 0, 0));
            const nui = nameNode.addComponent(UITransform);
            nui.setContentSize(260, 24);
            nui.setAnchorPoint(0, 0.5);
            const nl = nameNode.addComponent(Label);
            nl.string = '';
            nl.fontSize = 14;
            nl.lineHeight = 14;
            nl.color = new Color(255, 240, 220);
            nl.horizontalAlign = Label.HorizontalAlign.LEFT;
            nl.isSystemFontUsed = true;
            item.nameLabel = nl;

            const scoreNode = new Node('ScoreLabel');
            scoreNode.setParent(root);
            scoreNode.setPosition(new Vec3(320, 0, 0));
            const sui = scoreNode.addComponent(UITransform);
            sui.setContentSize(80, 24);
            sui.setAnchorPoint(1, 0.5);
            const sl = scoreNode.addComponent(Label);
            sl.string = '';
            sl.fontSize = 14;
            sl.lineHeight = 14;
            sl.color = Color.WHITE;
            sl.horizontalAlign = Label.HorizontalAlign.RIGHT;
            sl.isSystemFontUsed = true;
            item.scoreLabel = sl;

            const barBg = new Node('BarBg');
            barBg.setParent(root);
            barBg.setPosition(new Vec3(0, 0, 0));
            const bbgUI = barBg.addComponent(UITransform);
            bbgUI.setContentSize(200, 12);
            const bbgS = barBg.addComponent(Sprite);
            bbgS.sizeMode = Sprite.SizeMode.CUSTOM;
            bbgS.color = new Color(30, 30, 30, 200);
            const barNode = new Node('ProgressBar');
            barNode.setParent(barBg);
            barNode.setPosition(new Vec3(-100, 0, 0));
            const bUI = barNode.addComponent(UITransform);
            bUI.setContentSize(200, 12);
            bUI.setAnchorPoint(0, 0.5);
            const barS = barNode.addComponent(Sprite);
            barS.sizeMode = Sprite.SizeMode.CUSTOM;
            barS.color = new Color(80, 200, 80, 255);
            barS.type = Sprite.Type.SIMPLE;
            item.progressBar = barS;

            this._dynamicObjectiveTemplate = root;
        }

        // CardPoint template
        {
            const root = new Node('CardPointTemplate');
            const ui = root.addComponent(UITransform);
            ui.setContentSize(680, this.cardPointHeight);
            ui.setAnchorPoint(0.5, 0.5);
            const item = root.addComponent(CardPointItem);

            const iconNode = new Node('TypeIcon');
            iconNode.setParent(root);
            iconNode.setPosition(new Vec3(-330, 0, 0));
            const iui = iconNode.addComponent(UITransform);
            iui.setContentSize(8, this.cardPointHeight);
            const icon = iconNode.addComponent(Sprite);
            icon.sizeMode = Sprite.SizeMode.CUSTOM;
            icon.color = new Color(255, 255, 255);
            icon.type = Sprite.Type.SIMPLE;
            item.typeIcon = icon;

            const timeNode = new Node('TimeLabel');
            timeNode.setParent(root);
            timeNode.setPosition(new Vec3(-310, 0, 0));
            const tui = timeNode.addComponent(UITransform);
            tui.setContentSize(70, 20);
            tui.setAnchorPoint(0, 0.5);
            const tl = timeNode.addComponent(Label);
            tl.string = '';
            tl.fontSize = 12;
            tl.lineHeight = 12;
            tl.color = new Color(180, 200, 255);
            tl.horizontalAlign = Label.HorizontalAlign.LEFT;
            tl.isSystemFontUsed = true;
            item.timeLabel = tl;

            const descNode = new Node('DescLabel');
            descNode.setParent(root);
            descNode.setPosition(new Vec3(-230, 0, 0));
            const dui = descNode.addComponent(UITransform);
            dui.setContentSize(540, 28);
            dui.setAnchorPoint(0, 0.5);
            const dl = descNode.addComponent(Label);
            dl.string = '';
            dl.fontSize = 13;
            dl.lineHeight = 13;
            dl.color = new Color(230, 230, 230);
            dl.horizontalAlign = Label.HorizontalAlign.LEFT;
            dl.overflow = Label.Overflow.SHRINK;
            dl.isSystemFontUsed = true;
            item.descLabel = dl;

            this._dynamicCardPointTemplate = root;
        }

        // Achievement template
        {
            const root = new Node('AchievementTemplate');
            const ui = root.addComponent(UITransform);
            ui.setContentSize(140, 70);
            ui.setAnchorPoint(0.5, 0.5);
            const bg = root.addComponent(Sprite);
            bg.sizeMode = Sprite.SizeMode.CUSTOM;
            bg.color = new Color(100, 80, 30, 180);
            bg.type = Sprite.Type.SIMPLE;

            const labelNode = new Node('AchievementLabel');
            labelNode.setParent(root);
            labelNode.setPosition(new Vec3(0, 0, 0));
            const lui = labelNode.addComponent(UITransform);
            lui.setContentSize(130, 50);
            const ll = labelNode.addComponent(Label);
            ll.string = '';
            ll.fontSize = 12;
            ll.lineHeight = 16;
            ll.color = new Color(255, 240, 180);
            ll.horizontalAlign = Label.HorizontalAlign.CENTER;
            ll.verticalAlign = Label.VerticalAlign.MIDDLE;
            ll.overflow = Label.Overflow.SHRINK;
            ll.isSystemFontUsed = true;

            this._dynamicAchievementTemplate = root;
        }

        this._templatesCreated = true;
    }

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

        this.createDynamicTemplates();
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
        if (!this._result || !this.objectivesContainer || !this._result.levelId) return;
        if (!this._templatesCreated) this.createDynamicTemplates();
        const prefab = this.objectiveItemPrefab || this._dynamicObjectiveTemplate;
        if (!prefab) return;

        this.objectivesContainer.removeAllChildren();

        const level = ConfigManager.getInstance().findById<LevelConfig>(ConfigKeys.LEVELS, this._result.levelId);
        if (!level) return;

        let yOffset = -this.objectiveItemHeight / 2 - this.objectiveItemGap;

        const uiTransform = this.objectivesContainer.getComponent(UITransform);
        if (uiTransform) {
            const totalHeight = Math.max(1, level.objectives.length) * (this.objectiveItemHeight + this.objectiveItemGap) + this.objectiveItemGap;
            uiTransform.setContentSize(uiTransform.contentSize.width, totalHeight);
        }

        for (const obj of level.objectives) {
            const score = this._result.objectiveScores[obj.id] || 0;

            const itemNode = this.objectiveItemPrefab
                ? instantiate(this.objectiveItemPrefab)
                : (this._dynamicObjectiveTemplate ? instantiate(this._dynamicObjectiveTemplate) : new Node());
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
        if (!this._result || !this.cardPointsContainer) return;
        if (!this._templatesCreated) this.createDynamicTemplates();
        const prefab = this.cardPointItemPrefab || this._dynamicCardPointTemplate;
        if (!prefab) return;

        this.cardPointsContainer.removeAllChildren();

        const points = this._result.cardPoints.slice(-20).reverse();
        let yOffset = -this.cardPointHeight / 2 - this.cardPointGap;

        const uiTransform = this.cardPointsContainer.getComponent(UITransform);
        if (uiTransform) {
            const totalHeight = Math.max(10, points.length) * (this.cardPointHeight + this.cardPointGap) + this.cardPointGap;
            uiTransform.setContentSize(uiTransform.contentSize.width, Math.max(100, totalHeight));
        }

        if (points.length === 0) {
            const emptyNode = new Node('EmptyLabel');
            emptyNode.setParent(this.cardPointsContainer);
            emptyNode.setPosition(new Vec3(0, -this.cardPointHeight, 0));
            const eui = emptyNode.addComponent(UITransform);
            eui.setContentSize(600, 30);
            const el = emptyNode.addComponent(Label);
            el.string = '本关卡无卡点记录，完美通关！';
            el.fontSize = 13;
            el.lineHeight = 13;
            el.color = new Color(150, 200, 150);
            el.isSystemFontUsed = true;
            return;
        }

        for (const point of points) {
            const itemNode = this.cardPointItemPrefab
                ? instantiate(this.cardPointItemPrefab)
                : (this._dynamicCardPointTemplate ? instantiate(this._dynamicCardPointTemplate) : new Node());
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
        if (!this._result || !this.achievementsContainer) return;
        if (!this._templatesCreated) this.createDynamicTemplates();
        const prefab = this.achievementItemPrefab || this._dynamicAchievementTemplate;
        if (!prefab) return;

        this.achievementsContainer.removeAllChildren();

        const unlockedIds = AchievementManager.getInstance().getUnlockedAchievements().map(a => a.achievementId);
        const achievements = unlockedIds
            .map(id => ConfigManager.getInstance().findById<AchievementConfig>(ConfigKeys.ACHIEVEMENTS, id))
            .filter(Boolean) as AchievementConfig[];

        const cols = 5;
        const colW = 150;
        const rowH = 80;

        for (let i = 0; i < achievements.length; i++) {
            const itemNode = this.achievementItemPrefab
                ? instantiate(this.achievementItemPrefab)
                : (this._dynamicAchievementTemplate ? instantiate(this._dynamicAchievementTemplate) : new Node());
            itemNode.setParent(this.achievementsContainer);
            const col = i % cols;
            const row = Math.floor(i / cols);
            itemNode.setPosition(new Vec3(-colW * 2 + col * colW, -rowH / 2 - row * rowH - 10, 0));

            const label = itemNode.getComponentInChildren(Label);
            if (label) label.string = achievements[i].name;
        }

        if (achievements.length === 0) {
            const emptyNode = new Node('EmptyLabel');
            emptyNode.setParent(this.achievementsContainer);
            emptyNode.setPosition(new Vec3(0, -30, 0));
            const eui = emptyNode.addComponent(UITransform);
            eui.setContentSize(600, 30);
            const el = emptyNode.addComponent(Label);
            el.string = '暂无解锁成就，继续努力！';
            el.fontSize = 13;
            el.lineHeight = 13;
            el.color = new Color(180, 180, 150);
            el.isSystemFontUsed = true;
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
