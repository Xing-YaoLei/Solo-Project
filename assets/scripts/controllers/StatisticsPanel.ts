import { _decorator, Component, Node, Label, Button, Sprite, Color, Graphics, ProgressBar } from 'cc';
import { Statistics } from '../types/GameTypes';
import { StorageManager } from '../managers/StorageManager';
import { SUBSIDY_RULES } from '../config/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('StatisticsPanel')
export class StatisticsPanel extends Component {
    @property(Node)
    panelRoot: Node | null = null;

    @property(Label)
    totalGamesLabel: Label | null = null;

    @property(Label)
    winRateLabel: Label | null = null;

    @property(Label)
    avgScoreLabel: Label | null = null;

    @property(Label)
    totalCompensationLabel: Label | null = null;

    @property(Label)
    avgCompensationLabel: Label | null = null;

    @property(Node)
    compensationByTypeContainer: Node | null = null;

    @property(Node)
    compensationTypeItemPrefab: Node | null = null;

    @property(Node)
    subsidyStatsContainer: Node | null = null;

    @property(Node)
    subsidyStatItemPrefab: Node | null = null;

    @property(Node)
    insightsContainer: Node | null = null;

    @property(Node)
    insightItemPrefab: Node | null = null;

    @property(Graphics)
    compensationChart: Graphics | null = null;

    @property(Button)
    clearStatsButton: Button | null = null;

    @property(Button)
    closeButton: Button | null = null;

    private storageManager: StorageManager = StorageManager.getInstance();
    private statistics: Statistics | null = null;

    onLoad() {
        if (this.clearStatsButton) {
            this.clearStatsButton.node.on(Button.EventType.CLICK, this.onClearStatsClicked, this);
        }
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.hide, this);
        }
    }

    show() {
        this.loadStatistics();
        this.renderOverallStats();
        this.renderCompensationByType();
        this.renderSubsidyStats();
        this.renderInsights();
        this.renderCompensationChart();

        if (this.panelRoot) {
            this.panelRoot.active = true;
        }
    }

    private loadStatistics() {
        this.statistics = this.storageManager.getStatistics();
    }

    private renderOverallStats() {
        if (!this.statistics) return;

        if (this.totalGamesLabel) {
            this.totalGamesLabel.string = `总游戏次数: ${this.statistics.totalGames}`;
        }

        if (this.winRateLabel) {
            const winRate = this.statistics.totalGames > 0 ?
                Math.round((this.statistics.totalVictories / this.statistics.totalGames) * 100) : 0;
            this.winRateLabel.string = `胜率: ${winRate}%`;
            this.winRateLabel.color = winRate >= 60 ? new Color(0, 255, 100) : new Color(255, 200, 0);
        }

        if (this.avgScoreLabel) {
            this.avgScoreLabel.string = `平均得分: ${this.statistics.avgScore}`;
        }

        if (this.totalCompensationLabel) {
            this.totalCompensationLabel.string = `累计赔付: ¥${this.statistics.totalCompensationPaid}`;
            this.totalCompensationLabel.color = this.statistics.totalCompensationPaid > 500 ?
                new Color(255, 100, 100) : new Color(255, 255, 255);
        }

        if (this.avgCompensationLabel) {
            const compStats = this.storageManager.getCompensationStats();
            this.avgCompensationLabel.string = `场均赔付: ¥${compStats.avgPerGame}`;
        }
    }

    private renderCompensationByType() {
        if (!this.statistics || !this.compensationByTypeContainer || !this.compensationTypeItemPrefab) return;

        this.compensationByTypeContainer.removeAllChildren();

        const typeNames: Record<string, { name: string; color: Color; icon: string }> = {
            address: { name: '地址错误', color: new Color(255, 100, 100), icon: '📍' },
            rider: { name: '骑手拒单', color: new Color(255, 200, 0), icon: '🏍️' },
            subsidy: { name: '补贴误用', color: new Color(100, 200, 255), icon: '💰' },
            timing: { name: '超时送达', color: new Color(200, 100, 255), icon: '⏰' },
        };

        const entries = Object.entries(this.statistics.wrongStepStats);
        const total = entries.reduce((sum, [, count]) => sum + count, 0);

        if (total === 0) {
            const emptyNode = new Node('EmptyLabel');
            const label = emptyNode.addComponent(Label);
            label.string = '暂无数据';
            this.compensationByTypeContainer.addChild(emptyNode);
            return;
        }

        entries.sort((a, b) => b[1] - a[1]);

        entries.forEach(([type, count]) => {
            const item = this.compensationTypeItemPrefab!.clone();
            item.name = `Type_${type}`;

            const iconLabel = item.getChildByName('Icon')?.getComponent(Label);
            const nameLabel = item.getChildByName('Name')?.getComponent(Label);
            const countLabel = item.getChildByName('Count')?.getComponent(Label);
            const percentLabel = item.getChildByName('Percent')?.getComponent(Label);
            const progressBar = item.getChildByName('Progress')?.getComponent(ProgressBar);

            const typeInfo = typeNames[type] || { name: type, color: new Color(255, 255, 255), icon: '❓' };
            const percentage = Math.round((count / total) * 100);

            if (iconLabel) {
                iconLabel.string = typeInfo.icon;
            }
            if (nameLabel) {
                nameLabel.string = typeInfo.name;
                nameLabel.color = typeInfo.color;
            }
            if (countLabel) {
                countLabel.string = `${count}次`;
            }
            if (percentLabel) {
                percentLabel.string = `${percentage}%`;
            }
            if (progressBar) {
                progressBar.progress = percentage / 100;
                const barSprite = progressBar.node.getChildByName('Bar')?.getComponent(Sprite);
                if (barSprite) {
                    barSprite.color = typeInfo.color;
                }
            }

            this.compensationByTypeContainer!.addChild(item);
        });
    }

    private renderSubsidyStats() {
        if (!this.statistics || !this.subsidyStatsContainer || !this.subsidyStatItemPrefab) return;

        this.subsidyStatsContainer.removeAllChildren();

        const entries = Object.entries(this.statistics.subsidyEffectiveness);

        if (entries.length === 0) {
            const emptyNode = new Node('EmptyLabel');
            const label = emptyNode.addComponent(Label);
            label.string = '暂无补贴使用记录';
            this.subsidyStatsContainer.addChild(emptyNode);
            return;
        }

        entries.sort((a, b) => b[1].saved - a[1].saved);

        entries.forEach(([subsidyId, data]) => {
            const item = this.subsidyStatItemPrefab!.clone();
            item.name = `Subsidy_${subsidyId}`;

            const rule = SUBSIDY_RULES.find(r => r.id === subsidyId);

            const nameLabel = item.getChildByName('Name')?.getComponent(Label);
            const usedLabel = item.getChildByName('Used')?.getComponent(Label);
            const savedLabel = item.getChildByName('Saved')?.getComponent(Label);
            const avgLabel = item.getChildByName('Avg')?.getComponent(Label);

            if (nameLabel) {
                nameLabel.string = rule?.name || subsidyId;
            }
            if (usedLabel) {
                usedLabel.string = `使用: ${data.used}次`;
            }
            if (savedLabel) {
                savedLabel.string = `节省: ¥${data.saved}`;
                savedLabel.color = new Color(0, 255, 100);
            }
            if (avgLabel) {
                const avg = data.used > 0 ? Math.round(data.saved / data.used) : 0;
                avgLabel.string = `平均: ¥${avg}/次`;
            }

            this.subsidyStatsContainer!.addChild(item);
        });
    }

    private renderInsights() {
        if (!this.insightsContainer || !this.insightItemPrefab) return;

        this.insightsContainer.removeAllChildren();

        const insights = this.storageManager.getPerformanceInsights();

        if (insights.length === 0) {
            const emptyNode = new Node('EmptyLabel');
            const label = emptyNode.addComponent(Label);
            label.string = '表现优秀，继续保持！';
            label.color = new Color(0, 255, 100);
            this.insightsContainer.addChild(emptyNode);
            return;
        }

        insights.slice(0, 5).forEach((insight, index) => {
            const item = this.insightItemPrefab!.clone();
            item.name = `Insight_${index}`;

            const areaLabel = item.getChildByName('Area')?.getComponent(Label);
            const problemLabel = item.getChildByName('Problem')?.getComponent(Label);
            const suggestionLabel = item.getChildByName('Suggestion')?.getComponent(Label);
            const freqLabel = item.getChildByName('Frequency')?.getComponent(Label);

            if (areaLabel) {
                areaLabel.string = insight.area;
                const colors: Record<string, Color> = {
                    '地址处理': new Color(255, 100, 100),
                    '骑手调度': new Color(255, 200, 0),
                    '补贴应用': new Color(100, 200, 255),
                    '时间管理': new Color(200, 100, 255),
                };
                areaLabel.color = colors[insight.area] || new Color(255, 255, 255);
            }
            if (problemLabel) {
                problemLabel.string = `问题: ${insight.problem}`;
            }
            if (suggestionLabel) {
                suggestionLabel.string = `建议: ${insight.suggestion}`;
            }
            if (freqLabel) {
                freqLabel.string = `发生: ${insight.frequency}次`;
            }

            this.insightsContainer!.addChild(item);
        });
    }

    private renderCompensationChart() {
        if (!this.compensationChart || !this.statistics) return;

        this.compensationChart.clear();

        const compStats = this.storageManager.getCompensationStats();
        const entries = Object.entries(compStats.byLevel);

        if (entries.length === 0) return;

        const chartWidth = 400;
        const chartHeight = 150;
        const barWidth = chartWidth / Math.max(entries.length, 1) - 20;
        const maxValue = Math.max(...Object.values(compStats.byLevel), 1);

        entries.forEach(([levelId, value], index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = -chartWidth / 2 + index * (barWidth + 20) + barWidth / 2;
            const y = -chartHeight / 2;

            this.compensationChart!.fillColor = new Color(255, 100, 100, 200);
            this.compensationChart!.roundRect(x - barWidth / 2, y, barWidth, barHeight, 5);
            this.compensationChart!.fill();

            this.compensationChart!.fillColor = new Color(255, 255, 255);
            this.compensationChart!.fontSize = 12;
            this.compensationChart!.textAlign = Graphics.HorizontalAlign.CENTER;
            this.compensationChart!.fillText(`L${levelId}`, x, y - 15);
            this.compensationChart!.fillText(`¥${value}`, x, y + barHeight + 15);
        });
    }

    private onClearStatsClicked() {
        if (this.storageManager.clearStatistics()) {
            this.loadStatistics();
            this.renderOverallStats();
            this.renderCompensationByType();
            this.renderSubsidyStats();
            this.renderInsights();
            this.renderCompensationChart();
        }
    }

    hide() {
        if (this.panelRoot) {
            this.panelRoot.active = false;
        }
    }

    refresh() {
        this.loadStatistics();
        this.renderOverallStats();
        this.renderCompensationByType();
        this.renderSubsidyStats();
        this.renderInsights();
        this.renderCompensationChart();
    }

    getStatistics(): Statistics | null {
        return this.statistics;
    }

    onDestroy() {
        if (this.clearStatsButton) {
            this.clearStatsButton.node.off(Button.EventType.CLICK, this.onClearStatsClicked, this);
        }
        if (this.closeButton) {
            this.closeButton.node.off(Button.EventType.CLICK, this.hide, this);
        }
    }
}
