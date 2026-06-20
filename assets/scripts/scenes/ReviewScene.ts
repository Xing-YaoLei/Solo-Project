import { _decorator, Component, Node, Label, Button, Sprite, Color, director, ScrollView, UITransform, Prefab, instantiate, Toggle, Graphics } from 'cc';
import { GameManager } from '../core/GameManager';
import { FeedbackManager, VibrationType } from '../core/FeedbackManager';
import { AudioManager, SfxType } from '../core/AudioManager';
import { ReviewRecord } from '../core/GameTypes';
const { ccclass, property } = _decorator;

@ccclass('ReviewScene')
export class ReviewScene extends Component {
    @property(Node)
    bestRecordsContainer: Node | null = null;

    @property(Node)
    historyContainer: Node | null = null;

    @property(ScrollView)
    historyScrollView: ScrollView | null = null;

    @property(Toggle)
    allLevelsToggle: Toggle | null = null;

    @property(Toggle)
    compareToggle: Toggle | null = null;

    @property(Node)
    efficiencyChartContainer: Node | null = null;

    @property(Button)
    backButton: Button | null = null;

    @property(Prefab)
    recordItemPrefab: Prefab | null = null;

    @property(Label)
    noDataLabel: Label | null = null;

    private currentFilter: number | null = null;
    private compareMode: boolean = false;

    onLoad() {
        this.setupButtons();
        this.renderData();
    }

    onEnable() {
        this.renderData();
    }

    private setupButtons(): void {
        this.backButton?.node.on(Button.EventType.CLICK, this.onBack, this);

        this.allLevelsToggle?.node.on(Toggle.EventType.TOGGLE, () => {
            this.currentFilter = null;
            this.renderData();
        }, this);

        this.compareToggle?.node.on(Toggle.EventType.TOGGLE, (toggle) => {
            this.compareMode = toggle.isChecked;
            this.renderData();
        }, this);
    }

    private renderData(): void {
        const bestRecords = GameManager.instance.getBestRecords();
        const historyRecords = this.currentFilter
            ? GameManager.instance.getReviewRecords(this.currentFilter)
            : GameManager.instance.getReviewRecords();

        if ((!bestRecords || bestRecords.length === 0) &&
            (!historyRecords || historyRecords.length === 0)) {
            if (this.noDataLabel) {
                this.noDataLabel.active = true;
                this.noDataLabel.string = '暂无记录，快去完成关卡吧！';
            }
        } else {
            if (this.noDataLabel) {
                this.noDataLabel.active = false;
            }
        }

        this.renderBestRecords(bestRecords);
        this.renderHistoryRecords(historyRecords);
        this.renderEfficiencyChart(bestRecords);
    }

    private renderBestRecords(records: ReviewRecord[]): void {
        if (!this.bestRecordsContainer) return;

        this.bestRecordsContainer.removeAllChildren();

        if (records.length === 0) return;

        const levelNames: Record<number, string> = {
            1: '新手入门', 2: '渐入佳境', 3: '票房热卖',
            4: '销售达人', 5: '火爆预售', 6: '终极挑战'
        };

        const itemHeight = 70;
        const gap = 8;
        const totalHeight = records.length * (itemHeight + gap);
        const startY = totalHeight / 2 - itemHeight / 2;

        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const node = this.createRecordCard(record, levelNames[record.levelId] || `关卡${record.levelId}`, true);
            node.setPosition(0, startY - i * (itemHeight + gap));

            node.on(Node.EventType.TOUCH_END, () => {
                this.filterByLevel(record.levelId);
            });

            this.bestRecordsContainer.addChild(node);
        }
    }

    private renderHistoryRecords(records: ReviewRecord[]): void {
        if (!this.historyContainer) return;

        this.historyContainer.removeAllChildren();

        if (records.length === 0) return;

        const sorted = [...records].sort((a, b) => b.timestamp - a.timestamp);
        const displayRecords = sorted.slice(0, 30);

        const levelNames: Record<number, string> = {
            1: '新手入门', 2: '渐入佳境', 3: '票房热卖',
            4: '销售达人', 5: '火爆预售', 6: '终极挑战'
        };

        const itemHeight = 60;
        const gap = 6;
        const totalHeight = displayRecords.length * (itemHeight + gap);
        const startY = totalHeight / 2 - itemHeight / 2;

        for (let i = 0; i < displayRecords.length; i++) {
            const record = displayRecords[i];
            const node = this.createRecordCard(
                record,
                levelNames[record.levelId] || `关卡${record.levelId}`,
                false
            );
            node.setPosition(0, startY - i * (itemHeight + gap));
            this.historyContainer.addChild(node);
        }

        if (this.historyScrollView) {
            this.historyScrollView.scrollToTop(0);
        }
    }

    private createRecordCard(record: ReviewRecord, levelName: string, isBest: boolean): Node {
        let node: Node;

        if (this.recordItemPrefab) {
            node = instantiate(this.recordItemPrefab);
        } else {
            const width = 500;
            const height = isBest ? 68 : 56;

            node = new Node('Record');
            node.addComponent(UITransform).setContentSize(width, height);

            const bg = node.addComponent(Sprite);
            bg.color = isBest
                ? new Color(255, 248, 220, 200)
                : new Color(248, 249, 250, 200);

            const levelLabelNode = new Node('LevelName');
            levelLabelNode.addComponent(UITransform).setContentSize(120, 24);
            levelLabelNode.setPosition(-width / 2 + 70, height / 4);
            const levelLabel = levelLabelNode.addComponent(Label);
            levelLabel.string = (isBest ? '🏆 ' : '') + levelName;
            levelLabel.fontSize = isBest ? 16 : 14;
            levelLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            node.addChild(levelLabelNode);

            const diffLabelNode = new Node('Diff');
            diffLabelNode.addComponent(UITransform).setContentSize(60, 20);
            diffLabelNode.setPosition(-width / 2 + 40, -height / 4);
            const diffLabel = diffLabelNode.addComponent(Label);
            diffLabel.string = record.difficulty;
            diffLabel.fontSize = 11;
            diffLabel.color = this.getDifficultyColor(record.difficulty);
            diffLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            node.addChild(diffLabelNode);

            const stats = [
                { key: 'orders', label: `${record.ordersPerMinute.toFixed(1)}/分`, x: 20 },
                { key: 'acc', label: `${record.accuracy.toFixed(1)}%`, x: 100 },
                { key: 'time', label: `${record.avgProcessingTime.toFixed(1)}s`, x: 180 },
                { key: 'combo', label: `x${record.consecutiveMax}`, x: 260 }
            ];

            for (const stat of stats) {
                const statNode = new Node(stat.key);
                statNode.addComponent(UITransform).setContentSize(80, height);
                statNode.setPosition(-width / 2 + width * 0.5 + stat.x, 0);
                const statLabel = statNode.addComponent(Label);
                statLabel.string = stat.label;
                statLabel.fontSize = 13;
                node.addChild(statNode);
            }

            const scoreNode = new Node('Score');
            scoreNode.addComponent(UITransform).setContentSize(80, height);
            scoreNode.setPosition(width / 2 - 40, 0);
            const scoreLabel = scoreNode.addComponent(Label);
            scoreLabel.string = record.score.toString();
            scoreLabel.fontSize = isBest ? 20 : 16;
            scoreLabel.color = new Color(52, 152, 219, 255);
            node.addChild(scoreNode);

            if (isBest) {
                const effNode = new Node('Eff');
                effNode.addComponent(UITransform).setContentSize(60, 20);
                effNode.setPosition(width / 2 - 40, -height / 4);
                const effLabel = effNode.addComponent(Label);
                effLabel.string = `效率:${record.efficiency}`;
                effLabel.fontSize = 10;
                effLabel.color = new Color(155, 89, 182, 255);
                node.addChild(effNode);
            }

            const dateNode = new Node('Date');
            dateNode.addComponent(UITransform).setContentSize(100, 16);
            dateNode.setPosition(width / 2 - 50, -height / 2 + 8);
            const dateLabel = dateNode.addComponent(Label);
            dateLabel.string = this.formatDate(record.timestamp);
            dateLabel.fontSize = 9;
            dateLabel.color = new Color(155, 155, 155, 255);
            dateLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
            node.addChild(dateNode);
        }

        return node;
    }

    private renderEfficiencyChart(records: ReviewRecord[]): void {
        if (!this.efficiencyChartContainer) return;

        this.efficiencyChartContainer.removeAllChildren();

        if (!this.compareMode || records.length < 2) {
            return;
        }

        const width = 560;
        const height = 280;
        const padding = { top: 30, right: 20, bottom: 50, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const bgNode = new Node('ChartBG');
        bgNode.addComponent(UITransform).setContentSize(width, height);
        const bgSprite = bgNode.addComponent(Sprite);
        bgSprite.color = new Color(255, 255, 255, 200);
        this.efficiencyChartContainer.addChild(bgNode);

        const titleNode = new Node('Title');
        titleNode.addComponent(UITransform).setContentSize(width, 24);
        titleNode.setPosition(0, height / 2 - 14);
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = '📊 各关卡核销效率对比图';
        titleLabel.fontSize = 16;
        bgNode.addChild(titleNode);

        const graphicsNode = new Node('Graphics');
        graphicsNode.addComponent(UITransform).setContentSize(width, height);
        const graphics = graphicsNode.addComponent(Graphics);
        bgNode.addChild(graphicsNode);

        const metrics = [
            { key: 'efficiency', name: '效率', color: new Color(52, 152, 219, 255), max: 150 },
            { key: 'accuracy', name: '准确度', color: new Color(46, 204, 113, 255), max: 100 },
            { key: 'ordersPerMinute', name: '订单/分', color: new Color(230, 126, 34, 255), max: 20 },
            { key: 'consecutiveMax', name: '连击', color: new Color(155, 89, 182, 255), max: 30 }
        ];

        const barGroupWidth = chartWidth / records.length;
        const barWidth = Math.min(30, barGroupWidth / (metrics.length + 1));

        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const groupCenterX = -chartWidth / 2 + (i + 0.5) * barGroupWidth;

            for (let j = 0; j < metrics.length; j++) {
                const metric = metrics[j];
                const value = (record as any)[metric.key] || 0;
                const normalizedValue = Math.min(1, value / metric.max);
                const barHeight = normalizedValue * chartHeight;

                const barX = groupCenterX + (j - metrics.length / 2 + 0.5) * (barWidth + 4);
                const barY = -chartHeight / 2 + barHeight / 2;

                graphics.fillColor = metric.color;
                graphics.rect(
                    barX - barWidth / 2 + padding.left,
                    barY + padding.bottom,
                    barWidth,
                    barHeight
                );
                graphics.fill();

                if (i === 0) {
                    const legendNode = new Node(`Legend_${metric.key}`);
                    legendNode.addComponent(UITransform).setContentSize(120, 16);
                    legendNode.setPosition(
                        -width / 2 + 60 + j * 140,
                        -height / 2 + 16
                    );
                    const legendColor = new Node('Color');
                    legendColor.addComponent(UITransform).setContentSize(12, 12);
                    legendColor.setPosition(-50, 0);
                    const legendSprite = legendColor.addComponent(Sprite);
                    legendSprite.color = metric.color;
                    legendNode.addChild(legendColor);

                    const legendLabelNode = new Node('Label');
                    legendLabelNode.addComponent(UITransform).setContentSize(100, 16);
                    legendLabelNode.setPosition(10, 0);
                    const legendLabel = legendLabelNode.addComponent(Label);
                    legendLabel.string = metric.name;
                    legendLabel.fontSize = 10;
                    legendLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
                    legendNode.addChild(legendLabelNode);

                    bgNode.addChild(legendNode);
                }
            }

            const xLabelNode = new Node(`XLabel_${i}`);
            xLabelNode.addComponent(UITransform).setContentSize(barGroupWidth, 16);
            xLabelNode.setPosition(
                -chartWidth / 2 + (i + 0.5) * barGroupWidth,
                -height / 2 + padding.bottom - 12
            );
            const xLabel = xLabelNode.addComponent(Label);
            const levelShortNames: Record<number, string> = {
                1: 'L1', 2: 'L2', 3: 'L3', 4: 'L4', 5: 'L5', 6: 'L6'
            };
            xLabel.string = levelShortNames[record.levelId] || `L${record.levelId}`;
            xLabel.fontSize = 11;
            xLabel.color = new Color(100, 100, 100, 255);
            bgNode.addChild(xLabelNode);
        }

        graphics.strokeColor = new Color(200, 200, 200, 255);
        graphics.lineWidth = 1;
        graphics.moveTo(padding.left, padding.bottom);
        graphics.lineTo(width - padding.right, padding.bottom);
        graphics.moveTo(padding.left, padding.bottom);
        graphics.lineTo(padding.left, height - padding.top);
        graphics.stroke();
    }

    private filterByLevel(levelId: number): void {
        this.currentFilter = levelId;
        if (this.allLevelsToggle) {
            this.allLevelsToggle.isChecked = false;
        }
        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.LIGHT);
        this.renderData();
    }

    private getDifficultyColor(diff: string): Color {
        switch (diff) {
            case '简单': return new Color(46, 204, 113, 255);
            case '普通': return new Color(52, 152, 219, 255);
            case '困难': return new Color(230, 126, 34, 255);
            case '专家': return new Color(192, 57, 43, 255);
            default: return new Color(100, 100, 100, 255);
        }
    }

    private formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `${month}/${day} ${hour}:${minute}`;
    }

    private onBack(): void {
        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.LIGHT);
        director.loadScene('main-menu');
    }
}
