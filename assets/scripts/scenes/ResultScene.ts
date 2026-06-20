import { _decorator, Component, Node, Label, Button, Sprite, Color, director, ProgressBar, UITransform, Prefab, instantiate, Vec3, Graphics } from 'cc';
import { GameManager } from '../core/GameManager';
import { LevelResult, GameStats } from '../core/GameTypes';
import { FeedbackManager, VibrationType } from '../core/FeedbackManager';
import { AudioManager, SfxType } from '../core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('ResultScene')
export class ResultScene extends Component {
    @property(Node)
    resultPanel: Node | null = null;

    @property(Label)
    resultTitleLabel: Label | null = null;

    @property(Label)
    levelNameLabel: Label | null = null;

    @property(Sprite)
    resultIcon: Sprite | null = null;

    @property(Label)
    totalScoreLabel: Label | null = null;

    @property(Node)
    statsContainer: Node | null = null;

    @property(ProgressBar)
    speedProgress: ProgressBar | null = null;

    @property(ProgressBar)
    accuracyProgress: ProgressBar | null = null;

    @property(ProgressBar)
    efficiencyProgress: ProgressBar | null = null;

    @property(Label)
    speedLabel: Label | null = null;

    @property(Label)
    accuracyLabel: Label | null = null;

    @property(Label)
    efficiencyLabel: Label | null = null;

    @property(Label)
    speedScoreLabel: Label | null = null;

    @property(Label)
    accuracyScoreLabel: Label | null = null;

    @property(Label)
    efficiencyScoreLabel: Label | null = null;

    @property(Node)
    detailedStats: Node | null = null;

    @property(Button)
    retryButton: Button | null = null;

    @property(Button)
    nextLevelButton: Button | null = null;

    @property(Button)
    menuButton: Button | null = null;

    @property(Button)
    reviewButton: Button | null = null;

    @property(Node)
    starsContainer: Node | null = null;

    private currentResult: LevelResult | null = null;

    onLoad() {
        const levelId = GameManager.instance.currentLevelId;
        this.currentResult = GameManager.instance.getLevelResult(levelId);

        this.setupButtons();
        this.renderResult();
    }

    private setupButtons(): void {
        this.retryButton?.node.on(Button.EventType.CLICK, this.onRetry, this);
        this.nextLevelButton?.node.on(Button.EventType.CLICK, this.onNextLevel, this);
        this.menuButton?.node.on(Button.EventType.CLICK, this.onBackToMenu, this);
        this.reviewButton?.node.on(Button.EventType.CLICK, this.onReview, this);
    }

    private renderResult(): void {
        if (!this.currentResult) {
            director.loadScene('main-menu');
            return;
        }

        const result = this.currentResult;
        const stats = result.stats;

        if (this.resultTitleLabel) {
            this.resultTitleLabel.string = result.passed ? '🎉 关卡通过！' : '💔 挑战失败';
            this.resultTitleLabel.color = result.passed
                ? new Color(46, 204, 113, 255)
                : new Color(231, 76, 60, 255);
        }

        if (this.levelNameLabel) {
            const levelNames: Record<number, string> = {
                1: '新手入门', 2: '渐入佳境', 3: '票房热卖',
                4: '销售达人', 5: '火爆预售', 6: '终极挑战'
            };
            this.levelNameLabel.string = levelNames[result.levelId] || `关卡 ${result.levelId}`;
        }

        if (this.totalScoreLabel) {
            this.animateScore(this.totalScoreLabel, 0, result.score, 1.0);
        }

        if (this.resultPanel) {
            const panelSprite = this.resultPanel.getComponent(Sprite);
            if (panelSprite) {
                panelSprite.color = result.passed
                    ? new Color(236, 240, 241, 255)
                    : new Color(250, 235, 235, 255);
            }
        }

        this.renderStars(result);
        this.renderProgressBars(result);
        this.renderDetailedStats(stats);
        this.updateButtons(result);
    }

    private renderStars(result: LevelResult): void {
        if (!this.starsContainer) return;

        this.starsContainer.removeAllChildren();

        let stars = 0;
        if (result.passed) {
            const efficiency = result.efficiencyScore / 100;
            if (efficiency >= 0.9) stars = 3;
            else if (efficiency >= 0.7) stars = 2;
            else stars = 1;
        }

        const spacing = 80;
        const startX = -spacing;

        for (let i = 0; i < 3; i++) {
            const starNode = new Node(`Star_${i}`);
            starNode.addComponent(UITransform).setContentSize(64, 64);
            starNode.setPosition(startX + i * spacing, 0);

            const labelNode = new Node('Icon');
            labelNode.addComponent(UITransform).setContentSize(64, 64);
            const label = labelNode.addComponent(Label);
            label.fontSize = 56;
            label.string = i < stars ? '⭐' : '☆';
            label.color = i < stars
                ? new Color(241, 196, 15, 255)
                : new Color(189, 195, 199, 255);
            starNode.addChild(labelNode);

            this.starsContainer.addChild(starNode);

            if (FeedbackManager.instance.shouldAnimate() && i < stars) {
                const delay = i * 0.2 + 0.5;
                this.scheduleOnce(() => {
                    starNode.setScale(0, 0, 1);
                    import('cc').then(({ tween }) => {
                        tween(starNode)
                            .to(0.4, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
                            .to(0.2, { scale: new Vec3(1, 1, 1) })
                            .start();
                    });
                }, delay);
            }
        }
    }

    private renderProgressBars(result: LevelResult): void {
        const maxScore = 100;

        if (this.speedProgress) {
            this.speedProgress.progress = 0;
            this.animateProgress(this.speedProgress, Math.min(1, result.speedScore / maxScore));
        }
        if (this.accuracyProgress) {
            this.accuracyProgress.progress = 0;
            this.animateProgress(this.accuracyProgress, Math.min(1, result.accuracyScore / maxScore));
        }
        if (this.efficiencyProgress) {
            this.efficiencyProgress.progress = 0;
            this.animateProgress(this.efficiencyProgress, Math.min(1, result.efficiencyScore / maxScore));
        }

        if (this.speedScoreLabel) {
            this.speedScoreLabel.string = result.speedScore.toString();
        }
        if (this.accuracyScoreLabel) {
            this.accuracyScoreLabel.string = result.accuracyScore.toString();
        }
        if (this.efficiencyScoreLabel) {
            this.efficiencyScoreLabel.string = result.efficiencyScore.toString();
        }

        if (this.speedLabel) this.speedLabel.string = '⚡ 速度';
        if (this.accuracyLabel) this.accuracyLabel.string = '🎯 准确度';
        if (this.efficiencyLabel) this.efficiencyLabel.string = '📊 综合效率';
    }

    private renderDetailedStats(stats: GameStats): void {
        if (!this.detailedStats) return;

        this.detailedStats.removeAllChildren();

        const statsItems = [
            { icon: '📋', label: '处理订单数', value: stats.ordersProcessed.toString() },
            { icon: '✅', label: '正确处理', value: stats.ordersCorrect.toString() },
            { icon: '❌', label: '错误次数', value: stats.errors.toString() },
            { icon: '🚫', label: '正确拒绝', value: stats.correctRejections.toString() },
            { icon: '🔥', label: '最高连击', value: `x${stats.maxConsecutiveCorrect}` },
            { icon: '⏱️', label: '平均耗时', value: `${stats.averageProcessingTime.toFixed(1)}秒` },
            { icon: '🎫', label: '售出票数', value: stats.ticketsSold.toString() },
            { icon: '💰', label: '收入总额', value: `¥${stats.revenue.toLocaleString()}` },
            { icon: '💺', label: '座位利用率', value: `${(stats.seatsUtilization * 100).toFixed(1)}%` },
            { icon: '⌛', label: '总用时', value: `${Math.floor(stats.totalTime / 60)}分${Math.floor(stats.totalTime % 60)}秒` }
        ];

        const columns = 2;
        const itemWidth = 260;
        const itemHeight = 50;
        const gapX = 20;
        const gapY = 10;

        for (let i = 0; i < statsItems.length; i++) {
            const item = statsItems[i];
            const col = i % columns;
            const row = Math.floor(i / columns);

            const itemNode = new Node(`StatItem_${i}`);
            itemNode.addComponent(UITransform).setContentSize(itemWidth, itemHeight);
            const x = -((columns * itemWidth + (columns - 1) * gapX) / 2) + col * (itemWidth + gapX) + itemWidth / 2;
            const y = (statsItems.length / columns * (itemHeight + gapY) / 2) - row * (itemHeight + gapY) - itemHeight / 2 - 20;
            itemNode.setPosition(x, y);

            const bg = itemNode.addComponent(Sprite);
            bg.color = new Color(255, 255, 255, 100);

            const iconNode = new Node('Icon');
            iconNode.addComponent(UITransform).setContentSize(30, 30);
            iconNode.setPosition(-itemWidth / 2 + 25, 0);
            const iconLabel = iconNode.addComponent(Label);
            iconLabel.fontSize = 24;
            iconLabel.string = item.icon;
            itemNode.addChild(iconNode);

            const labelNode = new Node('Label');
            labelNode.addComponent(UITransform).setContentSize(120, 24);
            labelNode.setPosition(-20, 10);
            const label = labelNode.addComponent(Label);
            label.fontSize = 12;
            label.string = item.label;
            label.horizontalAlign = Label.HorizontalAlign.LEFT;
            itemNode.addChild(labelNode);

            const valueNode = new Node('Value');
            valueNode.addComponent(UITransform).setContentSize(120, 24);
            valueNode.setPosition(-20, -10);
            const valueLabel = valueNode.addComponent(Label);
            valueLabel.fontSize = 16;
            valueLabel.string = item.value;
            valueLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            valueLabel.color = new Color(52, 73, 94, 255);
            itemNode.addChild(valueNode);

            this.detailedStats.addChild(itemNode);
        }
    }

    private updateButtons(result: LevelResult): void {
        if (this.nextLevelButton) {
            const hasNext = result.levelId < 6 && result.passed;
            this.nextLevelButton.node.active = hasNext;
            if (!hasNext && result.levelId >= 6 && result.passed) {
                this.nextLevelButton.node.active = true;
                const label = this.nextLevelButton.node.getChildByName('Label')?.getComponent(Label);
                if (label) label.string = '🏆 已通关全部';
                this.nextLevelButton.interactable = false;
            }
        }
    }

    private animateProgress(bar: ProgressBar, targetProgress: number): void {
        if (!FeedbackManager.instance.shouldAnimate()) {
            bar.progress = targetProgress;
            return;
        }

        let current = 0;
        const step = targetProgress / 30;
        const update = () => {
            current += step;
            if (current >= targetProgress) {
                bar.progress = targetProgress;
                return;
            }
            bar.progress = current;
            this.scheduleOnce(update, 0.02);
        };
        update();
    }

    private animateScore(label: Label, from: number, to: number, duration: number): void {
        if (!FeedbackManager.instance.shouldAnimate()) {
            label.string = to.toString();
            return;
        }

        const startTime = Date.now();
        const update = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(1, elapsed / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(from + (to - from) * eased);
            label.string = current.toString();

            if (progress < 1) {
                this.scheduleOnce(update, 0.016);
            } else {
                label.string = to.toString();
            }
        };
        this.scheduleOnce(update, 0.3);
    }

    private onRetry(): void {
        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.MEDIUM);
        GameManager.instance.generateSessionId();
        director.loadScene('game-scene');
    }

    private onNextLevel(): void {
        if (this.currentResult && this.currentResult.levelId < 6) {
            GameManager.instance.setCurrentLevel(this.currentResult.levelId + 1);
            GameManager.instance.generateSessionId();
            AudioManager.instance.playSfx(SfxType.CLICK);
            FeedbackManager.instance.vibrate(VibrationType.MEDIUM);
            director.loadScene('game-scene');
        }
    }

    private onBackToMenu(): void {
        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.LIGHT);
        director.loadScene('main-menu');
    }

    private onReview(): void {
        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.LIGHT);
        director.loadScene('review-scene');
    }
}
