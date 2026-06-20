import { _decorator, Component, Node, Label, Button, Sprite, Color, director, ScrollView, UITransform, Layout, Prefab, instantiate, Vec3 } from 'cc';
import { LEVELS, getUnlockedLevels, getLevelById } from '../core/LevelData';
import { GameManager } from '../core/GameManager';
import { FeedbackManager, VibrationType } from '../core/FeedbackManager';
import { AudioManager, SfxType } from '../core/AudioManager';
import { LevelConfig } from '../core/GameTypes';
const { ccclass, property } = _decorator;

@ccclass('MainMenuScene')
export class MainMenuScene extends Component {
    @property(Node)
    levelsContainer: Node | null = null;

    @property(Prefab)
    levelItemPrefab: Prefab | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    @property(Button)
    settingsButton: Button | null = null;

    @property(Button)
    reviewButton: Button | null = null;

    @property(ScrollView)
    levelsScrollView: ScrollView | null = null;

    @property(Node)
    levelDetailPanel: Node | null = null;

    @property(Label)
    detailNameLabel: Label | null = null;

    @property(Label)
    detailDescLabel: Label | null = null;

    @property(Label)
    detailInfoLabel: Label | null = null;

    @property(Button)
    startLevelButton: Button | null = null;

    @property(Label)
    bestScoreLabel: Label | null = null;

    private selectedLevel: LevelConfig | null = null;
    private levelNodes: Map<number, Node> = new Map();

    onLoad() {
        if (this.settingsButton) {
            this.settingsButton.node.on(Button.EventType.CLICK, this.onSettingsClicked, this);
        }
        if (this.reviewButton) {
            this.reviewButton.node.on(Button.EventType.CLICK, this.onReviewClicked, this);
        }
        if (this.startLevelButton) {
            this.startLevelButton.node.on(Button.EventType.CLICK, this.onStartLevel, this);
        }

        this.renderLevelList();
    }

    onEnable() {
        this.renderLevelList();
    }

    private renderLevelList(): void {
        if (!this.levelsContainer) return;

        this.levelsContainer.removeAllChildren();
        this.levelNodes.clear();

        const completed = GameManager.instance.getCompletedLevelIds();
        const unlocked = getUnlockedLevels(completed);
        const unlockedIds = unlocked.map(l => l.id);

        for (const level of LEVELS) {
            const isUnlocked = unlockedIds.includes(level.id);
            const node = this.createLevelItem(level, isUnlocked);
            this.levelsContainer.addChild(node);
            this.levelNodes.set(level.id, node);
        }

        if (unlocked.length > 0) {
            this.selectLevel(unlocked[0]);
        }
    }

    private createLevelItem(level: LevelConfig, unlocked: boolean): Node {
        let node: Node;

        if (this.levelItemPrefab) {
            node = instantiate(this.levelItemPrefab);
        } else {
            node = new Node(`Level_${level.id}`);
            const ui = node.addComponent(UITransform);
            ui.setContentSize(320, 80);

            const bg = node.addComponent(Sprite);
            bg.color = this.getDifficultyColor(level.difficulty);

            const nameNode = new Node('Name');
            nameNode.addComponent(UITransform).setContentSize(280, 40);
            nameNode.setPosition(-150, 15);
            const nameLabel = nameNode.addComponent(Label);
            nameLabel.string = level.name;
            nameLabel.fontSize = 22;
            nameLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            node.addChild(nameNode);

            const infoNode = new Node('Info');
            infoNode.addComponent(UITransform).setContentSize(280, 20);
            infoNode.setPosition(-150, -15);
            const infoLabel = infoNode.addComponent(Label);
            infoLabel.string = this.formatLevelShortInfo(level);
            infoLabel.fontSize = 14;
            infoLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            node.addChild(infoNode);

            const button = node.addComponent(Button);
            button.transition = Button.Transition.SCALE;
            button.duration = 0.1;
            button.zoomScale = 0.95;
        }

        if (!unlocked) {
            const lockNode = new Node('Lock');
            lockNode.addComponent(UITransform).setContentSize(40, 40);
            lockNode.setPosition(130, 0);
            const lockLabel = lockNode.addComponent(Label);
            lockLabel.string = '🔒';
            lockLabel.fontSize = 32;
            node.addChild(lockNode);
        }

        const button = node.getComponent(Button) || node.addComponent(Button);
        button.node.on(Button.EventType.CLICK, () => {
            if (unlocked) {
                this.selectLevel(level);
                AudioManager.instance.playSfx(SfxType.CLICK);
                FeedbackManager.instance.vibrate(VibrationType.LIGHT);
            }
        });

        return node;
    }

    private selectLevel(level: LevelConfig): void {
        this.selectedLevel = level;

        if (this.detailNameLabel) {
            this.detailNameLabel.string = level.name;
        }
        if (this.detailDescLabel) {
            this.detailDescLabel.string = level.description;
        }
        if (this.detailInfoLabel) {
            this.detailInfoLabel.string = this.formatLevelDetailInfo(level);
        }

        const result = GameManager.instance.getLevelResult(level.id);
        if (this.bestScoreLabel) {
            this.bestScoreLabel.string = result ? `最高分: ${result.score}` : '尚未通关';
        }

        if (this.levelDetailPanel) {
            this.levelDetailPanel.active = true;
            const bg = this.levelDetailPanel.getComponent(Sprite);
            if (bg) {
                bg.color = this.getDifficultyColor(level.difficulty);
            }
        }

        this.levelNodes.forEach((node, id) => {
            const bg = node.getComponent(Sprite);
            if (bg) {
                bg.color = id === level.id
                    ? new Color(52, 152, 219, 255)
                    : this.getDifficultyColor(LEVELS.find(l => l.id === id)!.difficulty);
            }
        });
    }

    private onStartLevel(): void {
        if (!this.selectedLevel) return;

        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.MEDIUM);
        GameManager.instance.setCurrentLevel(this.selectedLevel.id);
        GameManager.instance.generateSessionId();

        director.loadScene('game-scene');
    }

    private onSettingsClicked(): void {
        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.LIGHT);
        director.loadScene('settings-scene');
    }

    private onReviewClicked(): void {
        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.LIGHT);
        director.loadScene('review-scene');
    }

    private getDifficultyColor(difficulty: string): Color {
        switch (difficulty) {
            case 'easy':
                return new Color(46, 204, 113, 180);
            case 'normal':
                return new Color(52, 152, 219, 180);
            case 'hard':
                return new Color(230, 126, 34, 180);
            case 'expert':
                return new Color(192, 57, 43, 180);
            default:
                return new Color(100, 100, 100, 180);
        }
    }

    private formatLevelShortInfo(level: LevelConfig): string {
        const difficultyNames: Record<string, string> = {
            easy: '简单',
            normal: '普通',
            hard: '困难',
            expert: '专家'
        };
        return `${difficultyNames[level.difficulty]} | ${level.targetOrders}单 | ${Math.floor(level.duration / 60)}分${level.duration % 60}秒`;
    }

    private formatLevelDetailInfo(level: LevelConfig): string {
        const diffNames: Record<string, string> = {
            easy: '⭐ 简单',
            normal: '⭐⭐ 普通',
            hard: '⭐⭐⭐ 困难',
            expert: '⭐⭐⭐⭐ 专家'
        };
        const ticketTypes = level.ticketRules.map(r => r.name).join('、');
        return `
${diffNames[level.difficulty]}
🏟️ ${level.venueName}
🎫 票种: ${ticketTypes}
🎯 目标: ${level.targetOrders} 单
⏱️ 时限: ${Math.floor(level.duration / 60)}分${level.duration % 60}秒
❌ 最大错误: ${level.maxErrors} 次
💰 奖励倍率: x${level.rewardMultiplier}
        `.trim();
    }
}
