import { _decorator, Component, Node, Label, Button, Sprite, Color, Graphics, instantiate, Prefab } from 'cc';
import { GameManager } from './GameManager';
import { LEVEL_CONFIGS, LevelConfig } from './data/LevelConfig';
import { LevelResult } from './data/ElderlyData';
const { ccclass, property } = _decorator;

interface ReviewData {
    levelId: number;
    levelName: string;
    result: LevelResult | null;
    passed: boolean;
    score: number;
    accuracy: number;
    maxCombo: number;
    stars: number;
    careScore: number;
}

@ccclass('ReviewPanel')
export class ReviewPanel extends Component {
    @property(Node)
    panelNode: Node | null = null;

    @property(Node)
    chartContainer: Node | null = null;

    @property(Node)
    levelListContainer: Node | null = null;

    @property(Prefab)
    levelReviewItemPrefab: Prefab | null = null;

    @property(Label)
    totalScoreLabel: Label | null = null;

    @property(Label)
    totalAccuracyLabel: Label | null = null;

    @property(Label)
    careLevelLabel: Node | null = null;

    @property(Button)
    backButton: Button | null = null;

    @property(Node)
    careIndicator: Node | null = null;

    private _reviewData: ReviewData[] = [];

    onLoad() {
        this.setupEventListeners();
    }

    setupEventListeners(): void {
        if (this.backButton) {
            this.backButton.node.on(Button.EventType.CLICK, this.onBack, this);
        }
    }

    show(): void {
        if (this.panelNode) {
            this.panelNode.active = true;
        }
        this.calculateReviewData();
        this.renderChart();
        this.renderLevelList();
        this.updateOverallStats();
    }

    hide(): void {
        if (this.panelNode) {
            this.panelNode.active = false;
        }
    }

    calculateReviewData(): void {
        this._reviewData = [];

        LEVEL_CONFIGS.forEach((config) => {
            const result = GameManager.instance.getLevelResult(config.id);
            const careScore = this.calculateCareScore(result, config);

            this._reviewData.push({
                levelId: config.id,
                levelName: config.name,
                result: result,
                passed: result?.passed || false,
                score: result?.score || 0,
                accuracy: result ? this.calcAccuracy(result) : 0,
                maxCombo: result?.maxCombo || 0,
                stars: result?.starCount || 0,
                careScore: careScore,
            });
        });
    }

    calcAccuracy(result: LevelResult): number {
        const total = result.correctCount + result.wrongCount;
        if (total === 0) return 0;
        return Math.floor((result.correctCount / total) * 100);
    }

    calculateCareScore(result: LevelResult | null, config: LevelConfig): number {
        if (!result || !result.passed) return 0;

        const scoreRatio = Math.min(result.score / config.threeStarScore, 1);
        const accuracyRatio = this.calcAccuracy(result) / 100;
        const speedRatio = result.totalTime > 0 ? Math.max(0, 1 - result.totalTime / config.timeLimit) : 0;
        const comboRatio = Math.min(result.maxCombo / 10, 1);

        const careScore = (
            scoreRatio * 40 +
            accuracyRatio * 35 +
            speedRatio * 15 +
            comboRatio * 10
        );

        return Math.floor(careScore);
    }

    renderChart(): void {
        if (!this.chartContainer) return;

        this.chartContainer.removeAllChildren();

        const chartNode = new Node('CareChart');
        const graphics = chartNode.addComponent(Graphics);
        this.chartContainer.addChild(chartNode);

        const containerWidth = this.chartContainer.uiTransform?.width || 600;
        const containerHeight = this.chartContainer.uiTransform?.height || 300;
        const barWidth = 50;
        const barGap = 30;
        const startX = -containerWidth / 2 + (containerWidth - (this._reviewData.length * (barWidth + barGap) - barGap)) / 2 + barWidth / 2;
        const baseY = -containerHeight / 2 + 30;
        const chartHeight = containerHeight - 60;

        this._reviewData.forEach((data, index) => {
            const barHeight = (data.careScore / 100) * chartHeight;
            const x = startX + index * (barWidth + barGap);
            const y = baseY + barHeight / 2;

            const barNode = new Node(`Bar_${data.levelId}`);
            const barSprite = barNode.addComponent(Sprite);
            barNode.setPosition(x, y, 0);
            barNode.setScale(barWidth / 20, barHeight / 20, 1);
            this.chartContainer.addChild(barNode);

            if (data.stars >= 3) {
                barSprite.color = new Color(76, 175, 80, 255);
            } else if (data.stars >= 1) {
                barSprite.color = new Color(255, 193, 7, 255);
            } else {
                barSprite.color = new Color(200, 200, 200, 255);
            }

            const scoreLabelNode = new Node('ScoreLabel');
            const scoreLabel = scoreLabelNode.addComponent(Label);
            scoreLabel.string = `${data.careScore}`;
            scoreLabel.fontSize = 16;
            scoreLabelNode.setPosition(x, baseY + barHeight + 15, 0);
            this.chartContainer.addChild(scoreLabelNode);

            const levelLabelNode = new Node('LevelLabel');
            const levelLabel = levelLabelNode.addComponent(Label);
            levelLabel.string = `第${data.levelId}关`;
            levelLabel.fontSize = 12;
            levelLabelNode.setPosition(x, baseY - 15, 0);
            this.chartContainer.addChild(levelLabelNode);
        });

        graphics.moveTo(-containerWidth / 2, baseY);
        graphics.lineTo(containerWidth / 2, baseY);
        graphics.strokeColor = new Color(200, 200, 200, 255);
        graphics.lineWidth = 1;
        graphics.stroke();
    }

    renderLevelList(): void {
        if (!this.levelListContainer) return;

        this.levelListContainer.removeAllChildren();

        this._reviewData.forEach((data) => {
            const item = this.createReviewItem(data);
            if (item) {
                this.levelListContainer.addChild(item);
            }
        });
    }

    createReviewItem(data: ReviewData): Node | null {
        let node: Node;

        if (this.levelReviewItemPrefab) {
            node = instantiate(this.levelReviewItemPrefab);
        } else {
            node = new Node(`Review_${data.levelId}`);
            node.addComponent(Sprite);

            const nameLabel = new Node('NameLabel');
            nameLabel.addComponent(Label);
            node.addChild(nameLabel);

            const scoreLabel = new Node('ScoreLabel');
            scoreLabel.addComponent(Label);
            node.addChild(scoreLabel);

            const careLabel = new Node('CareLabel');
            careLabel.addComponent(Label);
            node.addChild(careLabel);
        }

        const labels = node.getComponentsInChildren(Label);
        if (labels.length >= 1) {
            labels[0].string = `第${data.levelId}关: ${data.levelName}`;
        }
        if (labels.length >= 2) {
            labels[1].string = `得分: ${data.score}`;
        }
        if (labels.length >= 3) {
            const careLevel = this.getCareLevelName(data.careScore);
            labels[2].string = `护理达标: ${careLevel}`;
        }

        const sprite = node.getComponent(Sprite);
        if (sprite) {
            if (data.careScore >= 80) {
                sprite.color = new Color(220, 240, 220, 255);
            } else if (data.careScore >= 50) {
                sprite.color = new Color(255, 248, 220, 255);
            } else if (data.passed) {
                sprite.color = new Color(255, 230, 230, 255);
            } else {
                sprite.color = new Color(240, 240, 240, 255);
            }
        }

        return node;
    }

    getCareLevelName(careScore: number): string {
        if (careScore >= 90) return 'S级 优秀';
        if (careScore >= 80) return 'A级 良好';
        if (careScore >= 60) return 'B级 合格';
        if (careScore >= 40) return 'C级 待提升';
        if (careScore > 0) return 'D级 需努力';
        return '未完成';
    }

    updateOverallStats(): void {
        const passedLevels = this._reviewData.filter(d => d.passed);
        const totalScore = this._reviewData.reduce((sum, d) => sum + d.score, 0);
        const avgAccuracy = passedLevels.length > 0
            ? Math.floor(passedLevels.reduce((sum, d) => sum + d.accuracy, 0) / passedLevels.length)
            : 0;

        const avgCareScore = passedLevels.length > 0
            ? Math.floor(passedLevels.reduce((sum, d) => sum + d.careScore, 0) / passedLevels.length)
            : 0;

        if (this.totalScoreLabel) {
            this.totalScoreLabel.string = `总得分: ${totalScore}`;
        }
        if (this.totalAccuracyLabel) {
            this.totalAccuracyLabel.string = `平均准确率: ${avgAccuracy}%`;
        }
        if (this.careLevelLabel) {
            const careLabel = this.careLevelLabel.getComponent(Label);
            if (careLabel) {
                careLabel.string = `综合护理评级: ${this.getCareLevelName(avgCareScore)}`;
            }
        }

        if (this.careIndicator) {
            const sprite = this.careIndicator.getComponent(Sprite);
            if (sprite) {
                if (avgCareScore >= 80) {
                    sprite.color = new Color(76, 175, 80, 255);
                } else if (avgCareScore >= 60) {
                    sprite.color = new Color(255, 193, 7, 255);
                } else if (avgCareScore > 0) {
                    sprite.color = new Color(244, 67, 54, 255);
                } else {
                    sprite.color = new Color(150, 150, 150, 255);
                }
            }
        }
    }

    onBack(): void {
        GameManager.instance.playSound('click');
        this.hide();
    }

    get reviewData(): ReviewData[] {
        return [...this._reviewData];
    }
}
