import { _decorator, Component, Node, Label, Button, Sprite, Color, Graphics, ProgressBar, UITransform } from 'cc';
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

        this.node.active = true;
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
        if (!this.statistics) return;

        const container = this.compensationByTypeContainer || this.node.getChildByName('StatsInfo');
        if (!container) return;
        container.removeAllChildren();

        const typeNames: Record<string, string> = {
            address: '地址错误',
            rider: '骑手拒单',
            subsidy: '补贴误用',
            timing: '超时送达',
        };

        const entries = Object.entries(this.statistics.wrongStepStats);
        const total = entries.reduce((sum, [, count]) => sum + count, 0);

        if (total === 0) {
            this.makeChildLabel(container, '暂无数据', 14, new Color(150, 150, 150));
            return;
        }

        entries.sort((a, b) => b[1] - a[1]);
        entries.forEach(([type, count]) => {
            const percentage = Math.round((count / total) * 100);
            const name = typeNames[type] || type;
            this.makeChildLabel(container, `${name}: ${count}次 (${percentage}%)`, 14, new Color(220, 220, 240));
        });
    }

    private renderSubsidyStats() {
        if (!this.statistics) return;

        const container = this.subsidyStatsContainer || this.node.getChildByName('StatsInfo');
        if (!container) return;

        const entries = Object.entries(this.statistics.subsidyEffectiveness);

        if (entries.length === 0) {
            this.makeChildLabel(container, '暂无补贴使用记录', 14, new Color(150, 150, 150));
            return;
        }

        entries.sort((a, b) => b[1].saved - a[1].saved);
        entries.forEach(([subsidyId, data]) => {
            const rule = SUBSIDY_RULES.find(r => r.id === subsidyId);
            const avg = data.used > 0 ? Math.round(data.saved / data.used) : 0;
            this.makeChildLabel(container, `${rule?.name || subsidyId}: 使用${data.used}次 节省¥${data.saved} 平均¥${avg}/次`, 14, new Color(100, 200, 255));
        });
    }

    private renderInsights() {
        const container = this.insightsContainer || this.node.getChildByName('StatsInfo');
        if (!container) return;

        const insights = this.storageManager.getPerformanceInsights();

        if (insights.length === 0) {
            this.makeChildLabel(container, '表现优秀，继续保持！', 14, new Color(0, 255, 100));
            return;
        }

        insights.slice(0, 5).forEach((insight, index) => {
            this.makeChildLabel(container, `[${insight.area}] ${insight.problem} → 建议: ${insight.suggestion} (发生${insight.frequency}次)`, 13, new Color(255, 200, 100));
        });
    }

    private makeChildLabel(parent: Node, text: string, fontSize: number, color: Color): Label {
        const n = new Node(`Item_${parent.children.length}`);
        n.addComponent(UITransform).setContentSize(850, fontSize + 6);
        const label = n.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.color = color;
        label.overflow = Label.Overflow.CLAMP;
        parent.addChild(n);
        return label;
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
        this.node.active = false;
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
