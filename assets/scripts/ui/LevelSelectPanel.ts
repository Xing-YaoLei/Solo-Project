import { _decorator, Component, Node, Label, Sprite, Prefab, instantiate, Color, ScrollView } from 'cc';
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

    @property(Prefab)
    levelCardPrefab: Prefab | null = null;

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
        if (!this.levelCardPrefab || !this.levelContainer) return;

        levels.forEach(level => {
            const node = instantiate(this.levelCardPrefab!);
            const card = node.getComponent(LevelCard) || node.addComponent(LevelCard);
            card.setup(level);
            this.levelContainer!.addChild(node);
            this.levelCards.push(card);
        });
    }
}
