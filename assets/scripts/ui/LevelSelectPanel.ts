import { _decorator, Component, Node, Label, Sprite, UITransform, Color, ScrollView } from 'cc';
import { ConfigTypes } from '../types/ConfigTypes';
import { GameTypes } from '../types/GameTypes';
import { ConfigManager } from '../core/ConfigManager';
import { SaveManager } from '../core/SaveManager';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('LevelCard')
export class LevelCard extends Component {

    @property(Label)
    levelNameLabel: Label | null = null;

    @property(Label)
    levelDescLabel: Label | null = null;

    @property(Label)
    difficultyLabel: Label | null = null;

    @property(Node)
    lockedMask: Node | null = null;

    @property(Label)
    bestScoreLabel: Label | null = null;

    @property(Node)
    starsContainer: Node | null = null;

    private config: ConfigTypes.LevelConfig | null = null;
    private isUnlocked: boolean = false;

    public setup(config: ConfigTypes.LevelConfig): void {
        this.config = config;
        this.isUnlocked = SaveManager.instance.isLevelUnlocked(config.id);

        if (this.levelNameLabel) {
            this.levelNameLabel.string = `第${config.difficulty}关: ${config.name}`;
        }
        if (this.levelDescLabel) {
            this.levelDescLabel.string = config.description;
        }
        if (this.difficultyLabel) {
            this.difficultyLabel.string = '🔥'.repeat(config.difficulty);
        }

        if (this.lockedMask) {
            this.lockedMask.active = !this.isUnlocked;
        }

        this.refreshCompletionInfo();

        this.node.on(Node.EventType.TOUCH_END, this.onCardClicked, this);
    }

    private refreshCompletionInfo(): void {
        if (!this.config) return;

        const record = SaveManager.instance.getPlayerProfile().completedLevels[this.config.id];

        if (this.bestScoreLabel) {
            if (record) {
                this.bestScoreLabel.string = `最佳: ${record.bestScore.toFixed(1)}分 (${record.attempts}次)`;
                this.bestScoreLabel.node.active = true;
            } else {
                this.bestScoreLabel.node.active = false;
            }
        }

        if (this.starsContainer) {
            const stars = record?.stars || 0;
            const starLabels = this.starsContainer.getComponentsInChildren(Label);
            starLabels.forEach((label, i) => {
                label.string = i < stars ? '⭐' : '☆';
            });
        }
    }

    private onCardClicked(): void {
        if (!this.isUnlocked || !this.config) return;
        GameManager.instance.startLevel(this.config.id);
    }

    public getConfig(): ConfigTypes.LevelConfig | null {
        return this.config;
    }
}

@ccclass('LevelSelectPanel')
export class LevelSelectPanel extends Component {

    @property(ScrollView)
    levelScrollView: ScrollView | null = null;

    @property(Node)
    levelContainer: Node | null = null;

    @property(Label)
    totalScoreLabel: Label | null = null;

    @property(Label)
    playerLevelLabel: Label | null = null;

    @property(Label)
    coinsLabel: Label | null = null;

    private levelCards: LevelCard[] = [];

    start(): void {
        this.refresh();
    }

    public refresh(): void {
        const profile = SaveManager.instance.getPlayerProfile();

        if (this.playerLevelLabel) {
            this.playerLevelLabel.string = `Lv.${profile.level}`;
        }
        if (this.totalScoreLabel) {
            this.totalScoreLabel.string = `累计得分: ${SaveManager.instance.getTotalScore()}`;
        }
        if (this.coinsLabel) {
            this.coinsLabel.string = `💰 ${profile.coins}`;
        }

        if (this.levelContainer) {
            this.levelContainer.removeAllChildren();
        }
        this.levelCards = [];

        const levels = ConfigManager.instance.getAllLevels();
        if (!this.levelContainer) return;

        levels.forEach(level => {
            const node = this.createLevelCardNode();
            const card = node.getComponent(LevelCard) || node.addComponent(LevelCard);
            card.setup(level);
            this.levelContainer!.addChild(node);
            this.levelCards.push(card);
        });
    }

    private createLevelCardNode(): Node {
        const node = new Node('LevelCard');
        const ut = node.addComponent(UITransform);
        ut.setContentSize(660, 100);
        const card = node.addComponent(LevelCard);

        const levelNameNode = new Node('LevelNameLabel');
        node.addChild(levelNameNode);
        const levelNameUt = levelNameNode.addComponent(UITransform);
        levelNameUt.setContentSize(300, 28);
        levelNameNode.setPosition(-140, 20, 0);
        const levelNameLabel = levelNameNode.addComponent(Label);
        levelNameLabel.string = '';
        levelNameLabel.fontSize = 28;
        levelNameLabel.lineHeight = 28 * 1.2;
        levelNameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        levelNameLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const levelDescNode = new Node('LevelDescLabel');
        node.addChild(levelDescNode);
        const levelDescUt = levelDescNode.addComponent(UITransform);
        levelDescUt.setContentSize(300, 20);
        levelDescNode.setPosition(-140, -10, 0);
        const levelDescLabel = levelDescNode.addComponent(Label);
        levelDescLabel.string = '';
        levelDescLabel.fontSize = 12;
        levelDescLabel.lineHeight = 12 * 1.2;
        levelDescLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        levelDescLabel.verticalAlign = Label.VerticalAlign.CENTER;
        levelDescLabel.color = Color.GRAY;

        const difficultyNode = new Node('DifficultyLabel');
        node.addChild(difficultyNode);
        const difficultyUt = difficultyNode.addComponent(UITransform);
        difficultyUt.setContentSize(100, 24);
        difficultyNode.setPosition(200, 20, 0);
        const difficultyLabel = difficultyNode.addComponent(Label);
        difficultyLabel.string = '';
        difficultyLabel.fontSize = 14;
        difficultyLabel.lineHeight = 14 * 1.2;
        difficultyLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        difficultyLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const lockedMaskNode = new Node('LockedMask');
        node.addChild(lockedMaskNode);
        const lockedMaskUt = lockedMaskNode.addComponent(UITransform);
        lockedMaskUt.setContentSize(660, 100);
        lockedMaskNode.active = false;

        const bestScoreNode = new Node('BestScoreLabel');
        node.addChild(bestScoreNode);
        const bestScoreUt = bestScoreNode.addComponent(UITransform);
        bestScoreUt.setContentSize(200, 20);
        bestScoreNode.setPosition(0, -40, 0);
        const bestScoreLabel = bestScoreNode.addComponent(Label);
        bestScoreLabel.string = '';
        bestScoreLabel.fontSize = 12;
        bestScoreLabel.lineHeight = 12 * 1.2;
        bestScoreLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        bestScoreLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const starsNode = new Node('StarsContainer');
        node.addChild(starsNode);
        const starsUt = starsNode.addComponent(UITransform);
        starsUt.setContentSize(150, 24);
        starsNode.setPosition(250, -10, 0);

        card.levelNameLabel = levelNameLabel;
        card.levelDescLabel = levelDescLabel;
        card.difficultyLabel = difficultyLabel;
        card.lockedMask = lockedMaskNode;
        card.bestScoreLabel = bestScoreLabel;
        card.starsContainer = starsNode;

        return node;
    }
}
