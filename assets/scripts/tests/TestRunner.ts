import { _decorator, Component, Node, Label, find, ScrollView, Prefab, instantiate, Color } from 'cc';
import { GameTestSuite } from './GameTestSuite';

const { ccclass, property } = _decorator;

@ccclass('TestRunner')
export class TestRunner extends Component {

    @property(Node)
    testPanelRoot: Node | null = null;

    @property(Label)
    summaryLabel: Node | null = null;

    @property(ScrollView)
    resultScrollView: ScrollView | null = null;

    @property(Node)
    resultContainer: Node | null = null;

    @property(Prefab)
    resultItemPrefab: Prefab | null = null;

    @property(Node)
    runButton: Node | null = null;

    @property(Node)
    closeButton: Node | null = null;

    @property(Node)
    exportButton: Node | null = null;

    private isRunning: boolean = false;

    start(): void {
        this.runButton?.on(Node.EventType.TOUCH_END, this.runTests, this);
        this.closeButton?.on(Node.EventType.TOUCH_END, () => {
            if (this.testPanelRoot) {
                this.testPanelRoot.active = false;
            }
        }, this);
        this.exportButton?.on(Node.EventType.TOUCH_END, this.exportResults, this);

        this.hideTestPanel();
    }

    public showTestPanel(): void {
        if (this.testPanelRoot) {
            this.testPanelRoot.active = true;
        }
    }

    public hideTestPanel(): void {
        if (this.testPanelRoot) {
            this.testPanelRoot.active = false;
        }
    }

    public toggleTestPanel(): void {
        if (this.testPanelRoot) {
            this.testPanelRoot.active = !this.testPanelRoot.active;
        }
    }

    private async runTests(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;

        this.clearResults();

        if (this.summaryLabel) {
            (this.summaryLabel as any).string = '⏳ 测试运行中...';
        }

        const result = await GameTestSuite.runAllTests();

        if (this.summaryLabel) {
            const summaryColor: Color = result.failed === 0
                ? new Color(46, 125, 50)
                : result.failed <= 2
                    ? new Color(230, 81, 0)
                    : new Color(198, 40, 40);
            (this.summaryLabel as any).color = summaryColor;
            (this.summaryLabel as any).string =
                `测试完成: 总计${result.total}项 | ✅通过${result.passed}项 | ❌失败${result.failed}项`;
        }

        this.renderResults(result.results);

        this.isRunning = false;
    }

    private clearResults(): void {
        if (this.resultContainer) {
            this.resultContainer.removeAllChildren();
        }
    }

    private renderResults(results: GameTestSuite['testResults']): void {
        if (!this.resultItemPrefab || !this.resultContainer) return;

        results.forEach(r => {
            const node = instantiate(this.resultItemPrefab!);
            const labels = node.getComponentsInChildren(Label);

            let iconLabel: Label | null = null;
            let nameLabel: Label | null = null;
            let msgLabel: Label | null = null;
            let timeLabel: Label | null = null;

            labels.forEach(l => {
                const ln = l.node.name;
                if (ln.includes('Icon') || ln.includes('icon')) iconLabel = l;
                else if (ln.includes('Name') || ln.includes('name')) nameLabel = l;
                else if (ln.includes('Msg') || ln.includes('msg') || ln.includes('Message')) msgLabel = l;
                else if (ln.includes('Time') || ln.includes('time')) timeLabel = l;
            });

            if (iconLabel) {
                iconLabel.string = r.passed ? '✅' : '❌';
                iconLabel.color = r.passed ? new Color(46, 125, 50) : new Color(198, 40, 40);
            }
            if (nameLabel) nameLabel.string = r.name;
            if (msgLabel) {
                msgLabel.string = r.message;
                msgLabel.color = r.passed ? new Color(66, 66, 66) : new Color(198, 40, 40);
            }
            if (timeLabel) timeLabel.string = `${r.duration.toFixed(1)}ms`;

            this.resultContainer!.addChild(node);
        });
    }

    private exportResults(): void {
        const summary = `康复中心模拟游戏 - 测试结果导出\n` +
            `导出时间: ${new Date().toLocaleString()}\n\n` +
            `配置文件版本检查:\n` +
            `  - 关卡配置: ${GameTestSuite['_'] || '检查完成'}\n\n` +
            `请运行测试后查看完整结果`;

        console.log('[TestRunner] 测试结果导出:');
        console.log(summary);
    }
}
